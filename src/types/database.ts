export interface Database {
  public: {
    Tables: {
      registered_users: {
        Row: {
          id: number;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          email?: string;
          created_at?: string;
        };
      };
      active_sessions: {
        Row: {
          id: number;
          email: string;
          last_ping: string;
        };
        Insert: {
          id?: number;
          email: string;
          last_ping?: string;
        };
        Update: {
          id?: number;
          email?: string;
          last_ping?: string;
        };
      };
      chat_messages: {
        Row: {
          id: number;
          email: string;
          content: string;
          is_pinned: boolean;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          email: string;
          content: string;
          is_pinned?: boolean;
          is_deleted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          email?: string;
          content?: string;
          is_pinned?: boolean;
          is_deleted?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export type RegisteredUser = Database['public']['Tables']['registered_users']['Row'];
export type ActiveSession = Database['public']['Tables']['active_sessions']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
