// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://skerypaagunztsymslwt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZXJ5cGFhZ3VuenRzeW1zbHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NTA0NjgsImV4cCI6MjA1NzQyNjQ2OH0.yArda2inAIaHKszSTkyoB6RkJC9p5Z7Ldh3pKir573Y";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);