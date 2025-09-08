import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  status: "sent" | "delivered" | "read";
  created_at: string;
}

export const useMessageSearch = (conversationId: string | null) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { user } = useAuth();

  const searchMessages = async (query: string) => {
    if (!conversationId || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSearchResults(data);

        // Save search to history
        if (user) {
          await supabase.from("search_history").insert({
            user_id: user.id,
            search_query: query,
            search_type: "message",
          });
        }
      }
    } catch (error) {
      console.error("Error searching messages:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim()) {
      searchMessages(query);
    } else {
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      clearSearch();
    }
  };

  return {
    searchQuery,
    searchResults,
    searchLoading,
    showSearch,
    handleSearchChange,
    clearSearch,
    toggleSearch,
  };
};
