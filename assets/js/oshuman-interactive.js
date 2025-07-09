document.addEventListener('DOMContentLoaded', () => {
    /////// FIRST CHART
    const csvData = `Application,Screenshot,Action,Planning,Reflection,Retrieval,Grounding
    Calc,1.43%,1.33%,52.61%,37.77%,2.76%,4.09%
    VLC,3.77%,1.88%,61.99%,16.65%,9.32%,6.39%
    Multi-Apps,1.22%,1.94%,52.86%,37.65%,2.96%,3.37%
    Chrome,1.65%,1.75%,53.51%,37.11%,2.37%,3.61%
    VS Code,2.29%,1.56%,61.35%,26.04%,4.17%,4.58%
    OS,2.14%,1.53%,53.27%,36.53%,2.55%,3.98%
    Impress,1.78%,1.57%,57.80%,31.31%,3.66%,3.87%
    Writer,1.32%,1.72%,52.18%,40.12%,1.52%,3.14%
    Thunderbird,1.13%,2.36%,55.19%,35.35%,1.85%,4.11%
    GIMP,1.00%,0.90%,49.00%,45.29%,0.70%,3.11%`;

    /**
     * Replaces d3.csvParse.
     * Parses a CSV string into an array of objects.
     */
    function parseCsv(csv) {
        const lines = csv.trim().split('\n');
        const headers = lines.shift().split(',');
        const data = lines.map(line => {
            const values = line.split(',');
            const obj = {};
            headers.forEach((header, i) => {
                if (header === "Application") {
                    obj[header] = values[i];
                } else {
                    obj[header] = parseFloat(values[i].replace('%', '')) || 0;
                }
            });
            return obj;
        });
        data.columns = headers;
        return data;
    }

    const data = parseCsv(csvData);
    const keys = data.columns.slice(1);

    // Color palette to replace d3.schemeTableau10
    const colors = [
        '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
        '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'
    ];
    const colorMap = new Map(keys.map((key, i) => [key, colors[i % colors.length]]));

    const svg = document.querySelector("#app-breakdown-chart");
    const tooltip = document.querySelector("#app-breakdown-tooltip");
    const legend = document.querySelector("#app-breakdown-legend");
    const chartContainer = document.querySelector("#app-breakdown-chart-container");
    const SVG_NS = "http://www.w3.org/2000/svg";

    function drawChart() {
        // Clear previous renders
        svg.innerHTML = '';
        legend.innerHTML = '';

        const margin = { top: 20, right: 30, bottom: 80, left: 60 };
        const width = chartContainer.clientWidth - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        svg.setAttribute("width", width + margin.left + margin.right);
        svg.setAttribute("height", height + margin.top + margin.bottom);

        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute("transform", `translate(${margin.left},${margin.top})`);
        svg.appendChild(g);

        // --- Scales ---
        // Replaces d3.scaleLinear
        const scaleY = (value) => height - (value / 100) * height;
        // Replaces d3.scaleBand
        const bandWidth = width / data.length;
        const padding = 0.3;
        const barWidth = bandWidth * (1 - padding);
        const scaleX = (appName) => {
            const index = data.findIndex(d => d.Application === appName);
            return index * bandWidth + (bandWidth * padding / 2);
        };

        // --- Draw Y-axis ---
        const yAxis = document.createElementNS(SVG_NS, 'g');
        yAxis.setAttribute("class", "axis y-axis");
        // Draw axis line
        const yAxisLine = document.createElementNS(SVG_NS, 'path');
        yAxisLine.setAttribute('d', `M0,0 V${height}`);
        yAxisLine.setAttribute('stroke', '#ccc');
        yAxis.appendChild(yAxisLine);
        // Draw ticks and labels
        for (let i = 0; i <= 100; i += 20) {
            const yPos = scaleY(i);
            const tick = document.createElementNS(SVG_NS, 'line');
            tick.setAttribute('x1', -5);
            tick.setAttribute('x2', 0);
            tick.setAttribute('y1', yPos);
            tick.setAttribute('y2', yPos);
            tick.setAttribute('stroke', '#ccc');
            yAxis.appendChild(tick);

            const label = document.createElementNS(SVG_NS, 'text');
            label.setAttribute('x', -10);
            label.setAttribute('y', yPos);
            label.setAttribute('dy', '0.32em');
            label.setAttribute('text-anchor', 'end');
            label.textContent = `${i}%`;
            yAxis.appendChild(label);
        }
        g.appendChild(yAxis);

        // --- Draw X-axis ---
        const xAxis = document.createElementNS(SVG_NS, 'g');
        xAxis.setAttribute("class", "axis x-axis");
        xAxis.setAttribute("transform", `translate(0,${height})`);
        // Draw axis line
        const xAxisLine = document.createElementNS(SVG_NS, 'path');
        xAxisLine.setAttribute('d', `M0,0 H${width}`);
        xAxisLine.setAttribute('stroke', '#ccc');
        xAxis.appendChild(xAxisLine);
        // Draw labels
        data.forEach(d => {
            const xPos = scaleX(d.Application) + barWidth / 2;
            const label = document.createElementNS(SVG_NS, 'text');
            label.setAttribute('x', xPos);
            label.setAttribute('y', 15);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('transform', `translate(15, 5) rotate(-35, ${xPos}, 15)`);
            label.textContent = d.Application;
            xAxis.appendChild(label);
        });
        g.appendChild(xAxis);

        // --- Draw Stacked Bars ---
        // Replaces d3.stack
        data.forEach(d => {
            let yOffset = 0;
            keys.forEach(key => {
                const value = d[key];
                if (value === 0) return;

                const rect = document.createElementNS(SVG_NS, 'rect');
                rect.setAttribute('x', scaleX(d.Application));
                rect.setAttribute('y', scaleY(yOffset + value));
                rect.setAttribute('width', barWidth);
                rect.setAttribute('height', (value / 100) * height);
                rect.setAttribute('fill', colorMap.get(key));
                rect.classList.add('bar-segment');
                
                // Store data in attributes for event handling
                rect.dataset.key = key;
                rect.dataset.value = value.toFixed(2);
                rect.dataset.application = d.Application;

                g.appendChild(rect);
                yOffset += value;
            });
        });
        
        // --- Legend ---
        keys.forEach(key => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.dataset.key = key;
            item.style.color = "black";

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = colorMap.get(key);

            const label = document.createElement('span');
            label.className = 'legend-label';
            label.textContent = key;
            
            item.appendChild(colorBox);
            item.appendChild(label);
            legend.appendChild(item);
        });

        // --- Interactivity ---
        const allSegments = document.querySelectorAll('.bar-segment');
        const allLegendItems = document.querySelectorAll('.legend-item');

        const handleMouseOver = (event) => {
            const hoveredKey = event.currentTarget.dataset.key;
            
            allSegments.forEach(seg => {
                seg.style.opacity = seg.dataset.key === hoveredKey ? '1' : '0.2';
            });
            allLegendItems.forEach(leg => {
                leg.style.opacity = leg.dataset.key === hoveredKey ? '1' : '0.5';
            });
            
            // Show tooltip only if hovering a bar segment
            if (event.currentTarget.classList.contains('bar-segment')) {
                const value = event.currentTarget.dataset.value;
                tooltip.style.opacity = '1';
                tooltip.innerHTML = `${hoveredKey}: <strong style="color: white">${value}%</strong>`;
            }
        };
        
        const handleMouseOut = () => {
            allSegments.forEach(seg => seg.style.opacity = '1');
            allLegendItems.forEach(leg => leg.style.opacity = '1');
            tooltip.style.opacity = '0';
        };

        const handleMouseMove = (event) => {
            tooltip.style.left = (event.pageX + 15) + 'px';
            tooltip.style.top = (event.pageY - 10) + 'px';
        };
        
        allSegments.forEach(seg => {
            seg.addEventListener('mouseover', handleMouseOver);
            seg.addEventListener('mouseout', handleMouseOut);
            seg.addEventListener('mousemove', handleMouseMove);
        });

        allLegendItems.forEach(leg => {
            leg.addEventListener('mouseover', handleMouseOver);
            leg.addEventListener('mouseout', handleMouseOut);
        });
    }

    // Initial draw and resize handler
    drawChart();
    // window.addEventListener('resize', drawChart);
// });
// document.addEventListener("DOMContentLoaded", function() {

/////////////////////////////////////////////////////////////// NEXT CHART

   // --- Data ---
    const sg_dataString = `Application,Single Action,Grouped Action
    Calc,13.2,4.5
    VLC,5.1,3.7
    Chrome,5.8,4.3
    VS Code,3.6,2.0
    OS,3.9,2.0
    Impress,7.8,4.0
    Writer,7.5,3.2
    Thunderbird,6.7,3.8
    GIMP,2.8,2.01`;

    // 1. Parse data string manually
    const sg_lines = sg_dataString.trim().split('\n');
    const sg_header = sg_lines[0].split(',');
    const sg_data = sg_lines.slice(1).map(sg_line => {
        const sg_values = sg_line.split(',');
        return {
            [sg_header[0]]: sg_values[0],
            [sg_header[1]]: +sg_values[1],
            [sg_header[2]]: +sg_values[2]
        };
    });

    const sgChartContainer = document.querySelector("#sg-chart-container");

    // --- Chart Dimensions ---
    const sg_margin = {top: 20, right: 30, bottom: 80, left: 60};
    const sg_width = sgChartContainer.clientWidth - sg_margin.left - sg_margin.right;
    const sg_height = 500 - sg_margin.top - sg_margin.bottom;

    // --- SVG and Chart Group ---
    const sg_svgNS = "http://www.w3.org/2000/svg";
    const sg_container = document.getElementById("sg-chart-container");

    const sg_svg = document.createElementNS(sg_svgNS, "svg");
    sg_svg.setAttribute("width", sg_width + sg_margin.left + sg_margin.right);
    sg_svg.setAttribute("height", sg_height + sg_margin.top + sg_margin.bottom);

    const sg_g = document.createElementNS(sg_svgNS, "g");
    sg_g.setAttribute("transform", `translate(${sg_margin.left},${sg_margin.top})`);
    
    // --- Data Keys ---
    const sg_subgroups = ["Single Action", "Grouped Action"];
    const sg_groups = sg_data.map(d => d.Application);

    // --- Replicate D3 Scales with Vanilla JS ---

    // 2. Y Scale (Linear)
    const sg_yMax = Math.max(...sg_data.map(d => Math.max(d["Single Action"], d["Grouped Action"])));
    const niceYMax = Math.ceil(sg_yMax / 5) * 5; 
    
    function sg_yScale(sg_value) {
        return sg_height - (sg_value / niceYMax) * sg_height;
    }
    
    // 3. X0 Scale (Band for application groups)
    const sg_x0Padding = 0.2;
    const sg_x0Step = sg_width / sg_groups.length;
    const sg_x0Bandwidth = sg_x0Step * (1 - sg_x0Padding);

    function sg_x0Scale(sg_groupName) {
        const sg_index = sg_groups.indexOf(sg_groupName);
        return sg_index * sg_x0Step;
    }

    // 4. X1 Scale (Band for subgroups)
    const sg_x1Padding = 0.05;
    const sg_x1Step = sg_x0Bandwidth / sg_subgroups.length;
    const sg_x1Bandwidth = sg_x1Step * (1 - sg_x1Padding);

    function sg_x1Scale(sg_subgroupName) {
        const sg_index = sg_subgroups.indexOf(sg_subgroupName);
        return sg_index * sg_x1Step + (sg_x1Step * sg_x1Padding / 2);
    }
    
    // 5. Color Scale (Ordinal)
    const sg_colorMap = {
        "Single Action": '#1f77b4',
        "Grouped Action": '#ff7f0e'
    };
    function sg_colorScale(sg_subgroupName) {
        return sg_colorMap[sg_subgroupName];
    }
    
    // --- Tooltip ---
    const sg_tooltip = document.createElement("div");
    sg_tooltip.id = "tooltip";
    sg_tooltip.style.position = 'absolute';
    sg_tooltip.style.opacity = '0';
    sg_tooltip.style.backgroundColor = 'rgba(0,0,0,0.7)';
    sg_tooltip.style.color = 'white';
    sg_tooltip.style.padding = '5px 10px';
    sg_tooltip.style.borderRadius = '3px';
    sg_tooltip.style.pointerEvents = 'none';
    document.body.appendChild(sg_tooltip);


    // --- Mouse Events ---
    function sg_mouseover(sg_event, sg_key) {
        sg_tooltip.style.opacity = 1;
        document.querySelectorAll(`.sg-bar`).forEach(sg_bar => {
            sg_bar.style.opacity = sg_bar.dataset.key === sg_key ? '1' : '0.2';
        });
        document.querySelectorAll(`.sg-legend-item`).forEach(sg_leg => {
            sg_leg.style.opacity = sg_leg.dataset.key === sg_key ? '1' : '0.5';
        });
    }

    function sg_mousemove(sg_event, sg_key, sg_value) {
        sg_tooltip.innerHTML = `<strong style="color: white">${sg_key}</strong><br>Steps: ${sg_value}`;
        sg_tooltip.style.left = (sg_event.pageX + 15) + "px";
        sg_tooltip.style.top = (sg_event.pageY - 28) + "px";
    }
    
    function sg_mouseleave() {
        sg_tooltip.style.opacity = 0;
        document.querySelectorAll(`.sg-bar`).forEach(sg_bar => {
            sg_bar.style.opacity = 1;
        });
        document.querySelectorAll(`.sg-legend-item`).forEach(sg_leg => {
            sg_leg.style.opacity = 1;
        });
    }

    // --- Draw Bars ---
    sg_data.forEach(sg_d => {
        const sg_groupName = sg_d.Application;
        const sg_groupX = sg_x0Scale(sg_groupName) + (sg_x0Step * sg_x0Padding / 2);

        sg_subgroups.forEach(sg_key => {
            const sg_value = sg_d[sg_key];
            const sg_bar = document.createElementNS(sg_svgNS, "rect");
            
            const sg_x = sg_groupX + sg_x1Scale(sg_key);
            const sg_y = sg_yScale(sg_value);

            sg_bar.setAttribute("x", sg_x);
            sg_bar.setAttribute("y", sg_y);
            sg_bar.setAttribute("width", sg_x1Bandwidth);
            sg_bar.setAttribute("height", sg_height - sg_y);
            sg_bar.setAttribute("fill", sg_colorScale(sg_key));
            
            const sg_keyClass = sg_key.replace(/\s+/g, '-');
            sg_bar.classList.add("sg-bar", sg_keyClass);
            sg_bar.dataset.key = sg_key; 
            sg_bar.dataset.value = sg_value;
            
            sg_bar.addEventListener("mouseover", (sg_e) => sg_mouseover(sg_e, sg_key));
            sg_bar.addEventListener("mousemove", (sg_e) => sg_mousemove(sg_e, sg_key, sg_value));
            sg_bar.addEventListener("mouseleave", sg_mouseleave);

            sg_g.appendChild(sg_bar);
        });
    });

    // --- Draw Axes ---
    const sg_xAxis = document.createElementNS(sg_svgNS, "g");
    sg_xAxis.setAttribute("transform", `translate(0, ${sg_height})`);
    
    const sg_xAxisLine = document.createElementNS(sg_svgNS, "path");
    sg_xAxisLine.setAttribute("d", `M0,0 H${sg_width}`);
    sg_xAxisLine.setAttribute("stroke", "#333");
    sg_xAxisLine.setAttribute("fill", "none");
    sg_xAxis.appendChild(sg_xAxisLine);

    sg_groups.forEach(sg_groupName => {
        const sg_x = sg_x0Scale(sg_groupName) + sg_x0Bandwidth / 2 + (sg_x0Step * sg_x0Padding / 2);
        const sg_text = document.createElementNS(sg_svgNS, "text");
        sg_text.setAttribute("x", sg_x);
        sg_text.setAttribute("y", 10);
        sg_text.textContent = sg_groupName;
        sg_text.classList.add("tick-text");
        sg_text.style.textAnchor = "end";
        sg_text.setAttribute("transform", `translate(15, 5) rotate(-35 ${sg_x} 10)`);
        sg_xAxis.appendChild(sg_text);
    });

    const sg_yAxis = document.createElementNS(sg_svgNS, "g");
    const sg_yAxisLine = document.createElementNS(sg_svgNS, "path");
    sg_yAxisLine.setAttribute("d", `M0,0 V${sg_height}`);
    sg_yAxisLine.setAttribute("stroke", "#333");
    sg_yAxisLine.setAttribute("fill", "none");
    sg_yAxis.appendChild(sg_yAxisLine);
    
    const tickIncrement = 2.5;
    for (let tickValue = 0; tickValue <= niceYMax; tickValue += tickIncrement) {
        if (tickValue > niceYMax) continue;
        const sg_y = sg_yScale(tickValue);

        // ---- MODIFICATION: The following block that created the grid lines has been removed. ----
        /*
        // Grid line
        const sg_tickLine = document.createElementNS(sg_svgNS, "line");
        sg_tickLine.setAttribute("x1", 0);
        sg_tickLine.setAttribute("x2", sg_width); 
        sg_tickLine.setAttribute("y1", sg_y);
        sg_tickLine.setAttribute("y2", sg_y);
        sg_tickLine.setAttribute("stroke", "#eee");
        if(tickValue > 0) sg_yAxis.appendChild(sg_tickLine);
        */
       
        const sg_text = document.createElementNS(sg_svgNS, "text");
        sg_text.setAttribute("x", -10);
        sg_text.setAttribute("y", sg_y); 
        sg_text.setAttribute("dy", "0.32em");
        sg_text.textContent = tickValue.toFixed(1);
        sg_text.classList.add("tick-text");
        sg_text.style.textAnchor = "end";
        sg_yAxis.appendChild(sg_text);
    }
    
    sg_g.appendChild(sg_xAxis);
    sg_g.appendChild(sg_yAxis);

    const sg_yLabel = document.createElementNS(sg_svgNS, "text");
    sg_yLabel.setAttribute("text-anchor", "middle");
    sg_yLabel.setAttribute("transform", "rotate(-90)");
    sg_yLabel.setAttribute("y", -sg_margin.left + 13);
    sg_yLabel.setAttribute("x", -sg_height / 2);
    sg_yLabel.classList.add("axis-label");
    sg_yLabel.textContent = "Steps";
    sg_g.appendChild(sg_yLabel);

    // --- Draw Legend ---
    const sg_legend = document.createElement("div");
    sg_legend.style.display = "flex";
    sg_legend.style.justifyContent = "center";
    sg_legend.style.gap = "20px";
    sg_legend.style.color = "black";
    sg_legend.style.fontFamily = "sans-serif";
    // ---- MODIFICATION: Changed margin to be on the bottom to space it from the chart ----
    sg_legend.style.marginBottom = "10px";

    sg_subgroups.forEach(key => {
        const item = document.createElement('div');
        item.className = 'sg-legend-item';
        item.dataset.key = key;
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.cursor = 'default';
        item.style.color = "black";
        item.style.transition = 'opacity 0.2s';
    
        const colorBox = document.createElement('div');
        colorBox.style.width = '12px';
        colorBox.style.height = '12px';
        colorBox.style.backgroundColor = sg_colorMap[key];
        colorBox.style.marginRight = '5px';

        const label = document.createElement('span');
        label.textContent = key;
        
        item.appendChild(colorBox);
        item.appendChild(label);
        sg_legend.appendChild(item);

        item.addEventListener("mouseover", (e) => sg_mouseover(e, key));
        item.addEventListener("mouseleave", sg_mouseleave);
    });

    // --- Append elements to the DOM ---
    // ---- MODIFICATION: Appended legend first, then the SVG, to place legend on top ----
    sg_container.appendChild(sg_legend); 
    sg_svg.appendChild(sg_g);
    sg_container.appendChild(sg_svg);


///////////////////////////////////////////////////////////////// NEXT CHART

    // --- DATA AND CONFIGURATION ---

    const result_scatter_rawData = [
        { observation: 'Screenshot (SS)', baseline: 'UI-TARS-1.5 (100)', original: 42.5, single_wes_plus: 23.7, grouped_wes_plus: 14.3, wes_minus: -0.22 },
        { observation: 'Screenshot (SS)', baseline: 'Agent S2 w/ Gemini 2.5 (50)', original: 41.4, single_wes_plus: 28.2, grouped_wes_plus: 17.4, wes_minus: -0.26 },
        { observation: 'Screenshot (SS)', baseline: 'InfantAgent (50)', original: 35.3, single_wes_plus: 13.3, grouped_wes_plus: 8.2, wes_minus: -0.22 },
        { observation: 'Screenshot (SS)', baseline: 'Agent S2 w/ Claude 3.7 (50)', original: 34.5, single_wes_plus: 20.0, grouped_wes_plus: 11.4, wes_minus: -0.42 },
        { observation: 'Screenshot (SS)', baseline: 'UI-TARS-1.5 7B (100)', original: 26.9, single_wes_plus: 12.4, grouped_wes_plus: 7.9, wes_minus: -0.33 },
        { observation: 'Screenshot (SS)', baseline: 'UI-TARS-72B-DPO (50)', original: 24.6, single_wes_plus: 15.6, grouped_wes_plus: 10.6, wes_minus: -0.16 },
        { observation: 'A11y Tree', baseline: 'GPT-4 (15)', original: 12.2, single_wes_plus: 8.6, grouped_wes_plus: 6.1, wes_minus: -0.29 },
        { observation: 'A11y Tree', baseline: 'GPT-4o (15)', original: 11.4, single_wes_plus: 5.5, grouped_wes_plus: 3.5, wes_minus: -0.19 },
        { observation: 'A11y Tree', baseline: 'Qwen-Max (15)', original: 6.9, single_wes_plus: 4.2, grouped_wes_plus: 2.4, wes_minus: -0.36 },
        { observation: 'A11y Tree', baseline: 'Gemini-Pro-1.5 (15)', original: 4.8, single_wes_plus: 2.7, grouped_wes_plus: 1.8, wes_minus: -0.49 },
        { observation: 'A11y Tree', baseline: 'Llama-3-70B (15)', original: 1.6, single_wes_plus: 0.4, grouped_wes_plus: 0.3, wes_minus: -0.70 },
        { observation: 'SS + A11y Tree', baseline: 'GPT-4V (15)', original: 12.2, single_wes_plus: 8.5, grouped_wes_plus: 5.7, wes_minus: -0.46 },
        { observation: 'SS + A11y Tree', baseline: 'GPT-4o (15)', original: 11.2, single_wes_plus: 6.7, grouped_wes_plus: 4.2, wes_minus: -0.26 },
        { observation: 'SS + A11y Tree', baseline: 'Gemini-Pro-1.5 (15)', original: 5.1, single_wes_plus: 2.1, grouped_wes_plus: 1.3, wes_minus: -0.59 },
        { observation: 'Set-of-Mark', baseline: 'GPT-4V (15)', original: 11.8, single_wes_plus: 6.9, grouped_wes_plus: 4.5, wes_minus: -0.44 },
        { observation: 'Set-of-Mark', baseline: 'Gemini-Pro Vision (15)', original: 1.1, single_wes_plus: 0.5, grouped_wes_plus: 0.3, wes_minus: -0.72 },
    ];

    const result_scatter_observationColors = {
        'Screenshot (SS)': '#8884d8',
        'A11y Tree': '#82ca9d',
        'SS + A11y Tree': '#ffc658',
        'Set-of-Mark': '#ff7300',
    };

    const result_scatter_plotConfigs = {
        single: { yKey: 'single_wes_plus', name: 'Single WES+ (%)', color: '#3b82f6', yDomain: [0, 30], yTicks: [0, 10, 20, 30] },
        grouped: { yKey: 'grouped_wes_plus', name: 'Grouped WES+ (%)', color: '#16a34a', yDomain: [0, 30], yTicks: [0, 10, 20, 30] },
        wes_minus: { yKey: 'wes_minus', name: 'WES-', color: '#ef4444', yDomain: [-1, 0], yTicks: [-1.0, -0.8, -0.6, -0.4, -0.2, 0] },
    };
    const result_scatter_xDomain = [0, 50];
    const result_scatter_xTicks = [0, 10, 20, 30, 40, 50];

    let result_scatter_activePlot = 'single';

    // --- VANILLA JS CHART RENDERING ---

    const result_scatter_chartContainer = document.getElementById("oswh-result-scatter-chart-area");
    const result_scatter_tooltip = document.querySelector(".oswh-result-scatter-tooltip") || (()=>{
        const newTooltip = document.createElement("div");
        newTooltip.className = "oswh-result-scatter-tooltip";
        document.body.appendChild(newTooltip);
        return newTooltip;
    })();


    function result_scatter_createSvgElement(tag) {
        return document.createElementNS("http://www.w3.org/2000/svg", tag);
    }

    function result_scatter_renderChart() {
        result_scatter_chartContainer.innerHTML = '';
        const result_scatter_currentConfig = result_scatter_plotConfigs[result_scatter_activePlot];
        const result_scatter_containerRect = result_scatter_chartContainer.getBoundingClientRect();
        const result_scatter_containerWidth = result_scatter_containerRect.width;
        const result_scatter_containerHeight = result_scatter_containerRect.height;
        const result_scatter_margin = { top: 40, right: 40, bottom: 80, left: 60 };
        const result_scatter_width = result_scatter_containerWidth - result_scatter_margin.left - result_scatter_margin.right;
        const result_scatter_height = result_scatter_containerHeight - result_scatter_margin.top - result_scatter_margin.bottom;

        const result_scatter_svg = result_scatter_createSvgElement("svg");
        result_scatter_svg.setAttribute("width", result_scatter_containerWidth);
        result_scatter_svg.setAttribute("height", result_scatter_containerHeight);
        result_scatter_svg.id = "oswh-result-scatter-svg";

        const result_scatter_mainGroup = result_scatter_createSvgElement("g");
        result_scatter_mainGroup.setAttribute("transform", `translate(${result_scatter_margin.left},${result_scatter_margin.top})`);
        result_scatter_svg.appendChild(result_scatter_mainGroup);

        const result_scatter_xScale = (value) => ((value - result_scatter_xDomain[0]) / (result_scatter_xDomain[1] - result_scatter_xDomain[0])) * result_scatter_width;
        const result_scatter_yScale = (value) => result_scatter_height - ((value - result_scatter_currentConfig.yDomain[0]) / (result_scatter_currentConfig.yDomain[1] - result_scatter_currentConfig.yDomain[0])) * result_scatter_height;

        result_scatter_xTicks.forEach(tick => {
            const result_scatter_x = result_scatter_xScale(tick);
            const result_scatter_line = result_scatter_createSvgElement('line');
            result_scatter_line.setAttribute('x1', result_scatter_x);
            result_scatter_line.setAttribute('y1', 0);
            result_scatter_line.setAttribute('x2', result_scatter_x);
            result_scatter_line.setAttribute('y2', result_scatter_height);
            result_scatter_line.setAttribute('stroke', '#e0e0e0');
            result_scatter_line.setAttribute('stroke-dasharray', '3 3');
            result_scatter_mainGroup.appendChild(result_scatter_line);
        });
        result_scatter_currentConfig.yTicks.forEach(tick => {
            const result_scatter_y = result_scatter_yScale(tick);
            const result_scatter_line = result_scatter_createSvgElement('line');
            result_scatter_line.setAttribute('x1', 0);
            result_scatter_line.setAttribute('y1', result_scatter_y);
            result_scatter_line.setAttribute('x2', result_scatter_width);
            result_scatter_line.setAttribute('y2', result_scatter_y);
            result_scatter_line.setAttribute('stroke', '#e0e0e0');
            result_scatter_line.setAttribute('stroke-dasharray', '3 3');
            result_scatter_mainGroup.appendChild(result_scatter_line);
        });

        const result_scatter_xAxisGroup = result_scatter_createSvgElement('g');
        result_scatter_xAxisGroup.setAttribute('transform', `translate(0, ${result_scatter_height})`);
        result_scatter_xTicks.forEach(tick => {
            const result_scatter_x = result_scatter_xScale(tick);
            const result_scatter_tickLabel = result_scatter_createSvgElement('text');
            result_scatter_tickLabel.setAttribute('x', result_scatter_x);
            result_scatter_tickLabel.setAttribute('y', 20);
            result_scatter_tickLabel.setAttribute('text-anchor', 'middle');
            result_scatter_tickLabel.setAttribute('fill', '#6b7280');
            result_scatter_tickLabel.textContent = tick;
            result_scatter_xAxisGroup.appendChild(result_scatter_tickLabel);
        });
        result_scatter_mainGroup.appendChild(result_scatter_xAxisGroup);

        const result_scatter_yAxisGroup = result_scatter_createSvgElement('g');
        result_scatter_currentConfig.yTicks.forEach(tick => {
            const result_scatter_y = result_scatter_yScale(tick);
            const result_scatter_tickLabel = result_scatter_createSvgElement('text');
            result_scatter_tickLabel.setAttribute('x', -10);
            result_scatter_tickLabel.setAttribute('y', result_scatter_y);
            result_scatter_tickLabel.setAttribute('dy', '0.32em');
            result_scatter_tickLabel.setAttribute('text-anchor', 'end');
            result_scatter_tickLabel.setAttribute('fill', '#6b7280');
            result_scatter_tickLabel.textContent = tick;
            result_scatter_yAxisGroup.appendChild(result_scatter_tickLabel);
        });
        result_scatter_mainGroup.appendChild(result_scatter_yAxisGroup);

        const result_scatter_xAxisLabel = result_scatter_createSvgElement('text');
        result_scatter_xAxisLabel.setAttribute('text-anchor', 'middle');
        result_scatter_xAxisLabel.setAttribute('x', result_scatter_width / 2);
        result_scatter_xAxisLabel.setAttribute('y', result_scatter_height + 50);
        result_scatter_xAxisLabel.style.fill = '#4b5563';
        result_scatter_xAxisLabel.style.fontSize = '14px';
        result_scatter_xAxisLabel.textContent = 'Original Success Rate (%)';
        result_scatter_mainGroup.appendChild(result_scatter_xAxisLabel);

        const result_scatter_yAxisLabel = result_scatter_createSvgElement('text');
        result_scatter_yAxisLabel.setAttribute('text-anchor', 'middle');
        result_scatter_yAxisLabel.setAttribute('transform', `translate(${-result_scatter_margin.left + 20}, ${result_scatter_height / 2}) rotate(-90)`);
        result_scatter_yAxisLabel.style.fill = '#4b5563';
        result_scatter_yAxisLabel.style.fontSize = '14px';
        result_scatter_yAxisLabel.textContent = result_scatter_currentConfig.name;
        result_scatter_mainGroup.appendChild(result_scatter_yAxisLabel);

        result_scatter_rawData.forEach(d => {
            const result_scatter_circle = result_scatter_createSvgElement('circle');
            result_scatter_circle.setAttribute('cx', result_scatter_xScale(d.original));
            result_scatter_circle.setAttribute('cy', result_scatter_yScale(d[result_scatter_currentConfig.yKey]));
            result_scatter_circle.setAttribute('r', 6);
            result_scatter_circle.style.fill = result_scatter_observationColors[d.observation];
            result_scatter_circle.style.opacity = 0.8;
            result_scatter_circle.style.cursor = 'pointer';

            result_scatter_circle.addEventListener('mouseover', (event) => {
                result_scatter_tooltip.style.opacity = 0.9;
                result_scatter_tooltip.innerHTML = `
                    <p class="font-bold">${d.baseline}</p>
                    <p class="text-gray-600">Original (%): <span class="font-medium">${d.original}</span></p>
                    <p class="text-gray-600">${result_scatter_currentConfig.name}: <span class="font-medium">${d[result_scatter_currentConfig.yKey]}</span></p>`;
                result_scatter_tooltip.style.left = `${event.pageX + 15}px`;
                result_scatter_tooltip.style.top = `${event.pageY - 28}px`;
            });
            result_scatter_circle.addEventListener('mouseout', () => {
                result_scatter_tooltip.style.opacity = 0;
            });
            result_scatter_mainGroup.appendChild(result_scatter_circle);
        });

        // --- LEGEND RENDERING (POSITIONED AT TOP) ---
        const result_scatter_legendContainer = result_scatter_createSvgElement('g');
        const result_scatter_legendItems = Object.keys(result_scatter_observationColors);
        const result_scatter_itemWidth = 130; // Estimated width for each legend item
        const result_scatter_totalLegendWidth = result_scatter_legendItems.length * result_scatter_itemWidth;
        const result_scatter_startX = (result_scatter_width - result_scatter_totalLegendWidth) / 2;

        result_scatter_legendItems.forEach((name, i) => {
            const result_scatter_legendGroup = result_scatter_createSvgElement('g');
            // Position each item relative to the start of the legend block
            const result_scatter_xPos = i * result_scatter_itemWidth;
            result_scatter_legendGroup.setAttribute('transform', `translate(${result_scatter_xPos}, 0)`);

            const result_scatter_rect = result_scatter_createSvgElement('rect');
            result_scatter_rect.setAttribute('x', 0);
            result_scatter_rect.setAttribute('y', -6); // Center the rect vertically
            result_scatter_rect.setAttribute('width', 12);
            result_scatter_rect.setAttribute('height', 12);
            result_scatter_rect.style.fill = result_scatter_observationColors[name];
            result_scatter_legendGroup.appendChild(result_scatter_rect);

            const result_scatter_text = result_scatter_createSvgElement('text');
            result_scatter_text.setAttribute('x', 20);
            result_scatter_text.setAttribute('y', 0);
            result_scatter_text.setAttribute('dy', '0.35em'); // Vertically center text
            result_scatter_text.style.fontSize = '12px';
            result_scatter_text.style.fill = '#4b5563';
            result_scatter_text.textContent = name;
            result_scatter_legendGroup.appendChild(result_scatter_text);
            
            result_scatter_legendContainer.appendChild(result_scatter_legendGroup);
        });

        // Position the entire container group at the top of the chart area
        result_scatter_legendContainer.setAttribute('transform', `translate(${result_scatter_startX}, -20)`);
        result_scatter_mainGroup.appendChild(result_scatter_legendContainer);


        result_scatter_chartContainer.appendChild(result_scatter_svg);
    }

    // --- UI AND EVENT LISTENERS ---

    function result_scatter_updateButtonStyles() {
        const result_scatter_buttons = {
            single: document.getElementById('oswh-result-scatter-btn-single'),
            grouped: document.getElementById('oswh-result-scatter-btn-grouped'),
            wes_minus: document.getElementById('oswh-result-scatter-btn-wes-minus'),
        };

        for (const plotKey in result_scatter_buttons) {
            const result_scatter_button = result_scatter_buttons[plotKey];
            // Reset classes
            result_scatter_button.className = '';
            if (plotKey === result_scatter_activePlot) {
                result_scatter_button.classList.add(`oswh-result-scatter-btn-active-${plotKey}`);
            } else {
                result_scatter_button.classList.add(`oswh-result-scatter-btn-inactive-${plotKey}`);
            }
        }
    }

    document.getElementById('oswh-result-scatter-btn-single').addEventListener('click', () => { result_scatter_activePlot = 'single'; result_scatter_updateButtonStyles(); result_scatter_renderChart(); });
    document.getElementById('oswh-result-scatter-btn-grouped').addEventListener('click', () => { result_scatter_activePlot = 'grouped'; result_scatter_updateButtonStyles(); result_scatter_renderChart(); });
    document.getElementById('oswh-result-scatter-btn-wes-minus').addEventListener('click', () => { result_scatter_activePlot = 'wes_minus'; result_scatter_updateButtonStyles(); result_scatter_renderChart(); });
    
    result_scatter_updateButtonStyles();
    result_scatter_renderChart();
    window.addEventListener('resize', result_scatter_renderChart);
});