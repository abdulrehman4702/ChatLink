import React from "react";
import { Check, CheckCheck } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  status: "sent" | "delivered" | "read";
  created_at: string;
}

interface User {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  otherUser?: User;
  searchQuery?: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  otherUser,
  searchQuery,
}) => {
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM dd");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="w-4 h-4 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="w-4 h-4 text-gray-500" />;
      case "read":
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const highlightSearchQuery = (text: string, query: string) => {
    if (!query) return text;

    return text.split(new RegExp(`(${query})`, "gi")).map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end space-x-2 ${
          isOwn ? "flex-row-reverse space-x-reverse" : ""
        } max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg`}
      >
        {!isOwn && otherUser && (
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {otherUser.full_name?.charAt(0) || "U"}
              </div>
            )}
          </div>
        )}
        <div
          className={`px-3 py-2 md:px-4 md:py-2 rounded-2xl ${
            isOwn
              ? "bg-green-500 text-white"
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          <div className="break-words text-sm md:text-base">
            {searchQuery
              ? highlightSearchQuery(message.content, searchQuery)
              : message.content}
          </div>
          <div
            className={`text-xs mt-1 flex items-center ${
              isOwn ? "justify-end" : "justify-start"
            } space-x-1 ${isOwn ? "text-green-100" : "text-gray-500"}`}
          >
            <span>{formatMessageTime(message.created_at)}</span>
            {isOwn && (
              <div title={`Message ${message.status}`}>
                {getStatusIcon(message.status)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
