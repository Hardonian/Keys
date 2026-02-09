# Keys Frontend

> Web UI for browsing and managing Keys packs

## Deployment Modes

### Standalone Mode (No Backend)

The frontend runs **without Supabase** when environment variables are not set. It gracefully degrades to local/mock functionality.

```bash
# Install and run
pnpm install
pnpm dev
```

Visit `http://localhost:3000`

### With Backend (Optional)

To enable Supabase integration:

1. Copy `.env.example` to `.env.local`
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run `pnpm dev`

## Vercel Deployment

Deploy to Vercel without any environment variables for standalone mode:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Hardonian/Keys&root-directory=frontend)

Or set Supabase environment variables in Vercel dashboard for full backend integration.

## Development

```bash
pnpm install
pnpm dev         # Start dev server
pnpm build       # Production build
pnpm lint        # Run linter
pnpm test        # Run tests
```

## Architecture

- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **Supabase** (optional) for auth and data
- **TypeScript** throughout

## See Also

- [Main README](../README.md) — CLI documentation
- [CLI (`src/`)](../src/) — Local-first CLI
