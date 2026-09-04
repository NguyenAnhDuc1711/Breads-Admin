# Breads-Admin

> 🍞 Part of **[Breads](https://github.com/NguyenAnhDuc1711/Breads)** — start there for the architecture
> overview, screenshots and the other three repositories.

The moderation and analytics dashboard for Breads: review reported content, validate posts, manage users
and read engagement metrics. Live at **https://breads.sytes.net/admin**

Split out of `Breads-Fe` into its own repository so the public app and the internal tool ship on separate
release cycles and separate images — the admin bundle is never served to end users.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | **React 19** + **Vite** |
| Language | TypeScript |
| Routing | React Router |
| Data layer | **Redux Toolkit Query** — `baseApi` plus `postApi`, `userApi`, `reportApi` |
| Charts | Chart.js + `react-chartjs-2`, with `chartjs-chart-geo` for the geographic breakdown |
| UI | Bootstrap, `react-date-range`, `@uiw/react-md-editor` |
| Serving | Nginx (SPA fallback, 1-year immutable cache on hashed assets, gzip) |
| Lint | Oxlint |

## Pages

| Route | Purpose |
|---|---|
| `Login` | Moderator sign-in |
| `Overview` | Engagement charts and geographic distribution of users |
| `Users` / `User detail` | Browse accounts, inspect activity, apply account actions |
| `Posts` | Search and filter every post by content, author, media type and date range |
| `Posts Validation` | Review queue for posts awaiting approval |
| `Report` | Handle user reports and respond to reporters |

## Notable details

- **RTK Query, not hand-rolled fetching.** All server state goes through a single `baseApi`, so caching,
  invalidation and request de-duplication are declarative — `src/store/api/`.
- **Deployed under a sub-path.** Vite's `base` is driven by `BASE_PATH`, which lets the same build be served
  at `/admin` behind Nginx without hardcoding the prefix into the source.
- **Nginx does the SPA fallback** (`try_files $uri $uri/ /index.html`) and caches hashed assets for a year
  while keeping `index.html` uncached — deploys take effect immediately without stale-bundle errors.
- **Types are shared, not copied.** `src/Breads-Shared` is a git submodule pointing at
  [Breads-Shared](https://github.com/NguyenAnhDuc1711/Breads-Shared), the same contract the backend and the
  web app compile against.

## Getting started

```bash
git clone --recurse-submodules https://github.com/NguyenAnhDuc1711/Breads-Admin.git
cd Breads-Admin
cp .env.example .env.local     # set VITE_API_URL
npm install
npm run dev
```

> Without `--recurse-submodules` the `src/Breads-Shared` directory stays empty and the build fails.
> If you already cloned, run `git submodule update --init --recursive`.

### Environment

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Breads-Be origin (default `http://localhost:8080`) |
| `BASE_PATH` | build-time public base path — set to `/admin/` for the production deployment |

## Docker

```bash
docker compose up -d --build
```

## CI/CD

GitHub Actions runs CI and CodeQL on every push; a green run on `main` triggers an SSH deploy to the VPS,
which pulls, updates submodules and rebuilds the container.
