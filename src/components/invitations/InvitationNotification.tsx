import React, { useState, useEffect } from "react";
import { Bell, X, UserPlus } from "lucide-react";
import { useInvitations } from "../../hooks/useInvitations";
import { useModal } from "../../hooks/useModal";
import { ModalWrapper } from "../common/ModalWrapper";

interface InvitationNotificationProps {
  onInvitationAccepted?: (invitation: any) => void;
}

export const InvitationNotification: React.FC<InvitationNotificationProps> = ({
  onInvitationAccepted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const { pendingInvitations, respondToInvitation } = useInvitations();
  const { modalState, hideModal, showAlert } = useModal();

  // Show notification when new invitations arrive
  useEffect(() => {
    if (pendingInvitations.length > 0) {
      setShowNotification(true);
      // Auto-hide notification after 10 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      // Hide notification when no pending invitations
      setShowNotification(false);
    }
  }, [pendingInvitations.length]);

  const handleAccept = async (invitation: any) => {
    const result = await respondToInvitation(invitation.id, "accepted");
    if (result.success && onInvitationAccepted) {
      onInvitationAccepted(invitation);
      showAlert(
        "Invitation Accepted",
        "You can now start chatting with this user! The conversation has been created.",
        "success"
      );
    } else {
      showAlert(
        "Failed to Accept",
        "There was an error accepting the invitation. Please try again.",
        "error"
      );
    }
    setShowNotification(false);
  };

  const handleReject = async (invitation: any) => {
    const result = await respondToInvitation(invitation.id, "rejected");
    if (result.success) {
      showAlert(
        "Invitation Declined",
        "The invitation has been declined.",
        "info"
      );
    } else {
      showAlert(
        "Failed to Decline",
        "There was an error declining the invitation. Please try again.",
        "error"
      );
    }
    setShowNotification(false);
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  const latestInvitation = pendingInvitations[0];

  return (
    <>
      {/* Notification Bell - Always show if there are pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Chat Invitations"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
              {pendingInvitations.length}
            </span>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Chat Invitations
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      {invitation.sender?.avatar_url ? (
                        <img
                          src={invitation.sender.avatar_url}
                          alt={invitation.sender.full_name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {invitation.sender?.full_name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">
                          {invitation.sender?.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          wants to start a chat
                        </div>
                        {invitation.message && (
                          <div className="text-sm text-gray-600 mt-1 italic">
                            "{invitation.message}"
                          </div>
                        )}
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleAccept(invitation)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleReject(invitation)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification - Only show for new invitations */}
      {showNotification && latestInvitation && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 animate-in slide-in-from-right">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-sm mx-auto sm:mx-0">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">
                  New Chat Invitation
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {latestInvitation.sender?.full_name} wants to start a chat
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleAccept(latestInvitation)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
};
