import React from "react";

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

interface PrivacyTabProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  onSave: () => void;
  loading: boolean;
}

export const PrivacyTab: React.FC<PrivacyTabProps> = ({
  settings,
  setSettings,
  onSave,
  loading,
}) => {
  const privacySettings = [
    {
      key: "show_online_status",
      label: "Show Online Status",
      desc: "Let others see when you're online",
    },
    {
      key: "show_last_seen",
      label: "Show Last Seen",
      desc: "Let others see when you were last active",
    },
    {
      key: "allow_direct_messages",
      label: "Allow Direct Messages",
      desc: "Let others send you direct messages",
    },
    {
      key: "show_read_receipts",
      label: "Show Read Receipts",
      desc: "Let others see when you've read their messages",
    },
    {
      key: "searchable_by_email",
      label: "Searchable by Email",
      desc: "Let others find you by your email address",
    },
    {
      key: "searchable_by_phone",
      label: "Searchable by Phone",
      desc: "Let others find you by your phone number",
    },
  ];

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Privacy Settings
      </h2>

      <div className="space-y-6">
        {privacySettings.map((setting) => (
          <div
            key={setting.key}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
          >
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {setting.label}
              </h3>
              <p className="text-sm text-gray-500">{setting.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings[setting.key as keyof UserSettings] as boolean}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    [setting.key]: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={loading}
        className="mt-6 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Privacy Settings"}
      </button>
    </div>
  );
};
