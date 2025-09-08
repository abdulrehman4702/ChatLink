import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useSocket } from "./useSocket";
import { useNotifications } from "./useNotifications";
import { supabase } from "../lib/supabase";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  status: "sent" | "delivered" | "read";
  created_at: string;
  conversation_id?: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  status: "online" | "offline";
  last_seen: string;
  avatar_url?: string;
}

export const useMessages = (
  conversationId: string | null,
  otherUser: User | null
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const { user } = useAuth();
  const {
    socket,
    onlineUsers,
    typingUsers,
    joinConversation,
    leaveConversation,
    currentConversationId,
    isConnected,
  } = useSocket();
  const { markAsRead } = useNotifications();

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user || !socket) return;

    try {
      // Update message status in database
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

      // Notify the sender that messages have been read
      const unreadMessages = messages.filter(
        (msg) => msg.sender_id !== user.id && msg.status === "sent"
      );

      for (const message of unreadMessages) {
        socket.emit("message_read", {
          messageId: message.id,
          conversationId: conversationId,
          senderId: message.sender_id,
          readerId: user.id,
        });
      }

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.sender_id !== user.id && msg.status === "sent"
            ? { ...msg, status: "read" }
            : msg
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages();
      if (markAsRead && typeof markAsRead === "function") {
        try {
          markAsRead(conversationId);
        } catch (error) {
          console.error("Error calling markAsRead:", error);
        }
      }
      markMessagesAsRead(conversationId);
      // Join the conversation room only if we're not already in it
      if (currentConversationId !== conversationId) {
        joinConversation(conversationId);
      }
    } else {
      // Clear messages when no conversation is selected
      setMessages([]);
      setLoadingMessages(false);
    }

    // Cleanup: leave conversation room when component unmounts or conversation changes
    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [
    conversationId,
    loadMessages,
    joinConversation,
    leaveConversation,
    currentConversationId,
  ]); // Added loadMessages to dependencies

  // Handle typing status
  useEffect(() => {
    if (otherUser && typingUsers.has(otherUser.id)) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [typingUsers, otherUser]);

  // Create stable callback functions outside of useEffect
  const handleReceiveMessage = useCallback(
    (message: Message) => {
      // Check both field names for compatibility
      const messageConversationId =
        message.conversation_id || (message as any).conversationId;

      if (messageConversationId === conversationId) {
        // Update state immediately without debouncing
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some((msg) => msg.id === message.id);
          if (exists) {
            return prev;
          }

          // Normalize the message data to match the expected interface
          const normalizedMessage = {
            id: message.id,
            content: message.content,
            sender_id: message.sender_id || (message as any).senderId,
            status: message.status,
            created_at: message.created_at,
            conversation_id:
              message.conversation_id || (message as any).conversationId,
          };

          return [...prev, normalizedMessage];
        });
      } else {
      }
    },
    [conversationId]
  );

  const handleMessageStatus = useCallback((data: any) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId ? { ...msg, status: data.status } : msg
      )
    );
  }, []);

  const handleMessageRead = useCallback((data: any) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId ? { ...msg, status: "read" } : msg
      )
    );
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_status", handleMessageStatus);
    socket.on("message_read", handleMessageRead);

    // Handle conversation room join confirmation - reload messages to ensure sync
    const handleConversationJoined = (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        loadMessages();
      }
    };

    socket.on("conversation_joined", handleConversationJoined);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_status", handleMessageStatus);
      socket.off("message_read", handleMessageRead);
      socket.off("conversation_joined", handleConversationJoined);
    };
  }, [
    socket,
    handleReceiveMessage,
    handleMessageStatus,
    handleMessageRead,
    conversationId,
    loadMessages,
  ]);

  // Function to add a message locally (for sender's own messages)
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);

  return {
    messages,
    loadingMessages,
    isTyping,
    onlineUsers,
    markMessagesAsRead,
    isConnected,
    addMessage,
  };
};
