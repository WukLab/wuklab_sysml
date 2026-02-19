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
Author: Yiying Zhang, Reyna Abhyankar, Zijian He
<head>
<script src="https://www.google.com/search?q=https://cdn.tailwindcss.com"></script>
<script src="https://www.google.com/search?q=https://cdn.jsdelivr.net/npm/chart.js"></script>
<link href="https://www.google.com/search?q=https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
<link href="https://www.google.com/search?q=https://fonts.googleapis.com/css2%3Ffamily%3DCrimson%2BPro:ital,wght%400,400%3B0,600%3B0,700%3B1,400%26family%3DInter:wght%40400%3B600%3B700%26display%3Dswap" rel="stylesheet">
<style>
body { font-family: 'Crimson Pro', serif; color: #1a1a1a; line-height: 1.6; font-size: 1.25rem; background-color: #ffffff; }
h1, h2, h3, h4, .sans-serif { font-family: 'Inter', sans-serif; letter-spacing: -0.02em; }
.caption { font-family: 'Inter', sans-serif; font-size: 0.9rem; color: #666; text-align: center; margin-top: 0.75rem; }
.insight-block { margin: 2rem 0; padding: 1.5rem; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 0 4px 4px 0; }
.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 2rem 0; }
.metric-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; background-color: #fff; transition: transform 0.2s; }
.metric-box:hover { border-color: #cbd5e1; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
.metric-tag { font-family: 'Inter', sans-serif; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: #64748b; margin-bottom: 0.5rem; display: block; }
.heatmap-container { display: grid; grid-template-columns: 30px repeat(8, 1fr); gap: 2px; margin: 2rem 0; font-family: 'Inter', sans-serif; font-size: 0.65rem; }
.heatmap-label { display: flex; align-items: center; justify-content: center; font-weight: 600; color: #64748b; }
.heatmap-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 2px; transition: transform 0.1s; font-weight: 500; }
.grad-neg { background-color: #f1f5f9; color: #94a3b8; } .grad-0 { background-color: #fff1f2; color: #be123c; } .grad-10 { background-color: #ffe4e6; color: #be123c; } .grad-20 { background-color: #fecdd3; color: #be123c; } .grad-30 { background-color: #fda4af; color: #881337; } .grad-40 { background-color: #fb7185; color: #fff; } .grad-50 { background-color: #f43f5e; color: #fff; } .grad-60 { background-color: #e11d48; color: #fff; } .grad-70 { background-color: #be123c; color: #fff; } .grad-80 { background-color: #9f1239; color: #fff; } .grad-90 { background-color: #881337; color: #fff; } .grad-100 { background-color: #4c0519; color: #fff; }
.heatmap-cell:hover { transform: scale(1.2); z-index: 10; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
.intent-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
.intent-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; font-family: 'Inter', sans-serif; font-weight: 700; color: #1e293b; }
.intent-stat { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-family: 'Inter', sans-serif; font-weight: 600; margin-right: 0.5rem; }
.stat-good { background: #dcfce7; color: #166534; } .stat-bad { background: #fee2e2; color: #991b1b; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-family: 'Inter', sans-serif; font-size: 0.85rem; margin: 2rem 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
th { background-color: #f8fafc; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
tr:last-child td { border-bottom: none; }
.rank-col { font-weight: 700; color: #94a3b8; width: 60px; }
.score-col { font-weight: 700; color: #0f172a; text-align: right; }
.metric-col { color: #64748b; text-align: right; }
</style>
</head>

Large Language Models (LLMs) increasingly answer queries by citing web sources. While web search mitigates hallucinations by grounding responses in external data, it introduces a new dependency: the quality of the sources themselves.

In high-stakes domains—such as financial analysis or medical inquiries—users rely on citations for verification. A search-augmented LLM is subject to the "Garbage In, Garbage Out" principle; if an AI synthesizes information from biased or outdated pages, the resulting answer remains flawed.

Existing benchmarks and evaluators like HotpotQA and RAGAS emphasize answer correctness or relevance ranking. They do not evaluate the credibility of the evidence itself. We introduce SourceBench, a framework for measuring the quality of web sources referenced in AI answers.

## The SourceBench Framework

We constructed a dataset of 100 queries spanning informational, factual, argumentative, social, and shopping intents. To evaluate the retrieved sources, we designed an eight-metric framework covering two key dimensions: Content Quality and Meta-Attributes.

<div class="metric-grid">
<!-- Content Metrics -->
<div class="metric-box border-l-4 border-l-indigo-500">
<span class="metric-tag text-indigo-600">Content Quality</span>
<strong class="sans-serif text-gray-900 block text-lg mb-2">1. Relevance (CR)</strong>
<span class="text-gray-600 text-base">Does the source directly resolve the user need, or is it merely a keyword match?</span>
</div>
<div class="metric-box border-l-4 border-l-indigo-500">
<span class="metric-tag text-indigo-600">Content Quality</span>
<strong class="sans-serif text-gray-900 block text-lg mb-2">2. Factual Accuracy (FA)</strong>
<span class="text-gray-600 text-base">Are claims verifiable and supported by citations? Does it prioritize primary sources?</span>
</div>
<div class="metric-box border-l-4 border-l-indigo-500">
<span class="metric-tag text-indigo-600">Content Quality</span>
<strong class="sans-serif text-gray-900 block text-lg mb-2">3. Objectivity (NE)</strong>
<span class="text-gray-600 text-base">Is the tone neutral and clinical, avoiding emotional manipulation?</span>
</div>
<!-- Meta Metrics -->
<div class="metric-box border-l-4 border-l-emerald-500">
<span class="metric-tag text-emerald-600">Meta-Attribute</span>
<strong class="sans-serif text-gray-900 block text-lg mb-2">4. Freshness (FR)</strong>
<span class="text-gray-600 text-base">Is the content timely? Obsolete data (e.g., old code) is heavily penalized.</span>
</div>
<div class="metric-box border-l-4 border-l-emerald-500">
<span class="metric-tag text-emerald-600">Meta-Attribute</span>
<strong class="sans-serif text-gray-900 block text-lg mb-2">5. Author Accountability (AA)</strong>
<span class="text-gray-600 text-base">Is there a named author with verifiable credentials?</span>
</div>
<div class="metric-box border-l-4 border-l-emerald-500">
<span class="metric-tag text-emerald-600">Meta-Attribute</span>
<strong class="sans-serif text-gray-900 block text-lg mb-2">6. Ownership (OA)</strong>
<span class="text-gray-600 text-base">Is the entity behind the site transparent about its funding and location?</span>
</div>
<div class="metric-box border-l-4 border-l-emerald-500">
<span class="metric-tag text-emerald-600">Meta-Attribute</span>
<strong class="sans-serif text-gray-900 block text-lg mb-2">7. Domain Authority (DA)</strong>
<span class="text-gray-600 text-base">Is the domain a known institution (e.g., .gov, .edu) or a recognized brand?</span>
</div>
<div class="metric-box border-l-4 border-l-emerald-500">
<span class="metric-tag text-emerald-600">Meta-Attribute</span>
<strong class="sans-serif text-gray-900 block text-lg mb-2">8. Layout Clarity (LC)</strong>
<span class="text-gray-600 text-base">Evaluates consumability. Penalizes "SEO farms" saturated with ads.</span>
</div>
</div>

## Overall System Performance

We evaluated 3,996 cited sources across 12 systems, including search-equipped LLMs (e.g., GPT-5, Gemini-3-Pro, Grok-4.1), traditional SERP (Google), and AI search tools (e.g., Exa, Tavily, Gensee).

<div class="relative h-[400px] w-full border border-gray-100 rounded-lg p-6 bg-white shadow-sm mt-8">
<canvas id="leaderboardChart"></canvas>
</div>

The full leaderboard is presented in the table below. GPT-5 leads the pack (89.1) with a substantial margin, particularly in the Meta Metric (4.5), suggesting an internal filtering mechanism that rigorously prioritizes institutional authority. Gensee secures the #3 spot by optimizing for Content Relevance (4.3).

<table>
<thead>
<tr>
<th class="rank-col">Rank</th>
<th>System</th>
<th class="score-col">Weighted Score</th>
<th class="metric-col">Content Metric</th>
<th class="metric-col">Meta Metric</th>
</tr>
</thead>
<tbody>
<tr><td class="rank-col">1</td><td style="font-weight: 600; color: #047857;">GPT-5</td><td class="score-col">89.1</td><td class="metric-col">4.4</td><td class="metric-col">4.5</td></tr>
<tr><td class="rank-col">2</td><td style="font-weight: 600; color: #1d4ed8;">Grok-4.1</td><td class="score-col">83.4</td><td class="metric-col">4.2</td><td class="metric-col">4.1</td></tr>
<tr><td class="rank-col">3</td><td style="font-weight: 600; color: #0891b2;">Gensee</td><td class="score-col">81.8</td><td class="metric-col">4.3</td><td class="metric-col">3.9</td></tr>
<tr><td class="rank-col">4</td><td>GPT-4o</td><td class="score-col">81.5</td><td class="metric-col">4.1</td><td class="metric-col">4.0</td></tr>
<tr><td class="rank-col">5</td><td>Claude 3.5</td><td class="score-col">81.3</td><td class="metric-col">4.1</td><td class="metric-col">4.0</td></tr>
<tr><td class="rank-col">6</td><td>Exa</td><td class="score-col">80.1</td><td class="metric-col">3.9</td><td class="metric-col">4.1</td></tr>
<tr><td class="rank-col">7</td><td>Google</td><td class="score-col">79.9</td><td class="metric-col">4.0</td><td class="metric-col">4.0</td></tr>
<tr><td class="rank-col">8</td><td>Gemini 3 Pro</td><td class="score-col">79.4</td><td class="metric-col">3.9</td><td class="metric-col">4.0</td></tr>
<tr><td class="rank-col">9</td><td>Perplexity</td><td class="score-col">78.5</td><td class="metric-col">3.8</td><td class="metric-col">4.0</td></tr>
<tr><td class="rank-col">10</td><td>Tavily</td><td class="score-col">78.3</td><td class="metric-col">3.8</td><td class="metric-col">3.9</td></tr>
</tbody>
</table>
<div class="caption">Table 4: Main Leaderboard. "Content Metric" averages Relevance, Factuality, and Objectivity.</div>

## Key Insights

<div class="insight-block">
<h3 class="text-xl font-bold mb-2 sans-serif text-gray-900">Insight 1: Architecture must explicitly weight credibility.</h3>
<p class="mb-0 text-gray-700">
The next leap of AI-based search should go for architectures that explicitly weight source credibility and content quality. Our correlation analysis reveals that accountability metrics (Ownership, Author, Domain Authority) cluster together, forming a "Trust" dimension distinct from pure Content Relevance.
</p>
</div>

<div class="insight-block">
<h3 class="text-xl font-bold mb-2 sans-serif text-gray-900">Insight 2: The Inverse Law of AI Search and SERP.</h3>
<p class="mb-4 text-gray-700">
There is a striking inverse relationship between a model's SourceBench score and its reliance on traditional Google Search results.
Top-performing systems like <strong>GPT-5</strong> overlap with Google only <strong>16%</strong> of the time, functioning as "Discovery Engines" that find high-quality, buried evidence.
Conversely, lower-scoring systems (e.g., Tavily) overlap <strong>55%</strong> with Google, essentially acting as "Summarization Layers" over standard SERPs.
</p>
<div class="relative h-[300px] w-full border border-gray-100 rounded-lg p-6 bg-white shadow-sm">
<canvas id="inverseChart"></canvas>
</div>
<div class="caption">Figure 2: SourceBench Score (Green) vs. Google Overlap (Gray).</div>
</div>

<div class="insight-block">
<h3 class="text-xl font-bold mb-2 sans-serif text-gray-900">Insight 3: Better Search > Better Reasoning.</h3>
<p class="mb-4 text-gray-700">
Instead of relying on a model to "think" its way through noise, providing superior, well-curated context allows simpler models to achieve better outcomes. In our controlled experiment with DeepSeek, a non-reasoning model ("Chat") with high-quality search tools outperformed a reasoning model with low-quality search tools.
</p>
<div class="relative h-[250px] w-full border border-gray-100 rounded-lg p-6 bg-white shadow-sm">
<canvas id="deepseekChart"></canvas>
</div>
<div class="caption">Figure 3: DeepSeek experiment results.</div>
</div>

<div class="insight-block">
<h3 class="text-xl font-bold mb-6 sans-serif text-gray-900">Insight 4: Query intent dictates the difficulty landscape.</h3>
<p class="mb-6 text-gray-700">
Performance variability across query types highlights the different "personalities" of search tasks. A system that excels at factual retrieval often fails at social listening or shopping:
</p>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<!-- Shopping Card -->
<div class="intent-card border-l-4 border-l-pink-500">
<div class="intent-header text-pink-700">
<i class="fas fa-shopping-cart"></i>
<span>Shopping & Commercial</span>
</div>
<div class="mb-4">
<span class="intent-stat stat-good">High Freshness</span>
<span class="intent-stat stat-good">High Factuality</span>
</div>
<div class="p-2 bg-red-50 rounded text-xs text-red-800 font-semibold border border-red-100">
<i class="fas fa-exclamation-circle mr-1"></i> Lowest Layout Clarity
</div>
</div>
<!-- Social Card -->
<div class="intent-card border-l-4 border-l-orange-500">
<div class="intent-header text-orange-700">
<i class="fas fa-users"></i>
<span>Social & Community</span>
</div>
<div class="mb-4">
<span class="intent-stat stat-good">High Freshness</span>
</div>
<div class="p-2 bg-red-50 rounded text-xs text-red-800 font-semibold border border-red-100">
<i class="fas fa-balance-scale-right mr-1"></i> Lowest Objectivity Score
</div>
</div>
<!-- Factual Card -->
<div class="intent-card border-l-4 border-l-blue-500">
<div class="intent-header text-blue-700">
<i class="fas fa-book"></i>
<span>Factual Check</span>
</div>
<div class="mb-4">
<span class="intent-stat stat-good">High Authority (DA)</span>
<span class="intent-stat stat-good">High Accountability</span>
</div>
<div class="p-2 bg-slate-100 rounded text-xs text-slate-700 font-semibold border border-slate-200">
<i class="fas fa-history mr-1"></i> Lowest Freshness
</div>
</div>
<!-- Reasoning Card -->
<div class="intent-card border-l-4 border-l-purple-500">
<div class="intent-header text-purple-700">
<i class="fas fa-brain"></i>
<span>Multi-hop Reasoning</span>
</div>
<div class="p-2 bg-red-50 rounded text-xs text-red-800 font-semibold border border-red-100">
<i class="fas fa-times-circle mr-1"></i> Lowest Content Relevance (System Failure)
</div>
</div>
</div>
</div>


<div class="bg-white p-6 border border-gray-200 rounded-lg shadow-sm w-full max-w-lg mx-auto">
<div class="heatmap-container">
<!-- Header Row -->
<div class="heatmap-label"></div>
<div class="heatmap-label">CR</div><div class="heatmap-label">FA</div><div class="heatmap-label">NE</div>
<div class="heatmap-label">AA</div><div class="heatmap-label">FR</div><div class="heatmap-label">OA</div>
<div class="heatmap-label">DA</div><div class="heatmap-label">LC</div>
<!-- Rows populated via CSS classes -->
<div class="heatmap-label">CR</div><div class="heatmap-cell grad-100">1.0</div><div class="heatmap-cell grad-60">.61</div><div class="heatmap-cell grad-30">.31</div><div class="heatmap-cell grad-30">.32</div><div class="heatmap-cell grad-0">.02</div><div class="heatmap-cell grad-20">.21</div><div class="heatmap-cell grad-20">.19</div><div class="heatmap-cell grad-10">.12</div>
<div class="heatmap-label">FA</div><div class="heatmap-cell grad-60">.61</div><div class="heatmap-cell grad-100">1.0</div><div class="heatmap-cell grad-60">.67</div><div class="heatmap-cell grad-40">.44</div><div class="heatmap-cell grad-10">.07</div><div class="heatmap-cell grad-40">.47</div><div class="heatmap-cell grad-50">.48</div><div class="heatmap-cell grad-30">.35</div>
<div class="heatmap-label">NE</div><div class="heatmap-cell grad-30">.31</div><div class="heatmap-cell grad-60">.67</div><div class="heatmap-cell grad-100">1.0</div><div class="heatmap-cell grad-30">.31</div><div class="heatmap-cell grad-0">.02</div><div class="heatmap-cell grad-40">.39</div><div class="heatmap-cell grad-40">.44</div><div class="heatmap-cell grad-40">.44</div>
<div class="heatmap-label">AA</div><div class="heatmap-cell grad-30">.32</div><div class="heatmap-cell grad-40">.44</div><div class="heatmap-cell grad-30">.31</div><div class="heatmap-cell grad-100">1.0</div><div class="heatmap-cell grad-0">.05</div><div class="heatmap-cell grad-50">.53</div><div class="heatmap-cell grad-50">.48</div><div class="heatmap-cell grad-20">.22</div>
<div class="heatmap-label">FR</div><div class="heatmap-cell grad-0">.02</div><div class="heatmap-cell grad-10">.07</div><div class="heatmap-cell grad-0">.02</div><div class="heatmap-cell grad-0">.05</div><div class="heatmap-cell grad-100">1.0</div><div class="heatmap-cell grad-10">.10</div><div class="heatmap-cell grad-0">.05</div><div class="heatmap-cell grad-neg">-.03</div>
<div class="heatmap-label">OA</div><div class="heatmap-cell grad-20">.21</div><div class="heatmap-cell grad-40">.47</div><div class="heatmap-cell grad-40">.39</div><div class="heatmap-cell grad-50">.53</div><div class="heatmap-cell grad-10">.10</div><div class="heatmap-cell grad-100">1.0</div><div class="heatmap-cell grad-70">.73</div><div class="heatmap-cell grad-30">.36</div>
<div class="heatmap-label">DA</div><div class="heatmap-cell grad-20">.19</div><div class="heatmap-cell grad-50">.48</div><div class="heatmap-cell grad-40">.44</div><div class="heatmap-cell grad-50">.48</div><div class="heatmap-cell grad-0">.05</div><div class="heatmap-cell grad-70">.73</div><div class="heatmap-cell grad-100">1.0</div><div class="heatmap-cell grad-40">.39</div>
<div class="heatmap-label">LC</div><div class="heatmap-cell grad-10">.12</div><div class="heatmap-cell grad-30">.35</div><div class="heatmap-cell grad-40">.44</div><div class="heatmap-cell grad-20">.22</div><div class="heatmap-cell grad-neg">-.03</div><div class="heatmap-cell grad-30">.36</div><div class="heatmap-cell grad-40">.39</div><div class="heatmap-cell grad-100">1.0</div>
</div>
</div>
<div class="caption">Figure 4: Full Correlation Matrix. Colors represent correlation strength in 0.1 intervals.</div>

Conclusion: From Retrieval to Judgment

As AI systems transition from passive tools to active agents, the "black box" of retrieval is no longer acceptable. SourceBench demonstrates that high-parameter reasoning cannot fix low-quality context.

The future isn't just about smarter models; it's about discerning models—ones that understand that a random forum post and a peer-reviewed study are not semantically equivalent, even if they share the same keywords. If we want AI to be a trusted arbiter of truth, we must teach it to judge its sources, not just summarize them.

<script>
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#475569';

const leaderBoardData = [
    { name: &#39;GPT-5&#39;, score: 89.1, color: &#39;#10b981&#39; },
    { name: &#39;Grok-4.1&#39;, score: 83.4, color: &#39;#3b82f6&#39; },
    { name: &#39;Gensee&#39;, score: 81.8, color: &#39;#06b6d4&#39; },
    { name: &#39;GPT-4o&#39;, score: 81.5, color: &#39;#94a3b8&#39; },
    { name: &#39;Claude 3.5&#39;, score: 81.3, color: &#39;#94a3b8&#39; },
    { name: &#39;Exa&#39;, score: 80.1, color: &#39;#94a3b8&#39; },
    { name: &#39;Google&#39;, score: 79.9, color: &#39;#94a3b8&#39; },
    { name: &#39;Gemini 3 Pro&#39;, score: 79.4, color: &#39;#94a3b8&#39; },
    { name: &#39;Perplexity&#39;, score: 78.5, color: &#39;#94a3b8&#39; },
    { name: &#39;Tavily&#39;, score: 78.3, color: &#39;#ef4444&#39; },
];

const inverseData = {
    labels: [&#39;GPT-5&#39;, &#39;Grok-4.1&#39;, &#39;GPT-4o&#39;, &#39;Perplexity&#39;, &#39;Tavily&#39;],
    score: [89.1, 83.4, 81.5, 78.5, 78.3],
    overlap: [16.0, 29.7, 27.5, 40.0, 55.5]
};

const deepSeekData = [
    { name: &#39;Chat + Low Search&#39;, score: 70.1, color: &#39;#cbd5e1&#39; },
    { name: &#39;Reason + Low Search&#39;, score: 75.8, color: &#39;#94a3b8&#39; },
    { name: &#39;Chat + High Search&#39;, score: 75.9, color: &#39;#8b5cf6&#39; },
];

new Chart(document.getElementById(&#39;leaderboardChart&#39;), {
    type: &#39;bar&#39;,
    data: {
        labels: leaderBoardData.map(d =&gt; d.name),
        datasets: [{
            label: &#39;SourceBench Score&#39;,
            data: leaderBoardData.map(d =&gt; d.score),
            backgroundColor: leaderBoardData.map(d =&gt; d.color),
            borderRadius: 4,
            barThickness: 24
        }]
    },
    options: {
        indexAxis: &#39;y&#39;,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { min: 70, max: 95, grid: { color: &#39;#f1f5f9&#39; } }, y: { grid: { display: false } } }
    }
});

new Chart(document.getElementById(&#39;inverseChart&#39;), {
    type: &#39;bar&#39;,
    data: {
        labels: inverseData.labels,
        datasets: [
            {
                label: &#39;SourceBench Score&#39;,
                data: inverseData.score,
                backgroundColor: &#39;#10b981&#39;,
                yAxisID: &#39;y&#39;,
                borderRadius: 4,
                barPercentage: 0.6
            },
            {
                label: &#39;Google Overlap %&#39;,
                data: inverseData.overlap,
                backgroundColor: &#39;#94a3b8&#39;,
                yAxisID: &#39;y1&#39;,
                borderRadius: 4,
                barPercentage: 0.6
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: &#39;index&#39;, intersect: false },
        plugins: { legend: { position: &#39;top&#39;, labels: { usePointStyle: true } } },
        scales: { 
            x: { grid: { display: false } },
            y: { type: &#39;linear&#39;, display: true, position: &#39;left&#39;, min: 70, max: 95, title: { display: true, text: &#39;Weighted Score&#39; } },
            y1: { type: &#39;linear&#39;, display: true, position: &#39;right&#39;, min: 0, max: 60, grid: { drawOnChartArea: false }, title: { display: true, text: &#39;Overlap %&#39; } }
        }
    }
});

new Chart(document.getElementById(&#39;deepseekChart&#39;), {
    type: &#39;bar&#39;,
    data: {
        labels: deepSeekData.map(d =&gt; d.name),
        datasets: [{
            label: &#39;Score&#39;,
            data: deepSeekData.map(d =&gt; d.score),
            backgroundColor: deepSeekData.map(d =&gt; d.color),
            borderRadius: 4,
            barThickness: 24
        }]
    },
    options: {
        indexAxis: &#39;y&#39;,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { min: 65, max: 80, grid: { color: &#39;#f1f5f9&#39; } }, y: { grid: { display: false } } }
    }
});


</script>
