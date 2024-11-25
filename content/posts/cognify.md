---
title: "Cognify: A Comprehensive, Multi-Faceted Gen AI Workflow Optimizer"
date: 2024-11-25
draft: false
hideToc: false
tags: ["LLM", "GenAI Workflow", "LLM Optimizer"]
summary: "
Building high-quality, cost-effective generative AI applications is challenging due to the absence of systematic methods for tuning, testing, and optimization. We introduce **Cognify**, a tool that automatically enhances generation quality and reduces costs for generative AI workflows, including those written with LangChain, DSPy, and annotated Python. Built on a novel foundation of hierarchical, workflow-level optimization, Cognify delivers up to a **56% improvement in generation quality** and up to **11x cost reduction**. Cognify is publicly available at [https://github.com/GenseeAI/cognify](https://github.com/GenseeAI/cognify).
<br/><br/>
[Read More...](https://mlsys.wuklab.io/posts/cognify/)
"

---
Author: Yiying Zhang, Reyna Abhyankar, Zijian He

![logo](images/cognify/logo.jpg "image_tooltip")

**TL;DR:** Building high-quality, cost-effective generative AI applications is challenging due to the absence of systematic methods for tuning, testing, and optimization. We introduce **Cognify**, a tool that automatically enhances generation quality and reduces costs for generative AI workflows, including those written with LangChain, DSPy, and annotated Python. Built on a novel foundation of hierarchical, workflow-level optimization, Cognify delivers up to a **56% improvement in generation quality** and up to **11x cost reduction**. Cognify is publicly available at [https://github.com/GenseeAI/cognify](https://github.com/GenseeAI/cognify).


## Today’s Gen AI Workflow Practices

A common practice of deploying generative AI (gen AI) in production today involves creating workflows that integrate calls to gen AI models, tools, data sources, and other types of computation–these are often referred to as *gen AI workflows*. Typical examples of gen AI workflows include agentic workflows and LLM+RAG. Compared to a single call to a gen AI model, gen AI workflows offer more capable, customizable, and integrated solutions. Today’s in-production gen AI workflows are typically written by engineers as specialized software programs. Before deploying gen AI workflows, engineers manually tune workflows (*e.g.*, by trying different prompts) and select models for each step in a workflow. In the absence of a systematic tuning and optimization approach, the deployment of gen AI workflows can be prolonged, and the quality of the deployed workflows is often suboptimal. 


## Introducing Cognify

We introduce Cognify, a comprehensive, multi-objective gen-AI workflow optimizer. Cognify transforms gen-AI workflow programs (e.g., written in LangChain, DSPy, Python) into optimized workflows with multi-faceted optimization goals, including high workflow generation quality and low workflow execution cost. As shown in the results below, across application domains, Cognify **achieves up to 56% higher generation quality** with the same or smaller models, **pushes the cost-quality Pareto frontier**, and allows users to choose their preferred cost-quality combinations. Moreover, Cognify automates the entire optimization process with one click. Internally, it tests different combinations of optimization methods (we call them “*cogs*”) to achieve its optimization goals. Our current cogs include model selection, prompt engineering methods, and workflow structure changes (e.g., breaking and parallelizing components). Cognify allows users to configure cogs to include, models to select from, and the maximum optimization duration. 



![hotpot](images/cognify/hotpot.png "image_tooltip")


![codegen](images/cognify/codegen.png "image_tooltip")



![hover](images/cognify/hover.png "image_tooltip")

![t2s](images/cognify/t2s.png "image_tooltip")



![datavis](images/cognify/datavis.png "image_tooltip")



## The Secret Sauce: Holistic Workflow Hyperparameter Tuning

The core idea of Cognify is to perform optimizations at the workflow level instead of at each individual workflow component. Since upstream components’ generation highly affects how downstream components perform, optimizing components in isolation can negatively impact both final generation quality and workflow execution costs. Instead, Cognify optimizes the entire workflow by experimenting with various combinations of cogs applied across workflow components and assessing the effectiveness of these combinations based on the quality of the final output. 



![arch](images/cognify/arch.png "image_tooltip")


***Cognify Overall Architecture***

A key challenge in holistic workflow optimization is the associated optimization cost, both in terms of monetary cost and optimization time. A simplistic approach would involve performing a grid search over every possible cog combination, leading to exponential optimization costs. To confront this challenge, Cognify employs two strategies. First, we treats a workflow as a “*grey box*” and cogs as hyper-parameters to the workflow. The grey-box approach is in between white boxes and black boxes where we analyze and utilize workflows’ internal structures but not what each workflow step does. We design a customized Bayesian Optimizer for tuning workflow hyperparameters (i.e., cogs) based on the grey-box information, which allows for efficient exploration of the cog space. Second, we categorize cogs into two distinct layers: an outer loop containing cogs that alter workflow structures (like adding or removing components or rearranging their order) and an inner loop containing cogs that do not affect workflow structures (like prompt tuning and model selection). This two-layer approach reduces the overall search space that our Bayesian Optimizer needs to navigate.


![optim](images/cognify/optim.gif "image_tooltip")


***Cognify Optimization Flow***


## CogHub: a Gen AI Workflow Optimizer Registry

Together with the Cognify optimizer, we release CogHub, a registry of cogs. Just like how HuggingFace serves as the hub of open-source ML models, CogHub serves as an open-source hub of gen AI workflow optimizers that can be utilized internally by Cognify, explicitly by programmers, or by future gen AI tools. We currently support five cogs: 



* Task Decomposition (outer loop): break a task (one LLM call) into multiple better-described subtasks (multiple LLM calls)
* Task Ensemble (outer loop): multiple workers making an ensemble of generations, from which the most consistent majority one is chosen
* Multi-Step Reasoning (inner loop): asking LLMs to reason step by step
* Few-Shot Examples (inner loop): adding a few high-quality example demonstrations from input samples
* Model Selection (inner loop): evaluating different ML models (specified by the user if not using the default set)

We welcome community contributions of more cogs.


## Generation Demos

Below, we provide the generation results of a data visualization task for plotting a figure that represents mobile phone sales data across brands and quarters. We compare 1) directly asking OpenAI o1, 2) running a workflow (adopted from [MatPlotAgent](https://arxiv.org/pdf/2402.11453)), 3) the workflow optimized by DSPy, and 4) the workflow optimized by Cognify against the human plotted ground truth figure. As seen, Cognify’s generation is the closest to the ground truth.



![ground_truth](images/cognify/ground_truth.png "image_tooltip")
                     
Human Plotted Ground Truth


![o1](images/cognify/o1.png "image_tooltip")


Generated by o1-preview


![original](images/cognify/original_wf.png "image_tooltip")

Generated by Original Workflow
     
![dspy](images/cognify/dspy.png "image_tooltip")


Generated by DSPy-optimized workflow


![cognify](images/cognify/cognify.png "image_tooltip")


**Generated by Cognify-optimized workflow**


## Get Started with Cognify

Cognify is available as a Python package.

```
pip install cognify-ai
```

You can use Cognify with our simple command-line interface:

```
cognify optimize /path/to/workflow.py
```


To learn more, read our full documentation: [https://cognify-ai.readthedocs.io](https://cognify-ai.readthedocs.io).
