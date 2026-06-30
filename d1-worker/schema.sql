CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  storage_used_bytes INTEGER DEFAULT 0,
  storage_limit_bytes INTEGER DEFAULT 524288000,
  plan TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 0,
  reset_token TEXT,
  reset_token_expiry INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  credits INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  provider_payment_id TEXT,
  raw_payload TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transaction_id TEXT,
  credits_added INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_credits (
  user_id TEXT PRIMARY KEY,
  credits INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  link TEXT NOT NULL,
  commission_rate INTEGER DEFAULT 30,
  total_clicks INTEGER DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_paid_customers INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  total_pending REAL DEFAULT 0,
  total_paid REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS clicks (
  id TEXT PRIMARY KEY,
  affiliate_code TEXT NOT NULL,
  ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (affiliate_code) REFERENCES affiliates(code)
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  affiliate_code TEXT NOT NULL,
  affiliate_user_id TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  plan TEXT,
  amount REAL DEFAULT 0,
  commission_earned REAL DEFAULT 0,
  commission_rate INTEGER DEFAULT 30,
  status TEXT DEFAULT 'signup',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  FOREIGN KEY (affiliate_code) REFERENCES affiliates(code),
  FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  affiliate_user_id TEXT NOT NULL,
  affiliate_code TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  account_details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  FOREIGN KEY (affiliate_code) REFERENCES affiliates(code),
  FOREIGN KEY (affiliate_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS credit_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT,
  model_id TEXT,
  credits_per_generation INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  category TEXT,
  icon TEXT,
  metadata TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS module_credit_prices (
  module_id TEXT PRIMARY KEY,
  credits_per_generation INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (module_id) REFERENCES ai_modules(id)
);

CREATE TABLE IF NOT EXISTS provider_model_prices (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  updated_at TEXT
);
