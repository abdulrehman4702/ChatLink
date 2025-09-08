import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ChatSidebar } from "./ChatSidebar";
import { ChatArea } from "./ChatArea";
import { Settings } from "./Settings";
import { HamburgerMenu } from "./HamburgerMenu";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useMobile } from "../contexts/MobileContext";

interface User {
  id: string;
  full_name: string;
  email: string;
  status: "online" | "offline";
  last_seen: string;
}

export const Chat: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isMobile, sidebarOpen, toggleSidebar, setSidebarOpen } = useMobile();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(conversationId || null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Check if we're on settings page
  useEffect(() => {
    setShowSettings(location.pathname === "/settings");
  }, [location.pathname]);

  // Close sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && selectedConversation) {
      setSidebarOpen(false);
    }
  }, [isMobile, selectedConversation, setSidebarOpen]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      // If no conversationId in URL, clear selection
      setSelectedConversation(null);
      setSelectedUser(null);
    }
  }, [conversationId]);

  const loadConversation = async (convId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", convId)
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .single();

      if (convError || !conversation) {
        navigate("/");
        return;
      }

      // Get the other user's details
      const otherUserId =
        conversation.participant1_id === user.id
          ? conversation.participant2_id
          : conversation.participant1_id;

      const { data: otherUser, error: userError } = await supabase
        .from("users")
        .select("id, full_name, email, status, last_seen, avatar_url")
        .eq("id", otherUserId)
        .single();

      if (userError || !otherUser) {
        console.error("User not found:", userError);
        navigate("/");
        return;
      }

      setSelectedConversation(convId);
      setSelectedUser(otherUser);
    } catch (error) {
      console.error("Error loading conversation:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (
    conversationId: string,
    otherUser: User
  ) => {
    setSelectedConversation(conversationId);
    setSelectedUser(otherUser);
    navigate(`/chat/${conversationId}`);

    // Close sidebar on mobile after selecting conversation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleBackToChat = () => {
    if (selectedConversation) {
      navigate(`/chat/${selectedConversation}`);
    } else {
      navigate("/");
    }
  };


  return (
    <div className="h-screen flex bg-white relative overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${
            isMobile
              ? `fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : "relative flex-shrink-0"
          }
          ${!isMobile ? "w-96" : "w-80"}
        `}
      >
        <ChatSidebar
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header - Fixed */}
        {isMobile && (
          <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-white border-b border-gray-200 md:hidden">
            <div className="flex items-center space-x-3">
              <HamburgerMenu isOpen={sidebarOpen} onToggle={toggleSidebar} />
              {selectedUser && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedUser.full_name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedUser.status === "online" ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!showSettings && selectedUser && (
                <>
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Switch user"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </button>
                </>
              )}
              {showSettings && (
                <button
                  onClick={handleBackToChat}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to chat"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {showSettings ? (
          <div className={`flex-1 flex flex-col ${isMobile ? "pt-20" : ""}`}>
            {/* Desktop Settings Header */}
            {!isMobile && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBackToChat}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Back to chat"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h1 className="text-xl font-semibold text-gray-900">
                    Settings
                  </h1>
                </div>
              </div>
            )}
            {/* Settings Content */}
            <div className="flex-1 overflow-y-auto">
              <Settings />
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex flex-col ${isMobile ? "pt-20" : ""}`}>
            <ChatArea
              conversationId={selectedConversation}
              otherUser={selectedUser}
            />
          </div>
        )}
      </div>
    </div>
  );
};
