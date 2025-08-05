import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  profile: any;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error("AuthContext is undefined. Make sure AuthProvider is wrapping your component tree.");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();
  
  // Prevent multiple simultaneous profile requests
  const [isProfileFetching, setIsProfileFetching] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      console.log("No user found, skipping profile fetch");
      setProfileLoading(false);
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isProfileFetching) {
      console.log("Profile fetch already in progress, skipping");
      return;
    }
    
    console.log("Fetching profile for user:", user.id);
    setIsProfileFetching(true);
    setProfileLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      console.log("Profile fetch result:", { data, error });
      
      if (error) {
        console.error("Error fetching profile:", error);
        setProfileLoading(false);
        setIsProfileFetching(false);
        return;
      }
      
      console.log("Setting profile:", data);
      setProfile(data);
      setProfileLoading(false);
      setIsProfileFetching(false);
    } catch (error) {
      console.error("Error in refreshProfile:", error);
      setProfileLoading(false);
      setIsProfileFetching(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    let profileFetched = false;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user && !profileFetched) {
          profileFetched = true;
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            if (mounted) {
              refreshProfile();
            }
          }, 100);
        } else if (!session?.user) {
          setProfile(null);
          setProfileLoading(false);
          profileFetched = false;
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.id);
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user && !profileFetched) {
        profileFetched = true;
        setTimeout(() => {
          if (mounted) {
            refreshProfile();
          }
        }, 100);
      } else {
        setProfileLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // NO dependencies to prevent infinite loops

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Check if user is a supplier and redirect accordingly
      if (data.user) {
        const { data: supplierData } = await supabase
          .from('suppliers')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (supplierData) {
          // User is a supplier, redirect to supplier dashboard
          window.location.href = '/supplier-dashboard';
          return { error: null };
        }
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData || {}
        }
      });
      
      if (error) {
        toast({
          title: "خطأ في إنشاء الحساب",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تحقق من بريدك الإلكتروني",
          description: "لقد أرسلنا لك رابط تفعيل لإكمال التسجيل.",
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setProfile(null);
      setUser(null);
      setSession(null);
      
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "تم تسجيل خروجك من حسابك.",
      });
      
      // Force redirect to auth page
      window.location.href = '/auth';
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "خطأ في تسجيل الخروج",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    profileLoading,
    signIn,
    signUp,
    signOut,
    profile,
    refreshProfile,
  };

  console.log("AuthProvider rendering with value:", value);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};