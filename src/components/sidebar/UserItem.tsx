import React from "react";
import { formatLastSeen } from "../../utils/timeFormat";

interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  status: "online" | "offline";
  last_seen: string;
}

interface UserItemProps {
  user: User;
  onlineUsers: Set<string>;
  onClick: (user: User) => void;
}

export const UserItem: React.FC<UserItemProps> = ({
  user,
  onlineUsers,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick(user)}
      className="group p-3 md:p-4 hover:bg-white cursor-pointer transition-all duration-300 rounded-xl md:rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 bg-white"
    >
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="relative">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-300"
            />
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          {onlineUsers.has(user.id) && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-white rounded-full shadow-lg animate-pulse"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 truncate text-base md:text-lg">
            {user.full_name}
          </div>
          <div className="text-xs md:text-sm text-gray-500 truncate">
            {user.email}
          </div>
        </div>
        <div className="text-xs text-gray-400 font-medium">
          {onlineUsers.has(user.id) ? (
            <span className="flex items-center text-green-600">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full mr-1.5 md:mr-2 animate-pulse"></div>
              <span className="hidden sm:inline">Online</span>
            </span>
          ) : (
            <span className="hidden sm:inline">
              {formatLastSeen(user.last_seen)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
