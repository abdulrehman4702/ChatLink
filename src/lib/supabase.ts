import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          status: "online" | "offline";
          last_seen: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          status?: "online" | "offline";
          last_seen?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          status?: "online" | "offline";
          last_seen?: string;
          created_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant1_id: string;
          participant2_id: string;
          last_message: string | null;
          last_message_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant1_id: string;
          participant2_id: string;
          last_message?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          participant1_id?: string;
          participant2_id?: string;
          last_message?: string | null;
          last_message_at?: string | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          status: "sent" | "delivered" | "read";
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          status?: "sent" | "delivered" | "read";
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          status?: "sent" | "delivered" | "read";
          created_at?: string;
        };
      };
      chat_invitations: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          status: "pending" | "accepted" | "rejected" | "cancelled";
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          status?: "pending" | "accepted" | "rejected" | "cancelled";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          status?: "pending" | "accepted" | "rejected" | "cancelled";
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
