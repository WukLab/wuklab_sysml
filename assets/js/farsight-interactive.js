document.addEventListener('DOMContentLoaded', () => {

    const allData = {
        mcf: {
            labels: ['30%', '50%', '80%', '90%'],
            performance: { farsight: [0.13, 0.34, 0.67, 0.72], fastswap: [0.05, 0.13, 0.31, 0.48], hermit: [0.05, 0.1, 0.53, 0.56] },
            hits: { farsight: [2.79e6, 1.6e6, 0.8e6, 0.70e6], fastswap: [0.2e6, 0.12e6, 0.81e5, 0.56e5] },
        },
        xgboost: {
            labels: ['30%', '50%', '80%', '90%'],
            performance: { farsight: [0.83, 0.86, 0.95, 0.96], fastswap: [0.63, 0.68, 0.94, 0.94], hermit: [0.68, 0.70, 0.78, 0.78] },
            hits: { farsight: [2.7e6, 2.3e6, 0.4e6, 0.27e6], fastswap: [0.75e6, 0.65e6, 0.13e6, 0.11e6] },
        },
        pagerank: {
            labels: ['30%', '50%', '80%', '90%'],
            performance: { farsight: [0.68, 0.80, 0.88, 0.90], fastswap: [0.48, 0.60, 0.72, 0.81], hermit: [0.58, 0.67, 0.81, 0.83] },
            hits: { farsight: [6.9e6, 6.7e6, 6.6e6, 6.3e6], fastswap: [2.6e6, 2.6e6, 2.4e6, 2.3e6] },
        },
        sssp: {
            labels: ['30%', '50%', '80%', '90%'],
            performance: { farsight: [0.56, 0.71, 0.84, 0.91], fastswap: [0.25, 0.38, 0.72, 0.90], hermit: [0.51, 0.63, 0.83, 0.89] },
            hits: { farsight: [2.12e6, 0.89e6, 0.17e6, 0.24e4], fastswap: [0.89e6, 0.42e6, 0.5e5, 0.13e4] },
        }
    };

    let charts = {};
    let currentWorkload = 'mcf';

    const createChart = (ctx, type, labels, datasets, titles) => {
        if(charts[ctx.canvas.id]) {
            charts[ctx.canvas.id].destroy();
        }
        const isDarkMode = document.body.classList.contains('dark-theme');
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#dee2e6' : '#495057';
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 20, color: textColor, font: { family: "'Lato', sans-serif" } } },
                title: { display: true, text: titles.chartTitle, color: textColor, font: { size: 16, family: "'Lato', sans-serif" } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            let value = context.parsed.y;
                            if (value >= 1e6) {
                                label += (value / 1e6).toFixed(1) + 'M';
                            } else if (value >= 1e3) {
                                label += (value / 1e3).toFixed(1) + 'K';
                            } else {
                                label += value;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: !!titles.xTitle, text: titles.xTitle, color: textColor },
                    ticks: { color: textColor, font: { family: "'Lato', sans-serif" } },
                    grid: { color: gridColor }
                },
                y: {
                    title: { display: !!titles.yTitle, text: titles.yTitle, color: textColor },
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: { family: "'Lato', sans-serif" },
                        callback: function(value) {
                            if (value >= 1e6) return (value / 1e6) + 'M';
                            if (value >= 1e3) return (value / 1e3) + 'K';
                            return value;
                        }
                    },
                    grid: { color: gridColor }
                }
            }
        };
        if (type === 'bar' && ctx.canvas.id === 'prefetchHitsChart') {
            chartOptions.plugins.legend.display = false;
        }
        charts[ctx.canvas.id] = new Chart(ctx, { type: type, data: { labels, datasets }, options: chartOptions });
    };

    const updateCharts = (workload) => {
        currentWorkload = workload;
        const data = allData[workload];
        const perfCtx = document.getElementById('performanceChart').getContext('2d');
        const hitsCtx = document.getElementById('prefetchHitsChart').getContext('2d');

        createChart(perfCtx, 'line', data.labels, [
            { label: 'FarSight', data: data.performance.farsight, borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,0.1)', tension: 0.1, borderWidth: 3 },
            { label: 'FastSwap', data: data.performance.fastswap, borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.1)', tension: 0.1, borderWidth: 2, borderDash: [5, 5] },
            { label: 'Hermit', data: data.performance.hermit, borderColor: '#ffc107', backgroundColor: 'rgba(255,193,7,0.1)', tension: 0.1, borderWidth: 2, borderDash: [5, 5] },
        ], {
            chartTitle: `Normalized Performance on ${workload.toUpperCase()}`,
            xTitle: 'Local DRAM Percentage',
            yTitle: 'Normalized Latency'
        });

        createChart(hitsCtx, 'bar', ['FarSight', 'FastSwap'], [
            { label: 'Prefetch Hits', data: [data.hits.farsight.reduce((a, b) => a + b, 0), data.hits.fastswap.reduce((a, b) => a + b, 0)], backgroundColor: ['#007bff', '#dc3545'] },
        ], {
            chartTitle: `Total Prefetch Hits on ${workload.toUpperCase()}`,
            xTitle: 'Prefetching System',
            yTitle: 'Number of Prefetch Hits'
        });
    };

    const workloadButtons = document.querySelectorAll('.workload-btn');
    workloadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const workload = button.dataset.workload;
            workloadButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            updateCharts(workload);
        });
    });

    const predictButton = document.getElementById('predictButton');
    const predictionOrdinal = document.getElementById('predictionOrdinal');
    const prefetchResult = document.getElementById('prefetchResult');
    const arrow = document.getElementById('arrow');
    const futureMapEntries = document.querySelectorAll('#futureMap li');
    predictButton.addEventListener('click', () => {
        predictButton.disabled = true;
        predictButton.textContent = 'Predicting...';
        predictionOrdinal.textContent = '?';
        prefetchResult.style.opacity = 0;
        futureMapEntries.forEach(entry => entry.classList.remove('bg-warning'));
        arrow.classList.remove('text-success');
        setTimeout(() => {
            const predictedIndex = Math.floor(Math.random() * 3);
            predictionOrdinal.textContent = predictedIndex + 1;
            arrow.classList.add('text-success');
            setTimeout(() => {
                if (futureMapEntries[predictedIndex]) {
                    futureMapEntries[predictedIndex].classList.add('bg-warning');
                    const address = futureMapEntries[predictedIndex].querySelector('code').textContent;
                    prefetchResult.textContent = `Success! Prefetching data from ${address}.`;
                    prefetchResult.style.opacity = 1;
                }
                predictButton.disabled = false;
                predictButton.textContent = 'Run Prediction Again';
            }, 250);
        }, 250);
    });

    const faders = document.querySelectorAll('.fade-in');
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const startBfsBtn = document.getElementById('startBfsBtn');
    const resetBfsBtn = document.getElementById('resetBfsBtn');
    const bfsPathDisplay = document.getElementById('bfs-path-display');
    const bfsGraph = { 'A': [{ node: 'B', label: 1 }, { node: 'C', label: 2 }], 'B': [{ node: 'D', label: 1 }, { node: 'E', label: 2 }], 'C': [{ node: 'F', label: 1 }], 'D': [], 'E': [], 'F': [] };
    const resetBfs = () => {
        document.querySelectorAll('#bfs-visualization .graph-node').forEach(n => n.classList.remove('visited', 'active'));
        document.querySelectorAll('#bfs-visualization .edge').forEach(e => e.classList.remove('active'));
        document.querySelector('#arrowhead-bfs').classList.remove('active');
        bfsPathDisplay.innerHTML = '';
        startBfsBtn.disabled = false;
    };
    const startBfs = async () => {
        resetBfs();
        startBfsBtn.disabled = true;
        const queue = ['A'];
        const visited = new Set(['A']);
        let addressPath = [], semanticPath = [], pointerPath = [], addressResultPath = [];
        document.getElementById('bfs-node-A').classList.add('visited');
        while (queue.length > 0) {
            const currentNodeId = queue.shift();
            addressPath.push(currentNodeId);
            const currentNodeEl = document.getElementById(`bfs-node-${currentNodeId}`);
            currentNodeEl.classList.add('active');
            bfsPathDisplay.innerHTML = `<span>Visiting Node: ${addressPath.join(" → ")}</span>`;
            await sleep(600);
            for (const neighbor of bfsGraph[currentNodeId]) {
                if (!visited.has(neighbor.node)) {
                    visited.add(neighbor.node);
                    queue.push(neighbor.node);
                    semanticPath.push(neighbor.label);
                    pointerPath.push(`${currentNodeId}.ptr${neighbor.label}`);
                    addressResultPath.push(`Addr_${neighbor.node}`);
                    const edgeEl = document.getElementById(`edge-bfs-${currentNodeId}-${neighbor.node}`);
                    if (edgeEl) {
                        edgeEl.classList.add('active');
                        document.querySelector('#arrowhead-bfs').classList.add('active');
                        bfsPathDisplay.innerHTML = `<span>Traversing Edge: ${currentNodeId} → ${neighbor.node} (Ordinal: ${neighbor.label})</span>`;
                        await sleep(800);
                        edgeEl.classList.remove('active');
                        document.querySelector('#arrowhead-bfs').classList.remove('active');
                    }
                    document.getElementById(`bfs-node-${neighbor.node}`).classList.add('visited');
                }
            }
            currentNodeEl.classList.remove('active');
        }
        await sleep(200);
        const finalSemanticText = `<strong>Prediction Sequence: ${semanticPath.join(" → ")}</strong>`;
        const finalPointerText = `<span class="small text-muted">Resolves to Pointer Chain: <code>${pointerPath.join(" → ")}</code></span>`;
        const finalAddressText = `<span class="small text-secondary">Which maps to Memory Addresses: <code>${addressResultPath.join(" → ")}</code></span>`;
        bfsPathDisplay.innerHTML = `<div>${finalSemanticText}<br>${finalPointerText}<br>${finalAddressText}</div>`;
        startBfsBtn.disabled = false;
    };
    startBfsBtn.addEventListener('click', startBfs);
    resetBfsBtn.addEventListener('click', resetBfs);

    const startDijkstraBtn = document.getElementById('startDijkstraBtn');
    const resetDijkstraBtn = document.getElementById('resetDijkstraBtn');
    const dijkstraPathDisplay = document.getElementById('dijkstra-path-display');
    const dijkstraGraph = { 'A': [{ node: 'B', label: 1, weight: 2 }, { node: 'C', label: 2, weight: 1 }], 'B': [{ node: 'D', label: 1, weight: 3 }, { node: 'E', label: 2, weight: 7 }], 'C': [{ node: 'E', label: 1, weight: 3 }, { node: 'G', label: 2, weight: 5 }], 'D': [{ node: 'F', label: 1, weight: 1 }], 'E': [{ node: 'F', label: 1, weight: 4 }, { node: 'G', label: 2, weight: 1 }], 'G': [{ node: 'H', label: 1, weight: 1 }], 'F': [{ node: 'H', label: 1, weight: 2 }], 'H': [] };
    const resetDijkstra = () => {
        document.querySelectorAll('#dijkstra-visualization .graph-node').forEach(e => e.classList.remove('visited', 'active'));
        document.querySelectorAll('#dijkstra-visualization .edge').forEach(e => e.classList.remove('active', 'path'));
        document.querySelector('#arrowhead-dijkstra').classList.remove('active', 'path');
        dijkstraPathDisplay.innerHTML = '';
        startDijkstraBtn.disabled = false;
    };
    const startDijkstra = async () => {
        resetDijkstra();
        startDijkstraBtn.disabled = true;
        const distances = {};
        const prev = {};
        const pq = new Set();
        let semanticPath = [], pointerPath = [], addressResultPath = [];
        Object.keys(dijkstraGraph).forEach(node => {
            distances[node] = Infinity;
            prev[node] = null;
            pq.add(node);
        });
        distances['A'] = 0;
        while (pq.size > 0) {
            let minNode = null;
            pq.forEach(node => { if (minNode === null || distances[node] < distances[minNode]) minNode = node; });
            pq.delete(minNode);
            document.getElementById(`dijkstra-node-${minNode}`).classList.add('visited');
            const currentNodeEl = document.getElementById(`dijkstra-node-${minNode}`);
            currentNodeEl.classList.add('active');
            dijkstraPathDisplay.innerHTML = `<span>Visiting Node: ${minNode} (Cost: ${distances[minNode]})</span>`;
            await sleep(800);
            for (const neighbor of dijkstraGraph[minNode]) {
                if (!pq.has(neighbor.node)) continue;
                let alt = distances[minNode] + neighbor.weight;
                const edgeEl = document.getElementById(`edge-dijkstra-${minNode}-${neighbor.node}`);
                edgeEl.classList.add('active');
                document.querySelector('#arrowhead-dijkstra').classList.add('active');
                dijkstraPathDisplay.innerHTML = `<span>Checking ${minNode} → ${neighbor.node}. New Cost: ${alt}</span>`;
                await sleep(800);
                if (alt < distances[neighbor.node]) {
                    distances[neighbor.node] = alt;
                    prev[neighbor.node] = { from: minNode, label: neighbor.label };
                    semanticPath.push(neighbor.label);
                    pointerPath.push(`${minNode}.ptr${neighbor.label}`);
                    addressResultPath.push(`Addr_${neighbor.node}`);
                    dijkstraPathDisplay.innerHTML = `<span class="text-success">Found shorter path to ${neighbor.node}!</span>`;
                    await sleep(600);
                }
                edgeEl.classList.remove('active');
                document.querySelector('#arrowhead-dijkstra').classList.remove('active');
            }
            currentNodeEl.classList.remove('active');
            if (minNode === 'H') break;
        }
        const finalPath = [];
        let current = 'H';
        while (current) {
            finalPath.unshift(current);
            const p = prev[current];
            current = p ? p.from : null;
        }
        for (let i = 0; i < finalPath.length - 1; i++) {
            const from = finalPath[i];
            const to = finalPath[i + 1];
            const edgeId = `edge-dijkstra-${from}-${to}`;
            const edge = document.getElementById(edgeId);
            if (edge) {
                edge.classList.add('path');
            }
        }
        document.querySelector('#arrowhead-dijkstra').classList.add('path');
        const finalSemanticText = `<strong>Prediction Sequence: ${semanticPath.join(" → ")}</strong>`;
        const finalPointerText = `<span class="small text-muted">Resolves to Pointer Chain: <code>${pointerPath.join(" → ")}</code></span>`;
        const finalAddressText = `<span class="small text-secondary">Which maps to Memory Addresses: <code>${addressResultPath.join(" → ")}</code></span>`;
        dijkstraPathDisplay.innerHTML = `<div>${finalSemanticText}<br>${finalPointerText}<br>${finalAddressText}</div>`;
        startDijkstraBtn.disabled = false;
    };
    startDijkstraBtn.addEventListener('click', startDijkstra);
    resetDijkstraBtn.addEventListener('click', resetDijkstra);

    const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
            if (mutation.attributeName === "class") {
                updateCharts(currentWorkload);
            }
        });
    });
    observer.observe(document.body, { attributes: true });

    updateCharts('mcf');
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        resetBfs();
        resetDijkstra();
    });
});