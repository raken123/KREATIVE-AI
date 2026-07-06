import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Google GenAI client to prevent startup crashes if key is absent
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it to Secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Check if Gemini is configured
app.get("/api/config", (req, res) => {
  const isKeyConfigured = !!process.env.GEMINI_API_KEY;
  res.json({ isConfigured: isKeyConfigured });
});

// Generic endpoint for document drafting or text improvement
app.post("/api/gemini/generate-document", async (req, res) => {
  try {
    const { prompt, type, currentText } = req.body;
    const ai = getAI();

    let systemInstruction = "Du är KREATIVE AI, en expert på att skriva och redigera professionella dokument på svenska.";
    let contents = "";

    if (type === "draft") {
      contents = `Skapa ett utkast för ett dokument baserat på följande beskrivning: "${prompt}". 
      Dokumentet ska ha en tydlig rubrik, introduktion, strukturerade stycken med underrubriker, och en sammanfattning. 
      Skriv i professionell och engagerande ton. Använd Markdown för formatering. Skriv helt på svenska.`;
    } else if (type === "improve") {
      contents = `Hjälp mig att förbättra följande text:
      ---
      ${currentText}
      ---
      Instruktion för förbättring: ${prompt}
      Behåll Markdown-formatering om det finns. Skriv helt på svenska. Returnera endast den förbättrade texten.`;
    } else if (type === "summarize") {
      contents = `Sammanfatta följande text på ett klart och koncist sätt med punktlistor om lämpligt:
      ---
      ${currentText}
      ---
      Skriv helt på svenska. Använd Markdown för formatering.`;
    } else {
      contents = prompt;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Document Error:", error);
    res.status(500).json({ error: error.message || "Ett fel uppstod vid generering av dokument." });
  }
});

// Endpoint for generating slide content for presentations
app.post("/api/gemini/generate-slides", async (req, res) => {
  try {
    const { topic, slideCount = 4 } = req.body;
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Skapa en presentation om ämnet: "${topic}". Generera exakt ${slideCount} slides.
      Varje slide måste ha en rubrik (title), en brödtext (body) på svenska, och en layout-stil som passar innehållet.
      Layout-stilen måste vara en av följande strängar:
      - "split" (för jämförelser eller bild+text-känsla)
      - "center" (för korta, kraftfulla budskap eller citat)
      - "bullets" (för detaljerade punkter eller listor)
      - "hero" (för en stor introduktion eller rubriksida)
      
      Skriv ett strukturerat JSON-svar som följer detta schema:
      Ett fält "slides" som är en array av objekt. Varje objekt har fälten:
      - "title": Sträng
      - "body": Sträng (eller punktlista formaterad med nya rader)
      - "layout": Sträng (antingen "split", "center", "bullets" eller "hero")`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  body: { type: Type.STRING },
                  layout: { type: Type.STRING },
                },
                required: ["title", "body", "layout"],
              },
            },
          },
          required: ["slides"],
        },
        systemInstruction: "Du är KREATIVE Presentation AI. Du genererar engagerande, professionella presentationer i strukturerat JSON-format på svenska.",
        temperature: 0.7,
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Slides Error:", error);
    res.status(500).json({ error: error.message || "Ett fel uppstod vid generering av presentation." });
  }
});

// Endpoint for generating beautiful webpages
app.post("/api/gemini/generate-webpage", async (req, res) => {
  try {
    const { prompt, colorTheme = "modern" } = req.body;
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Skapa en professionell webbplatssida baserad på beskrivningen: "${prompt}".
      Webbsidan ska ha ett tema som passar "${colorTheme}".
      Generera en strukturerad JSON-representation av sidan så att vi kan rita upp den dynamiskt.
      Sidan ska bestå av en lista med sektioner (sections). Varje sektion har en typ:
      - "hero" (Huvudrubrik, undertext, call-to-action knapptext)
      - "features" (Grid av 3 funktioner, där varje funktion har en rubrik och beskrivning)
      - "content" (En längre löpande textsektion med en rubrik och stycken)
      - "pricing" (Ett priserbjudande eller paketering med rubrik, pris och fördelar)
      - "contact" (Ett kontaktformulär-område eller kontaktinfo)
      
      Svara med JSON som matchar detta schema:
      Ett fält "pageTitle" (Sträng), "metaDescription" (Sträng), och en array "sections" med objekt.
      Varje sektionsobjekt ska ha:
      - "type": Sträng (en av de 5 typerna)
      - "title": Sträng
      - "subtitle": Sträng (valfritt)
      - "content": Sträng eller array av strängar (valfritt, t.ex. för löpande text)
      - "items": Array av objekt för "features" (varje objekt har "title" och "description") eller "pricing" (varje objekt har "name", "price", "features" array)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pageTitle: { type: Type.STRING },
            metaDescription: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  content: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        name: { type: Type.STRING },
                        price: { type: Type.STRING },
                        features: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                    },
                  },
                },
                required: ["type", "title"],
              },
            },
          },
          required: ["pageTitle", "sections"],
        },
        systemInstruction: "Du är KREATIVE Web Creator AI. Du designar vackra, konverterande svenskspråkiga webbplatser i JSON-format.",
        temperature: 0.7,
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Webpage Error:", error);
    res.status(500).json({ error: error.message || "Ett fel uppstod vid generering av webbsidan." });
  }
});

// Endpoint for generating animated HTML video content
app.post("/api/gemini/generate-video", async (req, res) => {
  try {
    const { prompt, maxDuration = 120 } = req.body;
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Skapa en vacker animerad video (HTML-baserad presentation av scener) om ämnet: "${prompt}".
      Den totala längden får inte överskrida ${maxDuration} sekunder.
      Generera en serie professionella, sammanhängande scener (scenes) som tillsammans berättar historien.
      Varje scen har en specifik speltid (duration) i sekunder (t.ex. 5, 8, eller 12 sekunder per scen).
      För varje scen måste du tillhandahålla en rubrik, en undertext/underbeskrivning, en brödtext, ett bakgrundsgradient-tema (Tailwind gradient-klasser) samt en animeringstyp.
      
      Stilen ska kännas som en påkostad modern video. Använd kreativa färgkombinationer för gradienterna som matchar scenens känsla (t.ex. rymden kan ha djupa mörka nyanser, teknik kan ha lysande blått/lila, miljö kan ha grönt/teal).

      Svara med JSON som matchar detta schema:
      Ett fält "scenes" som är en array av objekt. Varje sektionsobjekt ska ha:
      - "title": Sträng (Huvudtitel för denna scen, t.ex. "Solen - Vår stjärna")
      - "subtitle": Sträng (Kort ingress eller fängslande underrubrik)
      - "body": Sträng (Längre beskrivande manus eller detaljerad text på svenska)
      - "duration": Heltal (Speltid för denna scen i sekunder, t.ex. 6 eller 10)
      - "backgroundGradient": Sträng (Tailwind-klasser för en snygg linjär gradient, t.ex. "from-slate-950 via-slate-900 to-indigo-950")
      - "textColor": Sträng (En av: "text-white" eller "text-slate-100" eller "text-indigo-50")
      - "animationType": Sträng (En av: "fade", "slide-up", "scale-up", "slide-left", "blur")`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  body: { type: Type.STRING },
                  duration: { type: Type.INTEGER },
                  backgroundGradient: { type: Type.STRING },
                  textColor: { type: Type.STRING },
                  animationType: { type: Type.STRING },
                },
                required: ["title", "subtitle", "body", "duration", "backgroundGradient", "textColor", "animationType"],
              },
            },
          },
          required: ["scenes"],
        },
        systemInstruction: "Du är KREATIVE Video AI. Du skapar otroligt vackra, engagerande och animerade HTML-videomanus med matchande designklasser i JSON-format på svenska.",
        temperature: 0.7,
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    
    // Calculate total duration
    let totalDuration = 0;
    if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
      parsedData.scenes.forEach((scene: any) => {
        totalDuration += scene.duration || 5;
      });
    }
    
    parsedData.totalDuration = totalDuration;
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Video Error:", error);
    res.status(500).json({ error: error.message || "Ett fel uppstod vid generering av videon." });
  }
});

// Setup Vite or static files middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
