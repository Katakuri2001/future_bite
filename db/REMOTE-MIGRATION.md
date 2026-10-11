# Running migrations against the production D1 database

Both migrations are already applied to `futurebite-db` (remote) as of 2026-10-11.

## Account scoping

`wrangler.jsonc` sets `account_id`. Without it wrangler resolves the *first*
account in the OAuth login, which is a different account — D1 then returns
error 7404 "database could not be found", which surfaces as a misleading
"fetch failed / connectivity issue".

## Use `--command`, not `--file`

`--file` uploads the SQL to Cloudflare and has D1 re-fetch it from a signed
URL. That second fetch fails in this environment. `--command` inlines the
statements in the API payload and works.

    npx wrangler d1 execute futurebite-db --remote --command="ALTER TABLE ..."

If `--file` is required (e.g. a large seed), run it from the Cloudflare
dashboard console instead:

- Dashboard → Workers & Pages → D1 → futurebite-db → Console
