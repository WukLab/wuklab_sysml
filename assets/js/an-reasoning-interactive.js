document.addEventListener('DOMContentLoaded', function () {
    // --- Interactive Latency Chart ---
    const chartData = [
        {
            title: 'Long Tasks',
            models: [
                { name: 'o3-DR', reasoning: 28, webSearch: 5, answerGen: 67 },
                { name: 'GPT-5', reasoning: 15, webSearch: 73, answerGen: 12 },
                { name: 'LangChain-DR', reasoning: 30, webSearch: 50, answerGen: 20 },
            ]
        },
        {
            title: 'Short Tasks',
            models: [
                { name: 'o3-DR', reasoning: 50, webSearch: 5, answerGen: 45 },
                { name: 'GPT-5', reasoning: 28, webSearch: 55, answerGen: 17 },
                { name: 'LangChain-DR', reasoning: 30, webSearch: 40, answerGen: 30 },
            ]
        }
    ];

    const latencyChart = document.getElementById('anr-latencyChart');
    const tooltip = document.getElementById('anr-chartTooltip');

    if (latencyChart && tooltip) {
        chartData.forEach(taskType => {
            const groupEl = document.createElement('div');
            groupEl.innerHTML = `<h3 class="text-xl font-semibold text-white mb-4">${taskType.title}</h3>`;
            
            taskType.models.forEach(model => {
                const modelEl = document.createElement('div');
                modelEl.className = 'flex items-center mb-2';
                modelEl.innerHTML = `<div class="w-32 text-right mr-4 text-white">${model.name}</div>`;
                
                const barContainer = document.createElement('div');
                barContainer.className = 'flex w-full h-8 bg-gray-700 rounded-md overflow-hidden';
                
                const segments = [
                    { type: 'Reasoning', value: model.reasoning, color: 'bg-red-500' },
                    { type: 'Web Search', value: model.webSearch, color: 'bg-blue-500' },
                    { type: 'Answer Gen', value: model.answerGen, color: 'bg-black' },
                ];

                segments.forEach(seg => {
                    if (seg.value > 0) {
                        const segEl = document.createElement('div');
                        segEl.className = `chart-bar-segment ${seg.color}`;
                        segEl.style.width = `${seg.value}%`;
                        segEl.dataset.tooltip = `${seg.type}: ${seg.value}%`;
                        barContainer.appendChild(segEl);

                        segEl.addEventListener('mousemove', (e) => {
                            tooltip.style.visibility = 'visible';
                            tooltip.style.opacity = '1';
                            tooltip.textContent = segEl.dataset.tooltip;
                            tooltip.style.left = `${e.pageX + 15}px`;
                            tooltip.style.top = `${e.pageY - 10}px`;
                        });
                        segEl.addEventListener('mouseleave', () => {
                            tooltip.style.visibility = 'hidden';
                            tooltip.style.opacity = '0';
                        });
                    }
                });

                modelEl.appendChild(barContainer);
                groupEl.appendChild(modelEl);
            });
            latencyChart.appendChild(groupEl);
        });
    }

    // --- Timeline Visualization ---
    const timelineContainer = document.getElementById('timelineVisualization');
    const colorMap = { r: 'bg-red-500', w: 'bg-blue-500', a: 'bg-black' };

    const timelineSystems = [
        { 
            name: 'o3-DR', 
            duration: 300,
            events: (() => {
                const events = [];
                let time = 0;
                for (let i = 0; i < 55; i++) {
                    const reasoningDuration = Math.random() * 3 + 1;
                    const searchDuration = Math.random() * 2 + 0.5;
                    if (time + reasoningDuration + searchDuration > 220) break;
                    events.push({ t: 'r', s: time, d: reasoningDuration, y: i * 1.8 });
                    time += reasoningDuration;
                    events.push({ t: 'w', s: time, d: searchDuration, y: i * 1.8 + 1 });
                    time += searchDuration;
                }
                events.push({ t: 'a', s: 220, d: 80, y: 0, h: 100 });
                return events;
            })()
        },
        { 
            name: 'GPT-5', 
            duration: 220,
            events: [
                { t: 'r', s: 0, d: 8, y: 5 },
                { t: 'w', s: 8, d: 20, y: 12 },
                { t: 'r', s: 28, d: 8, y: 20 },
                { t: 'w', s: 36, d: 40, y: 28 },
                { t: 'r', s: 76, d: 5, y: 40 },
                { t: 'w', s: 81, d: 55, y: 48 },
                { t: 'r', s: 136, d: 5, y: 60 },
                { t: 'w', s: 141, d: 45, y: 68 },
                { t: 'r', s: 186, d: 10, y: 80 },
                { t: 'a', s: 196, d: 24, y: 0, h: 100 }
            ]
        },
        {
            name: 'LangChain-DR',
            duration: 150,
            events: [
                { t: 'r', s: 0, d: 15, y: 5 },
                { t: 'w', s: 15, d: 25, y: 15 },
                { t: 'w', s: 18, d: 35, y: 30 },
                { t: 'w', s: 21, d: 30, y: 45 },
                { t: 'r', s: 55, d: 40, y: 55 },
                { t: 'w', s: 95, d: 20, y: 65 },
                { t: 'w', s: 98, d: 25, y: 80 },
                { t: 'a', s: 125, d: 25, y: 0, h: 100 }
            ]
        }
    ];
    
    if (timelineContainer) {
        timelineSystems.forEach(system => {
            const systemWrapper = document.createElement('div');
            
            const header = document.createElement('div');
            header.className = "flex items-center text-gray-300 mb-2";
            header.innerHTML = `<div class="w-32 text-right mr-4 font-semibold">${system.name}</div><div class="flex-1 text-xs text-gray-500">Time (s)</div>`;
            
            const timelineEl = document.createElement('div');
            timelineEl.className = 'w-full h-28 bg-gray-900/50 rounded-md relative';
            timelineEl.style.height = '120px';

            const timeMarkers = document.createElement('div');
            timeMarkers.className = 'absolute top-0 left-0 w-full h-full flex justify-between text-xs text-gray-600';
            for(let i = 0; i <= 4; i++) {
                const time = Math.round(system.duration / 4 * i);
                timeMarkers.innerHTML += `<div class="flex flex-col items-center h-full w-px bg-gray-700/50"><span class="mt-1">${time}</span></div>`;
            }
            timelineEl.appendChild(timeMarkers);

            system.events.forEach(event => {
                const eventEl = document.createElement('div');
                const left = (event.s / system.duration) * 100;
                const width = (event.d / system.duration) * 100;
                eventEl.className = `absolute rounded-sm ${colorMap[event.t]} opacity-90`;
                eventEl.style.left = `${left}%`;
                eventEl.style.width = `${width}%`;
                eventEl.style.top = `${event.y}%`;
                eventEl.style.height = `${event.h || (event.t === 'a' ? 100 : 8)}%`;
                if (event.t === 'a') {
                    eventEl.classList.add('border-l-2', 'border-gray-500');
                }
                timelineEl.appendChild(eventEl);
            });

            systemWrapper.appendChild(header);
            systemWrapper.appendChild(timelineEl);
            timelineContainer.appendChild(systemWrapper);
        });
    }

    // --- Token Cost Calculator ---
    const slider = document.getElementById('tokenSlider');
    const sliderValue = document.getElementById('sliderValue');
    const estimatedTokens = document.getElementById('estimatedTokens');
    const estimatedCost = document.getElementById('estimatedCost');

    function updateTokenCost() {
        if (!slider) return;
        const webTokens = parseInt(slider.value);
        
        const baseCost = 0.15;
        const costPerMillionTokens = 0.40;
        
        const baseTokens = 5000;
        const tokensPerMillionWeb = 4000;

        const finalTokens = baseTokens + (webTokens / 1000000) * tokensPerMillionWeb;
        const finalCost = baseCost + (webTokens / 1000000) * costPerMillionTokens;

        sliderValue.textContent = (webTokens / 1000000).toFixed(2) + 'M';
        estimatedTokens.textContent = '~' + Math.round(finalTokens).toLocaleString();
        estimatedCost.textContent = `~$${finalCost.toFixed(2)}`;
    }
    
    if (slider) {
        slider.addEventListener('input', updateTokenCost);
        updateTokenCost(); // Initial call
    }
});