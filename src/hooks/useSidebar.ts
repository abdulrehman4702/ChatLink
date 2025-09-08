import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useSocket } from "./useSocket";
import { useNotifications } from "./useNotifications";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  status: "online" | "offline";
  last_seen: string;
}

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string;
  last_message_at: string;
  other_user: User;
}

export const useSidebar = (selectedConversation: string | null) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { user, signOut } = useAuth();
  const { onlineUsers, socket } = useSocket();
  const { unreadCounts, totalUnreadCount, markAsRead, refreshNotifications } =
    useNotifications();
  const navigate = useNavigate();

  // Handle conversation deletion and creation events
  useEffect(() => {
    const handleConversationDeleted = (event: CustomEvent) => {
      const { conversationId } = event.detail;

      // Remove the deleted conversation from the list
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );

      // If the deleted conversation was selected, navigate to home
      if (selectedConversation === conversationId) {
        navigate("/");
      }
    };

    const handleConversationCreated = (event: CustomEvent) => {
      console.log(
        "Conversation created event received in sidebar:",
        event.detail
      );
      // Reload conversations to include the new conversation
      loadConversations();
      // Refresh notifications
      refreshNotifications();
    };

    const handleInvitationResponse = (event: CustomEvent) => {
      console.log(
        "Invitation response event received in sidebar:",
        event.detail
      );
      // Reload conversations in case a new conversation was created
      loadConversations();
      // Refresh notifications
      refreshNotifications();
    };

    window.addEventListener(
      "conversation_deleted",
      handleConversationDeleted as EventListener
    );
    window.addEventListener(
      "conversation_created",
      handleConversationCreated as EventListener
    );
    window.addEventListener(
      "invitation_response",
      handleInvitationResponse as EventListener
    );

    return () => {
      window.removeEventListener(
        "conversation_deleted",
        handleConversationDeleted as EventListener
      );
      window.removeEventListener(
        "conversation_created",
        handleConversationCreated as EventListener
      );
      window.removeEventListener(
        "invitation_response",
        handleInvitationResponse as EventListener
      );
    };
  }, [selectedConversation, navigate, refreshNotifications]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoadingConversations(true);
    try {
      // Use a single query with join to get user data efficiently
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          participant1:users!conversations_participant1_id_fkey(id, full_name, email, avatar_url, status, last_seen),
          participant2:users!conversations_participant2_id_fkey(id, full_name, email, avatar_url, status, last_seen)
        `
        )
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Error loading conversations:", error);
        return;
      }

      if (data && data.length > 0) {
        const conversationsWithUsers = data.map((conv) => {
          const otherUser =
            conv.participant1_id === user.id
              ? conv.participant2
              : conv.participant1;

          return {
            ...conv,
            other_user: otherUser,
          };
        });

        setConversations(conversationsWithUsers);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("Error in loadConversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  const loadAllUsers = async () => {
    if (!user) return;

    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, avatar_url, status, last_seen")
        .neq("id", user.id)
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error loading users:", error);
        return;
      }

      if (data) {
        setAllUsers(data);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Error in loadAllUsers:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const selectExistingConversation = async (
    otherUser: User,
    onSelectConversation: (conversationId: string, otherUser: User) => void
  ) => {
    if (!user) return;

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUser.id}),and(participant1_id.eq.${otherUser.id},participant2_id.eq.${user.id})`
      )
      .single();

    if (existingConv) {
      onSelectConversation(existingConv.id, otherUser);
      navigate(`/chat/${existingConv.id}`);
      setShowUserSearch(false);
    } else {
      // No existing conversation - this should not happen with invitation system
      console.warn(
        "No existing conversation found. User should send invitation first."
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadConversations(),
      loadAllUsers(),
      refreshNotifications(),
    ]);
    setRefreshing(false);
  };

  // Function to refresh conversations (can be called from other components)
  const refreshConversations = useCallback(async () => {
    console.log("Refreshing conversations...");
    await loadConversations();
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Logout initiated");
      await signOut();
      console.log("Sign out successful");
      // Don't force navigation - let React Router handle it based on auth state
    } catch (error) {
      console.error("Error during logout:", error);
      // Still don't force navigation - let the auth state change handle it
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
      loadAllUsers();
    } else {
      // Reset states when user logs out
      setConversations([]);
      setAllUsers([]);
      setLoadingConversations(false);
      setLoadingUsers(false);
    }
  }, [user]);

  // Listen for new messages to update conversation list
  useEffect(() => {
    if (socket && user) {
      const handleNewMessage = (message: any) => {
        console.log("New message received in sidebar:", message);
        // Reload conversations to get updated last_message and last_message_at
        loadConversations();
        // Also refresh notifications to update unread counts
        refreshNotifications();
      };

      const handleConversationCreated = (data: any) => {
        console.log("New conversation created:", data);
        // Reload conversations to include the new conversation
        loadConversations();
        // Refresh notifications
        refreshNotifications();
      };

      const handleInvitationResponse = (data: any) => {
        console.log("Invitation response received:", data);
        // Reload conversations in case a new conversation was created
        loadConversations();
        // Refresh notifications
        refreshNotifications();
      };

      socket.on("receive_message", handleNewMessage);
      socket.on("conversation_created", handleConversationCreated);
      socket.on("invitation_response", handleInvitationResponse);

      return () => {
        socket.off("receive_message", handleNewMessage);
        socket.off("conversation_created", handleConversationCreated);
        socket.off("invitation_response", handleInvitationResponse);
      };
    }
  }, [socket, user, refreshNotifications, loadConversations]);

  useEffect(() => {
    if (user && selectedConversation) {
      loadConversations();
    }
  }, [selectedConversation, user]);

  // Remove periodic refresh - rely on WebSocket events for real-time updates
  // useEffect(() => {
  //   if (user) {
  //     const interval = setInterval(() => {
  //       console.log("Periodic sidebar refresh...");
  //       loadConversations();
  //       refreshNotifications();
  //     }, 60000); // Refresh every 60 seconds instead of 30

  //     return () => clearInterval(interval);
  //   }
  // }, [user, refreshNotifications]);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.other_user?.full_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.other_user?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    searchQuery,
    setSearchQuery,
    conversations: filteredConversations,
    allUsers: filteredUsers,
    showUserSearch,
    setShowUserSearch,
    refreshing,
    loadingConversations,
    loadingUsers,
    unreadCounts,
    totalUnreadCount,
    onlineUsers,
    loadConversations,
    loadAllUsers,
    selectExistingConversation,
    handleRefresh,
    handleLogout,
    markAsRead,
    refreshConversations,
  };
};
