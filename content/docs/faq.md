---
title: FAQ
description: Common questions and answers.
order: 4
---

# FAQ

## Is Bobby open source?

The CLI and worker runtime are open source under MIT. The hosted dashboard is closed-source for now.

## Can I self-host?

Yes — point a worker at your own machine or a VPS. The dashboard has a self-hosted tier in private beta.

## What languages are supported?

Anything you can build from a shell. First-class templates exist for TypeScript, Python, Go, and Rust, but the pipeline is just a script — bring whatever toolchain you like.

## How are secrets handled?

Secrets are encrypted at rest with per-project keys and only decrypted inside the worker process at build time. They never leave the worker.

## How do I get help?

- File an issue on [GitHub](https://github.com)
- Ask in the community chat (link in your dashboard)
- Email support if you're on a paid plan

## What's on the roadmap?

The short list: native deploy targets, scheduled pipelines, and a marketplace for community pipeline steps.
