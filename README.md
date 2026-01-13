# GPXForage: Tracks that make sense

![GPXForage Banner](/public/og-image.png)

**GPXForage** is a powerful web application designed for cyclists, runners, and outdoor enthusiasts. It allows you to seamlessly merge multiple GPX track fragments into a single, cohesive route, analyze performance statistics, and visualize your adventures on interactive maps.

Built with performance and aesthetics in mind, GPXForage provides a premium "dark mode" experience, intuitive drag-and-drop interfaces, and robust administration tools.

## 🚀 Key Features

-   **GPX Merging**: Upload multiple `.gpx` files (fragments) and intelligently merge them into a single continuous track.
-   **Route Analysis**: Automatically calculates total distance, elevation gain, and point count.
-   **Visual Map Editor**: Preview your routes on interactive Leaflet maps before and after merging.
-   **Route Photos**: Attach PNG summary screens (e.g., from Zwift, Strava, or Garmin) to your routes for a complete history.
-   **User Dashboard**: unexpected job history, download previous merged files, and manage your route library.
-   **Admin Portal**: Dedicated admin views for managing users, monitoring system analytics, and overseeing job queues.
-   **Secure Authentication**: Enterprise-grade security via **Auth0** for seamless login and role management.

## 🛠️ Technology Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Authentication**: [Auth0](https://auth0.com/)
-   **Storage**: [AWS S3](https://aws.amazon.com/s3/) (Compatible with R2/MinIO)
-   **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)

## 🏁 Getting Started

Follow these instructions to set up the project locally for development.

### Prerequisites

-   **Node.js** (v20 or higher)
-   **PostgreSQL** (Local or cloud instance like Supabase/Neon)
-   **Auth0 Account** (Tenant domain, Client ID, Secret)
-   **S3-Compatible Storage** (AWS S3, Cloudflare R2, or MinIO)

### 1. Clone the Repository

```bash
git clone https://github.com/rohanoruganti/GPXForageV1.git
cd GPXForage
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory. You can use `.env.example` as a template:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gpx_forage"

# Auth0 Authentication
AUTH0_SECRET="long_random_string_32_chars_minimum"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://your-tenant.us.auth0.com"
AUTH0_CLIENT_ID="your_client_id"
AUTH0_CLIENT_SECRET="your_client_secret"

# AWS S3 Storage
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_BUCKET_NAME="your_bucket_name"
```

### 4. Database Setup

Initialize the Prisma client and push the schema to your database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment

This project is optimized for deployment on **Vercel**.

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  Add all the Environment Variables from your `.env` file to the Vercel Project Settings.
4.  **Crucial**: Update `AUTH0_BASE_URL` in Vercel to your production URL (e.g., `https://your-app.vercel.app`).
5.  Deploy!

## 📂 Project Structure

```
├── prisma/             # Database schema and migrations
├── public/             # Static assets (images, robots.txt)
├── src/
│   ├── app/            # Next.js App Router pages and API routes
│   │   ├── admin/      # Admin dashboard routes
│   │   ├── api/        # Backend API endpoints
│   │   ├── dashboard/  # User dashboard routes
│   │   └── page.tsx    # Landing page
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utilities (Auth0, DB, S3, GPX parsing)
│   └── middleware.ts   # Edge middleware for auth and routing
└── ...
```

## 📄 License

This project is proprietary and confidential. Unauthorized copying is strictly prohibited.
