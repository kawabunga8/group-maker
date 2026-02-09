import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Class = {
  id: string;
  name: string;
  created_at: string;
};

export type Student = {
  id: string;
  class_id: string;
  full_name: string;
  created_at: string;
};
