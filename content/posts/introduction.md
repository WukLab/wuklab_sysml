---
title: "Efficient Serving for Augmented LLMs"
date: 2024-02-10
draft: false
hideToc: false
tags: ["LLM", "Serving", "Agents"]
---

Today's large language model (LLM) usages are largely augmented.
First, LLMs are increasingly integrated with external tools and agents like ChatGPT plugins and an image-generation model to extend their capability beyond language-centric tasks. 
Second, an LLM can often be called multiple times in a sequence to carry out a conversation or to decompose a complex task into sub-tasks.
However, today's LLM serving systems are designed for standalone LLMs. They treat any interceptions to an LLM as starting a new request, causing unnecessary recomputation of already computed contexts.
This recomputation accounts for 37-40% of total model forwarding time in typical settings.

We built APIServe (ICML '24), the first LLM serving framework targeting augmented LLMs. APIServe minimizes the GPU resource waste caused by any interception to an LLM and dedicates saved memory for serving more requests. APIServe improves the overall serving throughput by 1.6x and completes 2x more requests per second compared to the state-of-the-art LLM serving systems.
