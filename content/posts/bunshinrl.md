---
title: "BunshinRL: Whole-Workspace Forking for Agentic Reinforcement Learning Rollouts"
date: 2026-11-13
draft: false
hideToc: false
tags: ["Sys for ML", "Reinforcement Learning", "CUAs"]
summary: "
Agentic RL rollouts run inside live workspaces: a browser, a desktop, a whole app stack per sample.
Scaling them means paying for hundreds of near-identical environments in memory, and waiting on slow
tool calls that hold up the entire batch. We built **BunshinRL**, an agentic RL rollout system that
shares memory across environments, caches tool-call prefixes, and speculatively executes tool calls,
all on top of **BunshinFork**, a live whole-workspace forking mechanism for containers.
BunshinRL cuts **peak memory by up to 43%** and **rollout latency by 23%** without changing the reward.
<br/><br/>
[Read More...](https://mlsys.wuklab.io/posts/bunshinrl/)
"

---
Author: Yutong Huang, Vikranth Srivatsa, Alex Asch, and Yiying Zhang

**TLDR**: Agentic reinforcement learning (RL) trains browser and computer-use agents inside real workspaces, so every
rollout carries a full running environment. Two costs dominate: memory for hundreds of concurrent environments, and
slow tool calls that stall the synchronous batch. Yet those environments are mostly identical, and the same tool calls
recur across training iterations. We built **BunshinRL**, an agentic RL rollout system that exploits this with *memory
sharing*, *tool-prefix caching*, and *speculative tool execution*, all built on **BunshinFork**, a live copy-on-write
fork of a whole container workspace. BunshinRL reduces **peak memory by up to 43%**, **total memory consumption by up
to 51%**, and **end-to-end rollout latency by 23%**, while reaching the same reward. Check out our full paper on
[arxiv](https://arxiv.org/abs/2611.10453).

## Agentic RL Rollouts Are Bound by Their Environments

In agentic RL, the policy reasons, emits a tool call (click a button, run a command, load a page), and waits for the
environment to return an observation, over and over until the task ends. Every rollout therefore needs its own
persistent, isolated workspace: for a computer-use agent, a browser, a display server, and desktop applications. This
brings two costs that text-only RL never had:

- **Memory.** At about 4 GB per sandbox, a batch of 256 rollouts needs 1 TB of CPU memory, and GRPO multiplies this by
  sampling several trajectories per task.
- **Tool latency.** A tool call can take seconds to minutes. Synchronous RL waits for the slowest trajectory, so a few
  long tool chains set the pace of the whole training step.

## The Opportunity: Rollouts Repeat Themselves

First, environments in a batch are largely the same: same libraries, same applications, same task data. Trajectories
in one GRPO group start from the same task and diverge only gradually.

<div style="display:flex;flex-wrap:wrap;gap:2%;justify-content:center;align-items:flex-start;">
<div style="flex:1 1 340px;max-width:49%;">
<img src="/images/bunshinrl/motivation_shareable_memory.png" alt="Shareable memory across agentic RL environments" style="width:100%;" />
<p align="center"><em>Share of an environment's memory that is identical in another environment. Within a GRPO group,
over half stays shareable after ten steps.</em></p>
</div>
<div style="flex:1 1 340px;max-width:49%;">
<img src="/images/bunshinrl/motivation_batch_memory.png" alt="Peak memory as concurrent rollouts scale" style="width:100%;" />
<p align="center"><em>Peak memory as concurrent rollouts grow. Private copies (CRIU) need 1.8x the memory of sharing
unchanged pages at 256 rollouts.</em></p>
</div>
</div>

Much of that shareable memory is heap and shared memory built up at runtime, which container image layers cannot
deduplicate. Keep one physical copy and allocate private pages only where an environment diverges, and memory scales
with what trajectories change, not with how many there are.

Second, tool calls repeat. Training revisits the same tasks every epoch, so trajectories often reissue the same opening
calls, and recurring calls make the next one predictable. A matching prefix can be skipped; a predicted call can run
early, hidden behind the model's reasoning. The catch is that a tool call also leaves behind modified files, running
processes, and in-memory application state, so both reuse and speculation require forking the *whole workspace*.

## BunshinRL: Three Techniques, One Primitive

![overview](/images/bunshinrl/overview.png)
<p align="center"><em>BunshinRL in one rollout step. Left: the prefix tree of workspace snapshots, stored as deltas on
disk with hot snapshots in memory. Right: R1 skips cached Tools 1 and 2, then rolls back a failed speculation of Tool 4;
R2 skips Tools 1 to 3 and successfully speculates Tools 5 and 6.</em></p>

**Memory sharing.** Rollouts for a task fork one initialized workspace copy-on-write (CoW): all branches map the same
physical pages, and a branch gets a private page only when it writes. Batch memory becomes the common state plus each
sample's changes.

**Tool-prefix caching.** Past tool calls form a *prefix tree* rooted at the initial workspace, where each node holds
the workspace state after a call. A sample walks the tree as its policy generates calls, skipping every match, and forks
a writable branch at the first miss. Nodes store only the pages their call changed, hot snapshots stay in memory, and
uncached prefixes are rebuilt by replaying calls from the nearest cached ancestor while the model reasons.

**Speculative tool execution.** A small classifier, the *Spec Tool Selector*, predicts a sample's next tool calls from
previously recorded ones. BunshinRL forks the workspace and runs them while the model is still reasoning. If the
policy's actual call matches, the speculative result is adopted; otherwise the branch is discarded and the real call
runs from the pre-speculation snapshot. Speculation is reserved for the tail samples that decide when the batch
finishes.

## BunshinFork: Forking a Live Container

Checkpoint/restore tools like CRIU serialize a workspace to disk and rebuild a private copy, which is slow and
duplicates every page. MicroVM sandboxes can share snapshot memory, but each runs its own guest kernel. BunshinFork
forks *containers*, where the host kernel sees every page and can share them directly.

![fork_architecture](/images/bunshinrl/fork_architecture.png)
<p align="center"><em>BunshinFork architecture. A brief freeze captures a consistent state; clones share unchanged pages
copy-on-write, while durable checkpointing runs in the background.</em></p>

Its key principle is to **separate online fork creation from durable checkpointing**. The source is frozen only long
enough to record process metadata, set up CoW mappings, and snapshot the file system. No application memory is copied,
and writing to disk happens in the background. Two mechanisms make the fork work:

- **Processes.** Plain `fork()` makes each copy a child of its source, scrambling the tree. BunshinFork rebuilds the
  recorded topology inside a new container.
- **Memory.** A kernel module extends CoW sharing across container boundaries, so clones share pages until they write.

![process_fork](/images/bunshinrl/process_fork.png)
<p align="center"><em>Linux <code>fork()</code> (left) makes one process a child of its source. BunshinFork (right)
rebuilds the whole process tree in a sibling container, sharing memory copy-on-write.</em></p>

## How Well Does It Work?

We train Qwen3-VL-8B with GRPO on OSWorld and the WebArena shopping site, and compare against **CRIU**, which restores
each fork from disk with a private memory copy, and **AgentENV**, a Firecracker microVM sandbox built for Kimi K3 RL
whose forks share snapshot memory.

<div style="display:flex;flex-wrap:wrap;gap:2%;justify-content:center;align-items:flex-start;">
<div style="flex:1 1 340px;max-width:49%;">
<img src="/images/bunshinrl/e2e_memory_osworld.png" alt="Memory over an OSWorld epoch" style="width:100%;" />
<p align="center"><em>Working set over one OSWorld epoch.</em></p>
</div>
<div style="flex:1 1 340px;max-width:49%;">
<img src="/images/bunshinrl/e2e_memory_webarena.png" alt="Memory over a WebArena epoch" style="width:100%;" />
<p align="center"><em>Working set over one WebArena epoch.</em></p>
</div>
</div>

BunshinRL cuts peak memory by **30%** vs. CRIU and **26%** vs. AgentENV on OSWorld, and by **43%** vs. AgentENV on
WebArena. CRIU pays for a full environment per fork; AgentENV shares memory but carries a guest kernel and private page
tables per microVM. Memory also turns into time: on WebArena, CRIU must shrink its batch to fit in 256 GB and takes
**2.4x longer** per epoch.

To isolate the latency techniques, we compare *Base* (memory sharing only), *Spec* (plus speculation), and *Full* (plus
speculation and prefix caching) on OSWorld.

<div style="display:flex;flex-wrap:wrap;gap:2%;justify-content:center;align-items:flex-start;">
<div style="flex:1 1 340px;max-width:49%;">
<img src="/images/bunshinrl/e2e_throughput.png" alt="Rollouts still running over an OSWorld epoch" style="width:100%;" />
<p align="center"><em>Rollouts still running over one OSWorld epoch.</em></p>
</div>
<div style="flex:1 1 340px;max-width:49%;">
<img src="/images/bunshinrl/e2e_prefix_spec_memory.png" alt="Memory cost of prefix caching and speculation" style="width:100%;" />
<p align="center"><em>Working set over the same epoch.</em></p>
</div>
</div>

Full finishes the epoch in **17.0 minutes** vs. 20.8 for Base, with Spec at 19.2. Speculation mostly shortens the
tail, while prefix caching skips matched calls outright and speeds up rollouts throughout. Because snapshots and
speculative branches are CoW forks that pay only for pages they change, peak memory rises only from 69 to 70 GiB.

For fork microbenchmarks and more detailed results, check out our [paper](https://arxiv.org/abs/2611.10453).

## Our Vision

Agentic RL turns every training sample into a running computer. BunshinRL shows that the environments in a batch, and
across training iterations, are overwhelmingly redundant, and that a cheap, live, whole-workspace fork is the right
primitive to exploit it: sharing memory, reusing past work, and speculating ahead all become the same operation. The
same fork applies beyond RL, to agent inference and other workloads that branch.

<hr>

{{< bunshinrl/checkout-paper >}}
