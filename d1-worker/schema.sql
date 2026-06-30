-- ============================================================
-- Core Tables (User's Design)
-- All user/client IDs are 8-digit numbers stored as TEXT.
-- The user_id is the single key linking all related data.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  email_verified INTEGER DEFAULT 0,
  reset_token TEXT,
  reset_token_expiry INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  billing_cycle TEXT NOT NULL,
  credits INTEGER DEFAULT 0,
  storage_limit INTEGER DEFAULT 0,
  max_projects INTEGER DEFAULT 0,
  max_video_duration INTEGER DEFAULT 0,
  max_resolution TEXT,
  features TEXT
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  starts_at TEXT,
  expires_at TEXT,
  auto_renew INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS credits (
  user_id TEXT PRIMARY KEY,
  current_balance INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_generations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  type TEXT,
  provider TEXT,
  model TEXT,
  prompt TEXT,
  negative_prompt TEXT,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  generation_time REAL,
  output_url TEXT,
  thumbnail_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  type TEXT,
  file_name TEXT,
  r2_key TEXT,
  url TEXT,
  size INTEGER DEFAULT 0,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS storage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  used_bytes INTEGER DEFAULT 0,
  limit_bytes INTEGER DEFAULT 0,
  files_count INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  transaction_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  plan_id TEXT,
  billing_cycle TEXT,
  credits INTEGER DEFAULT 0,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS affiliate_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  commission_percent INTEGER DEFAULT 30,
  total_earnings REAL DEFAULT 0,
  available_balance REAL DEFAULT 0,
  paid_balance REAL DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL,
  referred_user_id TEXT,
  subscription_id TEXT,
  commission REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (affiliate_id) REFERENCES affiliate_accounts(id),
  FOREIGN KEY (referred_user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
);

CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  is_active INTEGER DEFAULT 0,
  ssl_status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================
-- Supplementary Tables (system/internal)
-- ============================================================

CREATE TABLE IF NOT EXISTS clicks (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL,
  ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (affiliate_id) REFERENCES affiliate_accounts(id)
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  affiliate_id TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  account_details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  FOREIGN KEY (affiliate_id) REFERENCES affiliate_accounts(id)
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
  endpoint_id TEXT DEFAULT '',
  credits_per_generation INTEGER NOT NULL DEFAULT 0,
  unit_price REAL,
  unit TEXT,
  provider_cost_usd REAL,
  markup_multiplier REAL DEFAULT 2.0,
  credit_usd_value REAL DEFAULT 0.029,
  pricing_unavailable INTEGER DEFAULT 0,
  last_calculated_at TEXT
);

CREATE TABLE IF NOT EXISTS provider_model_prices (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  updated_at TEXT
);
