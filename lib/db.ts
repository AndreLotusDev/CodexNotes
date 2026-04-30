import { mkdirSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";
import { createId, createShareToken, hashShareToken } from "@/lib/security";
import { NoteRecord, ShareRecord, TipTapDoc } from "@/lib/types";
import { nowIso } from "@/lib/utils";

type DbNoteRow = {
  id: string;
  user_id: string;
  title: string;
  content_json: string;
  share_enabled: number;
  created_at: string;
  updated_at: string;
};

type DbShareRow = {
  id: string;
  note_id: string;
  token: string;
  token_hash: string;
  enabled: number;
  created_at: string;
  disabled_at: string | null;
};

type MigrationFile = {
  name: string;
  up: string;
  down: string;
};

const dataDir = join(process.cwd(), "data");
const migrationsDir = join(process.cwd(), "migrations");
const databasePath = process.env.DATABASE_PATH ?? join(dataDir, "tinynotes.sqlite");

mkdirSync(dataDir, { recursive: true });

const db = new Database(databasePath, {
  create: true,
  strict: true
});

let migrationsReady = false;

function parseMigrationFile(name: string): MigrationFile {
  const filePath = join(migrationsDir, name);
  const source = readFileSync(filePath, "utf8");
  const match = source.match(/--\s*up\s*\r?\n([\s\S]*?)--\s*down\s*\r?\n([\s\S]*)$/i);

  if (!match) {
    throw new Error(`Migration "${name}" must contain "-- up" and "-- down" sections.`);
  }

  const [, up, down] = match;
  return {
    name,
    up: up.trim(),
    down: down.trim()
  };
}

function listMigrationFiles() {
  return readdirSync(migrationsDir)
    .filter((name) => /^\d{2}.*\.sql$/.test(name))
    .sort()
    .map(parseMigrationFile);
}

function ensureMigrationsTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function runPendingMigrations() {
  if (migrationsReady) {
    return;
  }

  ensureMigrationsTable();

  const applied = new Set(
    db.query<{ name: string }, never>("SELECT name FROM migrations ORDER BY name ASC;").all().map((row) => row.name)
  );
  const migrations = listMigrationFiles().filter((migration) => !applied.has(migration.name));

  const applyMigration = db.transaction((migration: MigrationFile) => {
    if (migration.up) {
      db.run(migration.up);
    }

    db.query("INSERT INTO migrations (name, applied_at) VALUES ($name, $appliedAt);").run({
      name: migration.name,
      appliedAt: nowIso()
    });
  });

  for (const migration of migrations) {
    applyMigration(migration);
  }

  migrationsReady = true;
}

function rollbackMigrations(steps = 1) {
  ensureMigrationsTable();

  const appliedRows = db
    .query<{ name: string }, never>("SELECT name FROM migrations ORDER BY name DESC;")
    .all()
    .slice(0, steps);

  if (appliedRows.length === 0) {
    return [];
  }

  const migrationMap = new Map(listMigrationFiles().map((migration) => [migration.name, migration]));
  const rollbackMigration = db.transaction((migration: MigrationFile) => {
    if (migration.down) {
      db.run(migration.down);
    }

    db.query("DELETE FROM migrations WHERE name = $name;").run({
      name: migration.name
    });
  });

  const rolledBack: string[] = [];
  for (const row of appliedRows) {
    const migration = migrationMap.get(row.name);
    if (!migration) {
      throw new Error(`Applied migration "${row.name}" is missing from the migrations directory.`);
    }

    rollbackMigration(migration);
    rolledBack.push(migration.name);
  }

  migrationsReady = false;
  return rolledBack;
}

function parseNoteRow(row: DbNoteRow): NoteRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contentJson: JSON.parse(row.content_json) as TipTapDoc,
    shareEnabled: Boolean(row.share_enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parseShareRow(row: DbShareRow): ShareRecord {
  return {
    id: row.id,
    noteId: row.note_id,
    token: row.token,
    tokenHash: row.token_hash,
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    disabledAt: row.disabled_at
  };
}

function createEmptyDoc(): TipTapDoc {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: []
      }
    ]
  };
}

type SqliteStatements = {
  listNotes: ReturnType<typeof db.query<DbNoteRow, { userId: string }>>;
  createNote: ReturnType<typeof db.query<
    DbNoteRow,
    {
      id: string;
      userId: string;
      title: string;
      contentJson: string;
      shareEnabled: number;
      createdAt: string;
      updatedAt: string;
    }
  >>;
  getOwnedNote: ReturnType<typeof db.query<DbNoteRow, { userId: string; noteId: string }>>;
  updateNote: ReturnType<typeof db.query<
    DbNoteRow,
    {
      noteId: string;
      userId: string;
      title: string;
      contentJson: string;
      updatedAt: string;
    }
  >>;
  deleteNote: ReturnType<typeof db.query<unknown, { noteId: string; userId: string }>>;
  findShareByNoteId: ReturnType<typeof db.query<DbShareRow, { noteId: string }>>;
  createShare: ReturnType<typeof db.query<
    DbShareRow,
    {
      id: string;
      noteId: string;
      token: string;
      tokenHash: string;
      enabled: number;
      createdAt: string;
    }
  >>;
  enableExistingShare: ReturnType<typeof db.query<DbShareRow, { noteId: string }>>;
  disableShare: ReturnType<typeof db.query<DbShareRow, { noteId: string; disabledAt: string }>>;
  setNoteShareState: ReturnType<
    typeof db.query<DbNoteRow, { noteId: string; userId: string; shareEnabled: number; updatedAt: string }>
  >;
  findSharedNoteByToken: ReturnType<
    typeof db.query<(DbNoteRow & { token: string }), { tokenHash: string }>
  >;
};

let cachedStatements: SqliteStatements | null = null;

function getStatements() {
  if (cachedStatements) {
    return cachedStatements;
  }

  cachedStatements = {
    listNotes: db.query<DbNoteRow, { userId: string }>(`
      SELECT id, user_id, title, content_json, share_enabled, created_at, updated_at
      FROM notes
      WHERE user_id = $userId
      ORDER BY updated_at DESC;
    `),
    createNote: db.query<DbNoteRow, {
      id: string;
      userId: string;
      title: string;
      contentJson: string;
      shareEnabled: number;
      createdAt: string;
      updatedAt: string;
    }>(`
      INSERT INTO notes (id, user_id, title, content_json, share_enabled, created_at, updated_at)
      VALUES ($id, $userId, $title, $contentJson, $shareEnabled, $createdAt, $updatedAt)
      RETURNING id, user_id, title, content_json, share_enabled, created_at, updated_at;
    `),
    getOwnedNote: db.query<DbNoteRow, { userId: string; noteId: string }>(`
      SELECT id, user_id, title, content_json, share_enabled, created_at, updated_at
      FROM notes
      WHERE id = $noteId AND user_id = $userId;
    `),
    updateNote: db.query<DbNoteRow, {
      noteId: string;
      userId: string;
      title: string;
      contentJson: string;
      updatedAt: string;
    }>(`
      UPDATE notes
      SET title = $title, content_json = $contentJson, updated_at = $updatedAt
      WHERE id = $noteId AND user_id = $userId
      RETURNING id, user_id, title, content_json, share_enabled, created_at, updated_at;
    `),
    deleteNote: db.query<unknown, { noteId: string; userId: string }>(`
      DELETE FROM notes
      WHERE id = $noteId AND user_id = $userId;
    `),
    findShareByNoteId: db.query<DbShareRow, { noteId: string }>(`
      SELECT id, note_id, token, token_hash, enabled, created_at, disabled_at
      FROM shares
      WHERE note_id = $noteId;
    `),
    createShare: db.query<DbShareRow, {
      id: string;
      noteId: string;
      token: string;
      tokenHash: string;
      enabled: number;
      createdAt: string;
    }>(`
      INSERT INTO shares (id, note_id, token, token_hash, enabled, created_at, disabled_at)
      VALUES ($id, $noteId, $token, $tokenHash, $enabled, $createdAt, NULL)
      RETURNING id, note_id, token, token_hash, enabled, created_at, disabled_at;
    `),
    enableExistingShare: db.query<DbShareRow, { noteId: string }>(`
      UPDATE shares
      SET enabled = 1, disabled_at = NULL
      WHERE note_id = $noteId
      RETURNING id, note_id, token, token_hash, enabled, created_at, disabled_at;
    `),
    disableShare: db.query<DbShareRow, { noteId: string; disabledAt: string }>(`
      UPDATE shares
      SET enabled = 0, disabled_at = $disabledAt
      WHERE note_id = $noteId
      RETURNING id, note_id, token, token_hash, enabled, created_at, disabled_at;
    `),
    setNoteShareState: db.query<DbNoteRow, { noteId: string; userId: string; shareEnabled: number; updatedAt: string }>(`
      UPDATE notes
      SET share_enabled = $shareEnabled, updated_at = $updatedAt
      WHERE id = $noteId AND user_id = $userId
      RETURNING id, user_id, title, content_json, share_enabled, created_at, updated_at;
    `),
    findSharedNoteByToken: db.query<(DbNoteRow & { token: string }), { tokenHash: string }>(`
      SELECT n.id, n.user_id, n.title, n.content_json, n.share_enabled, n.created_at, n.updated_at, s.token
      FROM shares s
      INNER JOIN notes n ON n.id = s.note_id
      WHERE s.token_hash = $tokenHash AND s.enabled = 1 AND n.share_enabled = 1;
    `)
  };

  return cachedStatements;
}

const deleteOwnedNoteTransaction = db.transaction((userId: string, noteId: string) => {
  const statements = getStatements();
  const note = statements.getOwnedNote.get({ userId: userId, noteId: noteId });
  if (!note) {
    return false;
  }

  db.query("DELETE FROM shares WHERE note_id = $noteId;").run({ noteId: noteId });
  statements.deleteNote.run({ noteId: noteId, userId: userId });
  return true;
});

const enableShareTransaction = db.transaction((userId: string, noteId: string) => {
  const statements = getStatements();
  const note = statements.getOwnedNote.get({ userId: userId, noteId: noteId });
  if (!note) {
    return null;
  }

  const updatedAt = nowIso();
  const existingShare = statements.findShareByNoteId.get({ noteId: noteId });
  let shareRow: DbShareRow | null = null;

  if (existingShare) {
    shareRow = statements.enableExistingShare.get({ noteId: noteId });
  } else {
    const token = createShareToken();
    shareRow = statements.createShare.get({
      id: createId(),
      noteId: noteId,
      token: token,
      tokenHash: hashShareToken(token),
      enabled: 1,
      createdAt: updatedAt
    });
  }

  statements.setNoteShareState.get({
    noteId: noteId,
    userId: userId,
    shareEnabled: 1,
    updatedAt: updatedAt
  });

  return shareRow ? parseShareRow(shareRow) : null;
});

const disableShareTransaction = db.transaction((userId: string, noteId: string) => {
  const statements = getStatements();
  const note = statements.getOwnedNote.get({ userId: userId, noteId: noteId });
  if (!note) {
    return null;
  }

  const updatedAt = nowIso();
  const existingShare = statements.findShareByNoteId.get({ noteId: noteId });
  if (existingShare) {
    statements.disableShare.get({
      noteId: noteId,
      disabledAt: updatedAt
    });
  }

  statements.setNoteShareState.get({
    noteId: noteId,
    userId: userId,
    shareEnabled: 0,
    updatedAt: updatedAt
  });

  return true;
});

export const sqliteDb = {
  databasePath,
  runMigrations: runPendingMigrations,
  rollbackMigrations,
  listNotes(userId: string) {
    const statements = getStatements();
    return statements.listNotes.all({ userId: userId }).map(parseNoteRow);
  },

  createNote(userId: string, title: string, contentJson: TipTapDoc) {
    const statements = getStatements();
    const timestamp = nowIso();
    const note = statements.createNote.get({
      id: createId(),
      userId: userId,
      title: title,
      contentJson: JSON.stringify(contentJson),
      shareEnabled: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    if (!note) {
      throw new Error("Failed to create note.");
    }

    return parseNoteRow(note);
  },

  getNoteById(userId: string, noteId: string) {
    const statements = getStatements();
    const note = statements.getOwnedNote.get({ userId: userId, noteId: noteId });
    return note ? parseNoteRow(note) : null;
  },

  updateNote(userId: string, noteId: string, input: { title?: string; contentJson?: TipTapDoc }) {
    const statements = getStatements();
    const current = statements.getOwnedNote.get({ userId: userId, noteId: noteId });
    if (!current) {
      return null;
    }

    const updated = statements.updateNote.get({
      noteId: noteId,
      userId: userId,
      title: input.title ?? current.title,
      contentJson: JSON.stringify(input.contentJson ?? (JSON.parse(current.content_json) as TipTapDoc)),
      updatedAt: nowIso()
    });

    return updated ? parseNoteRow(updated) : null;
  },

  deleteNote(userId: string, noteId: string) {
    return deleteOwnedNoteTransaction(userId, noteId);
  },

  enableShare(userId: string, noteId: string) {
    return enableShareTransaction(userId, noteId);
  },

  disableShare(userId: string, noteId: string) {
    return disableShareTransaction(userId, noteId);
  },

  findShareByNoteId(noteId: string) {
    const statements = getStatements();
    const share = statements.findShareByNoteId.get({ noteId: noteId });
    return share ? parseShareRow(share) : null;
  },

  findSharedNoteByToken(token: string) {
    const statements = getStatements();
    const note = statements.findSharedNoteByToken.get({
      tokenHash: hashShareToken(token)
    });

    return note ? parseNoteRow(note) : null;
  },

  createEmptyDoc
};
