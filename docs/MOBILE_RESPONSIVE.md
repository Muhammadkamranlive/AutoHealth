# Mobile & responsive standards (project memory)

> **Do not ask again** — all pages, dashboards, landing, and forms must be responsive.  
> Future: **Capacitor** will wrap this Next.js app as a native webview (iOS/Android).

**Central memory file:** [`MEMORY.md`](./MEMORY.md)

## Product goal

One responsive web codebase → same UI in browser and inside Capacitor WebView. No separate “mobile layout” fork unless unavoidable.

## Breakpoints (Tailwind)

| Prefix | Min width | Use |
|--------|-----------|-----|
| (default) | 0 | Phone portrait |
| `sm` | 640px | Large phone / small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop sidebar, multi-column |
| `xl` | 1280px | Wide dashboard grids |

## Required patterns

### Layout
- Root: `overflow-x-hidden` on `body`
- Viewport: `viewport-fit=cover` for safe areas (notch)
- Page padding: `px-4 sm:px-6 lg:px-8`
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`

### Admin dashboard
- Sidebar: **drawer** on mobile (`< lg`), fixed sidebar on desktop
- Header: truncate long email; stack meta on very small screens
- Stat cards: 1 col mobile → 2 col tablet → 4 col desktop
- Charts: min height `h-48` mobile, `h-64` desktop

### Landing page
- Sticky nav with hamburger + full-screen menu (already implemented)
- Hero banner: shorter on mobile (`min-h-[360px]`)
- CTAs: full-width buttons on `xs`, inline on `sm+`
- Footer: single column → multi-column at `sm`/`lg`

### Forms (login, signup, user management)
- Container: `w-full max-w-md mx-auto px-4`
- Inputs: `w-full`, `min-h-11`, `text-base` (prevents iOS zoom on focus)
- Submit buttons: `w-full sm:w-auto min-h-11`

### Tables
```tsx
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <table className="w-full min-w-[640px]">...</table>
</div>
```

## Capacitor preparation

When adding Capacitor later:

1. `capacitor.config.ts` — `server.url` or bundled `webDir: 'out'` (may need `output: 'export'` or SSR hybrid)
2. Safe area CSS variables in `globals.css` (already stubbed)
3. Disable text selection on nav chrome if needed
4. Test `100vh` vs `100dvh` for mobile browser chrome
5. Status bar / splash — match medical blue `#2563eb`
6. Deep links for `/login`, `/admin`, `/dashboard`

## Files to keep responsive

- `src/components/landing/**`
- `src/components/admin/**`
- `src/components/admin-shell.tsx`
- `src/app/login`, `src/app/signup`
- `src/app/admin/**`
- `src/app/dashboard`, `src/app/partner/**`
- `src/components/ui/**` (Button, Input, Table)

## Cursor rule

Persistent rule: `.cursor/rules/responsive-mobile.mdc` (`alwaysApply: true`)
