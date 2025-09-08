import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { supabase } from "../lib/supabase";

interface UserSettings {
  show_online_status: boolean;
  show_last_seen: boolean;
  allow_direct_messages: boolean;
  show_read_receipts: boolean;
  searchable_by_email: boolean;
  searchable_by_phone: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  language: string;
  timezone: string;
}

interface UserProfile {
  full_name: string;
  bio: string;
  phone: string;
  location: string;
  theme: "light" | "dark" | "system";
}

export const useSettings = () => {
  const { user } = useAuth();
  const { notificationSettings, updateNotificationSettings, markAllAsRead } =
    useNotifications();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    bio: "",
    phone: "",
    location: "",
    theme: "system",
  });
  const [settings, setSettings] = useState<UserSettings>({
    show_online_status: true,
    show_last_seen: true,
    allow_direct_messages: true,
    show_read_receipts: true,
    searchable_by_email: true,
    searchable_by_phone: false,
    email_notifications: true,
    push_notifications: true,
    message_notifications: true,
    language: "en",
    timezone: "UTC",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("full_name, bio, phone, location, theme, avatar_url")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      if (userData) {
        setProfile({
          full_name: userData.full_name || "",
          bio: userData.bio || "",
          phone: userData.phone || "",
          location: userData.location || "",
          theme: userData.theme || "system",
        });
        setAvatarPreview(userData.avatar_url || "");
      }

      // Load user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settingsError && settingsError.code !== "PGRST116")
        throw settingsError;

      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;

    try {
      setLoading(true);
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarFile(null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Update user profile
      const { error: profileError } = await supabase
        .from("users")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          phone: profile.phone,
          location: profile.location,
          theme: profile.theme,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Upload avatar if selected
      if (avatarFile) {
        await uploadAvatar();
      }

      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    profile,
    setProfile,
    settings,
    setSettings,
    avatarFile,
    setAvatarFile,
    avatarPreview,
    setAvatarPreview,
    loading,
    setLoading,
    notificationSettings,
    updateNotificationSettings,
    markAllAsRead,
    handleAvatarUpload,
    saveProfile,
    saveSettings,
  };
};
