# Discovery PoC (Tavily)

Manual quality experiment — **does not** ingest to MongoDB or call OpenAI.

## Live run (requires approval + `TAVILY_API_KEY` in `.env.local`)

```bash
npm run discovery:poc:tavily
```

Outputs under `artifacts/discovery-poc/<timestamp>/`:

- `tavily-results.json`
- `tavily-report.md`

Hard cap: 12 profiles × 5 results (12 API search requests).

## PoC #2 — explicit-intent-focused queries

Separate catalog: `config/discovery/search-profiles.he.poc2.json` (PoC #1 catalog unchanged).

```bash
npm run discovery:poc:tavily:poc2
```

Outputs under `artifacts/discovery-poc/poc-2/<timestamp>/`.
