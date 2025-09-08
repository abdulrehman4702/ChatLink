import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useNotifications } from "../contexts/NotificationContext";
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
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { user, signOut } = useAuth();
  const { onlineUsers } = useSocket();
  const { unreadCounts, totalUnreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();

  // Handle conversation deletion
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

    window.addEventListener(
      "conversation_deleted",
      handleConversationDeleted as EventListener
    );

    return () => {
      window.removeEventListener(
        "conversation_deleted",
        handleConversationDeleted as EventListener
      );
    };
  }, [selectedConversation, navigate]);

  const loadConversations = async () => {
    if (!user) return;

    setLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) {
        console.error("Error loading conversations:", error);
        return;
      }

      if (data && data.length > 0) {
        const conversationsWithUsers = await Promise.all(
          data.map(async (conv) => {
            const otherUserId =
              conv.participant1_id === user.id
                ? conv.participant2_id
                : conv.participant1_id;

            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("id, full_name, email, avatar_url, status, last_seen")
              .eq("id", otherUserId)
              .single();

            if (userError) {
              console.error(
                "Error loading user data for",
                otherUserId,
                ":",
                userError
              );
              return null;
            }

            return {
              ...conv,
              other_user: userData,
            };
          })
        );

        const validConversations = conversationsWithUsers.filter(
          (conv) => conv !== null
        );
        setConversations(validConversations);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("Error in loadConversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

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

  const startNewConversation = async (
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
    } else {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          participant1_id: user.id,
          participant2_id: otherUser.id,
        })
        .select()
        .single();

      if (!error && newConv) {
        onSelectConversation(newConv.id, otherUser);
        navigate(`/chat/${newConv.id}`);
        setTimeout(() => {
          loadConversations();
        }, 100);
      } else {
        console.error("Error creating conversation:", error);
      }
    }
    setShowUserSearch(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadConversations(), loadAllUsers()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  useEffect(() => {
    if (user) {
      loadConversations();
      loadAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedConversation) {
      loadConversations();
    }
  }, [selectedConversation, user]);

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
    startNewConversation,
    handleRefresh,
    handleLogout,
    markAsRead,
  };
};
