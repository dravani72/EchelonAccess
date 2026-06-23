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
          opposition: string | null;
          nationality: string | null;
          languages: string[];
          public_private_status: string | null;
          influence_type: string | null;
          access_path: string | null;
          relationship_owner: string | null;
          best_approach: string | null;
          current_authority: string | null;
          historical_authority: string | null;
          sensitivity_level: "low" | "moderate" | "high" | "sensitive" | null;
          motivations: string | null;
          constraints: string | null;
          relevant_mandates: string[];
          relevant_geographies: string[];
          relevant_sectors: string[];
          relevant_institutions: string[];
          key_relationships: string | null;
          do_not_discuss: string | null;
          best_next_move: string | null;
          source_confidence: number | null;
          last_verified_date: string | null;
          relationship_strength: number;
          trust_level: "unknown" | "low" | "moderate" | "high" | "sensitive" | null;
          warmth_status: "cold" | "weak" | "known" | "warm" | "direct";
          current_title: string | null;
          current_organization: string | null;
          avatar_url: string | null;
          last_interaction: string | null;
          geography: string | null;
          sector_tags: string[];
          source_count: number;
          mandate_matches: number;
          review_status: "verified" | "needs_review" | "possible_duplicate";
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["people"]["Row"]> & {
          canonical_name: string;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["people"]["Row"]>;
      };
      business_cards: {
        Row: {
          id: string;
          workspace_id: string;
          person_id: string | null;
          organization_id: string | null;
          image_url: string | null;
          raw_ocr_text: string | null;
          parsed_fields: Json;
          scan_date: string;
          estimated_card_date: string | null;
          source_event: string | null;
          confidence: number;
          review_status: "unreviewed" | "reviewed" | "needs_attention" | "merged";
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["business_cards"]["Row"]> & {
          workspace_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_cards"]["Row"]>;
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
          mandate_category: string | null;
          deal_type: string | null;
          ask_type: string | null;
          transaction_type: string | null;
          client_profile: string | null;
          sponsor_profile: string | null;
          sector: string | null;
          geography: string[];
          jurisdiction: string[];
          target_counterparty_types: string[];
          desired_counterparties: string[];
          forbidden_contacts: string[];
          capital_type: string | null;
          capital_stack: string | null;
          target_amount: string | null;
          minimum_ticket: string | null;
          currency: string | null;
          economics: string | null;
          fee_model: string | null;
          transaction_stage: string | null;
          timeline: string | null;
          urgency: "low" | "medium" | "high" | "critical" | null;
          decision_deadline: string | null;
          close_target_date: string | null;
          regulatory_regime: string | null;
          compliance_requirements: string | null;
          sanctions_exposure: string | null;
          political_exposure: string | null;
          procurement_process: string | null;
          government_touchpoints: string[];
          required_approvals: string[];
          decision_makers: string[];
          gatekeepers: string[];
          influencers: string[];
          buyer_universe: string[];
          investor_universe: string[];
          strategic_partners: string[];
          relationship_thesis: string | null;
          access_strategy: string | null;
          outreach_angle: string | null;
          value_proposition: string | null;
          proof_points: string[];
          materials_required: string[];
          diligence_requirements: string[];
          data_room_status: string | null;
          confidentiality_level: "standard" | "confidential" | "highly_confidential" | "restricted" | null;
          conflict_constraints: string | null;
          competitive_landscape: string | null;
          incumbent_relationships: string | null;
          risks: string | null;
          blockers: string | null;
          open_questions: string[];
          success_criteria: string[];
          disqualification_criteria: string[];
          next_milestone: string | null;
          owner: string | null;
          priority: "low" | "medium" | "high" | "critical" | null;
          source_confidence: number | null;
          last_reviewed_date: string | null;
          tags: string[];
          notes: string | null;
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
