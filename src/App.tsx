import React, { useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { SocketProvider } from "./contexts/SocketContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { MobileProvider } from "./contexts/MobileContext";
import { Chat } from "./components/Chat";
import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { HomePage } from "./components/home/HomePage";
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
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-gray-400 mt-2">Auth loading...</p>
          )}
        </div>
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
                <Route path="/home" element={<HomePage />} />
                <Route path="/chat/:conversationId" element={<Chat />} />
                <Route path="/settings" element={<Chat />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/signup" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/chat/:conversationId"
                  element={<Navigate to="/login" replace />}
                />
                <Route
                  path="/settings"
                  element={<Navigate to="/login" replace />}
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
