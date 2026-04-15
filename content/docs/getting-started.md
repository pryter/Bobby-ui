---
title: Getting Started
description: Install, sign in, and run your first build.
order: 2
---

# Getting Started

This guide takes you from zero to a running build in about five minutes.

## 1. Sign in

Head to the [account page](/account) and sign in with GitHub or email. Bobby uses your GitHub identity to scope what repos you can connect.

## 2. Create a project

From the dashboard, click **New project**. You'll be asked for:

- A **name** — anything memorable.
- A **repo** — pick from any GitHub repo you have push access to.
- A **target** — web, worker, or static.

```bash
# Or, if you prefer the CLI:
bobby init my-project --repo github.com/you/my-project
```

## 3. Configure your pipeline

Bobby reads `bobby.config.ts` from your repo root. A minimal config:

```ts
import { defineConfig } from "@bobby/core"

export default defineConfig({
  build: "bun run build",
  output: "dist",
})
```

## 4. Run your first build

Click **Run** in the dashboard, or push a commit. The build console streams output live — no refresh needed.

That's it. From here, browse [Core concepts](/docs/concepts) to dig deeper, or skim the [FAQ](/docs/faq) for common gotchas.
