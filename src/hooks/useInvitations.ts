import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";

export interface ChatInvitation {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  message: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  recipient?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export const useInvitations = () => {
  const [pendingInvitations, setPendingInvitations] = useState<
    ChatInvitation[]
  >([]);
  const [sentInvitations, setSentInvitations] = useState<ChatInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();

  const loadPendingInvitations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_invitations")
        .select(
          `
          *,
          sender:users!chat_invitations_sender_id_fkey(id, full_name, email, avatar_url)
        `
        )
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading pending invitations:", error);
        return;
      }

      setPendingInvitations(data || []);
    } catch (error) {
      console.error("Error in loadPendingInvitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSentInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("chat_invitations")
        .select(
          `
          *,
          recipient:users!chat_invitations_recipient_id_fkey(id, full_name, email, avatar_url)
        `
        )
        .eq("sender_id", user.id)
        .in("status", ["pending", "accepted", "rejected"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading sent invitations:", error);
        return;
      }

      setSentInvitations(data || []);
    } catch (error) {
      console.error("Error in loadSentInvitations:", error);
    }
  };

  const sendInvitation = async (recipientId: string, message?: string) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      // Check if there's already a pending invitation
      const { data: existingInvitation } = await supabase
        .from("chat_invitations")
        .select("id, status")
        .eq("sender_id", user.id)
        .eq("recipient_id", recipientId)
        .eq("status", "pending")
        .single();

      if (existingInvitation) {
        return { success: false, error: "Invitation already sent" };
      }

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${recipientId}),and(participant1_id.eq.${recipientId},participant2_id.eq.${user.id})`
        )
        .single();

      if (existingConversation) {
        return { success: false, error: "Conversation already exists" };
      }

      const { data, error } = await supabase
        .from("chat_invitations")
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          message: message || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error sending invitation:", error);
        return { success: false, error: error.message };
      }

      // Reload sent invitations
      await loadSentInvitations();

      // Emit socket event to notify recipient
      if (socket) {
        socket.emit("invitation_sent", {
          recipientId,
          senderId: user.id,
          invitationId: data.id,
        });
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error in sendInvitation:", error);
      return { success: false, error: "Failed to send invitation" };
    }
  };

  const respondToInvitation = async (
    invitationId: string,
    status: "accepted" | "rejected"
  ) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from("chat_invitations")
        .update({ status })
        .eq("id", invitationId)
        .eq("recipient_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error responding to invitation:", error);
        return { success: false, error: error.message };
      }

      // If accepted, check if conversation was created
      if (status === "accepted") {
        // Wait a moment for the database trigger to execute
        setTimeout(async () => {
          const { data: conversation } = await supabase
            .from("conversations")
            .select("*")
            .or(
              `and(participant1_id.eq.${data.sender_id},participant2_id.eq.${user.id}),and(participant1_id.eq.${user.id},participant2_id.eq.${data.sender_id})`
            )
            .single();

          if (!conversation) {
            console.warn("Conversation was not created by trigger");
          }
        }, 1000);
      }

      // Reload invitations
      await loadPendingInvitations();
      await loadSentInvitations();

      // Emit socket event to notify sender
      if (socket && data) {
        socket.emit("invitation_responded", {
          invitationId,
          senderId: data.sender_id,
          recipientId: user.id,
          status,
        });
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error in respondToInvitation:", error);
      return { success: false, error: "Failed to respond to invitation" };
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!user) return { success: false, error: "User not authenticated" };

    try {
      const { error } = await supabase
        .from("chat_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId)
        .eq("sender_id", user.id);

      if (error) {
        console.error("Error cancelling invitation:", error);
        return { success: false, error: error.message };
      }

      // Reload sent invitations
      await loadSentInvitations();

      return { success: true };
    } catch (error) {
      console.error("Error in cancelInvitation:", error);
      return { success: false, error: "Failed to cancel invitation" };
    }
  };

  const getInvitationStatus = async (userId: string) => {
    if (!user) return "none";

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .or(
        `and(participant1_id.eq.${user.id},participant2_id.eq.${userId}),and(participant1_id.eq.${userId},participant2_id.eq.${user.id})`
      )
      .single();

    if (existingConversation) return "conversation_exists";

    const sentInvitation = sentInvitations.find(
      (inv) => inv.recipient_id === userId && inv.status === "pending"
    );
    const receivedInvitation = pendingInvitations.find(
      (inv) => inv.sender_id === userId && inv.status === "pending"
    );

    if (sentInvitation) return "sent";
    if (receivedInvitation) return "received";
    return "none";
  };

  useEffect(() => {
    if (user) {
      loadPendingInvitations();
      loadSentInvitations();
    }
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleInvitationReceived = () => {
      // Reload pending invitations when a new one is received
      loadPendingInvitations();
    };

    const handleInvitationResponse = () => {
      // Reload sent invitations when a response is received
      loadSentInvitations();
    };

    socket.on("invitation_received", handleInvitationReceived);
    socket.on("invitation_response", handleInvitationResponse);

    return () => {
      socket.off("invitation_received", handleInvitationReceived);
      socket.off("invitation_response", handleInvitationResponse);
    };
  }, [socket]);

  return {
    pendingInvitations,
    sentInvitations,
    loading,
    sendInvitation,
    respondToInvitation,
    cancelInvitation,
    getInvitationStatus,
    loadPendingInvitations,
    loadSentInvitations,
  };
};
