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
      const socketUrl = "https://chatlink-b2q6.onrender.com/";
      // const socketUrl =
      //   import.meta.env.VITE_SOCKET_URL ||
      //   (import.meta.env.DEV
      //     ? "https://chatlink-b2q6.onrender.com/"
      //     : window.location.origin);

      const newSocket = io(socketUrl, {
        transports: ["polling"], // Only use polling to avoid WebSocket issues
        upgrade: false, // Disable WebSocket upgrade completely
        rememberUpgrade: false,
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        autoConnect: true,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected successfully");
        setIsConnected(true);
        connectionAttempts.current = 0; // Reset attempts on successful connection
        newSocket.emit("join", user.id);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);

        // Only attempt reconnection for certain disconnect reasons
        if (reason === "io client disconnect") {
          // User manually disconnected, don't reconnect
          return;
        }
      });

      newSocket.on("reconnect", () => {
        setIsConnected(true);
        newSocket.emit("join", user.id);

        // Rejoin current conversation if exists
        if (currentConversationId) {
          newSocket.emit("join_conversation", {
            conversationId: currentConversationId,
            userId: user.id,
          });
        }
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
        }
      });

      newSocket.on("user_status", (data) => {
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
  }, []);

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
