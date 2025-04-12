import { createClient } from "@supabase/supabase-js";

// Check if required environment variables are present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey 
  });
  throw new Error('Missing required environment variables for Supabase');
}

// Log successful initialization (but don't expose the actual key)
console.log('Initializing Supabase client with URL:', supabaseUrl);
console.log('Service key present:', !!supabaseKey);

 export default createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
