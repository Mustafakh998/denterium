import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting user cleanup process...");

    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify we have the required environment variables
    if (!Deno.env.get("SUPABASE_URL") || !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      throw new Error("Missing required environment variables");
    }

    // Get all superadmin profiles to preserve their user accounts
    const { data: superAdmins, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email')
      .eq('system_role', 'super_admin');

    if (profileError) {
      console.error("Error fetching superadmin profiles:", profileError);
      throw new Error(`Failed to fetch superadmin profiles: ${profileError.message}`);
    }

    const superAdminUserIds = superAdmins?.map(admin => admin.user_id).filter(Boolean) || [];
    console.log(`Found ${superAdminUserIds.length} superadmin accounts to preserve:`, superAdmins?.map(a => a.email));

    if (superAdminUserIds.length === 0) {
      throw new Error("No superadmin accounts found - aborting for safety");
    }

    // Get all auth users with pagination
    let allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    
    while (true) {
      const { data: usersPage, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage
      });
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      if (!usersPage?.users || usersPage.users.length === 0) {
        break;
      }

      allUsers = allUsers.concat(usersPage.users);
      
      if (usersPage.users.length < perPage) {
        break; // Last page
      }
      
      page++;
    }

    console.log(`Found ${allUsers.length} total users in auth`);

    let deletedCount = 0;
    let preservedCount = 0;
    let errors: string[] = [];

    // Delete users that are not superadmins
    for (const user of allUsers) {
      if (superAdminUserIds.includes(user.id)) {
        console.log(`Preserving superadmin user: ${user.email} (${user.id})`);
        preservedCount++;
      } else {
        try {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteError) {
            const errorMsg = `Error deleting user ${user.email}: ${deleteError.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          } else {
            console.log(`Deleted user: ${user.email} (${user.id})`);
            deletedCount++;
          }
        } catch (error) {
          const errorMsg = `Failed to delete user ${user.email}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }

    const result = {
      success: true,
      message: `User cleanup completed. Deleted ${deletedCount} users, preserved ${preservedCount} superadmin accounts.`,
      deleted: deletedCount,
      preserved: preservedCount,
      errors: errors.length > 0 ? errors : undefined,
      superAdmins: superAdmins?.map(admin => ({ email: admin.email, user_id: admin.user_id }))
    };

    console.log("Cleanup result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in delete-non-superadmin-users function:", errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      message: "Failed to cleanup users"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});