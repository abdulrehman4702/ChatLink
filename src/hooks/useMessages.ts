import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useSocket } from "./useSocket";
// import { useNotifications } from "./useNotifications"; // Removed unused import
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
  // Remove unused markAsRead import to fix linting warning
  // const { markAsRead } = useNotifications();

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
  ]);

  // Separate effect for marking messages as read to prevent race conditions
  useEffect(() => {
    if (conversationId && user) {
      // Debounce the markAsRead calls
      const timeoutId = setTimeout(() => {
        markMessagesAsRead(conversationId);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [conversationId, user]);

  // Handle typing status
  useEffect(() => {
    if (otherUser && typingUsers.has(otherUser.id)) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [typingUsers, otherUser]);

  // Create stable callback functions for WebSocket events
  const handleReceiveMessage = useCallback(
    (message: Message) => {
      console.log("Received message via WebSocket:", message);

      // Check both field names for compatibility
      const messageConversationId =
        message.conversation_id || (message as any).conversationId;

      console.log(
        "Message conversation ID:",
        messageConversationId,
        "Current conversation ID:",
        conversationId
      );

      if (messageConversationId === conversationId) {
        console.log("Message matches current conversation, adding to state");

        // Update state immediately via WebSocket
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some((msg) => msg.id === message.id);
          if (exists) {
            console.log("Message already exists, skipping");
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

          console.log(
            "Adding normalized message to state via WebSocket:",
            normalizedMessage
          );
          return [...prev, normalizedMessage];
        });
      } else {
        console.log("Message doesn't match current conversation, ignoring");
      }
    },
    [conversationId]
  );

  const handleMessageStatus = useCallback((data: any) => {
    console.log("Message status update received via WebSocket:", data);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId ? { ...msg, status: data.status } : msg
      )
    );
  }, []);

  const handleMessageRead = useCallback((data: any) => {
    console.log("Message read status received via WebSocket:", data);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId ? { ...msg, status: "read" } : msg
      )
    );
  }, []);

  // WebSocket event listeners for real-time communication
  useEffect(() => {
    if (!socket) {
      console.log("WebSocket not available for message listeners");
      return;
    }

    console.log(
      "Setting up WebSocket event listeners for conversation:",
      conversationId
    );

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_status", handleMessageStatus);
    socket.on("message_read", handleMessageRead);

    // Handle conversation room join confirmation via WebSocket
    const handleConversationJoined = (data: { conversationId: string }) => {
      console.log("Conversation joined event received via WebSocket:", data);
      if (data.conversationId === conversationId) {
        console.log("Reloading messages after WebSocket conversation join");
        loadMessages();
      }
    };

    socket.on("conversation_joined", handleConversationJoined);

    return () => {
      console.log("Cleaning up WebSocket event listeners");
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
    console.log("Adding message locally:", message);
    setMessages((prev) => {
      // Check if message already exists to prevent duplicates
      const exists = prev.some((msg) => msg.id === message.id);
      if (exists) {
        console.log("Message already exists in local state, skipping");
        return prev;
      }
      console.log("Adding message to local state");
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
