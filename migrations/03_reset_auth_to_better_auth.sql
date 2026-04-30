-- up
DROP INDEX IF EXISTS idx_shares_token_hash;
DROP INDEX IF EXISTS idx_notes_user_id_updated_at;
DROP INDEX IF EXISTS idx_sessions_user_id;
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP INDEX IF EXISTS verification_identifier_idx;
DROP INDEX IF EXISTS account_userId_idx;
DROP INDEX IF EXISTS session_userId_idx;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS "session";
DROP TABLE IF EXISTS "user";

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS session_userId_idx ON "session"(user_id);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS account_userId_idx ON account(user_id);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content_json TEXT NOT NULL,
  share_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  disabled_at TEXT,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id_updated_at ON notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_token_hash ON shares(token_hash);

INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at)
VALUES (
  'seed-demo-user',
  'Demo User',
  'demo@tinynotes.local',
  1,
  NULL,
  1767225600000,
  1767225600000
);

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES (
  'seed-demo-account',
  'seed-demo-user',
  'credential',
  'seed-demo-user',
  'fa5bd33a8897416dca7e5b67b1b91d17:4d5212c9d2d3f7ed68b169608d8fba5e141340b8fa0f5142580a81f539afffa48d9925f2f41cff13e17c4a1d8bb3d8209206992c4c0b8cfff1a5fd45aed2e256',
  1767225600000,
  1767225600000
);

INSERT INTO notes (id, user_id, title, content_json, share_enabled, created_at, updated_at)
VALUES (
  'seed-demo-note',
  'seed-demo-user',
  'Welcome to TinyNotes',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Elegant drafting, now with Better Auth"}]},{"type":"paragraph","content":[{"type":"text","text":"Each note is now scoped to the authenticated user that owns it."}]}]}',
  0,
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);
-- down
DROP INDEX IF EXISTS idx_shares_token_hash;
DROP INDEX IF EXISTS idx_notes_user_id_updated_at;
DROP INDEX IF EXISTS verification_identifier_idx;
DROP INDEX IF EXISTS account_userId_idx;
DROP INDEX IF EXISTS session_userId_idx;
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS "session";
DROP TABLE IF EXISTS "user";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  share_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  disabled_at TEXT,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id_updated_at ON notes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_token_hash ON shares(token_hash);

INSERT INTO users (id, email, name, password, created_at)
VALUES (
  'seed-demo-user',
  'demo@tinynotes.local',
  'Demo User',
  'password123',
  '2026-01-01T00:00:00.000Z'
);

INSERT INTO notes (id, user_id, title, content_json, share_enabled, created_at, updated_at)
VALUES (
  'seed-demo-note',
  'seed-demo-user',
  'Welcome to TinyNotes',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Elegant drafting, now on SQLite"}]},{"type":"paragraph","content":[{"type":"text","text":"This workspace now stores auth, sessions, notes, and share links in SQLite through Bun."}]}]}',
  0,
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
);
