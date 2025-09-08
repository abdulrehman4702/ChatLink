import { useState, useRef } from "react";
import { useAuth } from "./useAuth";
import { useSocket } from "./useSocket";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  full_name: string;
  email: string;
  status: "online" | "offline";
  last_seen: string;
  avatar_url?: string;
}

export const useMessageSend = (
  conversationId: string | null,
  otherUser: User | null,
  addMessage?: (message: any) => void
) => {
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentMessageRef = useRef<string>("");
  const lastSentTimeRef = useRef<number>(0);

  const { user } = useAuth();
  const { socket } = useSocket();

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !otherUser || !user) return;

    // Prevent multiple sends of the same message
    const messageContent = newMessage.trim();
    const currentTime = Date.now();
    const timeSinceLastSend = currentTime - lastSentTimeRef.current;

    // If same message and sent within last 2 seconds, ignore
    if (
      lastSentMessageRef.current === messageContent &&
      timeSinceLastSend < 2000
    ) {
      return;
    }

    // If already sending, ignore
    if (isSending) {
      return;
    }

    setIsSending(true);
    lastSentMessageRef.current = messageContent;
    lastSentTimeRef.current = currentTime;

    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      content: newMessage.trim(),
      sender_id: user.id,
      status: "sent" as const,
      created_at: new Date().toISOString(),
    };

    // Save to database
    const { error: insertError } = await supabase.from("messages").insert({
      id: messageId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: message.content,
    });

    if (insertError) {
      console.error("Error saving message to database:", insertError);
      setIsSending(false);
      return;
    }

    // Update conversation last message
    await supabase
      .from("conversations")
      .update({
        last_message: message.content,
        last_message_at: message.created_at,
      })
      .eq("id", conversationId);

    // Add message to local state immediately for sender
    if (addMessage) {
      addMessage({
        ...message,
        conversation_id: conversationId,
      });
    }

    // Send via socket
    if (socket) {
      socket.emit("send_message", {
        recipientId: otherUser.id,
        message: message.content,
        senderId: user.id,
        messageId,
        conversationId: conversationId,
      });
    }

    setNewMessage("");
    handleTypingStop();
    setIsSending(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!typing && socket && otherUser && conversationId) {
      setTyping(true);
      socket.emit("typing", {
        recipientId: otherUser.id,
        isTyping: true,
        senderId: user?.id,
        conversationId: conversationId,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 2000);
  };

  const handleTypingStop = () => {
    if (typing && socket && otherUser && conversationId) {
      setTyping(false);
      socket.emit("typing", {
        recipientId: otherUser.id,
        isTyping: false,
        senderId: user?.id,
        conversationId: conversationId,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return {
    newMessage,
    setNewMessage,
    sendMessage,
    handleTyping,
    isSending,
  };
};
