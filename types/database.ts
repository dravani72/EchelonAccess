export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workspaces"]["Row"]> & {
          name: string;
          owner_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Row"]>;
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member" | "viewer";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["workspace_members"]["Row"]> & {
          workspace_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspace_members"]["Row"]>;
      };
      people: {
        Row: {
          id: string;
          workspace_id: string;
          canonical_name: string;
          display_name: string;
          honorific: string | null;
          aliases: string[];
          notes: string | null;
          relationship_strength: number;
          trust_level: "unknown" | "low" | "moderate" | "high" | "sensitive" | null;
          warmth_status: "cold" | "weak" | "known" | "warm" | "direct";
          current_title: string | null;
          current_organization: string | null;
          last_interaction: string | null;
          geography: string | null;
          sector_tags: string[];
          source_count: number;
          mandate_matches: number;
          review_status: "verified" | "needs_review" | "possible_duplicate";
        };
        Insert: Partial<Database["public"]["Tables"]["people"]["Row"]> & {
          canonical_name: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["people"]["Row"]>;
      };
      roles: {
        Row: {
          id: string;
          workspace_id: string;
          person_id: string;
          organization_name: string;
          title: string;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean;
          confidence: number;
          source_label: string;
        };
        Insert: Partial<Database["public"]["Tables"]["roles"]["Row"]> & {
          person_id: string;
          organization_name: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Row"]>;
      };
      interactions: {
        Row: {
          id: string;
          workspace_id: string;
          person_id: string | null;
          interaction_date: string;
          type: "meeting" | "email" | "call" | "introduction" | "event" | "proposal" | "note" | "follow_up" | "other";
          summary: string;
          outcome: string | null;
          next_step: string | null;
          confidence: number;
          source_label: string;
        };
        Insert: Partial<Database["public"]["Tables"]["interactions"]["Row"]> & {
          interaction_date: string;
          type: Database["public"]["Tables"]["interactions"]["Row"]["type"];
          summary: string;
        };
        Update: Partial<Database["public"]["Tables"]["interactions"]["Row"]>;
      };
      mandates: {
        Row: {
          id: string;
          workspace_id: string;
          client_name: string;
          title: string;
          objective: string;
          sector: string | null;
          geography: string[];
          status: "draft" | "researching" | "active" | "paused" | "completed" | "dead";
          relevant_contacts: number;
          next_action: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["mandates"]["Row"]> & {
          client_name: string;
          title: string;
          objective: string;
        };
        Update: Partial<Database["public"]["Tables"]["mandates"]["Row"]>;
      };
      outreach_queue: {
        Row: {
          id: string;
          workspace_id: string;
          person_name: string;
          mandate_title: string;
          reason: string;
          channel: "email" | "call" | "intro_request";
          relationship_strength: number;
          risk_level: "low" | "medium" | "high" | "unknown";
          due_date: string | null;
          status: "draft_needed" | "draft_ready" | "awaiting_approval" | "sent" | "follow_up_needed" | "paused" | "closed";
        };
        Insert: Partial<Database["public"]["Tables"]["outreach_queue"]["Row"]> & {
          person_name: string;
          mandate_title: string;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["outreach_queue"]["Row"]>;
      };
      review_tasks: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          detail: string;
          status: "needs_review" | "suggested" | "stale" | "sensitive";
        };
        Insert: Partial<Database["public"]["Tables"]["review_tasks"]["Row"]> & {
          title: string;
          detail: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_tasks"]["Row"]>;
      };
    };
  };
};
