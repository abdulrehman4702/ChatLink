import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "../lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  status: "online" | "offline";
  last_seen: string;
  bio?: string;
  phone?: string;
  location?: string;
  theme?: string;
}

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, email, full_name, avatar_url, status, last_seen, bio, phone, location, theme"
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: "No user logged in" };

    try {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user profile:", error);
        return { error };
      }

      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("Error in updateUserProfile:", error);
      return { error };
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user?.id]);

  return {
    userProfile,
    loading,
    refetch: fetchUserProfile,
    updateProfile: updateUserProfile,
  };
};
