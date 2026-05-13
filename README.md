# 2025-3e-Equilibria
- Autoři: Adam Hruška, Tobiáš Černek a Vojtěch Macek
- Třída: 3.E
- Školní rok: 2025/2026

## 1. Instalace a spuštění projektu
Na svém počítači otevřete terminál Git Bash a zadejte pomocí příkazu cd se přesuňte do složky, ve které chcete projekt mít uchovaný a poté zadejte tento příkaz:

```
git clone https://github.com/gyarab/2025-3e-Equilibria.git
```

Poté se případně přihlaste na svůj GitHub účet a dokončete klonování. Dále postupně jeden za druhým zadejte tyto příkazy:

```
cd 2025-3e-Equilibria/
bash initialize_project.txt
```

Druhému příkazu dejte čas a pokud poslední řádka v terminále obsahuje "Listening on TCP address 127.0.0.1:8000" tak otevřete prohlížeč a do vyhledávání zadejte:
"localhost:8000"

### Další zapínání projektu
Pokaždé co znovu otevřete projekt v terminálu dojeďte do složky projektu a zadejte postupně:

```
source venv/Scripts/activate
bash start_commands.txt
```

Poté v rámci jedné session můžete server znovu zapnout (pokud například spadnul) použijte ve složce projektu tento příkaz:

```
bash start_server.txt
```

## 2. Popis projektu

Equilibria je interaktivní strategický simulační nástroj, který přibližuje rozhodovací procesy ve státě prostřednictvím strategických voleb a jejich dopadů.
Hráč se ocitá v roli představitele státu a postupně čelí sérii dilemat a událostí, které ovlivňují fungování společnosti. Každé rozhodnutí, které učiní, má své důsledky krátkodobé i dlouhodobé a mění stav klíčových ukazatelů státu.

Hlavní myšlenkou projektu je ukázat, že vedení státu není otázkou jediného správného řešení, ale neustálého hledání rovnováhy mezi různými zájmy a hodnotami. Hra tak propojuje principy strategie, logického myšlení a společenského vzdělávání.

## 3. Cíle projektu a přínos pro výuku
Ukázat komplexnost rozhodovacích procesů ve veřejné správě a politice. Rozvíjet u hráčů schopnost analyzovat důsledky svých voleb a uvažovat v širších souvislostech. Podporovat zájem studentů o společenské dění, ekonomii, ekologii a občanské vzdělávání. Vytvořit moderní digitální nástroj, který může být využitelný ve výuce společenských věd nebo dějepisu.

Hra nabízí učitelům interaktivní způsob, jak přiblížit žákům principy rozhodování, kompromisu a rovnováhy ve společnosti. Lze ji využít pro skupinové diskuse, reflexi jednotlivých voleb a analýzu dopadů rozhodnutí.
Studenti si hravou formou rozvíjejí dovednosti v oblasti logického myšlení, týmové spolupráce a argumentace. Projekt spojuje technické a humanitní přístupy podporuje nejen programátorské a designérské schopnosti, ale i společenskou gramotnost.

## 4. Podrobný popis fungování hry
### Základní princip:
Hráč vstupuje do role lídra jednoho státu (např. České republiky) a jeho úkolem je udržet zemi v rovnováze během série kol. V průběhu hry se pravidelně objevují nové výzvy, kterým musí uživatel čelit, některé výzvy stihne vyřešit, jiné však propadnou, avšak budou mít vliv na ukazatele hry. Může jít například o ekonomickou krizi, ekologickou reformu, stávku učitelů nebo mezinárodní spor. Hráč má na výběr obvykle tři možnosti, z nichž každá jinak ovlivní tři hlavní ukazatele hry:

-  **Rozpočet** – finanční stabilita státu, schopnost investovat a reagovat na krize.

-  **Spokojenost občanů** – celková důvěra a podpora obyvatel.

-  **Ekologie a udržitelnost** - kvalita životního prostředí a dlouhodobé dopady politik.

-  **Vojenská vybavenost státu** - celková vybavenost státu proti vnějším či vnitřním hrozbám.

Po každém rozhodnutí se hodnoty ukazatelů změní. Hráč tak musí neustále vyvažovat své kroky (například opatření, které zvýší spokojenost občanů, může zhoršit stav rozpočtu nebo poškodit ekologii). Pokud některý z ukazatelů klesne na kriticky nízkou úroveň, může dojít k krizi (např. ekonomický kolaps, ztráta důvěry, ekologická katastrofa). V takovém případě hra končí. Důležitým prvkem v rozhodování má i čas, který určuje, kdy dané rozhodnutí vstoupí v platnost, nebo kdy daný problém se stává neřešitelným a má přímý dopad na ukazatele hry.

### Cíl simulace:
Cílem hry je udržet rovnováhu všech tří ukazatelů co nejdelší dobu
