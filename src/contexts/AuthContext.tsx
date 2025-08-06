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
    const currentUser = user || session?.user;
    
    if (!currentUser) {
      setProfileLoading(false);
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isProfileFetching) {
      return;
    }
    
    setIsProfileFetching(true);
    setProfileLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error in refreshProfile:", error);
      setProfile(null);
    } finally {
      setProfileLoading(false);
      setIsProfileFetching(false);
    }
  }, [user, session?.user, isProfileFetching]);

  useEffect(() => {
    let mounted = true;
    let profileFetched = false;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
          // Use setTimeout to avoid blocking the auth flow
          setTimeout(() => {
            window.location.href = '/supplier-dashboard';
          }, 100);
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
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};