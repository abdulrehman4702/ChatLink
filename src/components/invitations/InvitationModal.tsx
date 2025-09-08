import React, { useState } from "react";
import { X, Send, UserPlus } from "lucide-react";
import { useInvitations } from "../../hooks/useInvitations";

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onInvitationSent?: (success: boolean, message?: string) => void;
}

export const InvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  onClose,
  user,
  onInvitationSent,
}) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendInvitation } = useInvitations();

  const handleSendInvitation = async () => {
    if (!user) return;

    setIsSending(true);
    try {
      const result = await sendInvitation(user.id, message.trim() || undefined);

      if (result.success) {
        onClose();
        setMessage("");
        // Notify parent component about successful invitation
        if (onInvitationSent) {
          onInvitationSent(
            true,
            "Your chat invitation has been sent successfully!"
          );
        }
      } else {
        // Notify parent component about failed invitation
        if (onInvitationSent) {
          onInvitationSent(false, result.error || "Failed to send invitation");
        }
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      // Notify parent component about error
      if (onInvitationSent) {
        onInvitationSent(false, "Failed to send invitation. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Send Chat Invitation
              </h2>
              <p className="text-sm text-gray-500">
                Invite {user.full_name} to start chatting
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-xl">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-gray-900">
                {user.full_name}
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-6">
            <label
              htmlFor="invitation-message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Optional Message
            </label>
            <textarea
              id="invitation-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {message.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvitation}
              disabled={isSending}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Invitation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
