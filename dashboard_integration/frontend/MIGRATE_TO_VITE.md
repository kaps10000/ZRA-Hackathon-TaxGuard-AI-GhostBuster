Migration notes: CRA -> Vite

This branch adds Vite alongside CRA so you can try the Vite dev server without removing CRA.

To test locally:

1. From the frontend folder, install new deps:

```powershell
npm install
```

2. Start Vite dev server (hot reload):

```powershell
npm run dev
```

3. Build with Vite preview (production-like):

```powershell
npm run build:vite
npm run preview
```

Notes:
- The CRA scripts remain available (`npm start`, `npm run build`) so this change is reversible.
- If you see CSS or asset path differences, check `index.html` and any absolute import paths.
- The Vite server is configured to proxy `/api` to `http://localhost:4000` in `vite.config.js`.

If you want, I can complete a branch that removes CRA and fully migrates to Vite (update CI, Dockerfile, build outputs). That will require additional verification.
