import React, { useState } from "react";
import { LogOut, MessageCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarHeader } from "./SidebarHeader";
import { ActionBar } from "./ActionBar";
import { UserItem } from "./UserItem";
import { ConversationItem } from "./ConversationItem";
import { ConversationSkeleton, UserSkeleton } from "../Skeleton";
import { InvitationModal } from "../invitations/InvitationModal";
import { ModalWrapper } from "../common/ModalWrapper";
import { useSidebar } from "../../hooks/useSidebar";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useInvitations } from "../../hooks/useInvitations";
import { useModal } from "../../hooks/useModal";

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
  const { userProfile } = useUserProfile();
  const navigate = useNavigate();
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { modalState, hideModal, showAlert } = useModal();

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
    handleRefresh,
    handleLogout,
    markAsRead,
  } = useSidebar(selectedConversation);

  const { getInvitationStatus } = useInvitations();

  const handleUserClick = async (user: User) => {
    // Check if there's already a conversation or invitation
    const invitationStatus = await getInvitationStatus(user.id);

    if (invitationStatus === "conversation_exists") {
      // Conversation already exists, navigate to it
      showAlert(
        "Conversation Exists",
        "You already have a conversation with this user. Check your conversations list.",
        "info"
      );
      return;
    }

    if (invitationStatus === "sent") {
      // Show message that invitation is already sent
      showAlert(
        "Invitation Already Sent",
        "You have already sent an invitation to this user. Please wait for their response.",
        "warning"
      );
      return;
    }

    if (invitationStatus === "received") {
      // Show message that user has sent you an invitation
      showAlert(
        "Invitation Received",
        "This user has already sent you an invitation. Please check your notifications to accept or decline it.",
        "info"
      );
      return;
    }

    // Open invitation modal
    setSelectedUser(user);
    setInvitationModalOpen(true);
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
        user={userProfile}
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

      {/* Invitation Modal */}
      <InvitationModal
        isOpen={invitationModalOpen}
        onClose={() => {
          setInvitationModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onInvitationSent={(success, message) => {
          if (success) {
            showAlert(
              "Invitation Sent",
              message || "Your chat invitation has been sent successfully!",
              "success"
            );
          } else {
            showAlert(
              "Failed to Send Invitation",
              message || "Failed to send invitation",
              "error"
            );
          }
        }}
      />

      {/* Alert Modal */}
      <ModalWrapper
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showActions={modalState.showActions}
      />
    </div>
  );
};
