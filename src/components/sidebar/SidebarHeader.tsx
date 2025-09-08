import React from "react";
import { Search } from "lucide-react";

interface SidebarHeaderProps {
  user: {
    email?: string;
  } | null;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalUnreadCount: number;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  user,
  searchQuery,
  onSearchChange,
  totalUnreadCount,
}) => {
  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-purple-600/90 to-pink-600/90"></div>
      <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 md:-translate-y-16 md:translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8 md:translate-y-12 md:-translate-x-12"></div>

      <div className="relative z-10">
        {/* User Profile Section */}
        <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
          <div className="relative">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-xl md:rounded-2xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-2xl border border-white/30">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-400 border-2 border-white rounded-full shadow-lg"></div>
            {totalUnreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full min-w-[16px] md:min-w-[20px] text-center shadow-lg animate-bounce">
                {totalUnreadCount}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base md:text-lg truncate">
              {user?.email}
            </div>
            <div className="text-indigo-100 text-xs md:text-sm flex items-center">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-300 rounded-full mr-1.5 md:mr-2 animate-pulse"></div>
              Online
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3 md:mb-4">
          <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4 md:w-5 md:h-5" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={onSearchChange}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/70 font-medium shadow-lg text-sm md:text-base"
          />
        </div>
      </div>
    </div>
  );
};
