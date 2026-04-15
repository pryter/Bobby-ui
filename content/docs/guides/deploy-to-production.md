---
title: Deploy to Production
description: Promote a successful build to your production environment.
order: 2
---

# Deploy to Production

Production deploys in Bobby are just another pipeline stage — gated, observable, and reversible.

## Add a deploy stage

In the pipeline editor, drop a **Deploy** block after your test stage and point it at the `production` environment. Bobby will use whatever credentials are configured for that environment (SSH, Kubernetes, container registry, etc.).

## Manual approval

Toggle **Require approval** on the deploy stage if you want a human in the loop. Approvers get a notification in the dashboard and over your configured channel (Slack, email).

## Rollbacks

Every successful deploy is recorded as a release. From **Releases → History**, hit **Roll back** on any prior release to redeploy that exact artifact — no rebuild needed.

## Health checks

Bobby waits for your configured health check (HTTP probe, command exit code, or custom script) before marking the deploy successful. A failed probe automatically rolls back to the previous release.
