document.addEventListener("DOMContentLoaded", () => {
    const svg = document.getElementById('map-svg');

    document.querySelectorAll('.bar').forEach(bar => {
        const fill = bar.querySelector('.fill');
        if (!fill) return;

        const value = parseInt(fill.getAttribute('data-value'), 10);
        fill.style.width = Math.min(100, (value / 1000) * 100) + '%';

        const number = document.createElement('div');
        number.className = 'bar-text';
        number.textContent = `${value} / 1000`;
        bar.appendChild(number);
    });

    // Loading the SVG map and adding interactive pins etc.
    fetch("/static/main/svg/Cesko-kraje.svg")
        .then(resp => resp.text())
        .then(svgText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const paths = doc.querySelectorAll('path, polygon');

            const gMap = document.createElementNS("http://www.w3.org/2000/svg","g");
            paths.forEach(p => {
                p.classList.add('region');
                gMap.appendChild(p);
            });
            svg.appendChild(gMap);

            const pinsData = [
                {
                    name: "Praha", 
                    x: 2600, 
                    y: 720, 
                    desc: "Problém v Praze: Vysoké znečištění ovzduší a dopravy v centru města.",
                    solutions: [
                        { text: "Zóna bez emisí", id: "ZBE_PRG" },
                        { text: "Rozšířit MHD", id: "MHD_PRG" },
                        { text: "Monitorovat smog", id: "SMG_PRG" }
                    ]
                },
                {
                    name: "Středočeský", 
                    x: 2450, 
                    y: 950, 
                    desc: "Problém Středočeský: Nedostatečná infrastruktura a zásobování vodou v suchých oblastech.",
                    solutions: [
                        { text: "Nový vodovod", id: "VOD_STC" },
                        { text: "Dotace na studny", id: "DOT_STC" },
                        { text: "Změnit územní plán", id: "UZP_STC" }
                    ]
                },
                {
                    name: "Jihočeský",
                    x: 950, 
                    y: 1350, 
                    desc: "Problém Jihočeský: Kůrovcová kalamita v lesích a nutnost jejich obnovy.",
                    solutions: [
                        { text: "Těžba a sanace", id: "SAN_JHC" },
                        { text: "Výsadba smíšených lesů", id: "LES_JHC" },
                        { text: "Ekologická opatření", id: "EKO_JHC" }
                    ]
                },
                {
                    name: "Plzeňský",
                    x: 685, 
                    y: 800, 
                    desc: "Problém Plzeňský: Zvýšená nezaměstnanost v pohraničních oblastech a odliv mladých lidí.",
                    solutions: [
                        { text: "Podpora malého podnikání", id: "POD_PLZ" },
                        { text: "Rekvalifikační kurzy", id: "REK_PLZ" },
                        { text: "Investice do průmyslu", id: "INV_PLZ" }
                    ]
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

                const WIDTH = 560;
                const HEIGHT = 360;
                const MARGIN_ABOVE_PIN = 150;

                // Positioning tooltip above the pin
                tooltip.setAttribute("transform", `translate(${pin.x - (WIDTH/2)}, ${pin.y - (HEIGHT + MARGIN_ABOVE_PIN)})`);

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
                htmlContent.classList.add('tooltip-content-html');

                // Generating buttons from data structure
                const buttonHTML = pin.solutions.map(sol => 
                    `<button class="solution-btn" data-solution-id="${sol.id}">${sol.text}</button>`
                ).join('');

                htmlContent.innerHTML = `
                    <h3 class="tooltip-title">${pin.name}</h3>
                    <p class="tooltip-desc">${pin.desc}</p>
                    <div class="solution-buttons">
                        ${buttonHTML}
                    </div>
                `;
                foreignObject.appendChild(htmlContent);

                // Event listeners for solution buttons
                htmlContent.querySelectorAll('.solution-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        console.log(`Kliknuto na řešení pro ${pin.name}: ${button.textContent} (ID: ${button.dataset.solutionId})`);
                        e.stopPropagation(); 
                    });
                });


                // Pin hover effects
                gPin.addEventListener("mouseenter", () => {
                    gPin.setAttribute("transform", `translate(${pin.x},${pin.y}) scale(3.3)`);
                    gPin.style.filter = "drop-shadow(0 0 15px #fff)";
                });

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
});
