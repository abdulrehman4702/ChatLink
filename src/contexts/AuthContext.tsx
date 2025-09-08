import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to ensure user exists in users table
  const ensureUserExists = async (
    userId: string,
    email: string,
    fullName: string
  ) => {
    try {
      // Check if user exists in users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

      if (!existingUser) {
        // User doesn't exist in users table, create them
        const { error } = await supabase.from("users").insert({
          id: userId,
          email,
          full_name: fullName,
          status: "online",
          last_seen: new Date().toISOString(),
        });

        if (error) {
          console.error("Error creating user profile:", error);
        }
      }
    } catch (error) {
      console.error("Error ensuring user exists:", error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Ensure user exists in users table when they sign in
      if (session?.user && event === "SIGNED_IN") {
        await ensureUserExists(
          session.user.id,
          session.user.email || "",
          session.user.user_metadata?.full_name || "User"
        );
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (!error && data.user) {
      // Create user profile with error handling
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        status: "online",
        last_seen: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Error creating user profile:", profileError);
        // Return the profile error instead of the auth error
        return { data: null, error: profileError };
      }
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      // Ensure user exists in users table, create if not
      await ensureUserExists(
        data.user.id,
        email,
        data.user.user_metadata?.full_name || "User"
      );

      // Update user status to online
      await supabase
        .from("users")
        .update({
          status: "online",
          last_seen: new Date().toISOString(),
        })
        .eq("id", data.user.id);
    }

    return { data, error };
  };

  const signOut = async () => {
    if (user) {
      // Update user status to offline
      await supabase
        .from("users")
        .update({
          status: "offline",
          last_seen: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signUp,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
