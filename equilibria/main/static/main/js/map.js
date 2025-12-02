document.addEventListener("DOMContentLoaded", () => {
    const svg = document.getElementById('map-svg');

    // 1️⃣ Animace status barů
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

    // 2️⃣ Načtení SVG mapy a vytvoření pinů
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

            // ... (kód pro gMap a paths zůstává) ...

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
                    x: 1800, 
                    y: 1550, 
                    desc: "Problém Jihočeský: Kůrovcová kalamita v lesích a nutnost jejich obnovy.",
                    solutions: [
                        { text: "Těžba a sanace", id: "SAN_JHC" },
                        { text: "Výsadba smíšených lesů", id: "LES_JHC" },
                        { text: "Ekologická opatření", id: "EKO_JHC" }
                    ]
                },
                {
                    name: "Plzeňský",
                    x: 1200, 
                    y: 1150, 
                    desc: "Problém Plzeňský: Zvýšená nezaměstnanost v pohraničních oblastech a odliv mladých lidí.",
                    solutions: [
                        { text: "Podpora malého podnikání", id: "POD_PLZ" },
                        { text: "Rekvalifikační kurzy", id: "REK_PLZ" },
                        { text: "Investice do průmyslu", id: "INV_PLZ" }
                    ]
                }
            ];

            // 1. Pole pro sběr tooltipů
            const tooltipsToAdd = [];

            pinsData.forEach(pin => {

                // === SKUPINA PINU ===
                const gPin = document.createElementNS("http://www.w3.org/2000/svg","g");
                gPin.classList.add("pin");
                gPin.style.pointerEvents = 'all';

                // Kruh
                const circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
                circle.setAttribute("cx",0);
                circle.setAttribute("cy",0);
                circle.setAttribute("r",20);
                circle.setAttribute("fill","#b22222");
                gPin.appendChild(circle);

                // Trojúhelník (ocásek)
                const triangle = document.createElementNS("http://www.w3.org/2000/svg","polygon");
                triangle.setAttribute("points","-18,9 18,9 0,60");
                triangle.setAttribute("fill","#b22222");
                gPin.appendChild(triangle);

                // Vykřičník
                const exclamation = document.createElementNS("http://www.w3.org/2000/svg","text");
                exclamation.setAttribute("x",0);
                exclamation.setAttribute("y",10);
                exclamation.setAttribute("text-anchor","middle");
                exclamation.setAttribute("dominant-baseline","middle");
                exclamation.setAttribute("font-size","26");
                exclamation.setAttribute("fill","#fff");
                exclamation.textContent = "!";
                gPin.appendChild(exclamation);

                // --- POČÁTEČNÍ TRANSFORMACE ---
                gPin.setAttribute("transform", `translate(${pin.x},${pin.y}) scale(3)`);


                // === TOOLTIP ===
                const tooltip = document.createElementNS("http://www.w3.org/2000/svg","g");
                tooltip.classList.add("tooltip");
                tooltip.setAttribute("visibility","hidden");

                const WIDTH = 560;
                const HEIGHT = 360;
                const MARGIN_ABOVE_PIN = 150;

                // UPRAVENÁ POZICE A VĚTŠÍ ROZMĚR TOOLTIPU (šířka 280, výška 180)
                tooltip.setAttribute("transform", `translate(${pin.x - (WIDTH/2)}, ${pin.y - (HEIGHT + MARGIN_ABOVE_PIN)})`);

                // 1. SVG Pozadí (větší)
                const rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
                rect.setAttribute("width", WIDTH); // Nová šířka
                rect.setAttribute("height", HEIGHT); // Nová výška
                rect.setAttribute("rx",10);
                rect.setAttribute("ry",10);
                rect.setAttribute("fill","rgba(0,0,0,0.95)");
                rect.setAttribute("stroke","#ff6600");
                rect.setAttribute("stroke-width","3");
                tooltip.appendChild(rect);

                // 2. Foreign Object pro HTML (Nadpis, Text a Tlačítka)
                const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
                foreignObject.setAttribute("x", 10);
                foreignObject.setAttribute("y", 10);
                foreignObject.setAttribute("width", WIDTH - 20);
                foreignObject.setAttribute("height", HEIGHT - 20);
                tooltip.appendChild(foreignObject);

                // 3. HTML obsah
                const htmlContent = document.createElement('div');
                htmlContent.classList.add('tooltip-content-html');

                // Generování tlačítek z datové struktury
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

                // *** Listener pro tlačítka (vzor pro interaktivitu) ***
                htmlContent.querySelectorAll('.solution-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        // Zde můžete implementovat logiku řešení, např. odeslání dat
                        console.log(`Kliknuto na řešení pro ${pin.name}: ${button.textContent} (ID: ${button.dataset.solutionId})`);
                        e.stopPropagation(); // Zabrání zavření tooltipu po kliku na tlačítko
                    });
                });


                // === HOVER EFEKT ===
                gPin.addEventListener("mouseenter", () => {
                    gPin.setAttribute("transform", `translate(${pin.x},${pin.y}) scale(3.3)`);
                    gPin.style.filter = "drop-shadow(0 0 15px #fff)";
                });

                gPin.addEventListener("mouseleave", () => {
                    gPin.setAttribute("transform", `translate(${pin.x},${pin.y}) scale(3)`);
                    gPin.style.filter = "none";
                });


                // === CLICK PRO ZOBRAZENÍ TOOLTIPU ===
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

            // 4. AŽ ZDE, po přidání všech pinů, přidáme všechny tooltipy
            // Tím zajistíme, že jsou "navrchu"
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
