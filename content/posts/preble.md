---
title: "Preble: Efficient Distributed Prompt Scheduling for LLM Serving"
date: 2024-05-07
draft: false
hideToc: false
tags: ["LLM", "Serving", "Prefix Sharing"]
---

LLM prompts are growing more complex and longer with agents, tool use, large documents, video clips, and detailed few-shot examples. These prompts often have content that is shared across many requests. The computed intermediate state (KV cache) from one prompt can be reused by another for their shared parts to improve request handling performance and save GPU computation resources. However, current distributed LLM serving systems treat each request as independent and miss the opportunity to reuse the computed intermediate state. 
We introduce Preble, the first distributed LLM serving system that targets long and shared prompts. Preble achieves 2-10x average latency and 2-14x p99 latency over SOTA serving systems. The core of Preble is a new E2 Scheduling that optimizes load distribution and KV cache reutilization.  Preble is compatible with multiple serving backends such as vLLM and SGLang.

## What do today’s prompts look like?  

There is a rise of advanced prompts with the following properties:

1. Prompts are much longer than output:  Today’s LLMs support context lengths as high as 2M, and new LLM usages such as in-context learning, tool demonstration, and chain-of-thoughts keep emerging. 
2. Prompt sharing is common: Sharing can come from different user requests needing the same tools or instructions to solve similar tasks, multiple questions on the same document, sequence of steps each using previous context, etc.

Some typical workloads with long and shared prompts include Tools and agents, virtual environments, Chain of thought, multi-modality QA, document QA, RAG, program generation, and few-shot learning. The diagram below displays how prompt growing and sharing happen as more requests arrive. The parts reused by multiple requests are highlighted.  

![Long Prompt Workloads](/images/preble_gifs/long_prompt_ggl_drive.gif)

## Background: Prefix Caching + Distributed Serving
### Prefix Caching
With attention-based models, the intermediate computing result (KV cache) can be reused if sharing happens at the beginning of a sequence (i.e., prefix sharing). To exploit this property, an LLM serving system can store the KVs of a prompt and reuse its prefix when a match happens with a future request. Such reusing improves request response time and overall serving request rate. 

### Distributed LLM Serving
When scaling up a serving system, common techniques include data parallelism, model parallelism, and pipeline parallelism. While model and pipeline parallelism supports larger models by splitting a model across multiple GPUs, data parallelism increases the serving request rate by creating multiple instances of a model to process requests in parallel. 

## Existing systems

Most existing serving systems, such as vLLM, deepspeed-mii, and TGI, treat requests as independent. Additionally, most focus on optimizing output generation (decoding) and are unfit for today's long prompt workloads. The diagram below illustrates how a serving system distributes requests across data-parallel GPUs with no consideration of prompts.

![Existing System](/images/preble_gifs/existing_system_gif.gif)

By creating a scheduler that accounts for shared properties among requests, we can more efficiently route them to the appropriate GPU.

![Preble System](/images/preble_gifs/preble_system_processing_gif.gif)


## Efficient Scheduling for Long and Shared Prompts: E2 Scheduling
Scheduling based on load(Exploration): One approach is to schedule requests using techniques such as Round robin/Least outstanding requests. This improves utilization but has worse KV cache usage. 

Scheduling based on prefix matching(Exploitation): Another approach is to schedule requests based on the GPU that has the largest prefix matches. This improves the KV cache usage but potentially a worse utilization.  

E2 Scheduling (Exploitation + Exploration) combines the benefits of load and kv cache utilization. 
Exploration sends the request to the GPU with less load
Exploitation sends the request to the GPU with the greatest cache hit
E2 picks exploitation when reusing a prefix saves more computation. This happens when the shared prefix is longer than the remaining part of the prompt. If the shared prefix is shorter, E2 chooses exploration.

![E2 Scheduling](/images/preble_gifs/e2_scheduling_gif.gif)

## The Load Cost Equation
We use the following cost function in order to make an efficient scheduling decision
Load Cost(L): Estimated total request load at the time of and after current request running
Eviction Cost(E): Load to be evicted to run the current request
Running Cost(R): Cost to run the current request on the GPU
We schedule to the GPU that the lowest Cost(L + E + R)


## Preble Architecture 

When a request arrives, we first tokenize the request and send it to the global scheduler. 

The global scheduler manages tree and aggregate metadata to make the decision on which GPU to send to. The global scheduler also runs a periodic balancer that adapts to dynamic load.

The individual GPUs receive the request and inserts into a waiting queue. The waiting queue is sorted while considering the fairness and the cache utilization. The requests are processed and sent back to the global scheduler. 

## Evaluating the effectiveness of Preble

We evaluated this across 5 different workloads, 2 different models(Mistral 7b & LLama 3 70b), and 2 different gpu(A6000 + H100) and found a consistent improvement across all systems. 
![All Evaluations](/images/preble_gifs/eval_all_in_one.svg)
See our technical report for more detailed experiment results. 		

We also run a mixed workload on a real LLM azure to test a bursty workload.  	 	
![Real Trace](/images/preble_gifs/eval_real_trace.svg)
*Results on a real microsoft trace combining two workloads*

## Acknowledgement
I’d like to thank Junda Chen, Yutong, Ryan, Nishit, Max Hopkins, and Geoff for providing feedback and their advice. I’d also like to thank 

## Open Source/Package
This is ready to install/run at 
```
pip3 install preble
preble run sglang/vllm –port XXX –model XXX
```

## Citation

```
@article{srivatsa2024preble,
  title={Preble: Efficient Distributed Prompt Scheduling for LLM Serving},
  author={Srivatsa, Vikranth and He, Zijian and Abhyankar, Reyna and Li, Dongming and Zhang, Yiying},
  year={2024}
}
```

				
			
