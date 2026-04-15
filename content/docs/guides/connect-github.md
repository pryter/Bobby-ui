---
title: Connect GitHub
description: Link a GitHub repository so Bobby can build and deploy on every push.
order: 1
---

# Connect GitHub

Bobby pulls source straight from GitHub. Once a repository is linked, every push to a tracked branch kicks off a pipeline run.

## Install the app

1. Open **Settings → Integrations** in the Bobby dashboard.
2. Click **Connect GitHub**. You'll be redirected to GitHub to install the Bobby app on the org or user account that owns your repos.
3. Pick the repositories you want Bobby to see. You can change the selection any time from GitHub's app settings.

## Link a repository to a project

Inside any project, head to **Source → Repository** and pick from the list of installed repos. Bobby will:

- Read the default branch and detect the language / framework.
- Propose a starter pipeline you can accept or tweak.
- Register a webhook so future pushes trigger builds automatically.

## Branch filters

By default Bobby builds the default branch plus any branch with an open PR. Override this under **Pipeline → Triggers** with glob patterns (e.g. `release/*`, `main`).
