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

    console.log("Starting user cleanup process...");

    // Get all superadmin profiles to preserve their user accounts
    const { data: superAdmins, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email')
      .eq('system_role', 'super_admin');

    if (profileError) {
      console.error("Error fetching superadmin profiles:", profileError);
      throw profileError;
    }

    const superAdminUserIds = superAdmins?.map(admin => admin.user_id) || [];
    console.log(`Found ${superAdminUserIds.length} superadmin accounts to preserve:`, superAdmins?.map(a => a.email));

    // Get all auth users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`Found ${users.length} total users in auth`);

    let deletedCount = 0;
    let preservedCount = 0;

    // Delete users that are not superadmins
    for (const user of users) {
      if (superAdminUserIds.includes(user.id)) {
        console.log(`Preserving superadmin user: ${user.email} (${user.id})`);
        preservedCount++;
      } else {
        try {
          const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
          if (deleteError) {
            console.error(`Error deleting user ${user.email}:`, deleteError);
          } else {
            console.log(`Deleted user: ${user.email} (${user.id})`);
            deletedCount++;
          }
        } catch (error) {
          console.error(`Failed to delete user ${user.email}:`, error);
        }
      }
    }

    const result = {
      success: true,
      message: `User cleanup completed. Deleted ${deletedCount} users, preserved ${preservedCount} superadmin accounts.`,
      deleted: deletedCount,
      preserved: preservedCount,
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
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});