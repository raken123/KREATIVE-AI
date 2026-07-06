import { Template } from "../types";

export const TEMPLATES: Template[] = [
  // DOCUMENT TEMPLATES
  {
    id: "doc-blank",
    name: "Tomt dokument",
    description: "Starta från grunden med ett tomt papper.",
    type: "document",
    isPremium: false,
    content: {
      markdown: "# Mitt Nya Dokument\n\nBörja skriva här...",
    },
  },
  {
    id: "doc-project-plan",
    name: "Projektplan",
    description: "Strukturerad mall för milstolpar, mål och tidslinjer.",
    type: "document",
    isPremium: true,
    content: {
      markdown: `# Projektplan: [Projektnamn]\n\n## 1. Bakgrund & Syfte\nBeskriv kortfattat varför projektet initieras och vilket problem det löser.\n\n## 2. Projektmål\n- **Mål 1:** Konkret mätbart mål\n- **Mål 2:** Konkret mätbart mål\n\n## 3. Omfattning (Scope)\nVad som ingår och framför allt vad som *inte* ingår i projektet.\n\n## 4. Tidslinje & Milstolpar\n| Milstolpe | Beskrivning | Deadline |\n| :--- | :--- | :--- |\n| M1 | Kick-off & Planering | Vecka 1 |\n| M2 | Design & Prototyp | Vecka 4 |\n| M3 | Utveckling & Test | Vecka 8 |\n| M4 | Lansering | Vecka 10 |\n\n## 5. Riskanalys\nIdentifiera potentiella risker och hur de ska hanteras.`,
    },
  },
  {
    id: "doc-meeting-notes",
    name: "Mötesprotokoll",
    description: "Fånga beslut, diskussionspunkter och att-göra-listor.",
    type: "document",
    isPremium: false,
    content: {
      markdown: `# Mötesprotokoll: [Mötesrubrik]\n\n**Datum:** 2026-07-01  \n**Deltagare:** [Namn 1], [Namn 2]  \n**Syfte:** [Syfte med mötet]\n\n---\n\n## Dagordning & Diskussion\n1. **Punkt 1:** Diskussion och anteckningar...\n2. **Punkt 2:** Diskussion och anteckningar...\n\n## Beslut tagna\n- [ ] Beslut A: Beskriv beslutet och vem som ansvarar.\n- [ ] Beslut B: Beskriv beslutet.\n\n## Nästa steg (Att göra)\n- [ ] **[Namn 1]**: Slutför designutkastet.\n- [ ] **[Namn 2]**: Skicka ut mötesinbjudan inför uppföljning.`,
    },
  },

  // PRESENTATION TEMPLATES
  {
    id: "pres-blank",
    name: "Tom presentation",
    description: "Skapa en presentation med ett tomt startkort.",
    type: "presentation",
    isPremium: false,
    content: {
      slides: [
        {
          id: "slide-1",
          title: "Välkommen till din presentation",
          body: "Klicka här för att redigera och lägga till innehåll.",
          layout: "hero",
        },
      ],
    },
  },
  {
    id: "pres-company-pitch",
    name: "Företags-Pitch",
    description: "Investerarpitch för att presentera affärsidé, marknad och team.",
    type: "presentation",
    isPremium: true,
    content: {
      slides: [
        {
          id: "cp-1",
          title: "Framtidens Innovationer",
          body: "Hur vi löser morgondagens problem redan idag.\nPresenterad av [Ditt Namn]",
          layout: "hero",
        },
        {
          id: "cp-2",
          title: "Problemet vi löser",
          body: "- Nuvarande lösningar är långsamma och dyra\n- Företag förlorar miljoner på ineffektivitet\n- Brist på samarbetsverktyg anpassade för skolor och kontor",
          layout: "split",
        },
        {
          id: "cp-3",
          title: "Vår lösning: KREATIVE",
          body: "Ett komplett, vackert och AI-drivet workspace.\n\nSnabbt, intuitivt och tillgängligt för alla enheter.",
          layout: "center",
        },
        {
          id: "cp-4",
          title: "Marknadsmöjlighet",
          body: "• Globala marknaden växer med 15% årligen\n• Skolor söker moderna molnbaserade verktyg\n• Organisationer vill konsolidera sina verktygskostnader",
          layout: "bullets",
        },
      ],
    },
  },
  {
    id: "pres-lecture",
    name: "Skolföreläsning (Org)",
    description: "Pedagogisk mall perfekt anpassad för lärare och skolor.",
    type: "presentation",
    isPremium: true,
    isOrgOnly: true,
    content: {
      slides: [
        {
          id: "l-1",
          title: "Introduktion till Ekologi",
          body: "Lektion 1: Samspelet i naturen\nKlass: Biologi A",
          layout: "hero",
        },
        {
          id: "l-2",
          title: "Vad är ett ekosystem?",
          body: "Ett ekosystem består av alla levande varelser inom ett visst område, tillsammans med de abiotiska (icke-levande) miljöfaktorerna som jord, vatten och luft.",
          layout: "center",
        },
        {
          id: "l-3",
          title: "Producenter vs Konsumenter",
          body: "- **Producenter**: Gröna växter som tillverkar energi via fotosyntes.\n- **Konsumenter**: Djur som äter växter eller andra djur för att få energi.\n- **Nedbrytare**: Svampar och bakterier som bryter ner dött material.",
          layout: "split",
        },
        {
          id: "l-4",
          title: "Sammanfattning & Läxa",
          body: "1. Läs kapitel 3 i biologiboken\n2. Svara på instuderingsfrågorna 1-5\n3. Förbered dig på ett kort quiz nästa vecka",
          layout: "bullets",
        },
      ],
    },
  },

  // PAGE TEMPLATES
  {
    id: "page-blank",
    name: "Tom landningssida",
    description: "Starta med en ren sida redo för dina sektioner.",
    type: "page",
    isPremium: false,
    content: {
      pageTitle: "Min Nya Webbplats",
      metaDescription: "En nyskapad sida på KREATIVE.",
      colorTheme: "modern",
      sections: [
        {
          id: "sb-1",
          type: "hero",
          title: "Välkommen till min nyskapade sida",
          subtitle: "Redigera texten eller lägg till nya sektioner för att designa din drömsida.",
          content: "Läs mer",
        },
      ],
    },
  },
  {
    id: "page-product-launch",
    name: "Produktlansering",
    description: "Konverterande landningssida för ny produkt eller app.",
    type: "page",
    isPremium: true,
    content: {
      pageTitle: "Lanserar: KREATIVE App",
      metaDescription: "Det ultimata verktyget för skapande.",
      colorTheme: "modern",
      sections: [
        {
          id: "pl-1",
          type: "hero",
          title: "Skapa utan gränser",
          subtitle: "Världens första intelligenta svenskdesignade workspace för sidor, presentationer och dokument.",
          content: "Starta Gratis",
        },
        {
          id: "pl-2",
          type: "features",
          title: "Kraftfulla funktioner",
          subtitle: "Allt du behöver i en enda plattform",
          items: [
            {
              title: "AI Co-Creator",
              description: "Skriv dokument, generera fantastiska presentationer och rita webbsidor på sekunder.",
            },
            {
              title: "Blixtsnabbt UI",
              description: "Responsivt gränssnitt med eleganta animationer anpassade för både mobil och desktop.",
            },
            {
              title: "Export & Delning",
              description: "Exportera direkt till ren HTML-kod, Markdown-filer eller presentera live i webbläsaren.",
            },
          ],
        },
        {
          id: "pl-3",
          type: "content",
          title: "Byggt för modern produktivitet",
          subtitle: "Varför välja KREATIVE?",
          content: "Vi anser att skapande inte ska begränsas av klumpiga verktyg. Med KREATIVE kombinerar vi det bästa av tre världar: flexibiliteten hos en webbplatsbyggare, tydligheten i ett presentationsverktyg och djupet i ett ordbehandlingsprogram. Allt samlat under en vacker, enhetlig designlinje.",
        },
        {
          id: "pl-4",
          type: "pricing",
          title: "Hitta rätt plan för dig",
          subtitle: "Enkla, flexibla priser anpassade för dina behov.",
          items: [
            {
              name: "Free Trial",
              price: "0 kr",
              features: ["Skapa upp till 2 dokument", "Standardredigering", "Ingen AI-generering"],
            },
            {
              name: "Office Pack",
              price: "99 kr/mån",
              features: [
                "Oändligt med personliga dokument",
                "Full AI-generering",
                "Premium-maller och exporter",
                "Prioriterad support",
              ],
            },
            {
              name: "Organization Pack",
              price: "349 kr/mån",
              features: [
                "Oändlig åtkomst för skolor & företag",
                "Obegränsade medlemmar",
                "Centraliserad administration",
                "Skräddarsydd onboarding",
              ],
            },
          ],
        },
      ],
    },
  },

  // VIDEO TEMPLATES
  {
    id: "vid-blank",
    name: "Tom video",
    description: "Starta från grunden och bygg din egen video med färgglada scener.",
    type: "video",
    isPremium: false,
    content: {
      scenes: [
        {
          id: "vsc-blank-1",
          title: "Min Nya Video",
          subtitle: "En kort beskrivning eller introduktion",
          body: "Klicka på redigeringsknapparna för att ändra text, animation och färg.",
          duration: 5,
          backgroundGradient: "from-slate-900 via-slate-800 to-slate-950",
          textColor: "text-white",
          animationType: "fade",
        }
      ],
      totalDuration: 5
    }
  },
  {
    id: "vid-promo",
    name: "Produktlansering (Video)",
    description: "Elegant presentationsvideo för att marknadsföra en produkt eller tjänst.",
    type: "video",
    isPremium: true,
    content: {
      scenes: [
        {
          id: "vsc-promo-1",
          title: "Vi lanserar framtiden",
          subtitle: "KREATIVE App är äntligen här",
          body: "Världens första svenskdesignade intelligenta workspace för modern produktivitet.",
          duration: 5,
          backgroundGradient: "from-indigo-950 via-slate-900 to-purple-950",
          textColor: "text-indigo-100",
          animationType: "scale-up",
        },
        {
          id: "vsc-promo-2",
          title: "Makalös prestanda",
          subtitle: "Drivs av modern teknik",
          body: "Blixtsnabba laddningstider, automatisk molnsynk och responsiv design för alla enheter.",
          duration: 6,
          backgroundGradient: "from-purple-950 via-slate-900 to-fuchsia-950",
          textColor: "text-fuchsia-100",
          animationType: "slide-left",
        },
        {
          id: "vsc-promo-3",
          title: "Starta din resa idag",
          subtitle: "Gratis under provperioden",
          body: "Gå med tusentals andra kreatörer och uppgradera ditt arbetsflöde nu.",
          duration: 5,
          backgroundGradient: "from-fuchsia-950 via-slate-900 to-slate-950",
          textColor: "text-white",
          animationType: "slide-up",
        }
      ],
      totalDuration: 16
    }
  },
  {
    id: "vid-tutorial",
    name: "Pedagogisk Instruktion (Video)",
    description: "Perfekt strukturerad instruktionsvideo för lektioner eller guider.",
    type: "video",
    isPremium: true,
    isOrgOnly: true,
    content: {
      scenes: [
        {
          id: "vsc-tut-1",
          title: "Lektion: Fotosyntes",
          subtitle: "Biologi Klass A - Introduktion",
          body: "Idag ska vi lära oss hur växter omvandlar solljus, vatten och koldioxid till syre och energi.",
          duration: 6,
          backgroundGradient: "from-emerald-950 via-slate-900 to-teal-950",
          textColor: "text-emerald-100",
          animationType: "blur",
        },
        {
          id: "vsc-tut-2",
          title: "Klorofyllets roll",
          subtitle: "Solfångaren i bladen",
          body: "Det gröna ämnet klorofyll i växtens celler fångar in solenergin och sätter igång den kemiska processen.",
          duration: 6,
          backgroundGradient: "from-teal-950 via-slate-900 to-cyan-950",
          textColor: "text-teal-100",
          animationType: "slide-up",
        },
        {
          id: "vsc-tut-3",
          title: "Sammanfattning",
          subtitle: "Viktiga begrepp att komma ihåg",
          body: "Vatten + Koldioxid + Solljus → Druvsocker (glukos) + Syre. Läxa: Läs kapitel 3 i boken.",
          duration: 6,
          backgroundGradient: "from-cyan-950 via-slate-900 to-slate-950",
          textColor: "text-white",
          animationType: "scale-up",
        }
      ],
      totalDuration: 18
    }
  },

  // STORY TEMPLATES
  {
    id: "story-blank",
    name: "Tom Story",
    description: "Starta en tom berättelse där du själv kan placera ut dina dockor.",
    type: "story",
    isPremium: false,
    content: {
      scenes: [
        {
          id: "ssc-blank-1",
          duration: 5,
          background: "forest",
          characters: [],
          dialogues: []
        }
      ],
      totalDuration: 5
    }
  },
  {
    id: "story-knight-dragon",
    name: "Riddaren & Draken (Story)",
    description: "En spännande sagomall med en hjälte och en drake framför slottet.",
    type: "story",
    isPremium: true,
    content: {
      scenes: [
        {
          id: "ssc-kd-1",
          duration: 7,
          background: "castle",
          characters: [
            {
              id: "kd-char-1",
              type: "hero",
              name: "Riddar Carl",
              x: 25,
              y: 70,
              scale: 1.1,
              facing: "right",
              expression: "angry",
              animation: "bounce",
              clothing: "armor"
            },
            {
              id: "kd-char-2",
              type: "dragon",
              name: "Eldis",
              x: 75,
              y: 65,
              scale: 1.3,
              facing: "left",
              expression: "surprised",
              animation: "float",
              clothing: "royal"
            }
          ],
          dialogues: [
            {
              id: "kd-diag-1",
              characterId: "kd-char-1",
              text: "Stopp där, hemska drake! Du kan inte ta slottets skatt!",
              startTime: 0.5,
              duration: 3,
              bubbleType: "exclamation"
            },
            {
              id: "kd-diag-2",
              characterId: "kd-char-2",
              text: "Va? Jag ville bara låna en bok för att lära mig baka sockerkaka...",
              startTime: 4.0,
              duration: 2.8,
              bubbleType: "speech"
            }
          ]
        }
      ],
      totalDuration: 7
    }
  },
  {
    id: "story-space",
    name: "Rymdexpeditionen (Story)",
    description: "Ett futuristiskt rymdäventyr med en astronaut och en smart robot.",
    type: "story",
    isPremium: true,
    isOrgOnly: true,
    content: {
      scenes: [
        {
          id: "ssc-sp-1",
          duration: 8,
          background: "space",
          characters: [
            {
              id: "sp-char-1",
              type: "astronaut",
              name: "Kapten Alva",
              x: 20,
              y: 60,
              scale: 1.0,
              facing: "right",
              expression: "happy",
              animation: "float",
              clothing: "spacesuit"
            },
            {
              id: "sp-char-2",
              type: "robot",
              name: "Zenith",
              x: 80,
              y: 65,
              scale: 1.0,
              facing: "left",
              expression: "neutral",
              animation: "idle",
              clothing: "armor"
            }
          ],
          dialogues: [
            {
              id: "sp-diag-1",
              characterId: "sp-char-1",
              text: "Zenith, titta! Vi har precis kommit in i en ny galax!",
              startTime: 1.0,
              duration: 3.0,
              bubbleType: "speech"
            },
            {
              id: "sp-diag-2",
              characterId: "sp-char-2",
              text: "Analys slutförd: 99% chans för utomjordiskt liv i denna sektor.",
              startTime: 4.5,
              duration: 3.0,
              bubbleType: "speech"
            }
          ]
        }
      ],
      totalDuration: 8
    }
  }
];
