import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { MobileProvider } from "./contexts/MobileContext";
import { Auth } from "./components/Auth";
import { Chat } from "./components/Chat";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Show a minimal loading state to prevent flash of login page
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SocketProvider>
        <NotificationProvider>
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<Chat />} />
                <Route path="/chat/:conversationId" element={<Chat />} />
                <Route path="/settings" element={<Chat />} />
                <Route path="/auth" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/chat/:conversationId"
                  element={<Navigate to="/auth" replace />}
                />
                <Route
                  path="/settings"
                  element={<Navigate to="/auth" replace />}
                />
              </>
            )}
          </Routes>
        </NotificationProvider>
      </SocketProvider>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <MobileProvider>
        <AppContent />
      </MobileProvider>
    </AuthProvider>
  );
}

export default App;
