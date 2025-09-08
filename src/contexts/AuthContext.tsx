import React, {
  createContext,
  useEffect,
  useState,
  useMemo,
  useContext,
} from "react";
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

// Create default values for better Fast Refresh compatibility
const defaultContextValue: AuthContextType = {
  user: null,
  session: null,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
  loading: true,
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth initialization timeout - forcing loading to false");
        setLoading(false);
      }
    }, 3000); // 3 second fallback timeout

    // Get initial session with timeout
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          clearTimeout(fallbackTimeout);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        if (isMounted) {
          setLoading(false);
          clearTimeout(fallbackTimeout);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log("Auth state change:", event, session?.user?.id);

      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle specific auth events
        if (event === "SIGNED_OUT") {
          console.log("User signed out - clearing all state");
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log("Attempting sign up for:", email);

      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existingUser) {
        console.log("User already exists in database");
        return {
          data: null,
          error: {
            message:
              "An account with this email already exists. Please sign in instead.",
          },
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("Sign up error:", error);

        // Handle specific error cases
        if (
          error.message?.includes("User already registered") ||
          error.message?.includes("already been registered")
        ) {
          // User exists in Supabase Auth but not in our database
          // This means they were deleted from database but not from Auth
          return {
            data: null,
            error: {
              message:
                "An account with this email exists in our system but was deleted. Please contact support or try a different email.",
            },
          };
        }

        return { data: null, error };
      }

      if (!data.user) {
        return {
          data: null,
          error: {
            message: "Failed to create user account. Please try again.",
          },
        };
      }

      console.log("Supabase auth signup successful, creating user profile...");

      // Create user profile in our database
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        status: "online",
        last_seen: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        return {
          data: null,
          error: {
            message: "Failed to create user profile. Please try again.",
          },
        };
      }

      console.log("Sign up completed successfully");
      return { data, error: null };
    } catch (error) {
      console.error("Error during sign up:", error);
      return {
        data: null,
        error: { message: "An unexpected error occurred. Please try again." },
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { data: null, error };
      }

      if (!data.user) {
        return {
          data: null,
          error: { message: "Authentication failed. Please try again." },
        };
      }

      console.log("Supabase auth successful, checking user in database...");

      // Check if user exists in our users table
      const { error: selectError } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (selectError && selectError.code === "PGRST116") {
        // User doesn't exist in our database - this means they were deleted
        console.log("User not found in database - they were deleted");

        // Sign them out from Supabase Auth
        await supabase.auth.signOut();

        return {
          data: null,
          error: {
            message: "Your account has been deleted. Please sign up again.",
          },
        };
      } else if (selectError) {
        console.error("Error checking user existence:", selectError);
        return { data: null, error: selectError };
      } else {
        // User exists, update status
        console.log("User found in database, updating status...");
        await supabase
          .from("users")
          .update({
            status: "online",
            last_seen: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      }

      console.log("Sign in completed successfully");
      return { data, error: null };
    } catch (error) {
      console.error("Error during sign in:", error);
      return {
        data: null,
        error: { message: "An unexpected error occurred. Please try again." },
      };
    }
  };

  const signOut = async () => {
    try {
      console.log("Starting sign out process...");

      // Store user ID before clearing state
      const userId = user?.id;

      // Clear local state first to prevent any race conditions
      setUser(null);
      setSession(null);
      setLoading(false);

      if (userId) {
        // Update user status to offline (non-blocking)
        try {
          await supabase
            .from("users")
            .update({
              status: "offline",
              last_seen: new Date().toISOString(),
            })
            .eq("id", userId);
          console.log("User status updated to offline");
        } catch (error) {
          console.error("Error updating user status:", error);
        }
      }

      // Sign out from Supabase - this clears all tokens
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error during Supabase sign out:", error);
      }

      // Clear any remaining local storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log("Local storage cleared");
      } catch (error) {
        console.error("Error clearing local storage:", error);
      }

      console.log("Sign out completed successfully");
    } catch (error) {
      console.error("Error during sign out:", error);
      // Force clear local state even if signOut fails
      setUser(null);
      setSession(null);
      setLoading(false);

      // Still try to clear storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.error(
          "Error clearing storage during error handling:",
          storageError
        );
      }
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      session,
      signUp,
      signIn,
      signOut,
      loading,
    }),
    [user, session, signUp, signIn, signOut, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Export the hook from the context file for better Fast Refresh compatibility
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
