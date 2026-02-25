# Uploading this project to GitHub (steps)

These commands assume you have `git` and the GitHub CLI (`gh`) installed and authenticated.

1) Initialize and commit the repo (if not already):

```powershell
git init
git add .
git commit -m "Initial commit: Futuristic Restaurant"
```

2) Authenticate with GitHub CLI (follow prompts):

```powershell
gh auth login
```

3) Create a private repository under your account and push (replace <username> if needed):

```powershell
gh repo create danielmarcos794532/futuristic-restaurant --private --source=. --remote=origin --push
```

If you prefer not to use `gh`, create a repo in the GitHub UI, then run:

```powershell
git remote add origin https://github.com/<your-username>/futuristic-restaurant.git
git branch -M main
git push -u origin main
```

4) Add production secrets (recommended: use `wrangler secret put` rather than committing `.env.prod`):

```powershell
npx wrangler secret put JWT_SECRET --env prod
npx wrangler secret put OTHER_SECRET --env prod
```

5) Publish the Worker to the `prod` environment (after you set secrets and confirm `wrangler.toml`):

```powershell
npx wrangler publish --env prod
```

Notes:
- The repository will contain placeholders for secrets; do not commit real secrets.
- If you want me to prepare a CI workflow (Actions) for automated deploys, tell me and I will add it.
