---
title: Core Concepts
description: Projects, workers, pipelines, and how they connect.
order: 3
---

# Core Concepts

Four primitives make up everything in Bobby.

## Projects

A **project** is a single repo with a single build target. You can have many projects in one workspace, and each one gets its own configuration, secrets, and history.

## Workers

A **worker** is the runtime that actually executes your builds. Workers are stateless — they pull a job, run it, stream output, and exit. You can run them on Bobby's hosted infra or bring your own.

## Pipelines

A **pipeline** is the ordered set of steps that turn source code into a deployable artifact. Pipelines are defined in code (`bobby.config.ts`), not in YAML, so you get types, imports, and refactoring for free.

## Streams

Every build produces a **stream** — a live, append-only log of everything the worker did. Streams are the source of truth: the dashboard, CLI, and webhooks all read from the same stream.

---

## How they fit together

```
project ──► pipeline ──► worker ──► stream
   ▲                                   │
   └───────── you, watching live ◄─────┘
```

The shape is intentional. By keeping these four primitives small and orthogonal, every feature in Bobby ends up being a thin layer over the same core — which means fewer surprises when something breaks.
