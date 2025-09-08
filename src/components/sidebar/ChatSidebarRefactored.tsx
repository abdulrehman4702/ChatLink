import React from "react";
import { LogOut, MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarHeader } from "./SidebarHeader";
import { ActionBar } from "./ActionBar";
import { UserItem } from "./UserItem";
import { ConversationItem } from "./ConversationItem";
import { ConversationSkeleton, UserSkeleton } from "../Skeleton";
import { useSidebar } from "../../hooks/useSidebar";
import { useAuth } from "../../contexts/AuthContext";

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  status: "online" | "offline";
  last_seen: string;
}

interface ChatSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string, otherUser: User) => void;
}

export const ChatSidebarRefactored: React.FC<ChatSidebarProps> = ({
  selectedConversation,
  onSelectConversation,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    searchQuery,
    setSearchQuery,
    conversations,
    allUsers,
    showUserSearch,
    setShowUserSearch,
    refreshing,
    loadingConversations,
    loadingUsers,
    unreadCounts,
    totalUnreadCount,
    onlineUsers,
    startNewConversation,
    handleRefresh,
    handleLogout,
    markAsRead,
  } = useSidebar(selectedConversation);

  const handleUserClick = (user: User) => {
    startNewConversation(user, onSelectConversation);
  };

  const handleConversationClick = (conversationId: string, otherUser: User) => {
    onSelectConversation(conversationId, otherUser);
    if (markAsRead && typeof markAsRead === "function") {
      try {
        markAsRead(conversationId);
      } catch (error) {
        console.error("Error calling markAsRead:", error);
      }
    }
  };

  return (
    <div className="w-full bg-white border-r border-gray-200 flex flex-col h-full shadow-xl">
      <SidebarHeader
        user={user}
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        totalUnreadCount={totalUnreadCount}
      />

      <ActionBar
        showUserSearch={showUserSearch}
        totalUnreadCount={totalUnreadCount}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onToggleUserSearch={() => setShowUserSearch(!showUserSearch)}
        onSettingsClick={() => {
          navigate("/settings");
        }}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {showUserSearch ? (
          /* All Users List */
          <div className="p-4 md:p-6">
            <div className="space-y-3">
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <UserSkeleton key={index} />
                ))
              ) : allUsers.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-sm md:text-base">
                    No users found
                  </p>
                  <p className="text-gray-400 text-xs md:text-sm">
                    Try adjusting your search
                  </p>
                </div>
              ) : (
                allUsers.map((user) => (
                  <UserItem
                    key={user.id}
                    user={user}
                    onlineUsers={onlineUsers}
                    onClick={handleUserClick}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          /* Conversations List */
          <div className="p-4 md:p-6">
            <div className="space-y-3">
              {loadingConversations ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <ConversationSkeleton key={index} />
                ))
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <MessageCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-sm md:text-base">
                    No conversations yet
                  </p>
                  <p className="text-gray-400 text-xs md:text-sm">
                    Start a new chat with someone
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation === conversation.id}
                    hasUnread={unreadCounts.has(conversation.id)}
                    unreadCount={unreadCounts.get(conversation.id) || 0}
                    onlineUsers={onlineUsers}
                    onClick={handleConversationClick}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-3 p-3 md:p-4 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 border border-gray-100 hover:border-red-200 hover:shadow-lg group"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-semibold text-base md:text-lg">Logout</span>
        </button>
      </div>
    </div>
  );
};
