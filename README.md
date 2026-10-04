# SerDave Naturelle

React and Vite frontend with an Express API and PostgreSQL storage for appointments and contact messages.

## Backend setup

1. Install dependencies with `npm install`.
2. Set `DB_URL` in `.env` to your PostgreSQL connection URL.
3. Start the API with `npm run server` and the frontend with `npm run dev` in separate terminals.

The API uses the existing `public.services`, `public.category`, `public.appointments`, and `public.messages` tables. It does not create or alter database tables.

The Vite development server forwards `/api` requests to `http://localhost:3000`. For a production deployment, configure the web server or hosting platform to route `/api` to the Node server.

## API

- `GET /api/health` checks the API and its PostgreSQL connection.
- `GET /api/services` returns active services with their database categories, descriptions, prices, deposits, and durations.
- `POST /api/bookings` accepts `customerName`, `customerEmail`, `customerPhone`, `serviceId`, `bookingDate` (`YYYY-MM-DD`), and `bookingTime` (`HH:MM`). Price and deposit are read from the selected existing service.
- `POST /api/contact` accepts `name`, `email`, and `message` and stores them in the existing `public.messages` table.

Routes map HTTP paths and methods to controllers. Controllers validate input and coordinate database operations. The shared PostgreSQL pool is configured in `server/config/database.js`; middleware handles common request and error behavior.

## Frontend

- `npm run dev` starts Vite.
- `npm run build` creates the production frontend bundle.
- `npm run lint` runs ESLint across the project.
