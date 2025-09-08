import React from "react";

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  sound_notifications: boolean;
  desktop_notifications: boolean;
}

interface NotificationsTabProps {
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  markAllAsRead: () => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notificationSettings,
  updateNotificationSettings,
  markAllAsRead,
}) => {
  const notificationOptions = [
    {
      key: "email_notifications",
      label: "Email Notifications",
      desc: "Receive notifications via email",
    },
    {
      key: "push_notifications",
      label: "Push Notifications",
      desc: "Receive push notifications in your browser",
    },
    {
      key: "message_notifications",
      label: "Message Notifications",
      desc: "Get notified about new messages",
    },
    {
      key: "sound_notifications",
      label: "Sound Notifications",
      desc: "Play sound when receiving new messages",
    },
    {
      key: "desktop_notifications",
      label: "Desktop Notifications",
      desc: "Show desktop notifications for new messages",
    },
  ];

  const testNotifications = () => {
    if (notificationSettings.sound_notifications) {
      // Test sound using Web Audio API
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
      }
    }
    if (notificationSettings.desktop_notifications) {
      // Test desktop notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Test Notification", {
          body: "This is a test notification from ChatLink",
          icon: "/favicon.ico",
        });
      }
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Notification Settings
        </h2>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Mark All as Read
        </button>
      </div>

      <div className="space-y-6">
        {notificationOptions.map((setting) => (
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
                checked={
                  notificationSettings[
                    setting.key as keyof typeof notificationSettings
                  ] as boolean
                }
                onChange={(e) =>
                  updateNotificationSettings({
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

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          Test Notifications
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          Test your notification settings to make sure they work properly.
        </p>
        <button
          onClick={testNotifications}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Test Notifications
        </button>
      </div>
    </div>
  );
};
