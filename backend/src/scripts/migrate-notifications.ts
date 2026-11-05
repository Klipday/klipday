import pg from 'pg';

/**
 * Migration script ensuring public.notifications table and notification enums exist in PostgreSQL.
 */
async function MigrateNotificationsTable(): Promise<void> {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL must be defined.');
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log('Connected to PostgreSQL database. Applying notification migrations...');

  const migrationSql = `
    DO $$ BEGIN
      CREATE TYPE public.notification_type AS ENUM (
        'SUBMISSION_APPROVED',
        'SUBMISSION_REVISION_REQUESTED',
        'SUBMISSION_REJECTED',
        'WITHDRAWAL_APPROVED',
        'WITHDRAWAL_REJECTED',
        'KYC_VERIFIED',
        'KYC_REJECTED',
        'SUBMISSION_RECEIVED',
        'CAMPAIGN_APPROVED',
        'CAMPAIGN_REVISION_REQUESTED',
        'CAMPAIGN_REJECTED',
        'TOPUP_APPROVED',
        'TOPUP_REJECTED',
        'CAMPAIGN_BUDGET_EXHAUSTED',
        'ADMIN_NEW_CAMPAIGN',
        'ADMIN_NEW_TOPUP',
        'ADMIN_NEW_WITHDRAWAL',
        'ADMIN_NEW_KYC',
        'SYSTEM_ANNOUNCEMENT'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE public.notification_category AS ENUM (
        'CAMPAIGN',
        'SUBMISSION',
        'FINANCE',
        'ACCOUNT',
        'SYSTEM'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS public.notifications (
      id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      type public.notification_type NOT NULL,
      category public.notification_category NOT NULL DEFAULT 'SYSTEM'::public.notification_category,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_url TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      read_at TIMESTAMP(3),
      metadata JSONB,
      status public.status NOT NULL DEFAULT 'ACTIVE'::public.status,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT notifications_pkey PRIMARY KEY (id),
      CONSTRAINT notifications_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS notifications_account_id_is_read_idx ON public.notifications(account_id, is_read);
    CREATE INDEX IF NOT EXISTS notifications_account_id_created_at_idx ON public.notifications(account_id, created_at DESC);
  `;

  await client.query(migrationSql);

  console.log('Successfully created notifications table, enums, and indexes!');

  // Verify created table
  const verificationCheck = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'notifications';
  `);

  console.log('Verified created tables:', verificationCheck.rows.map((r: { table_name: string }) => r.table_name));

  await client.end();
}

MigrateNotificationsTable().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
