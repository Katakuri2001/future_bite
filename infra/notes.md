Deployment notes

1. Create a Cloudflare Workers project and connect D1 and R2 bindings in Cloudflare dashboard.
2. Set `JWT_SECRET` and `D1_DATABASE` in `wrangler.toml` or Cloudflare dashboard secrets.
3. Install dependencies and build the Worker bundle before `wrangler publish`.

AI integration: recommend OpenAI (GPT-4o or GPT-4.1) or Anthropic – see cost section in README.
