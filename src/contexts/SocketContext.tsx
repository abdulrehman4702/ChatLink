import React, {
  createContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  useContext,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  currentConversationId: string | null;
  isConnected: boolean;
  reconnect: () => void;
}

// Create default values for better Fast Refresh compatibility
const defaultContextValue: SocketContextType = {
  socket: null,
  onlineUsers: new Set(),
  typingUsers: new Set(),
  joinConversation: () => {},
  leaveConversation: () => {},
  currentConversationId: null,
  isConnected: false,
  reconnect: () => {},
};

export const SocketContext =
  createContext<SocketContextType>(defaultContextValue);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isCreatingSocket = useRef(false);
  const connectionAttempts = useRef(0);
  const maxConnectionAttempts = 3;
  const { user } = useAuth();

  // Create socket only once when user changes
  useEffect(() => {
    if (user && !socketRef.current && !isCreatingSocket.current) {
      isCreatingSocket.current = true;
      connectionAttempts.current = 0; // Reset attempts for new user

      // Use environment variable for socket URL or default to localhost for development
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL ||
        (import.meta.env.DEV
          ? "ws://localhost:3001"
          : "wss://chatlink-b2q6.onrender.com");

      const newSocket = io(socketUrl, {
        transports: ["websocket"], // Use WebSocket only for real-time communication
        upgrade: false, // Disable upgrade since we're using WebSocket directly
        rememberUpgrade: false,
        timeout: 20000, // Increased timeout for WebSocket
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10, // More attempts for WebSocket
        reconnectionDelay: 2000, // Longer initial delay for WebSocket
        reconnectionDelayMax: 10000, // Longer max delay
        autoConnect: true,
        withCredentials: false, // Disable credentials to avoid CORS issues
      });

      newSocket.on("connect", () => {
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        connectionAttempts.current = 0; // Reset attempts on successful connection
        newSocket.emit("join", user.id);

        // Emit a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("socket_connected", {
            detail: { userId: user.id },
          })
        );
      });

      newSocket.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason);
        setIsConnected(false);

        // Emit a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("socket_disconnected", {
            detail: { reason },
          })
        );

        // Only attempt reconnection for certain disconnect reasons
        if (reason === "io client disconnect") {
          // User manually disconnected, don't reconnect
          return;
        }
      });

      newSocket.on("reconnect", () => {
        console.log("WebSocket reconnected successfully");
        setIsConnected(true);
        newSocket.emit("join", user.id);

        // Rejoin current conversation if exists
        if (currentConversationId) {
          newSocket.emit("join_conversation", {
            conversationId: currentConversationId,
            userId: user.id,
          });
        }

        // Emit a custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("socket_reconnected", {
            detail: { userId: user.id },
          })
        );
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
        connectionAttempts.current += 1;

        // If we've exceeded max attempts, stop trying
        if (connectionAttempts.current >= maxConnectionAttempts) {
          console.error("Max socket connection attempts reached");
          newSocket.disconnect();
          isCreatingSocket.current = false;

          // Try to reconnect after a longer delay
          setTimeout(() => {
            if (user && !socketRef.current) {
              console.log(
                "Attempting to reconnect socket after max attempts reached"
              );
              connectionAttempts.current = 0;
              isCreatingSocket.current = false;
            }
          }, 30000); // Wait 30 seconds before trying again
        } else {
          // Retry connection after a delay
          setTimeout(() => {
            if (newSocket.disconnected) {
              newSocket.connect();
            }
          }, 2000 * connectionAttempts.current);
        }
      });

      newSocket.on("user_status", (data) => {
        console.log("User status update received:", data);
        if (data.status === "online") {
          setOnlineUsers((prev) => new Set([...prev, data.userId]));
        } else {
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(data.userId);
            return updated;
          });
        }
      });

      // Handle user last seen updates
      newSocket.on("user_last_seen", (data) => {
        console.log("User last seen update received:", data);
        // Dispatch a custom event for last seen updates
        window.dispatchEvent(
          new CustomEvent("user_last_seen", {
            detail: data,
          })
        );
      });

      newSocket.on("user_typing", (data) => {
        if (data.isTyping) {
          setTypingUsers((prev) => new Set([...prev, data.userId]));
        } else {
          setTypingUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(data.userId);
            return updated;
          });
        }
      });

      // Handle conversation deletion
      newSocket.on("conversation_deleted", (data) => {
        // Dispatch a custom event that can be listened to by other components
        window.dispatchEvent(
          new CustomEvent("conversation_deleted", {
            detail: data,
          })
        );
      });

      // Handle conversation creation
      newSocket.on("conversation_created", (data) => {
        console.log("Conversation created event received:", data);
        // Dispatch a custom event that can be listened to by other components
        window.dispatchEvent(
          new CustomEvent("conversation_created", {
            detail: data,
          })
        );
      });

      // Handle invitation responses
      newSocket.on("invitation_response", (data) => {
        console.log("Invitation response event received:", data);
        // Dispatch a custom event that can be listened to by other components
        window.dispatchEvent(
          new CustomEvent("invitation_response", {
            detail: data,
          })
        );
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
      isCreatingSocket.current = false;
    } else if (!user && socketRef.current) {
      // Clean up when user logs out
      console.log("Cleaning up socket for user logout");
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setOnlineUsers(new Set());
      setTypingUsers(new Set());
      setIsConnected(false);
      isCreatingSocket.current = false;
      connectionAttempts.current = 0; // Reset attempts on logout
    }

    // Cleanup function
    return () => {
      if (!user && socketRef.current) {
        console.log("Socket cleanup in useEffect return");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setOnlineUsers(new Set());
        setTypingUsers(new Set());
        setIsConnected(false);
        isCreatingSocket.current = false;
        connectionAttempts.current = 0;
      }
    };
  }, [user?.id]); // Only depend on user ID to prevent unnecessary re-renders

  // Handle room joining when conversation changes
  useEffect(() => {
    if (socket && user && currentConversationId && isConnected) {
      socket.emit("join_conversation", {
        conversationId: currentConversationId,
        userId: user.id,
      });
    }
  }, [socket, user, currentConversationId, isConnected]);

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (socket && user && isConnected) {
        socket.emit("join_conversation", {
          conversationId,
          userId: user.id,
        });
        setCurrentConversationId(conversationId);
      }
    },
    [socket, user, isConnected]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (socket && user && isConnected) {
        socket.emit("leave_conversation", {
          conversationId,
          userId: user.id,
        });
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
        }
      }
    },
    [socket, user, isConnected, currentConversationId]
  );

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      connectionAttempts.current = 0; // Reset attempts for manual reconnect
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      isCreatingSocket.current = false;
    }

    // Force reconnection by clearing the socket and letting the useEffect handle it
    setTimeout(() => {
      if (user && !socketRef.current) {
        console.log("Manual reconnect triggered");
        isCreatingSocket.current = false;
        connectionAttempts.current = 0;
      }
    }, 1000);
  }, [user]);

  const contextValue = useMemo(
    () => ({
      socket,
      onlineUsers,
      typingUsers,
      joinConversation,
      leaveConversation,
      currentConversationId,
      isConnected,
      reconnect,
    }),
    [
      socket,
      onlineUsers,
      typingUsers,
      joinConversation,
      leaveConversation,
      currentConversationId,
      isConnected,
      reconnect,
    ]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Export the hook from the context file for better Fast Refresh compatibility
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
