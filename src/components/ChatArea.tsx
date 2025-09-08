import React from "react";
import { ChatAreaRefactored } from "./chat/ChatAreaRefactored";

interface User {
  id: string;
  full_name: string;
  email: string;
  status: "online" | "offline";
  last_seen: string;
  avatar_url?: string;
}

interface ChatAreaProps {
  conversationId: string | null;
  otherUser: User | null;
  loading?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversationId,
  otherUser,
  loading,
}) => {
  return (
    <ChatAreaRefactored
      conversationId={conversationId}
      otherUser={otherUser}
      loading={loading}
    />
  );
};
