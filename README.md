This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## FOCURA workspace

After signing in, use `/navigation` for a dedicated page linking to the dashboard, focus timer, study sessions, materials, analytics, and study circle. The dashboard folder cards use the supplied glossy golden folder artwork.

## Supabase setup

FOCURA uses Supabase Auth, Postgres, Realtime, and private Storage for accounts and study data. Without a configured Supabase project, sign-in and data changes are intentionally disabled instead of being saved as pretend accounts in the browser.

1. Create a Supabase project.
2. In the Supabase SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy `.env.example` to `.env.local` and add the project URL and anon/public key from **Project Settings → API**. Do not put a service-role key in a browser-exposed variable.
4. In **Authentication → URL Configuration**, allow your local app URL (`http://localhost:45879`) and the deployed site URL.
5. Restart the Next.js server so it reads the environment variables.

Dashboard plans, folders, material links, timer history, and theme preferences are stored per account in Postgres and streamed to other signed-in devices. Uploaded study files use the private `study-materials` Storage bucket. Friend invitations are stored in Postgres and update in real time; acceptance is tied to the invited email and invite token.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
