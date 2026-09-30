// OpenNext Cloudflare config for FutureBite.
// No incremental cache backend is configured: the app uses build-time SSG
// (generateStaticParams) + server-rendered API routes, so an R2 cache bucket
// is not required and avoids the deploy-time cache population step.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});