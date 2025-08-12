import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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
  refreshProfile: (currentUser?: any) => Promise<void>;
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
  
  // Use ref to prevent circular dependencies
  const isProfileFetchingRef = useRef(false);

  const refreshProfile = useCallback(async (currentUser?: any) => {
    const userToFetch = currentUser || user || session?.user;
    
    console.log('refreshProfile called with user:', userToFetch?.id);
    
    if (!userToFetch) {
      console.log('No current user, setting profileLoading to false');
      setProfileLoading(false);
      return;
    }
    
    // Prevent multiple simultaneous requests using ref
    if (isProfileFetchingRef.current) {
      console.log('Profile already being fetched, skipping');
      return;
    }
    
    isProfileFetchingRef.current = true;
    setProfileLoading(true);
    
    try {
      console.log('Fetching profile for user:', userToFetch.id);
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userToFetch.id)
        .maybeSingle();
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error("Error fetching profile:", error);
        // Don't set profile to null on error, keep existing profile
        if (!profile) {
          setProfile(null);
        }
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error("Error in refreshProfile:", error);
      // Don't set profile to null on error, keep existing profile
      if (!profile) {
        setProfile(null);
      }
    } finally {
      setProfileLoading(false);
      isProfileFetchingRef.current = false;
    }
  }, [profile]); // Include profile to prevent clearing it unnecessarily

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          // Fetch profile after login
          refreshProfile(session.user);
        } else {
          // Clear profile on logout
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.id);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          refreshProfile(session.user);
        } else {
          setProfileLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setLoading(false);
          setProfileLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]); // Only depend on refreshProfile

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
          .order('created_at', { ascending: false })
          .limit(1)
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