import React from "react";
import { Check, X, Clock, UserPlus, UserCheck, UserX } from "lucide-react";
import { useInvitations, ChatInvitation } from "../../hooks/useInvitations";
import { formatMessageTime } from "../../utils/timeFormat";

interface InvitationListProps {
  type: "pending" | "sent";
  onInvitationAccepted?: (invitation: ChatInvitation) => void;
}

export const InvitationList: React.FC<InvitationListProps> = ({
  type,
  onInvitationAccepted,
}) => {
  const {
    pendingInvitations,
    sentInvitations,
    loading,
    respondToInvitation,
    cancelInvitation,
  } = useInvitations();

  const invitations = type === "pending" ? pendingInvitations : sentInvitations;

  const handleAccept = async (invitation: ChatInvitation) => {
    const result = await respondToInvitation(invitation.id, "accepted");
    if (result.success && onInvitationAccepted) {
      onInvitationAccepted(invitation);
    }
  };

  const handleReject = async (invitation: ChatInvitation) => {
    await respondToInvitation(invitation.id, "rejected");
  };

  const handleCancel = async (invitation: ChatInvitation) => {
    await cancelInvitation(invitation.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "accepted":
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case "rejected":
        return <UserX className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "rejected":
        return "Rejected";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "accepted":
        return "text-green-600 bg-green-50";
      case "rejected":
        return "text-red-600 bg-red-50";
      case "cancelled":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8">
        <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">
          {type === "pending"
            ? "No pending invitations"
            : "No sent invitations"}
        </p>
        <p className="text-gray-400 text-sm">
          {type === "pending"
            ? "You have no pending chat invitations"
            : "You haven't sent any invitations yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => {
        const otherUser =
          type === "pending" ? invitation.sender : invitation.recipient;

        return (
          <div
            key={invitation.id}
            className="flex items-center space-x-3 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow"
          >
            {/* Avatar */}
            <div className="relative">
              {otherUser?.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.full_name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {otherUser?.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {otherUser?.full_name}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {otherUser?.email}
              </div>
              {invitation.message && (
                <div className="text-sm text-gray-600 mt-1 italic">
                  "{invitation.message}"
                </div>
              )}
              <div className="flex items-center space-x-2 mt-2">
                {getStatusIcon(invitation.status)}
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                    invitation.status
                  )}`}
                >
                  {getStatusText(invitation.status)}
                </span>
                <span className="text-xs text-gray-400">
                  {formatMessageTime(invitation.created_at)}
                </span>
              </div>
            </div>

            {/* Actions */}
            {type === "pending" && invitation.status === "pending" && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAccept(invitation)}
                  className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                  title="Accept invitation"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReject(invitation)}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                  title="Reject invitation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {type === "sent" && invitation.status === "pending" && (
              <button
                onClick={() => handleCancel(invitation)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                title="Cancel invitation"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
