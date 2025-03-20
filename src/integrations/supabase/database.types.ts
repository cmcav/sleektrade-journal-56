
import { Database as GeneratedDatabase } from './types';

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  entry_price: number;
  exit_price: number | null;
  entry_date: string;
  exit_date: string | null;
  quantity: number;
  type: string;
  strategy: string | null;
  tags: string[] | null;
  pnl: number | null;
  pnl_percentage: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardUser {
  user_id: string;
  username: string | null;
  total_pnl: number;
  win_rate: number;
  trade_count: number;
  rank: number;
}

export interface Database extends GeneratedDatabase {
  public: {
    Tables: {
      trades: {
        Row: Trade;
        Insert: Omit<Trade, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Trade, 'id' | 'created_at' | 'updated_at'>>;
      };
    } & GeneratedDatabase['public']['Tables'];
    Views: GeneratedDatabase['public']['Views'];
    Functions: GeneratedDatabase['public']['Functions'];
    Enums: GeneratedDatabase['public']['Enums'];
    CompositeTypes: GeneratedDatabase['public']['CompositeTypes'];
  };
}
