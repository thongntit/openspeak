# OpenSpeak Backend

NestJS + TypeORM + PostgreSQL API for the OpenSpeak English pronunciation app.

## Stack

- **Framework:** NestJS 11 (TypeScript, strict mode)
- **ORM:** TypeORM 0.3
- **Database:** PostgreSQL 16 with JSONB + GIN indexes for phoneme queries
- **Validation:** class-validator DTOs + global `ValidationPipe` (whitelist + forbid-non-whitelisted)
- **Config:** `@nestjs/config` + Joi schema
- **Tests:** Jest (e2e via supertest)
- **Deploy:** Docker multi-stage build; CI publishes images to GitHub Container Registry (ghcr.io)

## Project layout

```
src/
  app.controller.ts            GET /api/health
  app.module.ts
  main.ts                      prefix=/api, global pipes/filters/interceptors, CORS
  common/
    dto/paginated-response.dto.ts
    filters/global-exception.filter.ts
    interceptors/logging.interceptor.ts
  database/
    database.module.ts         TypeORM forRootAsync
    migrations/
      1738157000000-InitialSchema.ts
    seeds/
      seed.ts                  `npm run seed` entrypoint
  data-source.ts               TypeORM CLI DataSource (for migrations/seed)
  words/
    word.entity.ts
    dto/get-words-query.dto.ts
    words.{module,service,controller}.ts
  collections/
    collection.entity.ts
    collection-word.entity.ts
    dto/{get-collections-query,get-collection-words-query}.dto.ts
    collections.{module,service,controller}.ts
test/
  api.e2e-spec.ts              full endpoint coverage
```

## Environment variables

All required unless noted. Managed by `@nestjs/config` with Joi validation — the app fails fast on missing/invalid values.

| Variable       | Example                                               | Notes                                     |
| -------------- | ----------------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db`                 | required                                  |
| `PORT`         | `3000`                                                | default `3000`                            |
| `NODE_ENV`     | `development` \| `production` \| `test`               | default `development`; controls SQL logging + prod error hiding |
| `CORS_ORIGIN`  | `http://localhost:5173`                               | required; exact origin match              |

Copy `.env.example` to `.env` for local dev.

## Scripts

```bash
npm install              # install deps
npm run start:dev        # watch mode (ts-node)
npm run build && npm start:prod
npm run migration:run    # apply migrations
npm run migration:revert # roll back last migration
npm run migration:generate -- src/database/migrations/<Name>
npm run seed             # idempotent seed (101 words, 7 collections)
npm run lint             # eslint --fix
npm run test:e2e         # full API e2e suite
```

## Local setup

```bash
# 1. Postgres (example via docker-compose, API removed for brevity):
docker compose up -d postgres

# 2. Env + deps
cp .env.example .env       # edit DATABASE_URL if needed
npm install

# 3. Schema + data
npm run migration:run
npm run seed

# 4. Start
npm run start:dev
# API at http://localhost:3000/api
```

Or run the full stack in containers:

```bash
docker compose up --build
# then inside the api container, or from host against localhost:
npm run migration:run
npm run seed
```

## API

All endpoints are under `/api`. Responses use a shared error shape:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["difficulty must be one of the following values: ..."],
  "timestamp": "2026-04-18T01:44:20.597Z",
  "path": "/api/words?difficulty=bogus"
}
```

### `GET /api/health`

```json
{ "status": "ok", "db": "up", "uptime": 42 }
```

### `GET /api/words`

Query parameters (all optional):

| Param        | Type    | Validation                                          |
| ------------ | ------- | --------------------------------------------------- |
| `phoneme`    | string  | single IPA phoneme; JSONB `@>` contains match       |
| `startsWith` | string  | matches `phonemes[0]`                               |
| `endsWith`   | string  | matches last element of `phonemes`                  |
| `difficulty` | string  | `beginner` \| `intermediate` \| `advanced`          |
| `search`     | string  | case-insensitive ILIKE on `word`                    |
| `limit`      | integer | 1–100, default `20`                                 |
| `offset`     | integer | ≥ 0, default `0`                                    |

Example:

```http
GET /api/words?phoneme=θ&limit=5
```

```json
{
  "data": [
    {
      "id": "…",
      "word": "thanks",
      "ipa": "θæŋks",
      "phonemes": ["θ", "æ", "ŋ", "k", "s"],
      "difficulty": "intermediate",
      "syllables": 1,
      "audio_url": null,
      "example_sentence": "Thanks for your help.",
      "created_at": "…",
      "updated_at": "…"
    }
  ],
  "total": 5,
  "limit": 5,
  "offset": 0,
  "hasNext": false,
  "hasPrev": false
}
```

### `GET /api/words/:id`

UUID path parameter. `400` on invalid UUID, `404` if not found.

### `GET /api/collections`

Query parameters: `difficulty`, `tag`, `limit`, `offset`. Each result includes a `word_count` aggregate.

### `GET /api/collections/:id`

Returns the collection with `word_count`.

### `GET /api/collections/:id/words`

Returns words in the collection ordered by `position` ASC. Supports `limit` (1–200, default 50) and `offset`. `404` if the collection does not exist.

## Database schema

```
words
  id UUID PK, word VARCHAR UNIQUE, ipa VARCHAR, phonemes JSONB,
  difficulty VARCHAR, syllables INT, audio_url VARCHAR,
  example_sentence TEXT, created_at/updated_at TIMESTAMP
  INDEX idx_phonemes_gin (phonemes GIN), idx_word_difficulty, idx_word_text

collections
  id UUID PK, name VARCHAR, description TEXT,
  difficulty VARCHAR, tags JSONB DEFAULT '[]',
  created_at/updated_at
  INDEX idx_collections_difficulty, idx_collections_tags (GIN)

collection_words
  collection_id UUID FK → collections(id) ON DELETE CASCADE
  word_id       UUID FK → words(id)       ON DELETE CASCADE
  position INT, PRIMARY KEY (collection_id, word_id)
  INDEX idx_collection_words_collection, idx_collection_words_word,
        idx_collection_words_position (collection_id, position)
```

Phoneme query strategy: `phonemes` is a JSONB array like `["θ", "æ", "ŋ", "k", "s"]`. Contains filters use `phonemes @> '["θ"]'::jsonb` against the GIN index; `startsWith`/`endsWith` extract `phonemes->>0` / `phonemes->>(jsonb_array_length(phonemes) - 1)`.

## IPA conventions

Seed data uses a pragmatic subset of American-leaning IPA:

- Long vowels keep the length mark: `iː`, `uː`, `ɔː`, `ɜː`, `ɑː`.
- Diphthongs are single tokens: `aɪ`, `oʊ`, `eɪ`, `aʊ`, `ɪə`.
- Rhoticity is explicit: `r` follows vowels in final position (`ˈwɔːtər`).
- Affricates are two-character tokens: `tʃ`, `dʒ`.
- Stress marks (`ˈ`, `ˌ`) live in `ipa` only — **not** in `phonemes`, to keep phoneme filters clean.

Expand the seed by appending to `SEED_WORDS` in `src/database/seeds/seed.ts`. Upserts are keyed on `word`.

## Published image (ghcr.io)

CI builds the backend image on every push to `main`, `dev`, and on `v*` tags, and pushes it to GitHub Container Registry:

```
ghcr.io/<owner>/openspeak-backend:latest       # newest stable (main branch only)
ghcr.io/<owner>/openspeak-backend:dev          # newest dev build (dev branch)
ghcr.io/<owner>/openspeak-backend:main         # alias for the current main tip
ghcr.io/<owner>/openspeak-backend:sha-<short>  # immutable, every push
ghcr.io/<owner>/openspeak-backend:<semver>     # on v* tag pushes
```

Pulling the image does not require authentication once the package is made public (repo → Packages → package settings). For private repos, `docker login ghcr.io` with a classic PAT scoped to `read:packages`.

### Running the image

You supply your own Postgres 16 instance (anywhere — managed, VM, docker-compose, etc.).

```bash
# 1. Pull
docker pull ghcr.io/<owner>/openspeak-backend:latest

# 2. Run migrations once against your database
docker run --rm \
  -e DATABASE_URL=postgresql://user:pass@your-db-host:5432/openspeak \
  ghcr.io/<owner>/openspeak-backend:latest \
  node -e "require('child_process').execSync('npm run migration:run',{stdio:'inherit'})"

# 3. (Optional) seed
docker run --rm \
  -e DATABASE_URL=postgresql://user:pass@your-db-host:5432/openspeak \
  ghcr.io/<owner>/openspeak-backend:latest \
  node -e "require('child_process').execSync('npm run seed',{stdio:'inherit'})"

# 4. Run the API
docker run -d --name openspeak-api -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@your-db-host:5432/openspeak \
  -e CORS_ORIGIN=https://your-frontend.example.com \
  -e NODE_ENV=production \
  ghcr.io/<owner>/openspeak-backend:latest

# 5. Verify
curl http://localhost:3000/api/health
```

Health check endpoint: `GET /api/health` returns `{ status, db, uptime }`.

Where the image actually runs (VM, Kubernetes, Nomad, Railway, Render, …) is up to you — the image is portable.

## Troubleshooting

- **`password authentication failed`** — verify `DATABASE_URL`; Postgres roles created with `CREATE USER … WITH PASSWORD …` need a matching password in the URL.
- **`relation "words" does not exist`** — run `npm run migration:run`.
- **`CORS_ORIGIN is required`** — `@nestjs/config` Joi validation is strict; set the env var.
- **`400 Bad Request` on unknown query params** — `ValidationPipe` uses `forbidNonWhitelisted: true`. Drop unsupported params.
- **Seed data drift** — `npm run seed` is idempotent (upsert by `word` / `name`). Safe to re-run.
