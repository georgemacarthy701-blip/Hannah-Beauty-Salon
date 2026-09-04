/**
 * FIX RLS SCRIPT for Hannah Beauty Salon OMS
 * Disables Row Level Security (RLS) on public.appointments and grants full permissions to anon & authenticated roles.
 */
import pg from 'pg';
import readline from 'readline';

const SQL_COMMANDS = `
-- Disable RLS on appointments so guest bookings can be inserted by anonymous users
ALTER TABLE IF EXISTS public.appointments DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.appointments TO anon, authenticated, service_role;

-- Ensure sequences (if any) are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
`;

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('=====================================================');
  console.log('  HANNAH BEAUTY SALON — SUPABASE RLS FIX UTILITY     ');
  console.log('=====================================================\n');

  let dbUri = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.argv[2];

  if (!dbUri) {
    console.log('To execute the fix, please provide your Supabase Postgres Database URI.');
    console.log('Example: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres\n');
    dbUri = await promptUser('Enter Supabase Database URI (or paste connection string): ');
  }

  if (!dbUri) {
    console.error('❌ Error: No Database URI provided. Aborting.');
    process.exit(1);
  }

  console.log('\nConnecting to Supabase PostgreSQL database...');
  const client = new pg.Client({
    connectionString: dbUri,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to PostgreSQL.');
    console.log('Executing SQL statements to disable RLS and grant permissions on `appointments`...\n');
    
    await client.query(SQL_COMMANDS);

    console.log('-----------------------------------------------------');
    console.log('✅ SUCCESS: Row-Level Security (RLS) has been disabled on `public.appointments`.');
    console.log('✅ SUCCESS: Full permissions granted to `anon` and `authenticated` roles.');
    console.log('-----------------------------------------------------');
    console.log('Guest customers can now successfully submit online bookings without 401/403 RLS policy errors!\n');
  } catch (err) {
    console.error('❌ Failed to apply RLS fix:');
    console.error(err.message || err);
    console.log('\n💡 Alternative: You can copy and run the following SQL directly in your Supabase SQL Editor:');
    console.log(SQL_COMMANDS);
  } finally {
    await client.end();
  }
}

main();
