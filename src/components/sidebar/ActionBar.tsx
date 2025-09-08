import React from "react";
import { RefreshCw, Users, Settings } from "lucide-react";
import { InvitationNotification } from "../invitations/InvitationNotification";

interface ActionBarProps {
  showUserSearch: boolean;
  totalUnreadCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onToggleUserSearch: () => void;
  onSettingsClick: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  showUserSearch,
  totalUnreadCount,
  refreshing,
  onRefresh,
  onToggleUserSearch,
  onSettingsClick,
}) => {
  return (
    <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-500 rounded-full"></div>
          <h2 className="font-semibold text-gray-800 text-base md:text-lg">
            {showUserSearch ? "All Users" : "Conversations"}
          </h2>
          {!showUserSearch && totalUnreadCount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full min-w-[16px] md:min-w-[20px] text-center">
              {totalUnreadCount}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 md:p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl transition-all duration-200 disabled:opacity-50"
            title="Refresh conversations"
          >
            <RefreshCw
              className={`w-4 h-4 md:w-5 md:h-5 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
          </button>
          <button
            onClick={onToggleUserSearch}
            className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-200 ${
              showUserSearch
                ? "bg-indigo-100 text-indigo-600 shadow-md"
                : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
            title={showUserSearch ? "Show conversations" : "Show all users"}
          >
            <Users className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          {/* Invitation Notifications */}
          <InvitationNotification
            onInvitationAccepted={() => {
              // Handle invitation acceptance
              console.log("Invitation accepted from ActionBar");
            }}
          />
          <button
            onClick={onSettingsClick}
            className="p-2 md:p-3 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg md:rounded-xl transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
