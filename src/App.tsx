import React, { useState, useEffect, useMemo } from "react";
import { 
  Mic, 
  Volume2, 
  Play, 
  Pause, 
  Square, 
  Flame, 
  MapPin, 
  Sliders, 
  Music, 
  Settings, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Trophy, 
  TrendingUp, 
  Check, 
  Search, 
  Share2, 
  Copy, 
  Plus, 
  Trash, 
  Radio,
  ChevronRight,
  Info
} from "lucide-react";
import { languages } from "./data/languages";
import { personas, hybridModes } from "./data/personas";
import { presets } from "./data/presets";
import { stateTriviaList, StateTrivia } from "./data/indiaMapData";
import { useAudioSynth } from "./hooks/useAudioSynth";
import { useSpeechSynthesis } from "./hooks/useSpeechSynthesis";

export default function App() {
  // Config state
  const [config, setConfig] = useState<{ hasApiKey: boolean; simulatorMode: boolean }>({
    hasApiKey: false,
    simulatorMode: true
  });

  // Ticker simulated match data
  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerItems = useMemo(() => [
    "🏏 IND vs AUS Live | Virat Kohli: 82*(51) in historic chase at MCG! | IND needing 16 from 6 balls...",
    "⚡ IPL Live Update | MS Dhoni smashes consecutive 3 sixes in the 20th over! Wankhede goes absolutely wild!",
    "🎯 Jasprit Bumrah delivers a searing yorker to clean bowl Travis Head at 147 km/h!",
    "😂 Gully Cricket Special | Chintu declares ball lost in Sharmaji's balcony is OUT. Match temporarily halted."
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [tickerItems]);

  // Tab State: "setup" (Tab 1), "voice" (Tab 2), "map" (Tab 3)
  const [activeTab, setActiveTab] = useState<"setup" | "voice" | "map">("setup");

  // On-Air Setup state (Tab 1)
  const [matchEvent, setMatchEvent] = useState(presets[0].matchEvent);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [searchLangQuery, setSearchLangQuery] = useState("");
  const [selectedPersona, setSelectedPersona] = useState(personas[0]);
  const [selectedHybrid, setSelectedHybrid] = useState("none");
  const [selectedRegion, setSelectedRegion] = useState<"North" | "South" | "East" | "West" | "All">("All");

  // Advanced Voice Controls & Humanizer (Tab 2)
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.1);
  const [volume, setVolume] = useState(0.9);
  const [fillerFrequency, setFillerFrequency] = useState(40); // 0-100 density

  // Interactive Map Trivia (Tab 3)
  const [selectedState, setSelectedState] = useState<StateTrivia>(stateTriviaList[0]);
  
  // Script and Audio Engine Queues
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiScript, setAiScript] = useState("");
  const [modifiedScript, setModifiedScript] = useState("");
  const [isGeneratedText, setIsGeneratedText] = useState(false);
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [broadcastQueue, setBroadcastQueue] = useState<string[]>([]);
  const [shareFeedback, setShareFeedback] = useState("");

  // Hooks
  const audioSounds = useAudioSynth();
  const speechSynth = useSpeechSynthesis();

  // Load API config
  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfig({
        hasApiKey: data.hasApiKey,
        simulatorMode: data.simulatorMode
      });
    } catch (e) {
      console.error("Config fetch error", e);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Filter 22 languages
  const filteredLanguages = useMemo(() => {
    return languages.filter(lang => 
      lang.name.toLowerCase().includes(searchLangQuery.toLowerCase()) ||
      lang.nativeName.includes(searchLangQuery)
    );
  }, [searchLangQuery]);

  // Handle Match Presets Selection
  const selectPreset = (text: string) => {
    setMatchEvent(text);
  };

  // Generate Commentary API payload
  const generateCommentary = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/commentary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchEvent,
          language: selectedLang.code,
          systemInstructions: selectedPersona.systemPrompt,
          persona: selectedPersona.code,
          hybridMode: selectedHybrid,
          temperature: selectedPersona.code === "sidhu" ? 1.25 : selectedPersona.code === "statman" ? 0.3 : 1.0
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAiScript(data.script);
        // Prefit script with Desi Filler injection rules
        const expanded = speechSynth.injectDesiFillers(data.script, fillerFrequency, selectedLang.code);
        setModifiedScript(expanded);
        setIsGeneratedText(true);
        
        // Auto-add to local history feed
        const newItem = {
          id: Math.random().toString(36).substr(2, 9),
          matchEvent,
          script: expanded,
          language: selectedLang,
          persona: selectedPersona,
          hybrid: selectedHybrid,
          createdAt: new Date().toLocaleTimeString()
        };
        setLocalHistory(prev => [newItem, ...prev]);
        
        // Auto-navigate to Voice tab for immediate mixing & playback!
        setActiveTab("voice");
      } else {
        alert("Generation failed: " + (data.error || "Please try again later."));
      }
    } catch (err: any) {
      alert("Error reaching Express API: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-inject fillers when slider frequency updates
  const handleFillerChange = (v: number) => {
    setFillerFrequency(v);
    if (aiScript) {
      const expanded = speechSynth.injectDesiFillers(aiScript, v, selectedLang.code);
      setModifiedScript(expanded);
    }
  };

  // State Map Click Handling
  const handleStateClick = (state: StateTrivia) => {
    setSelectedState(state);
    
    // Auto populate Setup Tab settings matching state identity!
    const matchingLang = languages.find(l => l.code === state.language);
    if (matchingLang) {
      setSelectedLang(matchingLang);
    }
  };

  // Split speaking script with highlight tracking
  const wordsArray = useMemo(() => {
    return modifiedScript.split(/\s+/);
  }, [modifiedScript]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShareFeedback("Copied to clipboard!");
    setTimeout(() => setShareFeedback(""), 3000);
  };

  // Fast trigger audio synthesis with visuals
  const playSoundEffect = (type: string) => {
    switch (type) {
      case "trumpet":
        audioSounds.playTrumpetRiff();
        break;
      case "crowd":
        audioSounds.playCrowdRoar("high");
        break;
      case "dhol":
        audioSounds.playDholBeat();
        break;
      case "whistle":
        audioSounds.playWhistle();
        break;
      case "outhorn":
        audioSounds.playOutHorn();
        break;
      case "firecrackers":
        audioSounds.playFirecrackers();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden pb-12">
      {/* Dynamic Main App Score Header & Live Marquee Ticker */}
      <div id="live-ticket-row" className="bg-slate-900 border-b border-slate-800 text-xs py-2 px-4 flex items-center justify-between overflow-hidden relative shadow-md">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-display font-bold tracking-widest text-[#00E676] uppercase text-[10px]">On Air</span>
        </div>
        
        <div className="flex-1 mx-6 overflow-hidden">
          <div className="whitespace-nowrap transition-transform duration-500 ease-in-out inline-block">
            <span className="font-mono text-emerald-400 font-medium">
              {tickerItems[tickerIndex]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-[11px] font-mono border-l border-slate-800 pl-4">
          <span className="text-slate-400">Time: <b className="text-slate-200">14:15 UTC</b></span>
          <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px] font-semibold">Live Feed</span>
        </div>
      </div>

      {/* Primary Brand Navigation & API Secret Banner */}
      <header className="max-w-7xl w-full mx-auto px-4 pt-6 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-xl font-bold shadow-[0_0_15px_rgba(0,230,118,0.4)]">
              🎙️
            </div>
            <div>
              <h1 className="text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
                CricVoice <span className="text-emerald-400">Live</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono tracking-wider">REAL-TIME CULTURAL BROADCASTS, TAILORED BY AI</p>
            </div>
          </div>
        </div>

        {/* Dynamic Simulator Mode Banner */}
        <div className="flex items-center gap-2.5">
          {config.simulatorMode ? (
            <div className="bg-amber-500/10 text-amber-500 text-xs px-3 py-2 rounded-xl border border-amber-500/20 flex items-center gap-2 max-w-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 shrink-0" />
              <div>
                <span className="font-semibold block">Using Sandbox Commentary</span>
                <span className="text-[10px] text-slate-400 block leading-tight">Add your Gemini API Key in secrets to activate real custom generations.</span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
              <div>
                <span className="font-semibold block text-white">Live AI Engaged</span>
                <span className="text-[10px] text-slate-400 block leading-tight">Gemini 3.5-Flash generating commentary in 22 languages!</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Broadcast Workstation */}
      <main className="max-w-7xl w-full mx-auto px-4 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 3-TAB BROADCAST CONTROL SUITE (8 cols) */}
        <section className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-2xl relative min-h-[640px]">
          {/* Tab Selection Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
            <nav className="flex gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button 
                id="tab-setup"
                onClick={() => setActiveTab("setup")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-200 cursor-pointer ${
                  activeTab === "setup" 
                    ? "bg-slate-800 text-[#00E676] shadow-sm font-semibold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Radio className="h-4 w-4 text-emerald-400" />
                On-Air Setup
              </button>
              
              <button 
                id="tab-voice"
                onClick={() => setActiveTab("voice")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-200 cursor-pointer ${
                  activeTab === "voice" 
                    ? "bg-slate-800 text-[#00E676] shadow-sm font-semibold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="h-4 w-4 text-amber-500" />
                Voice Mixer
              </button>

              <button 
                id="tab-map"
                onClick={() => setActiveTab("map")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-200 cursor-pointer ${
                  activeTab === "map" 
                    ? "bg-slate-800 text-[#00E676] shadow-sm font-semibold" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MapPin className="h-4 w-4 text-pink-500" />
                Map & Sounds
              </button>
            </nav>

            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-950 border border-slate-800 px-2 py-1 rounded">
              Active Module: <b className="text-white">{activeTab}</b>
            </span>
          </div>

          {/* TAB 1: ON AIR SETUP */}
          {activeTab === "setup" && (
            <div className="space-y-6">
              {/* Box 1: Live Event Match Description Text */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#00E676]">1. Describe the Match Ball Action</label>
                  <span className="text-xs text-slate-500">{matchEvent.length} / 500 characters</span>
                </div>
                <textarea
                  value={matchEvent}
                  onChange={(e) => setMatchEvent(e.target.value)}
                  placeholder="E.g. Rohit Sharma swings hard over midwicket for a massive six..."
                  className="w-full h-24 bg-slate-950 border border-slate-800 focus:border-[#00E676] rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#00E676] transition transition-all duration-300 resize-none text-slate-200 leading-relaxed font-sans"
                />
              </div>

              {/* Quick Historic Event presets */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">Quick Stadium Magic Presets</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => selectPreset(preset.matchEvent)}
                      className="text-left bg-slate-950 border border-slate-800/80 hover:border-emerald-500/40 p-2.5 rounded-xl flex items-start gap-3 hover:bg-slate-900 group transition duration-300 cursor-pointer"
                    >
                      <span className="text-2xs p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:scale-110 transition duration-300">
                        {preset.iconEmoji}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition">{preset.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Searchable Language of broadcast Selector (22 official) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#00E676] block">2. Select commentary Language</label>
                  
                  {/* Search filter bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search 22 official languages..."
                      value={searchLangQuery}
                      onChange={(e) => setSearchLangQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 py-1.5 pl-9 pr-3 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition font-sans"
                    />
                  </div>

                  {/* Scrollable list with high-contrast selections */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl h-[160px] overflow-y-auto p-1 text-xs space-y-0.5">
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSelectedLang(lang)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition cursor-pointer ${
                          selectedLang.code === lang.code 
                            ? "bg-slate-800/80 text-emerald-400 border border-emerald-500/20 font-semibold" 
                            : "hover:bg-slate-900/60 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="opacity-80">🇮🇳</span>
                          <span>{lang.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({lang.nativeName})</span>
                        </div>
                        {selectedLang.code === lang.code && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hybrid switch & Dialect pick Column */}
                <div className="space-y-4">
                  {/* Hybrid language toggle chips */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block">Dynamic Hybrid Code-Switching</label>
                    <div className="flex flex-wrap gap-1.5">
                      {hybridModes.map((mode) => (
                        <button
                          key={mode.code}
                          onClick={() => setSelectedHybrid(mode.code)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                            selectedHybrid === mode.code 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold" 
                              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          {mode.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* regional dialects picker quick select */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <MapPin className="h-4 w-4" />
                      <span>Regional Cultural Accents</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      The generated script automatically targets conversational spellings, local slangs, and references typical of specified dialects!
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-semibold uppercase font-mono tracking-wider">
                        Active Style: Standard {selectedLang.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commentary Personas Carousels */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-[#00E676] block">3. Pick Commentator Persona</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                  {personas.map((persona) => (
                    <button
                      key={persona.code}
                      onClick={() => setSelectedPersona(persona)}
                      className={`text-left border rounded-xl p-3 flex flex-col justify-between h-[115px] hover:scale-[1.02] transition duration-300 cursor-pointer ${
                        selectedPersona.code === persona.code
                          ? `bg-gradient-to-br ${persona.bgGradient} text-white border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)]`
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-2xl">{persona.avatar}</span>
                        <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-black/20 text-white">
                          {persona.code === selectedPersona.code ? "ON DUTY" : "BENCH"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <h4 className="text-xs font-bold leading-none">{persona.name}</h4>
                        <p className={`text-[10px] mt-1 line-clamp-2 ${
                          selectedPersona.code === persona.code ? "text-white/80" : "text-slate-400"
                        }`}>
                          {persona.tagline}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Big CTA with cricket-ball pulse loader */}
              <button
                onClick={generateCommentary}
                disabled={isGenerating || !matchEvent}
                className="w-full bg-[#00E676] hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 font-display text-slate-950 font-black py-4 uppercase tracking-widest rounded-xl text-sm flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 cursor-pointer group shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:shadow-[0_0_30px_rgba(0,230,118,0.5)]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin text-slate-950" />
                    Simulating Voice Waves...
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5 text-slate-950 group-hover:scale-125 transition duration-300" />
                    🎙️ Generate Commentary Script
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: VOICE MIXER */}
          {activeTab === "voice" && (
            <div className="space-y-6">
              {/* Simulator info alert if there is no text generated yet */}
              {!isGeneratedText && (
                <div className="p-10 bg-slate-950 border border-slate-800 text-slate-300 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 text-3xl bg-slate-900 border border-slate-800 flex items-center justify-center rounded-2xl animate-bounce-slow">
                    🎤
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Voice Booth Empty</h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-normal">
                      Head to the <b className="text-emerald-400 cursor-pointer" onClick={() => setActiveTab("setup")}>On-Air Setup</b>, describe an ball action, and generate a customized script to unlock voice mixing controls!
                    </p>
                  </div>
                </div>
              )}

              {isGeneratedText && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Voice Parameters Column */}
                  <div className="md:col-span-5 space-y-5">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#00E676] border-b border-slate-800 pb-2">Vocal Synthesis Mixer</h3>
                    
                    {/* Vocal Pitch Control */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Vocal Pitch Accent</span>
                        <span className="font-mono text-emerald-400 font-bold">{pitch}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Low Bass</span>
                        <span>Squeaky</span>
                      </div>
                    </div>

                    {/* Speech rate control */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Speech Rate Velocity</span>
                        <span className="font-mono text-emerald-400 font-bold">{rate}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Slow / Suspense</span>
                        <span>Fast / Frantic</span>
                      </div>
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Output Gain Level</span>
                        <span className="font-mono text-[#00E676] font-bold">{Math.round(volume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>

                    {/* Desi Humanizer density slider */}
                    <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-white font-bold">
                          <Flame className="h-4 w-4 text-emerald-400" />
                          <span>Desi Filler Intensity</span>
                        </div>
                        <span className="text-emerald-400 font-mono text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded uppercase font-bold">
                          {fillerFrequency}% Density
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={fillerFrequency}
                        onChange={(e) => handleFillerChange(parseInt(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Dynamically injects iconic Indian expressions like <i className="text-slate-300">"Baap re Baap!"</i> or <i className="text-slate-300">"O Teri!"</i> into sentences!
                      </p>
                    </div>
                  </div>

                  {/* Right: Active Script Output & Speech highlights */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-[#00E676]">Commentary Screenplay Output</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(modifiedScript)}
                          className="p-1 px-2.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                          title="Copy Script Text"
                        >
                          <Copy className="h-3 w-3" />
                          <span className="text-[10px] font-mono">Copy</span>
                        </button>
                      </div>
                    </div>

                    {shareFeedback && (
                      <div className="text-xs text-center text-[#00E676] bg-[#00E676]/10 p-2 rounded-lg border border-[#00E676]/20 py-1.5 font-mono">
                        {shareFeedback}
                      </div>
                    )}

                    {/* Word-by-word rendered screen with active highlighter highlights */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 w-full min-h-[220px] transition-all duration-300 relative flex flex-col justify-between">
                      <div className="text-sm md:text-base leading-relaxed text-slate-300 tracking-wide font-medium select-none max-h-[160px] overflow-y-auto">
                        {wordsArray.map((word, wordIdx) => {
                          const isHighlighted = wordIdx === speechSynth.currentWordIndex;
                          return (
                            <span
                              key={wordIdx}
                              className={`inline-block mr-1.5 rounded transition-all duration-150 py-0.5 px-1 ${
                                isHighlighted 
                                  ? "bg-emerald-400 text-slate-950 font-bold scale-110 shadow-md ring-2 ring-emerald-500/30" 
                                  : "hover:text-white"
                              }`}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </div>

                      {/* Custom Speaker Metadata Tag Footer */}
                      <div className="pt-4 border-t border-slate-900 flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{selectedPersona.avatar}</span>
                          <div>
                            <span className="text-2xs text-slate-500 font-mono block uppercase">Voiced by:</span>
                            <span className="text-xs font-semibold text-slate-200">{selectedPersona.name}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-2xs text-slate-500 font-mono block uppercase">Locale language:</span>
                          <span className="text-xs font-semibold text-slate-200">{selectedLang.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Programmatic Player Synthesis controls */}
                    <div className="flex gap-2 w-full pt-1">
                      {speechSynth.isSpeaking ? (
                        <>
                          {speechSynth.isPaused ? (
                            <button
                              onClick={speechSynth.resume}
                              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-xs uppercase font-mono tracking-widest cursor-pointer"
                            >
                              Resume Broadcast
                            </button>
                          ) : (
                            <button
                              onClick={speechSynth.pause}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 rounded-xl text-xs uppercase font-mono tracking-widest cursor-pointer"
                            >
                              Pause Speech
                            </button>
                          )}
                          <button
                            onClick={speechSynth.stop}
                            className="bg-red-500/20 text-red-400 hover:text-white border border-red-500/30 hover:bg-red-500 py-3.5 px-6 rounded-xl text-xs uppercase font-mono tracking-wide transition cursor-pointer flex items-center gap-2"
                          >
                            <Square className="h-3.5 w-3.5" />
                            Stop
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => speechSynth.speak(modifiedScript, selectedLang.code, pitch, rate, volume)}
                          className="w-full bg-[#00E676] text-slate-950 font-black py-4 rounded-xl text-xs uppercase font-mono tracking-widest hover:bg-emerald-400 hover:scale-[1.01] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5"
                        >
                          <Play className="h-4 w-4 fill-current text-slate-950" />
                          Speak Commentary Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIVE REGIONAL MAP & STADIUM SOUNDS */}
          {activeTab === "map" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Visual Intersecting State Nodes Map - Telemetry theme */}
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#00E676] flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      Regional Telemetry Radar
                    </h3>
                    <span className="text-[10px] text-slate-500">Click State To Target accent</span>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl relative min-h-[300px] flex flex-col justify-between">
                    
                    {/* SVG/Radar Node Interface layout representing layout of India */}
                    <div className="relative w-full h-[220px] bg-slate-900/30 rounded-xl border border-dashed border-slate-800/80 overflow-hidden flex items-center justify-center">
                      
                      {/* Grid overlays */}
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,230,118,0.06),transparent)]" />
                      <div className="absolute top-1/2 left-0 right-0 border-t border-slate-800/50" />
                      <div className="absolute left-1/2 top-0 bottom-0 border-l border-slate-800/50" />
                      
                      {/* Plot beacon states */}
                      {stateTriviaList.map((state) => {
                        const isSelected = selectedState.id === state.id;
                        return (
                          <button
                            key={state.id}
                            onClick={() => handleStateClick(state)}
                            style={{ left: `${state.coordinates.x}%`, top: `${state.coordinates.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                          >
                            {/* Glowing effect ring if selected */}
                            <span className={`absolute -inset-2.5 rounded-full transition-all duration-300 ${
                              isSelected 
                                ? "bg-emerald-400/20 animate-ping" 
                                : "group-hover:bg-blue-400/10"
                            }`} />
                            
                            {/* Inner point */}
                            <span className={`relative block rounded-full transition-all duration-300 ${
                              isSelected ? "h-3.5 w-3.5 bg-[#00E676] shadow-[0_0_10px_#00E676]" : "h-2 w-2 bg-slate-600 group-hover:bg-blue-400"
                            }`} />

                            {/* Hover Namecard labels */}
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-950/90 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded text-slate-300 opacity-60 group-hover:opacity-100 transition whitespace-nowrap z-20">
                              {state.name}
                            </span>
                          </button>
                        );
                      })}

                      {/* Compass widget */}
                      <div className="absolute bottom-3 right-3 text-[9px] font-mono text-slate-600 flex flex-col items-end">
                        <span>N 20.5937°</span>
                        <span>E 78.9629°</span>
                        <span className="text-emerald-500 font-bold uppercase mt-1">Radar: Online</span>
                      </div>
                    </div>

                    {/* Regional details trivia display box */}
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="text-sm">🇮🇳</span>
                          {selectedState.name} <span className="font-mono text-xs text-slate-400">({selectedState.nativeName})</span>
                        </span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                          Dialect: {selectedState.dialect}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-2.5 pt-2 border-t border-slate-800/80 text-[10px]">
                        <div>
                          <span className="text-slate-500 block">Historic Ground:</span>
                          <span className="text-slate-300 font-medium">{selectedState.stadium}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Cricket Legends:</span>
                          <span className="text-slate-300 font-medium">{selectedState.legend}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-normal mt-2">
                        💡 <b className="text-slate-200">State Fact:</b> {selectedState.trivia}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stadium programmatic synthesized Synthesizer Board pad */}
                <div className="md:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#00E676] flex items-center gap-1.5">
                      <Music className="h-4 w-4" />
                      Stadium SFX Board
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Brass Trumpet */}
                    <button
                      onClick={() => playSoundEffect("trumpet")}
                      className="bg-slate-950 border border-slate-800 hover:border-amber-400 p-4 rounded-2xl text-center group transition-all duration-300 flex flex-col items-center justify-center space-y-2 cursor-pointer shadow-md"
                    >
                      <span className="text-2xl group-hover:scale-125 transition duration-300">🎺</span>
                      <span className="text-xs font-bold text-slate-200">IPL Trumpet</span>
                      <span className="text-[9px] text-slate-500 font-mono">Brass Synth</span>
                    </button>

                    {/* Crowd Roar */}
                    <button
                      onClick={() => playSoundEffect("crowd")}
                      className="bg-slate-950 border border-slate-800 hover:border-emerald-400 p-4 rounded-2xl text-center group transition-all duration-300 flex flex-col items-center justify-center space-y-2 cursor-pointer shadow-md"
                    >
                      <span className="text-2xl group-hover:scale-125 transition duration-300">🔊</span>
                      <span className="text-xs font-bold text-slate-200">Crowd Roar</span>
                      <span className="text-[9px] text-slate-500 font-mono">White Noise Envelope</span>
                    </button>

                    {/* Dhol beat loop */}
                    <button
                      onClick={() => playSoundEffect("dhol")}
                      className="bg-slate-950 border border-slate-800 hover:border-[#00E676] p-4 rounded-2xl text-center group transition-all duration-300 flex flex-col items-center justify-center space-y-2 cursor-pointer shadow-md"
                    >
                      <span className="text-2xl group-hover:scale-125 transition duration-300">🥁</span>
                      <span className="text-xs font-bold text-slate-200">Dhol Beats</span>
                      <span className="text-[9px] text-slate-500 font-mono">Resonant Kicks</span>
                    </button>

                    {/* Whistle pop */}
                    <button
                      onClick={() => playSoundEffect("whistle")}
                      className="bg-slate-950 border border-slate-800 hover:border-blue-400 p-4 rounded-2xl text-center group transition-all duration-300 flex flex-col items-center justify-center space-y-2 cursor-pointer shadow-md"
                    >
                      <span className="text-2xl group-hover:scale-125 transition duration-300">😚</span>
                      <span className="text-xs font-bold text-slate-200">Field Whistle</span>
                      <span className="text-[9px] text-slate-500 font-mono">Sine LFO Sweep</span>
                    </button>

                    {/* Cricket out horn buzzer */}
                    <button
                      onClick={() => playSoundEffect("outhorn")}
                      className="bg-slate-950 border border-slate-800 hover:border-red-400 p-4 rounded-2xl text-center group transition-all duration-300 flex flex-col items-center justify-center space-y-2 cursor-pointer shadow-md"
                    >
                      <span className="text-2xl group-hover:scale-125 transition duration-300">🚨</span>
                      <span className="text-xs font-bold text-slate-200">Wicket Horn</span>
                      <span className="text-[9px] text-slate-500 font-mono">Sawtooth Buzz</span>
                    </button>

                    {/* Popping Firecrackers */}
                    <button
                      onClick={() => playSoundEffect("firecrackers")}
                      className="bg-slate-950 border border-slate-800 hover:border-pink-400 p-4 rounded-2xl text-center group transition-all duration-300 flex flex-col items-center justify-center space-y-2 cursor-pointer shadow-md"
                    >
                      <span className="text-2xl group-hover:scale-125 transition duration-300">🎆</span>
                      <span className="text-xs font-bold text-slate-200">Firecrackers</span>
                      <span className="text-[9px] text-slate-500 font-mono">Crackling Pops</span>
                    </button>

                  </div>
                </div>

              </div>
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: RECENT COMMENTARY HISTORY & FEEDBACKS (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Box 1: Live Studio Status Monitor */}
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">Broadcast Console</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00E676]/15 border border-[#00E676]/25 text-[10px] font-bold text-[#00E676]">
                <Radio className="h-3 w-3 animate-pulse text-[#00E676]" />
                Ready To Mix
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] font-mono">CULTURAL DIALECTS</span>
                <span className="text-white font-mono font-bold">Standard</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-500 block text-[9px] font-mono">PERSONA MODES</span>
                <span className="text-white font-mono font-bold capitalize">{selectedPersona.code}</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 select-none">
                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                Target Language:
              </span>
              <span className="text-emerald-400 font-bold">{selectedLang.name}</span>
            </div>
          </div>

          {/* Box 2: Feed of generated commentaries (Local History) */}
          <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#00E676]">Saved commentary feeds</h3>
              <span className="text-[10px] text-slate-500 font-mono">({localHistory.length} total)</span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {localHistory.length === 0 ? (
                <div className="text-center py-8 bg-slate-950/40 border border-slate-850 border-dashed rounded-xl p-4">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    No historic commentary generated yet. Generate your first clip above to populate saved recordings!
                  </p>
                </div>
              ) : (
                localHistory.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-slate-950 border border-slate-850 hover:border-slate-700/80 rounded-xl transition duration-200"
                  >
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-900 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{item.persona.avatar}</span>
                        <span className="text-slate-300 font-semibold">{item.persona.name}</span>
                      </div>
                      <span className="text-slate-500 font-mono">{item.createdAt}</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed italic">
                      "{item.script}"
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                      <div className="flex gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase font-mono">
                          {item.language.name}
                        </span>
                        {item.hybrid !== "none" && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold font-mono uppercase">
                            Mix
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAiScript(item.script);
                            setModifiedScript(item.script);
                            // Set languages and persona
                            setSelectedLang(item.language);
                            setSelectedPersona(item.persona);
                            setSelectedHybrid(item.hybrid);
                            setIsGeneratedText(true);
                            setActiveTab("voice");
                          }}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[#00E676] hover:bg-slate-800 font-medium cursor-pointer transition"
                        >
                          Load Mixer
                        </button>
                        <button
                          onClick={() => copyToClipboard(item.script)}
                          className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Box 3: Commentary Matchday Guide Banner */}
          <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800/80 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Trophy className="h-20 w-20 text-white" />
            </div>
            
            <div className="relative">
              <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Matchday Mode active</span>
              <h4 className="text-xs font-bold text-white mt-2">Simulate Grand Tournament Slang</h4>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                Connect your dynamic stadium dhol and horn elements in real-time as the audio synthesizer is playing! Perfect for recording or saving cultural matchdays.
              </p>
            </div>
          </div>

        </aside>
      </main>

      {/* Simplified Brand Footer block */}
      <footer className="max-w-7xl w-full mx-auto px-4 mt-12 pt-6 border-t border-slate-900 flex justify-between items-center text-slate-500 text-[10px] font-mono">
        <span>CricVoice Live © 2026</span>
        <span>Standard Node Sandbox Container Port 3000 Ingress</span>
      </footer>

    </div>
  );
}
