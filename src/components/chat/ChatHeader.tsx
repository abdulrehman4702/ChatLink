import React, { useState, useEffect, useRef } from "react";
import { Search, Phone, Video, MoreVertical, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  full_name: string;
  email: string;
  status: "online" | "offline";
  last_seen: string;
  avatar_url?: string;
}

interface ChatHeaderProps {
  otherUser: User | null;
  isTyping: boolean;
  onlineUsers: Set<string>;
  showSearch: boolean;
  onToggleSearch: () => void;
  onDeleteChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  isTyping,
  onlineUsers,
  showSearch,
  onToggleSearch,
  onDeleteChat,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!otherUser) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteChat) {
      onDeleteChat();
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  const handleSearchClick = () => {
    onToggleSearch();
    setShowMenu(false);
  };

  const handleDeleteClickFromMenu = () => {
    handleDeleteClick();
    setShowMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
              {otherUser.full_name.charAt(0).toUpperCase()}
            </div>
            {onlineUsers.has(otherUser.id) && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {otherUser.full_name}
            </div>
            <div className="text-sm text-gray-500">
              {isTyping ? (
                <span className="text-green-600">typing...</span>
              ) : onlineUsers.has(otherUser.id) ? (
                "online"
              ) : (
                `last seen ${format(
                  new Date(otherUser.last_seen),
                  "MMM dd, HH:mm"
                )}`
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuToggle}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={handleSearchClick}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center space-x-2 ${
                    showSearch
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Search Messages</span>
                </button>
                {onDeleteChat && (
                  <button
                    onClick={handleDeleteClickFromMenu}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Chat</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Chat
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this chat with{" "}
              <strong>{otherUser.full_name}</strong>? All messages will be
              permanently removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
