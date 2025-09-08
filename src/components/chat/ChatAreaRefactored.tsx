import React from "react";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatHeader } from "./ChatHeader";
import { SearchBar } from "./SearchBar";
import { MessagesList } from "./MessagesList";
import { MessageInput } from "./MessageInput";
import { useMessages } from "../../hooks/useMessages";
import { useMessageSearch } from "../../hooks/useMessageSearch";
import { useMessageSend } from "../../hooks/useMessageSend";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { supabase } from "../../lib/supabase";

interface User {
  id: string;
  full_name: string;
  email: string;
  status: "online" | "offline";
  last_seen: string;
  avatar_url?: string;
}

interface ChatAreaProps {
  conversationId: string | null;
  otherUser: User | null;
  loading?: boolean;
}

export const ChatAreaRefactored: React.FC<ChatAreaProps> = ({
  conversationId,
  otherUser,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { messages, loadingMessages, isTyping, onlineUsers, addMessage } =
    useMessages(conversationId, otherUser);
  const {
    searchQuery,
    searchResults,
    searchLoading,
    showSearch,
    handleSearchChange,
    clearSearch,
    toggleSearch,
  } = useMessageSearch(conversationId);
  const { newMessage, setNewMessage, sendMessage, handleTyping } =
    useMessageSend(conversationId, otherUser, addMessage);

  const handleDeleteChat = async () => {
    if (!conversationId || !user) return;

    try {
      // First, check if the conversation exists and user has permission
      const { data: conversation, error: checkError } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .single();

      if (checkError || !conversation) {
        console.error("Conversation not found or no permission:", checkError);
        alert(
          "Conversation not found or you don't have permission to delete it."
        );
        return;
      }

      // Delete the conversation (messages will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) {
        console.error("Error deleting conversation:", error);
        alert(`Failed to delete chat: ${error.message}`);
        return;
      }

      // Notify the other user that the conversation has been deleted
      if (socket && otherUser) {
        socket.emit("conversation_deleted", {
          conversationId,
          deletedBy: user.id,
          otherUserId: otherUser.id,
        });
      }

      // Navigate back to the main chat page
      navigate("/");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  if (!conversationId || !otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500 text-sm md:text-base">
            Choose a contact to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      <ChatHeader
        otherUser={otherUser}
        isTyping={isTyping}
        onlineUsers={onlineUsers}
        showSearch={showSearch}
        onToggleSearch={toggleSearch}
        onDeleteChat={handleDeleteChat}
      />

      <SearchBar
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={clearSearch}
      />

      <div className="flex-1 flex flex-col min-h-0">
        <MessagesList
          messages={messages}
          currentUserId={user?.id}
          otherUser={otherUser}
          showSearch={showSearch}
          searchQuery={searchQuery}
          searchResults={searchResults}
          searchLoading={searchLoading}
          loadingMessages={loadingMessages}
        />
      </div>

      <MessageInput
        newMessage={newMessage}
        onMessageChange={(e) => setNewMessage(e.target.value)}
        onSendMessage={sendMessage}
        onTyping={handleTyping}
      />
    </div>
  );
};
