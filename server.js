import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Store connected users - now supports multiple tabs per user
const connectedUsers = new Map(); // userId -> Set of socketIds
const socketToUser = new Map(); // socketId -> userId
const userRooms = new Map(); // userId -> Set of conversationIds

io.on("connection", (socket) => {
  // Handle user joining
  socket.on("join", (userId) => {
    // Add socket to user's set of connections
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);
    socketToUser.set(socket.id, userId);

    // Join user to their personal room for direct messaging
    socket.join(`user_${userId}`);

    // Broadcast user online status only if this is their first connection
    if (connectedUsers.get(userId).size === 1) {
      socket.broadcast.emit("user_status", {
        userId,
        status: "online",
        lastSeen: new Date(),
      });
    }
  });

  // Handle joining a conversation room
  socket.on("join_conversation", (data) => {
    const { conversationId, userId } = data;

    console.log(
      `User ${userId} joining conversation room: conversation_${conversationId}`
    );

    // Join the conversation room
    socket.join(`conversation_${conversationId}`);

    // Track user's rooms
    if (!userRooms.has(userId)) {
      userRooms.set(userId, new Set());
    }
    userRooms.get(userId).add(conversationId);

    console.log(
      `User ${userId} successfully joined conversation_${conversationId}`
    );
    console.log("Current user rooms:", Array.from(userRooms.get(userId) || []));

    // Send confirmation that user joined the room
    socket.emit("conversation_joined", { conversationId });
  });

  // Handle leaving a conversation room
  socket.on("leave_conversation", (data) => {
    const { conversationId, userId } = data;

    // Leave the conversation room
    socket.leave(`conversation_${conversationId}`);

    // Remove from user's rooms
    if (userRooms.has(userId)) {
      userRooms.get(userId).delete(conversationId);
    }
  });

  // Handle sending messages
  socket.on("send_message", (data) => {
    const { recipientId, message, senderId, messageId, conversationId } = data;

    console.log("Received send_message event:", data);

    // Send message to the conversation room with "sent" status first
    const messageData = {
      id: messageId,
      sender_id: senderId,
      content: message,
      conversation_id: conversationId,
      created_at: new Date().toISOString(),
      status: "sent",
    };

    console.log(
      "Broadcasting message to conversation room:",
      `conversation_${conversationId}`
    );
    console.log("Message data:", messageData);

    // Check which sockets are in the conversation room
    const room = io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
    if (room) {
      console.log(
        `Room conversation_${conversationId} has ${room.size} sockets:`,
        Array.from(room)
      );
    } else {
      console.log(
        `Room conversation_${conversationId} does not exist or is empty`
      );
    }

    io.to(`conversation_${conversationId}`).emit(
      "receive_message",
      messageData
    );

    // Send delivery confirmation after a short delay
    setTimeout(() => {
      console.log("Sending delivery confirmation for message:", messageId);

      // Send delivery confirmation to sender's personal room
      io.to(`user_${senderId}`).emit("message_status", {
        messageId,
        status: "delivered",
      });

      // Send delivery confirmation to all participants in the conversation room
      io.to(`conversation_${conversationId}`).emit("message_status", {
        messageId,
        status: "delivered",
      });
    }, 500); // 500ms delay to simulate network delivery
  });

  // Handle message read status
  socket.on("message_read", (data) => {
    const { messageId, senderId, conversationId, readerId } = data;

    // Send read status to the conversation room
    io.to(`conversation_${conversationId}`).emit("message_status", {
      messageId,
      status: "read",
    });
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { recipientId, isTyping, senderId, conversationId } = data;

    // Send typing status to the conversation room
    io.to(`conversation_${conversationId}`).emit("user_typing", {
      userId: senderId,
      isTyping,
    });
  });

  // Handle conversation deletion
  socket.on("conversation_deleted", (data) => {
    const { conversationId, deletedBy, otherUserId } = data;

    // Notify the other user that the conversation has been deleted
    io.to(`user_${otherUserId}`).emit("conversation_deleted", {
      conversationId,
      deletedBy,
    });
  });

  // Handle chat invitation sent
  socket.on("invitation_sent", (data) => {
    const { recipientId, senderId, invitationId } = data;

    // Notify the recipient about the new invitation
    io.to(`user_${recipientId}`).emit("invitation_received", {
      invitationId,
      senderId,
    });
  });

  // Handle invitation response (accepted/rejected)
  socket.on("invitation_responded", (data) => {
    const { invitationId, senderId, recipientId, status } = data;

    // Notify the sender about the response
    io.to(`user_${senderId}`).emit("invitation_response", {
      invitationId,
      recipientId,
      status,
    });

    // If accepted, notify both users that they can now chat
    if (status === "accepted") {
      io.to(`user_${senderId}`).emit("conversation_ready", {
        message: "Chat invitation accepted! You can now start messaging.",
      });
      io.to(`user_${recipientId}`).emit("conversation_ready", {
        message: "Chat invitation accepted! You can now start messaging.",
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // If no more tabs are open for this user, mark as offline
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
          userRooms.delete(userId);
          socket.broadcast.emit("user_status", {
            userId,
            status: "offline",
            lastSeen: new Date(),
          });
        }
      }
      socketToUser.delete(socket.id);
    }
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
