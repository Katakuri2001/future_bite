# GitHub Actions Secrets — How to create and manage

This project uses GitHub Actions to build and publish the Worker and (optionally) upload assets to R2. Store secrets in the repository's Secrets (Settings → Secrets & variables → Actions).

Recommended secrets to add:
- `CF_API_TOKEN` — Cloudflare API token with scopes: `Workers:Edit`, `Account:Read`, `D1:Edit` (or `D1:Read`), `R2:Write` if uploading assets. Use minimal scopes.
- `JWT_SECRET` — application JWT signing secret.
- `R2_BUCKET` — name of the R2 bucket (not a secret but convenient to store here).
- `CF_ACCOUNT_ID` — Cloudflare account id (optional to store as secret or set in `wrangler.toml`).

Add secrets via the GitHub UI:

1. Go to your repository on GitHub.
2. Settings → Secrets and variables → Actions → New repository secret.
3. Enter the name (e.g., `CF_API_TOKEN`) and the value, click `Add secret`.

Add secrets via GitHub CLI (`gh`):

```bash
# login first: gh auth login
echo "$CF_API_TOKEN" | gh secret set CF_API_TOKEN --body -
gh secret set JWT_SECRET --body "$(openssl rand -hex 32)"
gh secret set R2_BUCKET --body "your_assets_bucket"
```

Notes & best practices:
- Do NOT commit secrets or `.env` files containing secrets.
- Use separate tokens for CI than for personal access.
- Limit token scopes to the minimum required for deployment.
- Rotate tokens if they are shared or exposed.
- For organization-level deployments, consider using GitHub Environments with required reviewers.
