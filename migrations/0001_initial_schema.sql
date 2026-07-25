-- 0001_initial_schema.sql
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  create_time TEXT NOT NULL
);

-- 支出记录表
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  reimburse_type TEXT NOT NULL,
  reimburse_amount REAL,
  pay_type TEXT NOT NULL,
  date TEXT NOT NULL,
  other TEXT,
  create_time TEXT NOT NULL,
  update_time TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- 配置表
CREATE TABLE IF NOT EXISTS configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  options TEXT NOT NULL,
  update_time TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_configs_user_id ON configs(user_id);
