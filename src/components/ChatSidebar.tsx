import React from "react";
import { ChatSidebarRefactored } from "./sidebar/ChatSidebarRefactored";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  status: "online" | "offline";
  last_seen: string;
}

interface ChatSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string, otherUser: User) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  selectedConversation,
  onSelectConversation,
}) => {
  return (
    <ChatSidebarRefactored
      selectedConversation={selectedConversation}
      onSelectConversation={onSelectConversation}
    />
  );
};
