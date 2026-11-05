import pg from 'pg';

/**
 * Migration script ensuring public.email_verification_codes and public.password_reset_tokens
 * tables and their constraints/indexes exist in PostgreSQL.
 */
async function MigrateAuthRecoveryTables(): Promise<void> {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL must be defined.');
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('Connected to PostgreSQL database. Applying migrations...');

  const migrationSql = `
    -- Create email_verification_codes table
    CREATE TABLE IF NOT EXISTS public.email_verification_codes (
      id TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      account_id TEXT NOT NULL,
      expires_at TIMESTAMP(3) NOT NULL,
      used_at TIMESTAMP(3),
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT email_verification_codes_pkey PRIMARY KEY (id),
      CONSTRAINT email_verification_codes_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS email_verification_codes_account_id_idx ON public.email_verification_codes(account_id);
    CREATE INDEX IF NOT EXISTS email_verification_codes_expires_at_idx ON public.email_verification_codes(expires_at);

    -- Create password_reset_tokens table
    CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
      id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      account_id TEXT NOT NULL,
      expires_at TIMESTAMP(3) NOT NULL,
      used_at TIMESTAMP(3),
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
      CONSTRAINT password_reset_tokens_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_token_hash_key ON public.password_reset_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS password_reset_tokens_account_id_idx ON public.password_reset_tokens(account_id);
    CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON public.password_reset_tokens(expires_at);
  `;

  await client.query(migrationSql);

  console.log('Successfully created email_verification_codes and password_reset_tokens tables!');

  // Verify created tables
  const verificationCheck = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('email_verification_codes', 'password_reset_tokens');
  `);

  console.log('Verified created tables:', verificationCheck.rows.map((r: { table_name: string }) => r.table_name));

  await client.end();
}

MigrateAuthRecoveryTables().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
