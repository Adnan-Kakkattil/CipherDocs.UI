## CipherDocs - Local run guide

### Prerequisites
- Node.js installed
- MongoDB running locally on `127.0.0.1:27017` (or update `MONGODB_URI`)

### Start the API
1. Copy env:
   - `apps/api/.env.example` → `apps/api/.env`
2. Install and seed:
   - `cd apps/api`
   - `npm install`
   - `npm run seed`
3. Run:
   - `npm run dev`

API: `http://127.0.0.1:4000`\nGraphQL: `http://127.0.0.1:4000/api/graphql`

### Start the Web app
1. Copy env:
   - `apps/web/.env.example` → `apps/web/.env.local`
2. Install and run:
   - `cd apps/web`
   - `npm install`
   - `npm run dev`

Web: `http://localhost:3000`

### Labs
See `docs/labs/` for step-by-step exercises.

### Hosting note
Run this locally (loopback) for classroom use; avoid exposing it on a public interface.

### Deploying the Web app on Hostinger (Business plan)
Hostinger’s Node.js Apps can deploy from a **subfolder**. This repo contains **two apps**:\n\n- Web (Next.js): `apps/web`\n- API (Express + GraphQL): `apps/api`\n\nDeploy them as **two Hostinger Node.js Apps** (recommended: main domain for web, subdomain for API).\n+\n+#### A) Deploy the Web app (Next.js)\n+- **Framework preset**: Next.js\n+- **Root directory**: `apps/web`\n+- **Node version**: 22.x\n+- **Build command**: `npm install && npm run build`\n+- **Start command**: `npm run start:hostinger`\n+\n+Environment variables:\n+- **`NEXT_PUBLIC_API_BASE`**: your API base URL (example: `https://api.your-domain.com`)\n+\n+#### B) Deploy the API app (Express)\n+- **Framework preset**: Express.js\n+- **Root directory**: `apps/api`\n+- **Node version**: 22.x\n+- **Build command**: `npm install && npm run build`\n+- **Start command**: `npm run start:hostinger`\n+\n+Environment variables:\n+- **`MONGODB_URI`**: your Mongo connection string\n+- (Optional) **`UPLOAD_DIR`**: `uploads`\n+\n+Note: Hostinger provides `PORT` automatically. The start script binds to `0.0.0.0` so it will be reachable by the platform.

