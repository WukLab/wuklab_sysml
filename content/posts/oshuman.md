---
title: "OSWorld-Human: Benchmarking the Efficiency of Computer-Use Agents"
date: 2025-07-03
draft: false
hideToc: false
tags: ["Sys for ML", "CUAs", "LLM Benchmarks"]
summary: "
Computer-Use Agents (CUAs) can perform complex tasks, but their high latency makes them impractical. A task taking a human minutes can take an agent over 20 minutes. We study these bottlenecks and construct a new benchmark, OSWorld-Human, that measures both accuracy and temporal efficiency of CUAs. 
<br><br>
[Read More...](/posts/oshuman)
"
---
Author: Reyna Abhyankar, Yiying Zhang

## AI Agents: Smart, But Slow

{{< oshuman/agent-time >}}

We conduct a deep dive on the primary causes of CUA latency by studying [Agent S2](https://www.simular.ai/articles/agent-s2), the leading open-source CUA based on the [OSWorld benchmark](https://os-world.github.io/).

The S2 framework generally follows the “observation-think-act” framework, as depicted for a simple document editing task here:

<!-- <p align="center">
  <img src="https://github.com/WukLab/wuklab_sysml/blob/main/static/images/oshuman/blog-fast.gif?raw=true" style="width: 80%">
</p> -->

Upon breaking down the latency for various applications, LLM calls for "Planning" and "Reflection" are the main culprits, consuming **75-94%** of total task time. Planning and reflection occur at each step and include the full history of observations. This means tasks that take more steps are *exponentially slower* than tasks that take fewer steps. 

<!-- {{< oshuman/agent-time >}} -->

## OSWorld-Human: A New Benchmark

Based on our observations, we constructed **OSWorld-Human**, a benchmark that reflects how humans accomplish computer-use tasks. We manually performed all 369 tasks in OSWorld and recorded the sequence of manual actions needed to complete them. OSWorld-Human is available [open-source](https://github.com/WukLab/osworld-human). 

Furthermore, we found that some steps can be completed without the need of an additional screenshot since there is no change in the UI. For example, clicking on a text box, typing, and pressing enter do not require 3 separate screenshots. Hence, we also construct a **grouped-action** trajectory for each task, which represents actions that can be completed from a single observation Applications where the UI does not change significantly from step to step have a much higher discrepancy between single and grouped trajectories, as shown below.
 
<!-- {{< oshuman/agent-time >}} -->

To measure the performance of SOTA agents on OSWorld-Human, we introduce two **weighted efficiency scores**. 

{{< oshuman/wes >}}

These metrics are aggregated over the entire dataset and paint a clear picture of an agent’s accuracy and efficiency.

We analyze 16 agents’ performance on OSWorld and OSWorld-Human.

<!-- {{< oshuman/agent-time >}} -->

Even the highest-performing agent, S2, takes 1.4x more steps than needed to complete a task, which can add tens of minutes of real-time latency. 

## Our Vision

CUAs can significantly boost human productivity and accessibility by automating desktop tasks. Their adoption hinges on bringing latency down to human or sub-human levels. We hope OSWorld-Human encourages future research on improving the efficiency of CUAs as a parallel goal to accuracy.

<br>

{{< oshuman/checkout-paper >}}

<br>