document.addEventListener("DOMContentLoaded", () => {
    const svg = document.getElementById('map-svg');
    const startBtn = document.getElementById('start-btn');
    const timerDisplay = document.getElementById('game-timer');

    // --- LOGIKA ČASOVAČE ---
    let seconds = 0;
    let timerInterval = null;
    let isGameRunning = false;

    function updateTimer() {
        seconds++;
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${mins}:${secs}`;
    }

    startBtn.addEventListener('click', () => {
        if (!isGameRunning) {
            isGameRunning = true;
            startBtn.textContent = "GAME RUNNING";
            startBtn.classList.add('active');
            timerInterval = setInterval(updateTimer, 1000);
            console.log("Simulace byla úspěšně spuštěna.");
            
            // Zde můžeš přidat spuštění dynamiky hry (např. klesání barů)
        }
    });

    // --- INICIALIZACE STATUS BARŮ ---
    document.querySelectorAll('.bar').forEach(bar => {
        const fill = bar.querySelector('.fill');
        if (!fill) return;

        const value = parseInt(fill.getAttribute('data-value'), 10);
        // Animace naplnění po načtení
        setTimeout(() => {
            fill.style.width = Math.min(100, (value / 1000) * 100) + '%';
        }, 300);

        const number = document.createElement('div');
        number.className = 'bar-text';
        number.textContent = `${value} / 1000`;
        bar.appendChild(number);
    });

    // --- NAČTENÍ A ZPRACOVÁNÍ MAPY ---
    fetch("/static/main/svg/czech_map.svg")
        .then(resp => resp.text())
        .then(svgText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const externalSvg = doc.querySelector('svg');

            const viewBox = externalSvg.getAttribute('viewBox').split(/[\s,]+/).map(parseFloat);
            const orgW = viewBox[2];
            const orgH = viewBox[3];

            const scale = Math.min(3508 / orgW, 2480 / orgH);

            const gMap = document.createElementNS("http://www.w3.org/2000/svg", "g");
            gMap.id = "map-layer";

            const dx = (3508 - (orgW * scale)) / 2;
            const dy = (2480 - (orgH * scale)) / 2;
            gMap.setAttribute("transform", `translate(${dx}, ${dy}) scale(${scale})`);

            while (externalSvg.firstChild) {
                gMap.appendChild(externalSvg.firstChild);
            }

            const regionBorderColor = "rgb(205,164,86)";
            gMap.querySelectorAll('path, polygon').forEach(p => {
                const fill = p.getAttribute('fill');
                if(fill == regionBorderColor){
                    p.classList.add('region');
                    p.removeAttribute('fill'); 
                }
            });

            svg.insertBefore(gMap, svg.firstChild);

            // --- KOMPLETNÍ DATA VŠECH 14 KRAJŮ ---
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

            const tooltipsList = [];

            pinsData.forEach(pin => {
                // Vytvoření grupy pro Pin
                const gPin = document.createElementNS("http://www.w3.org/2000/svg","g");
                gPin.classList.add("pin");
                gPin.style.pointerEvents = 'all';

                // Pulzující radarová aura
                const radar = document.createElementNS("http://www.w3.org/2000/svg","circle");
                radar.classList.add("radar");
                radar.setAttribute("cx", 0);
                radar.setAttribute("cy", 0);
                radar.setAttribute("r", 20);
                gPin.appendChild(radar);

                // Hlavní bod pinu
                const center = document.createElementNS("http://www.w3.org/2000/svg","circle");
                center.setAttribute("cx", 0);
                center.setAttribute("cy", 0);
                center.setAttribute("r", 10);
                center.setAttribute("fill", "#58a6ff");
                center.setAttribute("stroke", "#ffffff");
                center.setAttribute("stroke-width", "2");
                gPin.appendChild(center);

                // Ikona vykřičníku
                const icon = document.createElementNS("http://www.w3.org/2000/svg","text");
                icon.setAttribute("x", 0);
                icon.setAttribute("y", 1);
                icon.setAttribute("text-anchor", "middle");
                icon.setAttribute("dominant-baseline", "middle");
                icon.setAttribute("font-size", "12");
                icon.setAttribute("fill", "#fff");
                icon.setAttribute("font-weight", "bold");
                icon.style.pointerEvents = "none";
                icon.textContent = "!";
                gPin.appendChild(icon);

                // Pozicování a měřítko pinu
                gPin.setAttribute("transform", `translate(${pin.x},${pin.y}) scale(4)`);

                // Vytvoření Tooltipu
                const tooltip = document.createElementNS("http://www.w3.org/2000/svg","g");
                tooltip.classList.add("tooltip");
                
                const W = 1300;
                const H = 800;
                const MARGIN = 220;
                
                tooltip.setAttribute("transform", `translate(${pin.x - W/2}, ${pin.y - H - MARGIN})`);

                const rect = document.createElementNS("http://www.w3.org/2000/svg","rect");
                rect.setAttribute("width", W);
                rect.setAttribute("height", H);
                tooltip.appendChild(rect);

                const fo = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
                fo.setAttribute("width", W);
                fo.setAttribute("height", H);
                tooltip.appendChild(fo);

                const div = document.createElement('div');
                div.className = 'tooltip-content-html';
                
                const buttonHTML = pin.solutions.map(s => 
                    `<button class="solution-btn" data-id="${s.id}">${s.text}</button>`
                ).join('');

                div.innerHTML = `
                    <h3 class="tooltip-title">${pin.name}</h3>
                    <p class="tooltip-desc">${pin.desc}</p>
                    <div class="solution-buttons">
                        ${buttonHTML}
                    </div>
                `;
                fo.appendChild(div);

                // Logika interakce
                gPin.onclick = (e) => {
                    document.querySelectorAll('.tooltip').forEach(t => t.style.visibility = 'hidden');
                    tooltip.style.visibility = "visible";
                    tooltip.style.pointerEvents = 'auto';
                    e.stopPropagation();
                };

                // Přidání do SVG
                svg.appendChild(gPin);
                tooltipsList.push(tooltip);
            });

            // Přidání tooltipů navrch
            tooltipsList.forEach(t => svg.appendChild(t));

            // Zavření tooltipu při kliku mimo
            svg.onclick = () => {
                document.querySelectorAll('.tooltip').forEach(t => {
                    t.style.visibility = 'hidden';
                    t.style.pointerEvents = 'none';
                });
            };
        });
});