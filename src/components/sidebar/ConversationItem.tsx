import React from "react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  full_name: string;
  email: string;
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

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  hasUnread: boolean;
  unreadCount: number;
  onlineUsers: Set<string>;
  onClick: (conversationId: string, otherUser: User) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  hasUnread,
  unreadCount,
  onlineUsers,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick(conversation.id, conversation.other_user)}
      className={`group p-3 md:p-4 cursor-pointer transition-all duration-300 rounded-xl md:rounded-2xl border ${
        isSelected
          ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-lg shadow-indigo-100/50"
          : hasUnread
          ? "border-l-4 border-l-red-500 border-r border-t border-b border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 hover:bg-white bg-red-50/30 animate-pulse"
          : "border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 hover:bg-white bg-white"
      }`}
    >
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="relative">
          {conversation.other_user?.avatar_url ? (
            <img
              src={conversation.other_user.avatar_url}
              alt={conversation.other_user.full_name}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover shadow-lg transition-all duration-300"
            />
          ) : (
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg transition-all duration-300 ${
                isSelected
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                  : "bg-gradient-to-br from-purple-400 to-pink-500 group-hover:from-indigo-400 group-hover:to-purple-500"
              }`}
            >
              {conversation.other_user?.full_name?.charAt(0).toUpperCase()}
            </div>
          )}
          {onlineUsers.has(conversation.other_user?.id) && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-white rounded-full shadow-lg animate-pulse"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-gray-900 truncate text-base md:text-lg">
              {conversation.other_user?.full_name}
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="text-xs text-gray-400 font-medium">
                {conversation.last_message_at &&
                  formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: true,
                  })}
              </div>
              {hasUnread && (
                <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full min-w-[16px] md:min-w-[20px] text-center">
                  {unreadCount}
                </div>
              )}
            </div>
          </div>
          <div
            className={`text-xs md:text-sm truncate ${
              hasUnread ? "text-gray-900 font-semibold" : "text-gray-500"
            }`}
          >
            {conversation.last_message || "Start a conversation..."}
          </div>
        </div>
      </div>
    </div>
  );
};
