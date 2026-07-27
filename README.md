# MoneyMapper

MoneyMapper is a financial fitness dashboard (React + Vite + Tailwind) designed as a companion to the MoneyMapper Flutter app. It provides a real-time view of your financial pillars, AI recommendations, and weekly trackers.

## Setup & Run

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to a new `.env` file and set your API endpoint:
   ```bash
   cp .env.example .env
   ```
   The `.env` file should contain:
   `VITE_API_URL=https://your-api.onrender.com` (or your local backend URL for testing).

3. **Development Mode**
   ```bash
   npm run dev
   ```

4. **Production Build & Preview**
   To prepare the app for deployment (e.g., Vercel, Netlify):
   ```bash
   npm run build
   npm run preview
   ```
   This generates static files in the `dist` folder.

## Stack
- React (Vite)
- React Router
- Tailwind CSS v4
- Recharts (for charting)

## Deployment Notes
- Ensure your backend (`moneymapper-api`) has configured CORS to allow requests from your deployed website's domain to prevent cross-origin issues.
