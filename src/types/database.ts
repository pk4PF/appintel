// Database types for Supabase
// These match the schema in supabase/migrations/001_initial_schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          app_store_id: number | null;
          slug: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          app_store_id?: number | null;
          slug?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          app_store_id?: number | null;
          slug?: string | null;
          created_at?: string;
        };
      };
      apps: {
        Row: {
          id: string;
          app_store_id: string;
          name: string;
          icon_url: string | null;
          description: string | null;
          short_description: string | null;
          developer_name: string | null;
          developer_id: string | null;
          category_id: string | null;
          secondary_category_id: string | null;
          release_date: string | null;
          last_updated: string | null;
          price: number;
          currency: string;
          pricing_model: string;
          bundle_id: string | null;
          minimum_os_version: string | null;
          size_bytes: number | null;
          languages: string[] | null;
          countries: string[] | null;
          content_rating: string | null;
          url: string | null;
          screenshots: string[] | null;
          ipad_screenshots: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_store_id: string;
          name: string;
          icon_url?: string | null;
          description?: string | null;
          short_description?: string | null;
          developer_name?: string | null;
          developer_id?: string | null;
          category_id?: string | null;
          secondary_category_id?: string | null;
          release_date?: string | null;
          last_updated?: string | null;
          price?: number;
          currency?: string;
          pricing_model?: string;
          bundle_id?: string | null;
          minimum_os_version?: string | null;
          size_bytes?: number | null;
          languages?: string[] | null;
          countries?: string[] | null;
          content_rating?: string | null;
          url?: string | null;
          screenshots?: string[] | null;
          ipad_screenshots?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          app_store_id?: string;
          name?: string;
          icon_url?: string | null;
          description?: string | null;
          short_description?: string | null;
          developer_name?: string | null;
          developer_id?: string | null;
          category_id?: string | null;
          secondary_category_id?: string | null;
          release_date?: string | null;
          last_updated?: string | null;
          price?: number;
          currency?: string;
          pricing_model?: string;
          bundle_id?: string | null;
          minimum_os_version?: string | null;
          size_bytes?: number | null;
          languages?: string[] | null;
          countries?: string[] | null;
          content_rating?: string | null;
          url?: string | null;
          screenshots?: string[] | null;
          ipad_screenshots?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      app_metrics: {
        Row: {
          id: string;
          app_id: string;
          date: string;
          downloads_estimate: number | null;
          revenue_estimate: number | null;
          rating: number | null;
          rating_count: number | null;
          review_count: number | null;
          rank_overall: number | null;
          rank_category: number | null;
          rank_free: number | null;
          rank_paid: number | null;
          rank_grossing: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          date: string;
          downloads_estimate?: number | null;
          revenue_estimate?: number | null;
          rating?: number | null;
          rating_count?: number | null;
          review_count?: number | null;
          rank_overall?: number | null;
          rank_category?: number | null;
          rank_free?: number | null;
          rank_paid?: number | null;
          rank_grossing?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          date?: string;
          downloads_estimate?: number | null;
          revenue_estimate?: number | null;
          rating?: number | null;
          rating_count?: number | null;
          review_count?: number | null;
          rank_overall?: number | null;
          rank_category?: number | null;
          rank_free?: number | null;
          rank_paid?: number | null;
          rank_grossing?: number | null;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          app_id: string;
          review_id: string | null;
          author: string | null;
          title: string | null;
          review_text: string | null;
          rating: number;
          review_date: string | null;
          country: string | null;
          version: string | null;
          helpful_count: number;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          review_id?: string | null;
          author?: string | null;
          title?: string | null;
          review_text?: string | null;
          rating: number;
          review_date?: string | null;
          country?: string | null;
          version?: string | null;
          helpful_count?: number;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          review_id?: string | null;
          author?: string | null;
          title?: string | null;
          review_text?: string | null;
          rating?: number;
          review_date?: string | null;
          country?: string | null;
          version?: string | null;
          helpful_count?: number;
          processed?: boolean;
          created_at?: string;
        };
      };
      review_insights: {
        Row: {
          id: string;
          app_id: string;
          insight_type: string;
          summary: string;
          evidence: string[] | null;
          frequency: number;
          sentiment_score: number | null;
          generated_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          insight_type: string;
          summary: string;
          evidence?: string[] | null;
          frequency?: number;
          sentiment_score?: number | null;
          generated_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          insight_type?: string;
          summary?: string;
          evidence?: string[] | null;
          frequency?: number;
          sentiment_score?: number | null;
          generated_at?: string;
        };
      };
      opportunity_scores: {
        Row: {
          id: string;
          app_id: string;
          score: number;
          momentum: number | null;
          demand_signal: number | null;
          user_satisfaction: number | null;
          monetization_potential: number | null;
          competitive_density: number | null;
          time_window: string;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          score: number;
          momentum?: number | null;
          demand_signal?: number | null;
          user_satisfaction?: number | null;
          monetization_potential?: number | null;
          competitive_density?: number | null;
          time_window?: string;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          score?: number;
          momentum?: number | null;
          demand_signal?: number | null;
          user_satisfaction?: number | null;
          monetization_potential?: number | null;
          competitive_density?: number | null;
          time_window?: string;
          calculated_at?: string;
        };
      };
      similar_apps: {
        Row: {
          id: string;
          app_id: string;
          similar_app_id: string;
          similarity_score: number | null;
          positioning_diff: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          similar_app_id: string;
          similarity_score?: number | null;
          positioning_diff?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          app_id?: string;
          similar_app_id?: string;
          similarity_score?: number | null;
          positioning_diff?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience types
export type Category = Database['public']['Tables']['categories']['Row'];
export type App = Database['public']['Tables']['apps']['Row'];
export type AppMetrics = Database['public']['Tables']['app_metrics']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsight = Database['public']['Tables']['review_insights']['Row'];
export type OpportunityScore = Database['public']['Tables']['opportunity_scores']['Row'];
export type SimilarApp = Database['public']['Tables']['similar_apps']['Row'];

// Insert types
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type AppInsert = Database['public']['Tables']['apps']['Insert'];
export type AppMetricsInsert = Database['public']['Tables']['app_metrics']['Insert'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
export type ReviewInsightInsert = Database['public']['Tables']['review_insights']['Insert'];
export type OpportunityScoreInsert = Database['public']['Tables']['opportunity_scores']['Insert'];

// App with relations
export type AppWithScore = App & {
  opportunity_scores: OpportunityScore[];
  categories: Category | null;
};

export type AppWithDetails = App & {
  opportunity_scores: OpportunityScore[];
  categories: Category | null;
  app_metrics: AppMetrics[];
  reviews: Review[];
  review_insights: ReviewInsight[];
};

