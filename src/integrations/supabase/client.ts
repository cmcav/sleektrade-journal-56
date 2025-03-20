
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = "https://aoejqphughnbpacopwgq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZWpxcGh1Z2huYnBhY29wd2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0Mjg3NDcsImV4cCI6MjA1ODAwNDc0N30.h0tKD0JhIGonN0wV-49Q7onmkA0GigVZp4Nidq-GlWE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
