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
                    name: "Hlavní město Praha", 
                    x: 1225, 
                    y: 1000, 
                    desc: "Problém v Praze: Vysoké znečištění ovzduší a dopravy v centru města.",
                    solutions: [
                        { text: "Zóna bez emisí", id: "ZBE_PRG" },
                        { text: "Rozšířit MHD", id: "MHD_PRG" },
                        { text: "Monitorovat smog", id: "SMG_PRG" }
                    ]
                },
                {
                    name: "Středočeský kraj", 
                    x: 1050, 
                    y: 950, 
                    desc: "Problém Středočeský kraj: Nedostatečná infrastruktura a zásobování vodou v suchých oblastech.",
                    solutions: [
                        { text: "Nový vodovod", id: "VOD_STC" },
                        { text: "Dotace na studny", id: "DOT_STC" },
                        { text: "Změnit územní plán", id: "UZP_STC" }
                    ]
                },
                {
                    name: "Jihočeský kraj",
                    x: 1150, 
                    y: 1800, 
                    desc: "Problém Jihočeský kraj: Kůrovcová kalamita v lesích a nutnost jejich obnovy.",
                    solutions: [
                        { text: "Těžba a sanace", id: "SAN_JHC" },
                        { text: "Výsadba smíšených lesů", id: "LES_JHC" },
                        { text: "Ekologická opatření", id: "EKO_JHC" }
                    ]
                },
                {
                    name: "Plzeňský kraj",
                    x: 685, 
                    y: 1350, 
                    desc: "Problém Plzeňský kraj: Zvýšená nezaměstnanost v pohraničních oblastech a odliv mladých lidí.",
                    solutions: [
                        { text: "Podpora malého podnikání", id: "POD_PLZ" },
                        { text: "Rekvalifikační kurzy", id: "REK_PLZ" },
                        { text: "Investice do průmyslu", id: "INV_PLZ" }
                    ]
                },
                {
                    name: "Karlovarský kraj",
                    x: 450, 
                    y: 900,
                    desc: "Problém Karlovarský kraj: Pokles lázeňství a turistického ruchu v regionu.",
                    solutions: [
                        { text: "Marketingová kampaň", id: "MKT_KVK" },
                        { text: "Podpora lázeňství", id: "POD_KVK" },
                        { text: "Zlepšení infrastruktury", id: "INF_KVK" }
                    ]
                },
                {
                    name: "Ústecký kraj",
                    x: 975,
                    y: 625,
                    desc: "Problém Ústecký kraj: Vysoká míra znečištění ovzduší a zdravotní problémy obyvatel.",
                    solutions: [
                        { text: "Snížení emisí z průmyslu", id: "EMI_USK" },
                        { text: "Zalesňování", id: "ZAL_USK" },
                        { text: "Zdravotní programy", id: "ZDR_USK" }
                    ]
                },
                {
                    name: "Liberecký kraj",
                    x: 1525,
                    y: 500,
                    desc: "Problém Liberecký kraj: Nedostatečná dopravní infrastruktura a spojení s okolními regiony.",
                    solutions: [
                        { text: "Modernizace silnic", id: "SIL_LIB" },
                        { text: "Zlepšení veřejné dopravy", id: "VER_LIB" },
                        { text: "Podpora cyklostezek", id: "CYK_LIB" }
                    ]
                },
                {
                    name: "Královéhradecký kraj",
                    x: 1900,
                    y: 900,
                    desc: "Problém Královéhradecký kraj: Nedostatek pracovních příležitostí pro mladé lidi v regionu.",
                    solutions: [
                        { text: "Podpora startupů", id: "STU_KHK" },
                        { text: "Vzdělávací programy", id: "VZD_KHK" },
                        { text: "Spolupráce s firmami", id: "FIR_KHK" }
                    ]
                },
                {
                    name: "Pardubický kraj",
                    x: 1875,
                    y: 1075,
                    desc: "Problém Pardubický kraj: Znečištění řeky Labe a jeho dopady na ekosystém.",
                    solutions: [
                        { text: "Čištění řeky", id: "CIS_PCE" },
                        { text: "Ochrana přírody", id: "OCH_PCE" },
                        { text: "Vzdělávací kampaně", id: "VZD_PCE" }
                    ]
                },
                {
                    name: "Kraj Vysočina", 
                    x: 1825,
                    y: 1575, 
                    desc: "Problém Kraj Vysočina: Stárnutí populace a nedostatek zdravotnických služeb v odlehlých oblastech.",
                    solutions: [
                        { text: "Mobilní kliniky", id: "MOB_VYS" },
                        { text: "Podpora mladých lékařů", id: "POD_VYS" },
                        { text: "Zlepšení dopravy", id: "DOP_VYS" }
                    ]
                },
                {
                    name: "Jihomoravský kraj", 
                    x: 2325,
                    y: 1700, 
                    desc: "Problém Jihomoravský kraj: Znečištění ovzduší a dopravní zácpy v Brně.",
                    solutions: [
                        { text: "Rozšíření MHD", id: "MHD_JMK" },
                        { text: "Podpora cyklistiky", id: "CYK_JMK" },
                        { text: "Zelené zóny", id: "ZEL_JMK" }
                    ]
                },
                {
                    name: "Olomoucký kraj", 
                    x: 2625,
                    y: 1385, 
                    desc: "Problém Olomoucký kraj: Vysoká nezaměstnanost a odliv mladých lidí z regionu.",
                    solutions: [
                        { text: "Podpora podnikání", id: "POD_OLK" },
                        { text: "Vzdělávací programy", id: "VZD_OLK" },
                        { text: "Zlepšení infrastruktury", id: "INF_OLK" }
                    ]
                },
                {
                    name: "Zlínský kraj", 
                    x: 2850,
                    y: 1650, 
                    desc: "Problém Zlínský kraj: Nedostatečná podpora malých a středních podniků v regionu.",
                    solutions: [
                        { text: "Podpora podnikání", id: "POD_ZLK" },
                        { text: "Vzdělávací programy", id: "VZD_ZLK" },
                        { text: "Zlepšení infrastruktury", id: "INF_ZLK" }
                    ]
                },
                {
                    name: "Moravskoslezský kraj", 
                    x: 3150,
                    y: 1150, 
                    desc: "Problém Moravskoslezský kraj: Vysoká míra znečištění ovzduší a zdravotní problémy obyvatel.",
                    solutions: [
                        { text: "Snížení emisí", id: "SNI_MSK" },
                        { text: "Zlepšení zdravotní péče", id: "ZDR_MSK" },
                        { text: "Podpora ekologických technologií", id: "EKO_MSK" }
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
