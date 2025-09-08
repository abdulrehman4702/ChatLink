import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
} from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { supabase } from "../lib/supabase";

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  sound_notifications: boolean;
  desktop_notifications: boolean;
}

interface UnreadMessage {
  conversation_id: string;
  count: number;
  last_message: string;
  last_message_at: string;
  sender_name: string;
}

interface NotificationContextType {
  unreadCounts: Map<string, number>;
  totalUnreadCount: number;
  notificationSettings: NotificationSettings;
  unreadMessages: UnreadMessage[];
  updateNotificationSettings: (
    settings: Partial<NotificationSettings>
  ) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  playNotificationSound: () => void;
  showDesktopNotification: (title: string, body: string, icon?: string) => void;
  refreshNotifications: () => Promise<void>;
}

// Create default values for better Fast Refresh compatibility
const defaultNotificationSettings: NotificationSettings = {
  email_notifications: true,
  push_notifications: true,
  message_notifications: true,
  sound_notifications: true,
  desktop_notifications: true,
};

const defaultContextValue: NotificationContextType = {
  unreadCounts: new Map(),
  totalUnreadCount: 0,
  notificationSettings: defaultNotificationSettings,
  unreadMessages: [],
  updateNotificationSettings: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  playNotificationSound: () => {},
  showDesktopNotification: () => {},
  refreshNotifications: async () => {},
};

export const NotificationContext =
  createContext<NotificationContextType>(defaultContextValue);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      email_notifications: true,
      push_notifications: true,
      message_notifications: true,
      sound_notifications: true,
      desktop_notifications: true,
    });

  const { user } = useAuth();
  const { socket, currentConversationId } = useSocket();

  // Load notification settings
  useEffect(() => {
    if (user) {
      loadNotificationSettings();
      loadUnreadCounts();
    }
  }, [user]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (socket && user) {
      const handleReceiveMessage = (message: any) => {
        console.log(
          "Notification context received message via WebSocket:",
          message
        );
        if (message.sender_id !== user.id) {
          handleNewMessage(message);
        }
      };

      const handleMessageRead = (data: any) => {
        console.log("Message read event received via WebSocket:", data);
        // Update local state immediately
        setUnreadCounts((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.conversationId);
          return newMap;
        });
        setUnreadMessages((prev) =>
          prev.filter((msg) => msg.conversation_id !== data.conversationId)
        );
      };

      socket.on("receive_message", handleReceiveMessage);
      socket.on("message_read", handleMessageRead);

      return () => {
        socket.off("receive_message", handleReceiveMessage);
        socket.off("message_read", handleMessageRead);
      };
    }
  }, [socket, user]);

  const loadNotificationSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select(
          "email_notifications, push_notifications, message_notifications, sound_notifications, desktop_notifications"
        )
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If table doesn't exist or user has no settings, create default settings
        if (error.code === "PGRST116" || error.code === "42P01") {
          // Create default settings for the user
          try {
            const { error: insertError } = await supabase
              .from("user_settings")
              .insert({
                user_id: user.id,
                email_notifications: true,
                push_notifications: true,
                message_notifications: true,
                sound_notifications: true,
                desktop_notifications: true,
              });

            if (insertError) {
              console.error("Error creating default settings:", insertError);
            }
          } catch (insertError) {
            console.error("Error creating default settings:", insertError);
          }
          return;
        }

        // Handle column doesn't exist error
        if (error.message?.includes("does not exist")) {
          console.warn(
            "Notification settings columns missing - using defaults"
          );
          return;
        }

        console.error("Error loading notification settings:", error);
        return;
      }

      if (data) {
        setNotificationSettings((prev) => ({
          ...prev,
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          message_notifications: data.message_notifications ?? true,
          sound_notifications: data.sound_notifications ?? true,
          desktop_notifications: data.desktop_notifications ?? true,
        }));
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
    }
  };

  const loadUnreadCounts = useCallback(async () => {
    if (!user) return;

    try {
      // First get all conversations for the user
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id, participant1_id, participant2_id")
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);

      if (convError) {
        console.error("Error loading conversations:", convError);
        return;
      }

      const counts = new Map<string, number>();
      const unreadList: UnreadMessage[] = [];

      // Get unread messages for each conversation
      for (const conv of conversations || []) {
        const { data: unreadMessages, error: msgError } = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .eq("status", "sent")
          .order("created_at", { ascending: false });

        if (!msgError && unreadMessages && unreadMessages.length > 0) {
          counts.set(conv.id, unreadMessages.length);

          // Get sender name for the latest message
          const senderId = unreadMessages[0].sender_id;
          const { data: senderData } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", senderId)
            .single();

          unreadList.push({
            conversation_id: conv.id,
            count: unreadMessages.length,
            last_message: unreadMessages[0].content,
            last_message_at: unreadMessages[0].created_at,
            sender_name: senderData?.full_name || "Unknown",
          });
        }
      }

      setUnreadCounts(counts);
      setUnreadMessages(unreadList);
    } catch (error) {
      console.error("Error loading unread counts:", error);
    }
  }, [user]);

  // Remove periodic refresh - rely on WebSocket events for real-time updates
  // useEffect(() => {
  //   if (user) {
  //     const interval = setInterval(loadUnreadCounts, 60000); // Refresh every 60 seconds
  //     return () => clearInterval(interval);
  //   }
  // }, [user, loadUnreadCounts]);

  // Auto-mark messages as read when user switches to a conversation
  useEffect(() => {
    if (currentConversationId && user) {
      // Debounce the markAsRead call to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        // Call markAsRead function directly to avoid dependency issues
        const markAsReadFn = async (conversationId: string) => {
          if (!user) return;

          try {
            // Update message status to read
            const { error } = await supabase
              .from("messages")
              .update({ status: "read" })
              .eq("conversation_id", conversationId)
              .neq("sender_id", user.id)
              .eq("status", "sent");

            if (error) {
              console.error("Error marking messages as read:", error);
              return;
            }

            // Update local state immediately for better UX
            setUnreadCounts((prev) => {
              const newMap = new Map(prev);
              newMap.delete(conversationId);
              return newMap;
            });

            setUnreadMessages((prev) =>
              prev.filter((msg) => msg.conversation_id !== conversationId)
            );

            // Refresh notifications to ensure consistency
            setTimeout(() => {
              loadUnreadCounts();
            }, 1000);
          } catch (error) {
            console.error("Error marking as read:", error);
          }
        };

        markAsReadFn(currentConversationId);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [currentConversationId, user, loadUnreadCounts]);

  const handleNewMessage = async (message: any) => {
    if (!notificationSettings.message_notifications) return;

    // Update unread counts
    const currentCount = unreadCounts.get(message.conversation_id) || 0;
    setUnreadCounts(
      (prev) => new Map(prev.set(message.conversation_id, currentCount + 1))
    );

    // Only show notifications if user is NOT currently viewing this conversation
    const isViewingConversation =
      currentConversationId === message.conversation_id;

    if (!isViewingConversation) {
      // Play sound notification
      if (notificationSettings.sound_notifications) {
        playNotificationSound();
      }

      // Show desktop notification
      if (
        notificationSettings.desktop_notifications &&
        "Notification" in window
      ) {
        const permission = await requestNotificationPermission();
        if (permission === "granted") {
          showDesktopNotification(
            "New Message",
            message.content,
            "/favicon.ico"
          );
        }
      }
    }

    // Reload unread counts
    loadUnreadCounts();
  };

  const updateNotificationSettings = useCallback(
    async (settings: Partial<NotificationSettings>) => {
      if (!user) return;

      try {
        const newSettings = { ...notificationSettings, ...settings };
        setNotificationSettings(newSettings);

        const { error } = await supabase.from("user_settings").upsert({
          user_id: user.id,
          email_notifications: newSettings.email_notifications,
          push_notifications: newSettings.push_notifications,
          message_notifications: newSettings.message_notifications,
          sound_notifications: newSettings.sound_notifications,
          desktop_notifications: newSettings.desktop_notifications,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error updating notification settings:", error);
          // Still update local state even if database update fails
        }
      } catch (error) {
        console.error("Error updating notification settings:", error);
      }
    },
    [user, notificationSettings]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!user) return;

      try {
        // Update message status to read
        const { error } = await supabase
          .from("messages")
          .update({ status: "read" })
          .eq("conversation_id", conversationId)
          .neq("sender_id", user.id)
          .eq("status", "sent");

        if (error) {
          console.error("Error marking messages as read:", error);
          return;
        }

        // Update local state immediately for better UX
        setUnreadCounts((prev) => {
          const newMap = new Map(prev);
          newMap.delete(conversationId);
          return newMap;
        });

        setUnreadMessages((prev) =>
          prev.filter((msg) => msg.conversation_id !== conversationId)
        );

        // Refresh notifications to ensure consistency
        setTimeout(() => {
          loadUnreadCounts();
        }, 1000);
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    },
    [user, loadUnreadCounts]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      // Update all unread messages to read
      await supabase
        .from("messages")
        .update({ status: "read" })
        .neq("sender_id", user.id)
        .eq("status", "sent");

      // Clear local state
      setUnreadCounts(new Map());
      setUnreadMessages([]);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user]);

  const refreshNotifications = useCallback(async () => {
    console.log("Refreshing notifications...");
    await loadUnreadCounts();
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
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
      console.error("Error playing notification sound:", error);
      // Fallback to system beep
    }
  }, []);

  const showDesktopNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: icon || "/favicon.ico",
          badge: "/favicon.ico",
          tag: "chatlink-message",
        });
      }
    },
    []
  );

  const requestNotificationPermission =
    async (): Promise<NotificationPermission> => {
      if (!("Notification" in window)) return "denied";

      if (Notification.permission === "default") {
        return await Notification.requestPermission();
      }

      return Notification.permission;
    };

  const totalUnreadCount = Array.from(unreadCounts.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  const contextValue = useMemo(
    () => ({
      unreadCounts,
      totalUnreadCount,
      notificationSettings,
      unreadMessages,
      updateNotificationSettings,
      markAsRead,
      markAllAsRead,
      playNotificationSound,
      showDesktopNotification,
      refreshNotifications,
    }),
    [
      unreadCounts,
      totalUnreadCount,
      notificationSettings,
      unreadMessages,
      updateNotificationSettings,
      markAsRead,
      markAllAsRead,
      playNotificationSound,
      showDesktopNotification,
      refreshNotifications,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Export the hook from the context file for better Fast Refresh compatibility
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
