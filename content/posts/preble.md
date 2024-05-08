---
title: "Preble: Efficient Distributed Prompt Scheduling for LLM Serving"
date: 2024-05-07
draft: false
hideToc: false
tags: ["LLM", "Serving"]
---

Prompts to large language models (LLMs) have evolved beyond simple user questions. For LLMs to solve complex problems, today's practices are to include domain-specific instructions, illustration of tool usages, and long context such as textbook chapters in prompts. As such, many parts of prompts are repetitive across requests, and their attention computation results can be reused. However, today's LLM serving systems treat every request in isolation, missing the opportunity of computation reuse.

This paper proposes Preble, the first distributed LLM serving platform that targets and optimizes for prompt sharing. We perform a study on five popular LLM workloads. Based on our study results, we designed a distributed scheduling system that co-optimizes computation reuse and load balancing. Our evaluation of Preble on two to 8 GPUs with real workloads and request arrival patterns on two open-source LLM models shows that Preble outperforms the state of the art avg latency by 1.5x to 14.5x and p99 by 2x to 10x.
