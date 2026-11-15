-- Hadir schema. Every row a professor sees hangs off users.id, so deleting a user removes their whole workspace.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  title         TEXT NOT NULL DEFAULT '',
  department    TEXT NOT NULL DEFAULT '',
  is_demo       INTEGER NOT NULL DEFAULT 0,
  gender        TEXT NOT NULL DEFAULT '',
  pabbel_id     TEXT,                          -- set when the account signs in with Pabbel
  created_at    TEXT NOT NULL,
  expires_at    TEXT
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id               INTEGER PRIMARY KEY,
  owner_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code             TEXT NOT NULL,
  name_ar          TEXT NOT NULL,
  name_en          TEXT NOT NULL,
  section          TEXT NOT NULL DEFAULT '1',
  room             TEXT NOT NULL DEFAULT '',
  days             TEXT NOT NULL DEFAULT '',      -- comma list of weekday numbers, Monday = 0
  start_time       TEXT NOT NULL DEFAULT '08:00', -- HH:MM local time
  duration_min     INTEGER NOT NULL DEFAULT 90,
  term_start       TEXT NOT NULL,                 -- ISO date
  term_weeks       INTEGER NOT NULL DEFAULT 16,
  absence_limit_pct INTEGER NOT NULL DEFAULT 25,
  late_after_min   INTEGER NOT NULL DEFAULT 10,
  UNIQUE (owner_id, code, section)
);

CREATE TABLE IF NOT EXISTS students (
  id         INTEGER PRIMARY KEY,
  owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  number     TEXT NOT NULL,                       -- the value printed as the ID card's barcode
  name_ar    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  major      TEXT NOT NULL DEFAULT '',
  year       INTEGER NOT NULL DEFAULT 1,
  gender     TEXT NOT NULL DEFAULT '',            -- 'f', 'm' or '' (picks the default profile picture)
  UNIQUE (owner_id, number)
);

CREATE TABLE IF NOT EXISTS enrollments (
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, student_id)
);

CREATE TABLE IF NOT EXISTS class_sessions (
  id         INTEGER PRIMARY KEY,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  starts_at  TEXT NOT NULL,                       -- ISO datetime with offset
  topic      TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at  TEXT
);
CREATE INDEX IF NOT EXISTS class_sessions_course ON class_sessions(course_id, starts_at);

CREATE TABLE IF NOT EXISTS attendance (
  session_id INTEGER NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'excused')),
  marked_at  TEXT NOT NULL,
  method     TEXT NOT NULL DEFAULT 'scan' CHECK (method IN ('scan', 'manual', 'auto', 'assistant')),
  note       TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS notices (
  id         INTEGER PRIMARY KEY,
  owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id  INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  level      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'assistant'
);

CREATE TABLE IF NOT EXISTS agent_threads (
  id         TEXT PRIMARY KEY,
  owner_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_events (
  kind       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS rate_events_lookup ON rate_events(kind, subject, at);
