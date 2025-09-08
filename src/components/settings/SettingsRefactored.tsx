import React from "react";
import { ProfileTab } from "./ProfileTab";
import { PrivacyTab } from "./PrivacyTab";
import { NotificationsTab } from "./NotificationsTab";
import { AppearanceTab } from "./AppearanceTab";
import { useSettings } from "../../hooks/useSettings";

export const SettingsRefactored: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    profile,
    setProfile,
    settings,
    setSettings,
    avatarPreview,
    loading,
    notificationSettings,
    updateNotificationSettings,
    markAllAsRead,
    handleAvatarUpload,
    saveProfile,
    saveSettings,
  } = useSettings();

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "privacy", label: "Privacy", icon: "🔒" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "appearance", label: "Appearance", icon: "🎨" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileTab
            profile={profile}
            setProfile={setProfile}
            avatarPreview={avatarPreview}
            onAvatarUpload={handleAvatarUpload}
            onSave={saveProfile}
            loading={loading}
          />
        );
      case "privacy":
        return (
          <PrivacyTab
            settings={settings}
            setSettings={setSettings}
            onSave={saveSettings}
            loading={loading}
          />
        );
      case "notifications":
        return (
          <NotificationsTab
            notificationSettings={notificationSettings}
            updateNotificationSettings={updateNotificationSettings}
            markAllAsRead={markAllAsRead}
          />
        );
      case "appearance":
        return (
          <AppearanceTab
            profile={profile}
            setProfile={setProfile}
            settings={settings}
            setSettings={setSettings}
            onSave={saveProfile}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full flex">
        {/* Tab Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto">{renderTabContent()}</div>
      </div>
    </div>
  );
};
