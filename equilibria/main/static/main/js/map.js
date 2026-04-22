document.addEventListener("DOMContentLoaded", () => {
    const svg = document.getElementById('map-svg');

    document.querySelectorAll('.bar').forEach(bar => {
        const fill = bar.querySelector('.fill')
        const number = document.createElement('div');
        number.className = 'bar-text';
        const value = parseInt(fill.getAttribute('data-value'), 10);
        number.textContent = `${value} / 1000`;
        bar.appendChild(number);

        updateBar(bar.querySelector('.fill'), value);
    });

    function updateBar(fill, newValue) {
        if (!fill) return;


        fill.setAttribute('data-value', newValue);
        const value = parseInt(newValue, 10);
        fill.style.width = Math.min(100, (value / 1000) * 100) + '%';

        const bar = fill.parentElement;
        const number = bar.querySelector('.bar-text');
        if (number) {
            number.textContent = `${value} / 1000`;
        }
    }

    // Loading the SVG map and adding interactive pins etc.
    fetch("/static/main/svg/czech_map.svg")
        .then(resp => resp.text())
        .then(svgText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const externalSvg = doc.querySelector('svg');

            // 1. Calculate Scale while preserving aspect ratio
            const mapViewBox = externalSvg.getAttribute('viewBox').split(/[\s,]+/).map(parseFloat);
            const orgW = mapViewBox[2];
            const orgH = mapViewBox[3];

            // Use the smaller scale factor to prevent deformation
            const scale = Math.min(3508 / orgW, 2480 / orgH);

            // Create a group for the map and apply scaling
            const gMap = document.createElementNS("http://www.w3.org/2000/svg", "g");
            gMap.id = "map-layer";

            // Centering the map if it's smaller than the canvas
            const dx = (3508 - (orgW * scale)) / 2;
            const dy = (2480 - (orgH * scale)) / 2;
            gMap.setAttribute("transform", `translate(${dx}, ${dy}) scale(${scale})`);

            while (externalSvg.firstChild) {
                gMap.appendChild(externalSvg.firstChild);
            }

            // Identify region borders by their fill color and add a class for styling
            const regionBorderColor = "rgb(205,164,86)"
            gMap.querySelectorAll('path, polygon').forEach(p => {
                const fill = p.getAttribute('fill');

                if(fill == regionBorderColor){
                    p.classList.add('region');
                }
            });

            svg.insertBefore(gMap, svg.firstChild);

            const pinsData = [
                {
                    id: 1,
                    name: "Hlavní město Praha", 
                    x: 1225, 
                    y: 1000, 
                },
                {
                    id: 2,
                    name: "Středočeský kraj", 
                    x: 1050, 
                    y: 950, 
                },
                {
                    id: 3,
                    name: "Jihočeský kraj",
                    x: 1150, 
                    y: 1800, 
                },
                {
                    id: 4,
                    name: "Plzeňský kraj",
                    x: 685, 
                    y: 1350, 
                },
                {
                    id: 5,
                    name: "Karlovarský kraj",
                    x: 450, 
                    y: 900,
                },
                {
                    id: 6,
                    name: "Ústecký kraj",
                    x: 975,
                    y: 625,
                },
                {
                    id: 7,
                    name: "Liberecký kraj",
                    x: 1525,
                    y: 500,
                },
                {
                    id: 8,
                    name: "Královéhradecký kraj",
                    x: 1900,
                    y: 900,
                },
                {
                    id: 9,
                    name: "Pardubický kraj",
                    x: 1875,
                    y: 1075,
                },
                {
                    id: 10,
                    name: "Kraj Vysočina", 
                    x: 1825,
                    y: 1575, 
                },
                {
                    id: 11,
                    name: "Jihomoravský kraj", 
                    x: 2325,
                    y: 1700, 
                },
                {
                    id: 12,
                    name: "Olomoucký kraj", 
                    x: 2625,
                    y: 1385, 
                },
                {
                    id: 13,
                    name: "Zlínský kraj", 
                    x: 2850,
                    y: 1650, 
                },
                {
                    id: 14,
                    name: "Moravskoslezský kraj", 
                    x: 3150,
                    y: 1150, 
                }
            ];

            //Field for storing tooltips to add later
            const tooltipsToAdd = [];

            pinsData.forEach(pin => {

                //Problem pins on the map
                const gPin = document.createElementNS("http://www.w3.org/2000/svg","g");
                gPin.classList.add("pin");
                gPin.style.pointerEvents = 'all';

                // Circle part of the pin
                const circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
                circle.setAttribute("cx",0);
                circle.setAttribute("cy",0);
                circle.setAttribute("r",20);
                circle.setAttribute("fill","#b22222");
                gPin.appendChild(circle);

                // Triangle part of the pin
                const triangle = document.createElementNS("http://www.w3.org/2000/svg","polygon");
                triangle.setAttribute("points","-18,9 18,9 0,60");
                triangle.setAttribute("fill","#b22222");
                gPin.appendChild(triangle);

                // Exclamation mark inside the pin
                const exclamation = document.createElementNS("http://www.w3.org/2000/svg","text");
                exclamation.setAttribute("x",0);
                exclamation.setAttribute("y",10);
                exclamation.setAttribute("text-anchor","middle");
                exclamation.setAttribute("dominant-baseline","middle");
                exclamation.setAttribute("font-size","26");
                exclamation.setAttribute("fill","#fff");
                exclamation.textContent = "!";
                gPin.appendChild(exclamation);

                // Initial pin scaling for better visibility
                gPin.setAttribute("transform", `translate(${pin.x},${pin.y}) scale(3)`);

                // Tooltip creation
                const tooltip = document.createElementNS("http://www.w3.org/2000/svg","g");
                tooltip.classList.add("tooltip");
                tooltip.setAttribute("visibility","hidden");

                // Tooltip dimensions and positioning logic
                const WIDTH = 1080;
                const HEIGHT = 720;
                const MARGIN_ABOVE_PIN = 150;
                let tool_tip_x  = pin.x - (WIDTH/2);
                let tool_tip_y = pin.y - (HEIGHT + MARGIN_ABOVE_PIN);

                // Convert SVG coordinates to screen coordinates
                const pt = svg.createSVGPoint();
                pt.x = pin.x;
                pt.y = pin.y;
                const screenPt = pt.matrixTransform(svg.getScreenCTM());

                // Adjust tooltip position if it goes off-screen
                if (screenPt.x + WIDTH/2 > window.innerWidth) {
                    tool_tip_x = pin.x - WIDTH;
                } else if (screenPt.x - WIDTH/2 < 0) {
                    tool_tip_x = pin.x - WIDTH/2 + 20;
                }

                if (pin.y - (HEIGHT + MARGIN_ABOVE_PIN) < 0) {
                    tool_tip_y = pin.y + MARGIN_ABOVE_PIN;
                }

                // Positioning tooltip above the pin
                tooltip.setAttribute("transform", `translate(${tool_tip_x}, ${tool_tip_y})`);

                // Tooltip Background Rectangle
                const rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
                rect.setAttribute("width", WIDTH);
                rect.setAttribute("height", HEIGHT);
                rect.setAttribute("rx",10);
                rect.setAttribute("ry",10);
                rect.setAttribute("fill","rgba(0,0,0,0.95)");
                rect.setAttribute("stroke","#ff6600");
                rect.setAttribute("stroke-width","3");
                tooltip.appendChild(rect);

                // Foreign Object for HTML (Title, Text, and Buttons)
                const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
                foreignObject.setAttribute("x", 10);
                foreignObject.setAttribute("y", 10);
                foreignObject.setAttribute("width", WIDTH - 20);
                foreignObject.setAttribute("height", HEIGHT - 20);
                tooltip.appendChild(foreignObject);

                // HTML content inside Foreign Object
                const htmlContent = document.createElement('div');
                htmlContent.classList.add("tooltip-content-html-" + pin.id);

                // Setting the inner HTML of the tooltip content
                htmlContent.innerHTML = `
                    <h3 class="tooltip-title tooltip-title-${pin.id}"></h3>
                    <p class="tooltip-desc tooltip-desc-${pin.id}"></p>
                    <div class="solution-buttons">
                        <button class="solution-btn btn-${pin.id}"></button>
                        <button class="solution-btn btn-${pin.id}"></button>
                        <button class="solution-btn btn-${pin.id}"></button>
                    </div>
                `;
                foreignObject.appendChild(htmlContent);

                // Event listeners for solution buttons
                htmlContent.querySelectorAll('.solution-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        t.style.visibility = 'hidden';
                        t.style.pointerEvents = 'none';
                        e.stopPropagation();
                    });
                });

                // Pin hover effects
                gPin.addEventListener("mouseenter", () => {
                    gPin.setAttribute("transform", `translate(${pin.x},${pin.y}) scale(3.3)`);
                    gPin.style.filter = "drop-shadow(0 0 15px #fff)";
                });

                // Pin mouse leave effects
                gPin.addEventListener("mouseleave", () => {
                    gPin.setAttribute("transform", `translate(${pin.x},${pin.y}) scale(3)`);
                    gPin.style.filter = "none";
                });


                // Click event to show tooltip
                gPin.addEventListener("click", (e) => {
                    document.querySelectorAll('.tooltip').forEach(t => {
                        t.style.visibility = 'hidden';
                        t.style.pointerEvents = 'none';
                    });
                    tooltip.style.visibility = "visible";
                    tooltip.style.pointerEvents = 'auto';

                    e.stopPropagation();
                });

                gPin.setAttribute("id", pin.id);
                gPin.classList.add("hidden");
                svg.appendChild(gPin);
                
                tooltipsToAdd.push(tooltip);
            });

            tooltipsToAdd.forEach(tooltip => {
                svg.appendChild(tooltip);
            });

            svg.addEventListener("click", () => {
                document.querySelectorAll('.tooltip')
                    .forEach(t => {
                        t.style.visibility = 'hidden';
                        t.style.pointerEvents = 'none';
                    });
            });
        });
    
    const gameId = gameID;
    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${wsScheme}://${window.location.host}/ws/game/play/${gameId}/`);

    socket.onopen = () => console.log("WebSocket connected");

    socket.onmessage = function(e){
        const data = JSON.parse(e.data);

        switch(data.type){
            case "initial_state":
            case "update_state":
                updateIndicators(data.game);
                break;
            case "new_problem":
                displayProblem(data);
                break;
        }

    }

    function updateIndicators(game){
        updateBar(document.getElementById('economy'), game.economy);
        updateBar(document.getElementById('satisfaction'), game.citizen_satisfaction);
        updateBar(document.getElementById('environment'), game.environment);
        updateBar(document.getElementById('military-power'), game.military_power);
    }

    function displayProblem(data){
        const problem = data.problem;
        console.log("New problem in region:", problem.region_id);
        const pin = document.getElementById(problem.region_id);
        if(pin){
            pin.classList.remove("hidden");
            pin.style.pointerEvents = "all";
        }

        document.querySelector(`.tooltip-title-${problem.region_id}`).textContent = problem.title;
        document.querySelector(`.tooltip-desc-${problem.region_id}`).textContent = problem.description;

        const buttons = document.querySelectorAll(`.btn-${problem.region_id}`);
        const solutions = data.solutions;
        buttons.forEach((button, index) => {
            if(solutions && solutions[index]){
                button.textContent = solutions[index].name;
                button.style.display = "inline-block";
                button.onclick = () => sendSolution(solutions[index].id, problem.region_id, pin);
            } else {
                button.style.display = "none";
            }
        });
    }

    function sendSolution(solutionId, regionId, pin){
        socket.send(JSON.stringify({
            "type": "submit_solution",
            "solution_id": solutionId,
            "region_id": regionId
        }));

        pin.style.pointerEvents = "none";
        pin.classList.add("hidden");
    }
});
