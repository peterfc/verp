/**
 * Migration runner for adding needs_password_setup field
 * This runs the SQL migration via Supabase client
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running migration: Add needs_password_setup to profiles table...')
  
  const sql = `
    -- Add needs_password_setup field to profiles table
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS needs_password_setup BOOLEAN DEFAULT FALSE;

    -- Add comment to explain the field
    COMMENT ON COLUMN profiles.needs_password_setup IS 'Indicates if this profile was created by an admin and the user needs to set up their password';

    -- Create an index for efficient querying (if it doesn't exist)
    CREATE INDEX IF NOT EXISTS idx_profiles_needs_password_setup ON profiles(needs_password_setup) WHERE needs_password_setup = TRUE;
  `

  const { data, error } = await supabase.rpc('exec_sql', { sql })

  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }

  console.log('Migration completed successfully!')
  process.exit(0)
}

runMigration().catch(console.error)
