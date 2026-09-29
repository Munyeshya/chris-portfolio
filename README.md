# Lions Plus

Lions Plus is a React website with a Node.js/Express API and a MySQL-backed management dashboard. It includes website content management, booking requests, quotation documents, administrator accounts, and email notifications.

## Local development

Requirements: Node.js 22+ and MySQL 8+.

1. Copy `.env.example` to `.env` and fill in local values.
2. Install dependencies with `npm ci`.
3. Apply the database migrations with `npm run migrate`.
4. Create or update the initial administrator with `npm run create-admin`.
5. Run `npm run dev` and `npm run dev:api` in separate terminals.

Vite proxies `/api` to `http://localhost:8787` during local development.

## Commands

```text
npm run dev          Start the Vite development server
npm run dev:api      Start the API in watch mode
npm run build        Build the React frontend into dist/
npm run start:api    Start the API without watch mode
npm run migrate      Apply pending MySQL migrations
npm run create-admin Create or update the configured administrator
npm run lint         Check the source
```

## Database migrations

Database changes are numbered SQL files under `migrations/mysql`. The migration runner records checksums in `schema_migrations`; never modify a migration after it has been applied. Add a new numbered migration instead.

Migrations are run deliberately during deployment before restarting the API. They are not automatically executed merely because code was pushed.

## Production deployment

The intended production host is the Contabo VPS serving `lionsplus.rw`:

```text
Nginx -> React dist/
      -> /api/ -> Node.js on 127.0.0.1:8788 -> dedicated MySQL database
```

Templates are available in `deployment/`:

- `nginx-lionsplus.conf` serves the frontend, supports React route fallback, and proxies `/api`.
- `lionsplus-api.service` runs the API as the dedicated `lionsplus` Linux user.
- `production.env.example` lists the required server-only variables.

Recommended paths:

```text
/srv/lionsplus/current       Application checkout
/srv/lionsplus/shared/.env   Production secrets (never commit)
```

After cloning on the server:

1. Create a dedicated `lionsplus_db` database and restricted `lionsplus_user` MySQL account.
2. Create `/srv/lionsplus/shared/.env` from the production example and set permissions to `600`.
3. Run `npm ci`, `npm run migrate`, `npm run create-admin`, and `npm run build`.
4. Install and enable the systemd and Nginx configurations.
5. Verify `/api/health`, then issue the HTTPS certificate with Certbot.
6. Configure database backups, log rotation, monitoring, and tested restoration.

Do not store database passwords, JWT secrets, email credentials, certificates, or production `.env` files in Git.
