---
title: RAG
description: Retrieval-augmented generation grounded in your own code and documents.
order: 2
---

# RAG

**Retrieval-augmented generation (RAG)** pairs a language model with a retrieval step: before answering, the system finds the material that's relevant to the question and uses it as the basis for the answer.

Done well, the answers come from your sources, and the system can show you which ones.

## What we focus on

- **Finding the right material.** Retrieval quality decides answer quality. Most of our effort goes here.
- **Grounded answers.** Every answer should trace back to sources you can open and check.
- **Staying current.** Code and documents change; answers should keep up without starting from scratch.
- **Speed.** Retrieval has to be fast enough to keep an interaction feeling responsive.

## Where it shows up

[Ucelot](/products/ucelot) is our main RAG product: it reads your repositories and document collections and answers questions with citations back to files, lines and pages.
