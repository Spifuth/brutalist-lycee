-- =====================================================================
-- LYCEE.SIN — Database schema (source of truth)
-- =====================================================================
-- Portable standard PostgreSQL. Runs against Neon (v0 preview) and any
-- self-hosted Postgres (your Docker stack) with no changes.
--
-- Idempotent: safe to run repeatedly. In Docker, this file is mounted into
-- /docker-entrypoint-initdb.d so a fresh Postgres container auto-provisions.
-- To (re)apply manually:  psql "$DATABASE_URL" -f db/schema.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pseudo         TEXT NOT NULL,
  pseudo_lower   TEXT NOT NULL UNIQUE,          -- case-insensitive uniqueness
  passphrase_hash TEXT NOT NULL,                -- scrypt hash, never plaintext
  avatar_seed    TEXT NOT NULL DEFAULT '',      -- deterministic avatar seed
  avatar_variant TEXT NOT NULL DEFAULT 'grid',  -- avatar render style
  accent         TEXT NOT NULL DEFAULT 'orange',
  level          TEXT NOT NULL DEFAULT 'inconnu',
  status         TEXT NOT NULL DEFAULT 'active', -- active | suspended
  is_admin       BOOLEAN NOT NULL DEFAULT FALSE,
  points         INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uploaded profile picture (sub-project G, task 3). NULL means "use the
-- DiceBear fallback" — the existing behaviour, and the state a removal
-- restores. `avatar_file` is a generated UUID filename, never anything
-- derived from user input; the file itself lives outside the DB, on the
-- bind-mounted avatars directory (see lib/avatar-storage.ts).
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_uploaded_at TIMESTAMPTZ;
-- ---------------------------------------------------------------------
-- SESSIONS  (opaque token stored in an httpOnly cookie)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,                 -- random 256-bit hex
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);

-- ---------------------------------------------------------------------
-- BADGES  (definitions) + awards
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT 'award',    -- lucide icon name
  points      INTEGER NOT NULL DEFAULT 0,
  kind        TEXT NOT NULL DEFAULT 'manual',   -- manual | quiz | survey | secret | streak
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
CREATE INDEX IF NOT EXISTS user_badges_user_idx ON user_badges(user_id);

-- ---------------------------------------------------------------------
-- DOCS  (subjects -> articles; article body is a JSON block array)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doc_subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT 'book',
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS doc_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID NOT NULL REFERENCES doc_subjects(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  blocks      JSONB NOT NULL DEFAULT '[]'::jsonb,   -- DocBlock[]
  position    INTEGER NOT NULL DEFAULT 0,
  published   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subject_id, slug)
);

-- ---------------------------------------------------------------------
-- QUIZZES  (quiz -> questions; attempts per user)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  topic       TEXT NOT NULL DEFAULT 'cyber',
  level       TEXT NOT NULL DEFAULT 'tous',
  badge_slug  TEXT,                              -- badge awarded on completion
  published   BOOLEAN NOT NULL DEFAULT TRUE,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id       UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt        TEXT NOT NULL,
  options       JSONB NOT NULL DEFAULT '[]'::jsonb,  -- string[]
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation   TEXT NOT NULL DEFAULT '',
  position      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS quiz_questions_quiz_idx ON quiz_questions(quiz_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_idx ON quiz_attempts(quiz_id);

-- ---------------------------------------------------------------------
-- SURVEYS  (level positioning; answers as JSON)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS survey_responses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level      TEXT NOT NULL,
  answers    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, level)
);

-- ---------------------------------------------------------------------
-- VOTES  (topic voting; up to N per user enforced in app layer)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_key  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_key)
);
CREATE INDEX IF NOT EXISTS votes_topic_idx ON votes(topic_key);

-- ---------------------------------------------------------------------
-- QUESTIONS  (audience question wall)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  pseudo     TEXT NOT NULL DEFAULT 'anonyme',
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',   -- pending | answered | hidden
  upvotes    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS questions_status_idx ON questions(status);

-- ---------------------------------------------------------------------
-- SECRETS  (hidden redeemable codes) + redemptions
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS secrets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,             -- what the student types to redeem
  name        TEXT NOT NULL,
  hint        TEXT NOT NULL DEFAULT '',         -- shown on the hunt board
  location    TEXT NOT NULL DEFAULT '',         -- admin-only note: where it hides
  points      INTEGER NOT NULL DEFAULT 10,
  badge_slug  TEXT,                             -- optional badge awarded
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added after the first 8 secrets shipped, so ALTER rather than a column in the
-- CREATE above: schema.sql is applied on every container start and the table
-- already exists in prod.
--   category    free text, grouped into families by lib/secret-taxonomy.ts
--   difficulty  easy | medium | hard | insane — a filter on the hunt board
--   unlock_at   NULL for an ordinary secret. For a milestone, how many ORDINARY
--               secrets must be found before it is granted automatically. See
--               lib/milestones.ts; typing a milestone code is refused.
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS category   TEXT NOT NULL DEFAULT 'AUTRE';
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE secrets ADD COLUMN IF NOT EXISTS unlock_at  INTEGER;

CREATE TABLE IF NOT EXISTS secret_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_id   UUID NOT NULL REFERENCES secrets(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, secret_id)
);
CREATE INDEX IF NOT EXISTS secret_redemptions_user_idx ON secret_redemptions(user_id);

-- Un secret, plusieurs formulations acceptées.
--
-- Né d'une mesure : quatre secrets « en double » de la base de prod ont tous
-- été créés le 2026-09-07 à la même seconde, en pleine intervention, parce que
-- des élèves donnaient une réponse juste mais non prévue et que le jeu la
-- refusait. Le défaut n'était pas le contenu mais le modèle — un secret n'avait
-- qu'un seul code. Un alias crédite le secret canonique : une validation, un
-- lot de points, quelle que soit la formulation tapée.
CREATE TABLE IF NOT EXISTS secret_aliases (
  code       TEXT PRIMARY KEY,                 -- toujours stocké en majuscules
  secret_id  UUID NOT NULL REFERENCES secrets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS secret_aliases_secret_idx ON secret_aliases(secret_id);

-- ---------------------------------------------------------------------
-- SETTINGS  (key/value app config, e.g. live-quiz state)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- LIVE QUIZ  (teacher-driven, server-authoritative clock)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS live_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_slug           TEXT NOT NULL,
  state               TEXT NOT NULL DEFAULT 'lobby',  -- lobby|question|reveal|finished|aborted
  current_q_idx       INTEGER NOT NULL DEFAULT 0,
  -- Shuffled once at creation and stored, so every client sees the same order
  -- and a page reload cannot reshuffle it.
  question_order      JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- The clock is server-authoritative: clients render a countdown from these
  -- two columns but never decide when a question ends.
  question_started_at TIMESTAMPTZ,
  question_duration_s INTEGER NOT NULL DEFAULT 15,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS live_sessions_state_idx ON live_sessions(state);

CREATE TABLE IF NOT EXISTS live_participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL DEFAULT 0,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE TABLE IF NOT EXISTS live_answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  choice       INTEGER NOT NULL,
  is_correct   BOOLEAN NOT NULL,
  score        INTEGER NOT NULL DEFAULT 0,
  elapsed_ms   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Idempotency, not decoration: a double-tap or a network retry must not
  -- score twice. This constraint exists in the old implementation because
  -- double submission was a real problem.
  UNIQUE (session_id, user_id, question_key)
);
CREATE INDEX IF NOT EXISTS live_answers_session_idx ON live_answers(session_id);

-- ---------------------------------------------------------------------
-- PIXELWAR  (a shared 300x300 canvas)
-- ---------------------------------------------------------------------

-- Sparse on purpose: one row per cell that has actually been painted, not
-- 90 000 rows of empty. A class paints hundreds in a session, so reading the
-- whole canvas is a few hundred rows and wiping it is a DELETE.
CREATE TABLE IF NOT EXISTS pixel_cells (
  x          INTEGER NOT NULL,
  y          INTEGER NOT NULL,
  color      SMALLINT NOT NULL,
  -- Attribution survives the painter leaving; the pixel does not need them.
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  placed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (x, y)
);
-- The stream asks "what changed in the last few seconds" once per tick.
CREATE INDEX IF NOT EXISTS pixel_cells_placed_at_idx ON pixel_cells(placed_at);

-- The cooldown cannot be read from pixel_cells: painting over someone's pixel
-- reassigns that row's user_id, which would erase the previous painter's only
-- record of having placed anything and hand them a free turn.
CREATE TABLE IF NOT EXISTS pixel_cooldowns (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  placed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
