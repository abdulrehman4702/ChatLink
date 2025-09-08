import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  showSearch: boolean;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  showSearch,
  searchQuery,
  onSearchChange,
  onClearSearch,
}) => {
  if (!showSearch) return null;

  return (
    <div className="mt-4 relative flex-shrink-0">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={onSearchChange}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <button
        onClick={onClearSearch}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
