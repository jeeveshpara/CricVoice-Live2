import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI | null => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
};

// Simulated fallback database for offline play or missing keys
const fallbackComments: Record<string, string> = {
  sidhu: "गुरु! क्या गजब शॉट मार दिया! चौका भी शर्मा गया, बल्ला मैदान का सुल्तान दिखाई दे रहा है! जो हंसे उसका भी भला, जो रोए उसका भी बल्ला! थोंको ताली फटाक से!",
  statman: "A trajectory angle of exactly 45 degrees achieved at an orbital escape velocity of 142 kilometers per hour. Statistically, this is a 94.2% optimal execution boundary for maximum kinetic transfer. Exceptional biomechanical physics on display.",
  meme_lord: "Sheesh! Talk about ultimate cooking! Absolute gigachad behavior on the pitch. No cap, that bowler is crying in 4K right now. The aura is currently sitting at +9000!",
  gully: "अरे बाप रे! ये तो हमारे गली का नियम तोड़ दिया! वन-टिप-वन-हैंड का चांस ही नहीं मिला! गेंद सीधा शर्मा जी के बालकनी में! अब जो ढूंढ कर लाएगा वो पहली बैटिंग करेगा भाय!",
  karan_johar: "The sky wept in slow motion as the stadium fell into grandfather's silent embrace. A tear rolled down under the helmet, reflecting the dreams of three generations of lovers. This isn't a run, this is a cinematic visual poetry of souls!",
  gen_z_influencer: "Slayyyy bestie! That cover drive was literally immaculate, like we are talking peak aesthetic main character energy. The bowler's haircut was kinda mid anyway, but this is a certified gorgeous moment. Period!"
};

// API: Check health/config
app.get("/api/config", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    simulatorMode: !hasKey,
    hasApiKey: hasKey
  });
});

// API: Generate Cricket Commentary
app.post("/api/commentary/generate", async (req, res) => {
  try {
    const { matchEvent, language, dialect, hybridMode, persona, systemInstructions, temperature = 1.0 } = req.body;

    if (!matchEvent) {
      return res.status(400).json({ error: "Match event description is required" });
    }

    const client = getGeminiClient();

    if (!client) {
      // Return beautiful context-aware simulation
      const fallbackText = fallbackComments[persona] || "क्या कमाल का शॉट मार दिया! चौका ही चौका!";
      const mockResult = `[SIMULATED] ${fallbackText} \n\n(Note: Simulator commentary generated successfully. Configure your real GEMINI_API_KEY in the Secrets panel for live custom AI voices!)`;
      return res.json({
        script: mockResult,
        simulator: true,
        wordCount: mockResult.split(/\s+/).length,
        estimatedDuration: Math.round(mockResult.split(/\s+/).length * 0.45) + 5
      });
    }

    // Build creative dynamic prompt elements
    const promptString = `
    Match Event Scenario:
    "${matchEvent}"

    Core Persona Guidelines:
    ${systemInstructions || ""}

    Language Constraints:
    - Language Code selected: ${language}
    - Local Dialect specified: ${dialect || "Standard regional form"}
    - Hybrid Language Hybridisation (Hinglish/Tanglish/etc): ${hybridMode || "none"}

    Instructions:
    Generate exactly 3 to 4 lines of highly entertaining verbal cricket commentary in character. Ensure the terminology fits the local vocabulary, slang, and specific exclamations of the character. Use native scripts or friendly conversational spelling where appropriate. Return pure text, without any labels, markdown headings, or formatting notes.
    `;

    let scriptText = "";
    let isSimulator = false;

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptString,
        config: {
          systemInstruction: `You are a professional commentary simulator in CricVoice Live. Your job is to output absolute peak entertainment commentary. NEVER write explanatory warnings or preambles. Output ONLY the speaking script.`,
          temperature: temperature,
          topP: 0.95,
        }
      });
      scriptText = response.text || "गेंद सीधे छक्के के लिए चली गई है!";
    } catch (apiError: any) {
      console.warn("Gemini API call failed, falling back to simulator mode:", apiError.message || apiError);
      const fallbackText = fallbackComments[persona] || "क्या कमाल का शॉट मार दिया! चौका ही चौका!";
      scriptText = `[DEMAND STANDBY] ${fallbackText} \n\n(Note: The live API is currently under heavy load. The studio automatically restored local broadcasting!)`;
      isSimulator = true;
    }
    
    res.json({
      script: scriptText,
      simulator: isSimulator,
      wordCount: scriptText.split(/\s+/).length,
      estimatedDuration: Math.round(scriptText.split(/\s+/).length * 0.45) + 3
    });
  } catch (error: any) {
    console.error("General Generation Handler Error:", error);
    res.status(500).json({ error: error.message || "Failed to process commentary request" });
  }
});

// Setup dynamic bundle configuration depending on environment
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite HMR...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CricVoice Live running on http://localhost:${PORT}`);
  });
}

initServer();
