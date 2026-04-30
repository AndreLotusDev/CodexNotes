-- up
INSERT INTO users (id, email, name, password, created_at)
SELECT
  'seed-demo-user',
  'demo@tinynotes.local',
  'Demo User',
  'password123',
  '2026-01-01T00:00:00.000Z'
WHERE NOT EXISTS (
  SELECT 1
  FROM users
  WHERE id = 'seed-demo-user'
);

INSERT INTO notes (id, user_id, title, content_json, share_enabled, created_at, updated_at)
SELECT
  'seed-demo-note',
  'seed-demo-user',
  'Welcome to TinyNotes',
  '{"type":"doc","content":[{"type":"heading","attrs":{"level":1},"content":[{"type":"text","text":"Elegant drafting, now on SQLite"}]},{"type":"paragraph","content":[{"type":"text","text":"This workspace now stores auth, sessions, notes, and share links in SQLite through Bun."}]}]}',
  0,
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
WHERE NOT EXISTS (
  SELECT 1
  FROM notes
  WHERE id = 'seed-demo-note'
);
-- down
DELETE FROM notes WHERE id = 'seed-demo-note';
DELETE FROM users WHERE id = 'seed-demo-user';
