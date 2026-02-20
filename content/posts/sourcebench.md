---
title: "SourceBench: Can AI Answers Reference Quality Web Sources?"
date: 2026-02-18
draft: false
hideToc: false
tags: ["AI Search", "LLM"]
summary: "
Most AI benchmarks focus on answer correctness but ignore the quality of cited sources, leading to a \"Garbage In, Garbage Out\" blind spot. To address this, we introduced SourceBench, a framework evaluating 3,996 sources across 12 AI systems using 8 distinct metrics like freshness and domain authority. Our results show that while GPT-5 leads in authoritative trust, engines like Gensee excel in relevance; crucially, we found that a \"dumb\" model with high-quality search tools often outperforms a \"smart\" reasoning model with poor search tools, proving that retrieval quality is the true bottleneck.
<br/><br/>
[Read More...](https://mlsys.wuklab.io/posts/sourcebench/)
"

---
Author: Yiying Zhang, Hexi Jin, Stephen Liu, Yuheng Li, Simran Malik

Large Language Models (LLMs) increasingly answer queries by citing web sources. While web search mitigates hallucinations by grounding responses in external data, it introduces a new dependency: the quality of the sources themselves.

In high-stakes domains—such as financial analysis or medical inquiries—users rely on citations for verification. A search-augmented LLM is subject to the "**Garbage In, Garbage Out**" principle; if an AI synthesizes information from biased or outdated pages, the resulting answer remains flawed.

Existing benchmarks and evaluators like HotpotQA and RAGAS emphasize answer correctness or relevance ranking. They do not evaluate the credibility of the evidence itself. We introduce **SourceBench**, the **first** framework for measuring the **quality of web sources** referenced in AI answers.

## The SourceBench Framework

We constructed a dataset of 100 queries spanning informational, factual, argumentative, social, and shopping intents. To evaluate the retrieved sources, we designed an eight-metric framework covering two key dimensions: **Content Quality** and **Meta-Attributes**.

{{< sourcebench/metric >}}

## Overall System Performance

We evaluated 3,996 cited sources across 12 systems, including search-equipped LLMs (e.g., GPT-5, Gemini-3-Pro, Grok-4.1), traditional SERP (Google), and AI search tools (e.g., Exa, Tavily, Gensee).

{{< sourcebench/leaderboard >}}

The full leaderboard is presented in the table below. GPT-5 leads the pack (89.1) with a substantial margin, particularly in the Meta Metric (4.5), suggesting an internal filtering mechanism that rigorously prioritizes institutional authority. Gensee secures the #3 spot by optimizing for Content Relevance (4.3).

{{< sourcebench/leaderboardtable >}}

## Key Insights

### Insight 1: Architecture must explicitly weight credibility
The next leap of AI-based search should go for architectures that explicitly weight source credibility and content quality. Our correlation analysis reveals that accountability metrics (Ownership, Author, Domain Authority) cluster together, forming a "Trust" dimension distinct from pure Content Relevance.

{{< sourcebench/heatmap >}}

### Insight 2: The Inverse Law of AI Search and SERP
There is a striking inverse relationship between a model's SourceBench score and its reliance on traditional Google Search results.
Top-performing systems like **GPT-5** overlap with Google only 16% of the time, functioning as "**Discovery Engines**" that find high-quality, buried evidence.
Conversely, lower-scoring systems (e.g., Tavily) overlap 55% with Google, essentially acting as "**Summarization Layers**" over standard SERPs.

{{< sourcebench/inverse >}}

### Insight 3: Better Search > Better Reasoning
Instead of relying on a model to "think" its way through noise, providing superior, well-curated context allows simpler models to achieve better outcomes. In our controlled experiment with DeepSeek, a non-reasoning model ("Chat") with high-quality search tools outperformed a reasoning model with low-quality search tools.

{{< sourcebench/deepseek >}}


### Insight 4: Query intent dictates the difficulty landscape
Performance variability across query types highlights the different "personalities" of search tasks. A system that excels at factual retrieval often fails at social listening or shopping:

{{< sourcebench/querytype >}}

## Conclusion: From Retrieval to Judgment

As AI systems transition from passive tools to active agents, the "black box" of retrieval is no longer acceptable. SourceBench demonstrates that high-parameter reasoning cannot fix low-quality context.

The future isn't just about smarter models; it's about discerning models—ones that understand that a random forum post and a peer-reviewed study are not semantically equivalent, even if they share the same keywords. If we want AI to be a trusted arbiter of truth, we must teach it to judge its sources, not just summarize them.


