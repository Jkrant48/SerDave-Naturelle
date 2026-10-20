# SerDave Naturelle

React and Vite frontend with an Express API, Supabase PostgreSQL for application data, and Supabase Storage for portfolio images.

## Supabase and backend setup

1. Create a Supabase project and copy `.env.example` to `.env`.
2. Set `SUPABASE_DB_URL` to the Supabase PostgreSQL connection URI from **Project Settings > Database**. For a long-running Node API, use the Supabase Session pooler URI when direct database connectivity is unavailable or times out; use the URI's exact host, port, and username. The legacy `DB_URL` variable is still accepted as a fallback.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from **Project Settings > API**. The service-role key is server-only; never add it to a `VITE_` variable or commit it.
4. Create a public Storage bucket named `portfolio` in Supabase (or set `SUPABASE_STORAGE_BUCKET` to another public bucket name). The API validates image content and accepts JPEG, PNG, and WebP files up to 5 MB.
5. Run `server/database/salon_database_postgresql(1).sql` if the salon tables have not yet been created. For an existing database, run `server/database/admin_management_migration.sql` to add the portfolio storage path and appointment add-on table.
6. Set `CLIENT_URL` to the exact frontend origin and `ADMIN_SESSION_SECRET` to a unique random value of at least 32 characters. When the frontend Static Site and API Web Service use different Render domains, set `ADMIN_COOKIE_SAME_SITE=none`; production cookies are secure and require HTTPS. Local development can keep `ADMIN_COOKIE_SAME_SITE=lax`.
7. Set `PAYSTACK_SECRET_KEY` in the server `.env` to the matching Paystack test or live secret key. It must remain server-only; the booking form opens Paystack's hosted checkout in a popup window and does not need the public key. If initialization fails, the API responds with Paystack's safe error message and logs its response status in the Render API service logs.
8. Run `npm install`, then start the API with `npm run server` and the frontend with `npm run dev` in separate terminals.
9. Open `/admin`. If no Admin account exists, the page offers first-admin setup. Create the admin with an email and a password of at least 12 characters; setup becomes unavailable as soon as the first admin is created. Alternatively, run `npm run admin:create` in an interactive terminal to create the first admin from the command line.

The app continues to use PostgreSQL through `pg`; `SUPABASE_DB_URL` points it at Supabase instead of Render. Admin sessions are signed and stored in HTTP-only cookies. Admin API requests verify the session and the user's `Admin` role.

The Vite development server forwards `/api` requests to `http://localhost:3000`. For a Render deployment with a separate Static Site and API Web Service:

1. Set `VITE_API_URL` on the **Static Site** to the API Web Service's base URL (for example, `https://your-api-service.onrender.com`; do not add `/api`). Vite embeds this value at build time, so save the variable and trigger a new frontend deploy after setting or changing it.
2. Set `CLIENT_URL` on the **API Web Service** to the Static Site's exact public origin so credentialed admin requests are allowed. Set `ADMIN_COOKIE_SAME_SITE=none`; otherwise the browser will not send the admin session cookie between separate Render domains, and management requests will return `401`.
3. In the Render Static Site's **Redirects/Rewrites** settings, add a `Rewrite` from `/*` to `/index.html` so browser refreshes and direct links such as `/admin` return the React app.
4. Check the API directly at `https://your-api-service.onrender.com/api/health`. It should return JSON with `"status":"ok"` and `"database":"connected"`. The frontend's own `...onrender.com/api/health` URL only works if that frontend origin is also configured to serve or proxy the API.

All frontend API calls use the same `VITE_API_URL` helper, including the booking service catalog, so the booking page cannot accidentally request `/api/services` from the static-site origin.

## API

- `GET /api/health` checks the API and its PostgreSQL connection.
- `GET /api/services` returns active services with their database categories, descriptions, prices, deposits, and durations.
- `GET /api/portfolio` returns the public portfolio images displayed on the home page.
- `POST /api/bookings` accepts `customerName`, `customerEmail`, `customerPhone`, `serviceId` (a Treatment, Braids, or Locs service), optional `addOnServiceIds` (services from all other categories), `bookingDate` (`YYYY-MM-DD`), and `bookingTime` (`HH:MM`). It saves the appointment as pending payment and returns a Paystack checkout URL for the fixed, non-refundable GH₵50 deposit, which is credited toward the appointment total. The appointment is confirmed only after `GET /api/bookings/verify?reference=...` verifies the successful GH₵50 GHS transaction with Paystack. Add-on prices are retained in `public.appointment_add_ons`.
- `POST /api/contact` accepts `name`, `email`, and `message` and stores them in the existing `public.messages` table.
- `/admin` is the admin-only management page. Admins can review appointments, create/edit/delete categories, add/edit/remove services, and publish portfolio images. Service removal deactivates a row rather than deleting it, preserving appointment history.
- When the database has no Admin users, `/admin` offers one-time first-admin setup. The API locks and rechecks the database during creation to ensure concurrent setup requests cannot create multiple first admins.
- Signed-in admins can create employee accounts from the Employee accounts section. They set and confirm an initial password (minimum 12 characters), which is stored as a salted scrypt hash. Employee accounts do not grant access to the admin dashboard.
- Admin login and management endpoints are under `/api/admin`. Category deletion is blocked while services still reference that category.
- For booking, name the three main service categories so they contain “Treatment”, “Braids”, and “Locs” respectively. Services in every other category appear as optional add-ons.

Routes map HTTP paths and methods to controllers. Controllers validate input and coordinate database operations. The shared PostgreSQL pool is configured in `server/config/database.js`; middleware handles common request and error behavior.

## Frontend

- `npm run dev` starts Vite.
- `npm run build` creates the production frontend bundle.
- `npm run lint` runs ESLint across the project.
