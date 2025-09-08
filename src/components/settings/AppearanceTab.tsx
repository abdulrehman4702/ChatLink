import React from "react";

interface UserProfile {
  full_name: string;
  bio: string;
  phone: string;
  location: string;
  theme: "light" | "dark" | "system";
}

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

interface AppearanceTabProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  onSave: () => void;
  loading: boolean;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  profile,
  setProfile,
  settings,
  setSettings,
  onSave,
  loading,
}) => {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Appearance Settings
      </h2>

      <div className="space-y-6">
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={profile.theme}
            onChange={(e) =>
              setProfile({
                ...profile,
                theme: e.target.value as "light" | "dark" | "system",
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) =>
              setSettings({ ...settings, language: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) =>
              setSettings({ ...settings, timezone: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={loading}
        className="mt-6 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Appearance Settings"}
      </button>
    </div>
  );
};
