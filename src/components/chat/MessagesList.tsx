import React, { useRef, useEffect, useCallback, memo } from "react";
import { Search } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { MessageSkeleton } from "../Skeleton";

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

interface MessagesListProps {
  messages: Message[];
  currentUserId: string | undefined;
  otherUser: User | null;
  showSearch: boolean;
  searchQuery: string;
  searchResults: Message[];
  searchLoading: boolean;
  loadingMessages: boolean;
}

export const MessagesList: React.FC<MessagesListProps> = memo(
  ({
    messages,
    currentUserId,
    otherUser,
    showSearch,
    searchQuery,
    searchResults,
    searchLoading,
    loadingMessages,
  }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isNearBottom, setIsNearBottom] = React.useState(true);

    const scrollToBottom = useCallback(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, []);

    const handleScroll = useCallback(() => {
      if (!messagesContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Consider "near bottom" if within 100px of the bottom
      setIsNearBottom(distanceFromBottom < 100);
    }, []);

    // Only auto-scroll if user is near the bottom
    useEffect(() => {
      if (isNearBottom && !loadingMessages) {
        scrollToBottom();
      }
    }, [messages, isNearBottom, loadingMessages, scrollToBottom]);

    // Check if we're near bottom when component mounts
    useEffect(() => {
      if (messagesContainerRef.current) {
        handleScroll();
      }
    }, [handleScroll]);

    if (showSearch && searchQuery) {
      return (
        <div
          className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-gray-50 min-h-0"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Search Results for "{searchQuery}"
              </h3>
              <span className="text-xs text-gray-500">
                {searchLoading
                  ? "Searching..."
                  : `${searchResults.length} results`}
              </span>
            </div>
            {searchLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <MessageSkeleton key={index} isOwn={index % 2 === 0} />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === currentUserId}
                    otherUser={otherUser || undefined}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm md:text-base">
                  No messages found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (loadingMessages && messages.length === 0) {
      return (
        <div
          className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-gray-50 min-h-0"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <MessageSkeleton key={index} isOwn={index % 2 === 0} />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 bg-gray-50 min-h-0"
        onScroll={handleScroll}
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.sender_id === currentUserId}
            otherUser={otherUser || undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  }
);
