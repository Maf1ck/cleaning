/** Each entry is one schema version; never edit an applied entry, append a new one. */
export const MIGRATIONS: string[][] = [
  [
    `CREATE TABLE settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE orders (
      id uuid PRIMARY KEY,
      public_token text NOT NULL UNIQUE,
      idempotency_key text NOT NULL UNIQUE,
      status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'agreed', 'done', 'cancelled')),
      customer_name text NOT NULL,
      customer_phone text NOT NULL,
      address text NOT NULL,
      out_of_city boolean NOT NULL DEFAULT false,
      preferred_date date,
      preferred_time text,
      comment text NOT NULL DEFAULT '',
      items jsonb NOT NULL,
      price_snapshot jsonb NOT NULL,
      estimate jsonb NOT NULL,
      final_price integer,
      agreed_at timestamptz,
      owner_note text NOT NULL DEFAULT '',
      consent_at timestamptz NOT NULL,
      anonymized_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    'CREATE INDEX orders_created_idx ON orders (created_at DESC)',
    'CREATE INDEX orders_status_idx ON orders (status)',
    `CREATE TABLE order_events (
      id bigserial PRIMARY KEY,
      order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
      kind text NOT NULL,
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    'CREATE INDEX order_events_order_idx ON order_events (order_id, created_at)',
    `CREATE TABLE uploads (
      id uuid PRIMARY KEY,
      token text NOT NULL UNIQUE,
      order_id uuid REFERENCES orders (id) ON DELETE CASCADE,
      mime text NOT NULL,
      width integer NOT NULL,
      height integer NOT NULL,
      size integer NOT NULL,
      bytes bytea NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    'CREATE INDEX uploads_order_idx ON uploads (order_id)',
    `CREATE TABLE bonus_codes (
      code text PRIMARY KEY,
      order_id uuid NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
      amount integer NOT NULL,
      min_order integer NOT NULL,
      expires_at timestamptz NOT NULL,
      status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'redeemed', 'void')),
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE admin_account (
      id integer PRIMARY KEY CHECK (id = 1),
      password_hash text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE admin_sessions (
      token_hash text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    )`,
    `CREATE TABLE rate_hits (
      bucket text NOT NULL,
      at timestamptz NOT NULL DEFAULT now()
    )`,
    'CREATE INDEX rate_hits_idx ON rate_hits (bucket, at)',
  ],
]
