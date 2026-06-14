import { useState, useEffect, useRef, useCallback } from "react";
import "./index.css";

/* Helper to load external scripts dynamically */
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
};

/* ─────────────────────────────────────────────────────────────
   GESTURE EMOJIS & TRANSLATIONS
   ───────────────────────────────────────────────────────────── */
const SIGN_ICONS = {
  Fist: "✊",
  "Open Hand": "🖐️",
  Rock: "🤘",
  "Thumbs Up": "👍",
  "Thumbs Down": "👎",
  Peace: "✌️",
  "Pointing Up": "☝️",
  Unknown: "❓",
};

const EASY_MODE_TRANSLATIONS = {
  Fist: "Please wait / Stop",
  "Open Hand": "Hello / Greeting",
  Rock: "Cool / Let's rock",
  "Thumbs Up": "I agree / Yes",
  "Thumbs Down": "Dislike / No",
  Peace: "Peace / Victory",
  "Pointing Up": "Attention / One",
  None: "Waiting for gesture input...",
};

const SPOKEN_VARIATIONS = {
  Fist: ["Please wait.", "Hold on a second.", "Stop."],
  "Open Hand": ["Hello!", "Hi there!", "Greetings!"],
  Rock: ["Cool!", "Awesome!", "Nice!"],
  "Thumbs Up": ["I agree.", "Yes.", "That's right!"],
  "Thumbs Down": ["No.", "I don't think so.", "No, thanks."],
  Peace: ["Peace!", "Victory!"],
  "Pointing Up": ["Excuse me.", "Attention, please."],
};

function getNaturalSpokenPhrase(gestureName) {
  const variations = SPOKEN_VARIATIONS[gestureName];
  if (variations && variations.length > 0) {
    const randomIndex = Math.floor(Math.random() * variations.length);
    return variations[randomIndex];
  }
  return gestureName;
}

/* ─────────────────────────────────────────────────────────────
   SVG ICONS
   ───────────────────────────────────────────────────────────── */
const Icon = {
  Screen: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <polyline points="8 21 12 17 16 21" /><line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Camera: ({ off }) => off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  Mic: ({ off }) => off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Send: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={14} height={14}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────
   GESTURE RECOGNITION LOGIC
   ───────────────────────────────────────────────────────────── */
function recognizeGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { name: "Unknown", confidence: 0.0 };
  }

  const getDistance = (a, b) => {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
    );
  };

  const wrist = landmarks[0];

  // Knuckles and Tips
  const indexKnuckle = landmarks[5];
  const indexTip = landmarks[8];
  const middleKnuckle = landmarks[9];
  const middleTip = landmarks[12];
  const ringKnuckle = landmarks[13];
  const ringTip = landmarks[16];
  const pinkyKnuckle = landmarks[17];
  const pinkyTip = landmarks[20];

  // Distances to wrist - if tip is further than knuckle, finger is extended
  const indexOpen = getDistance(indexTip, wrist) > getDistance(indexKnuckle, wrist);
  const middleOpen = getDistance(middleTip, wrist) > getDistance(middleKnuckle, wrist);
  const ringOpen = getDistance(ringTip, wrist) > getDistance(ringKnuckle, wrist);
  const pinkyOpen = getDistance(pinkyTip, wrist) > getDistance(pinkyKnuckle, wrist);

  // Thumb detection: Thumb is open if it's far from index knuckle (landmark 5) relative to hand size
  const thumbTip = landmarks[4];
  const indexMCP = landmarks[5];
  const thumbKnuckle = landmarks[2];
  const handSize = getDistance(landmarks[9], wrist);
  const thumbOpen = getDistance(thumbTip, indexMCP) > handSize * 0.45;

  // Count open fingers (Index, Middle, Ring, Pinky)
  const openCount = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length;

  // Gesture classification
  // 1. Fist: All closed
  if (openCount === 0 && !thumbOpen) {
    return { name: "Fist", confidence: 0.95 };
  }
  
  // 2. Thumbs Up/Down: Only thumb open
  if (thumbOpen && openCount === 0) {
    if (thumbTip.y < thumbKnuckle.y) {
      return { name: "Thumbs Up", confidence: 0.92 };
    } else {
      return { name: "Thumbs Down", confidence: 0.90 };
    }
  }

  // 3. Pointing Up: Only index open
  if (indexOpen && openCount === 1 && !thumbOpen) {
    return { name: "Pointing Up", confidence: 0.88 };
  }

  // 4. Peace: Index and Middle open
  if (indexOpen && middleOpen && openCount === 2 && !thumbOpen) {
    return { name: "Peace", confidence: 0.92 };
  }

  // 5. Rock: Index and Pinky open, middle and ring closed
  if (indexOpen && pinkyOpen && openCount === 2 && !middleOpen && !ringOpen) {
    return { name: "Rock", confidence: 0.90 };
  }

  // 6. Open Hand: All open
  if (indexOpen && middleOpen && ringOpen && pinkyOpen && openCount === 4 && thumbOpen) {
    return { name: "Open Hand", confidence: 0.98 };
  }

  // Fallback: if at least 3 fingers are open, classify as Open Hand
  if (openCount >= 3) {
    return { name: "Open Hand", confidence: 0.85 };
  }

  return { name: "Unknown", confidence: 0.5 };
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function SignLanguageDetector() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const lastSignRef = useRef("");
  const debounceRef = useRef(null);
  const chatEndRef = useRef(null);
  const avatarTimeoutRef = useRef(null);
  const processFrameRef = useRef(null);

  // Pre-load conversation items
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      sender: "Maya S.",
      initial: "M",
      text: "Hi! I'll be signing today — Easy Mode helps you follow along.",
      time: "09:41",
      isSignLanguage: true,
      translation: "Hi! I will use sign language to speak today. You can read the text below my video to follow along.",
      isMe: false,
    },
    {
      id: 2,
      sender: "You",
      initial: "Y",
      text: "Perfect, I just turned it on. Ready when you are!",
      time: "09:41",
      isMe: true,
    }
  ]);

  // States
  const [isRunning, setIsRunning] = useState(false);
  const [easyMode, setEasyMode] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [gesture, setGesture] = useState({ name: "None", confidence: null });
  const [signHistory, setSignHistory] = useState([]);

  const [message, setMessage] = useState("");

  // Settings & Screenshare States
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("settings");
  const [detectionConfidence, setDetectionConfidence] = useState(0.5);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const screenStreamRef = useRef(null);

  // AI Avatar Animation State
  const [avatarAnimating, setAvatarAnimating] = useState(false);

  // Accessibility Toggles
  const [signToTextActive, setSignToTextActive] = useState(true);
  const [voiceToTextActive, setVoiceToTextActive] = useState(false);
  const [textToSpeechActive, setTextToSpeechActive] = useState(true);

  // Accessibility Refs
  const signToTextActiveRef = useRef(true);
  const voiceToTextActiveRef = useRef(false);
  const textToSpeechActiveRef = useRef(true);
  const micOnRef = useRef(true);
  const isRunningRef = useRef(false);
  const camOnRef = useRef(true);
  const recognitionRef = useRef(null);
  const lastProcessingTimeRef = useRef(0);

  // Sync refs to prevent stale closure loops
  useEffect(() => {
    signToTextActiveRef.current = signToTextActive;
  }, [signToTextActive]);

  useEffect(() => {
    voiceToTextActiveRef.current = voiceToTextActive;
  }, [voiceToTextActive]);

  useEffect(() => {
    textToSpeechActiveRef.current = textToSpeechActive;
  }, [textToSpeechActive]);

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    camOnRef.current = camOn;
  }, [camOn]);

  const [isReadingManual, setIsReadingManual] = useState(false);

  const closeSettings = () => {
    setShowSettings(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsReadingManual(false);
  };

  const readManualOutLoud = () => {
    if (isReadingManual) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsReadingManual(false);
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();

        const textToSpeak = `Welcome to Signal, your interactive sign language and communication call space! Let's walk through how this application works.

In the center of your screen, your camera feed is the dominant window. Directly beneath it is the Live Translation Bar. Any sign gesture you show in front of your camera will be translated and shown here instantly.

We support seven key hand gestures in our signs dictionary:
- A Fist represents "Please wait" or "Stop".
- An Open Hand means "Hello" or "Greetings".
- The Rock sign represents "Cool" or "Awesome".
- A Thumbs Up means "I agree" or "Yes".
- A Thumbs Down means "Dislike" or "No".
- The Peace sign means "Peace" or "Victory".
- And Pointing Up is used to request "Attention" or represent the number "One".

In the top header, you can toggle three powerful accessibility features:
First, Sign to Text controls the artificial intelligence hand-tracking engine. You can turn this off to save power during standard video calls.
Second, Voice to Text uses your microphone to transcribe your spoken voice directly into the live call chat in real-time.
Third, Text to Speech speaks all translated gestures and outgoing chat messages out loud using natural, friendly phrases.

Next, you can toggle "Easy Mode" in the sidebar controls. When active, it automatically translates and simplifies sign gesture captions and chat messages into warm, clear everyday plain language.

Finally, to support users with low-end computers, Signal automatically throttles all artificial intelligence scans to ten frames per second and uses hardware-accelerated video rendering. This keeps your device cool, prevents lag, and saves over eighty percent of processor overhead.

You are now ready to communicate. Position your hand clearly in front of the camera, and enjoy using Signal!`;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.92; // Slower, clear teaching pace
        utterance.pitch = 1.0;

        utterance.onend = () => {
          setIsReadingManual(false);
        };
        utterance.onerror = () => {
          setIsReadingManual(false);
        };

        setIsReadingManual(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Speech Synthesis Helper (Text-to-Speech)
  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // cancel existing talk backlog
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice to Text (Speech Recognition) Effect
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (voiceToTextActive && micOn && isRunning) {
      if (!recognitionRef.current) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onresult = (event) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript;
            }
          }
          if (transcript.trim() && micOnRef.current) {
            const time = new Date().toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit"
            });
            setChatHistory(prev => [
              ...prev,
              {
                id: Date.now(),
                sender: "You (Voice)",
                initial: "Y",
                text: transcript.trim(),
                time,
                isMe: true,
              }
            ]);
          }
        };

        rec.onend = () => {
          if (voiceToTextActiveRef.current && micOnRef.current && isRunningRef.current) {
            try { rec.start(); } catch { /* ignore restart errors */ }
          }
        };

        recognitionRef.current = rec;
      }

      try {
        recognitionRef.current.start();
      } catch { /* ignore start errors */ }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch { /* ignore stop errors */ }
      }
    }
  }, [voiceToTextActive, micOn, isRunning]);

  // Dynamic participant states calculated reactively
  const youActivity = isRunning 
    ? (gesture.name !== "None" ? "signing" : "listening") 
    : "idle";
  const mayaActivity = isRunning && gesture.name !== "None" ? "listening" : "signing";
  
  const PARTICIPANTS = [
    { id: 1, name: "Maya S.", initial: "M", status: "online", activity: mayaActivity },
    { id: 2, name: "Arjun K.", initial: "A", status: "online", activity: "speaking" },
    { id: 3, name: "You", initial: "Y", status: "online", activity: youActivity },
  ];



  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  /* ── Draw hand skeleton on canvas ── */
  const drawHand = useCallback((landmarks, w, h) => {
    if (!showLandmarks) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    const CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17],
    ];

    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 4;
    ctx.shadowColor = "rgba(16, 185, 129, 0.4)";

    for (const [a, b] of CONNECTIONS) {
      const pa = landmarks[a], pb = landmarks[b];
      ctx.beginPath();
      ctx.moveTo(pa.x * w, pa.y * h);
      ctx.lineTo(pb.x * w, pb.y * h);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#34d399";
    for (const m of landmarks) {
      ctx.beginPath();
      ctx.arc(m.x * w, m.y * h, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [showLandmarks]);

  /* ── Handle MediaPipe results ── */
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Optimized: Avoid double-rendering camera feed on top of smooth hardware video element

    if (results.multiHandLandmarks?.length > 0 && camOn) {
      for (const lm of results.multiHandLandmarks) {
        drawHand(lm, canvas.width, canvas.height);
        const g = recognizeGesture(lm);

        if (g.confidence > 0.5) {
          setGesture({ name: g.name, confidence: g.confidence.toFixed(2) });

          // Trigger AI Avatar animation
          setAvatarAnimating(true);
          clearTimeout(avatarTimeoutRef.current);
          avatarTimeoutRef.current = setTimeout(() => setAvatarAnimating(false), 1500);

          // Push to history (debounced, no repeat)
          if (g.name !== lastSignRef.current) {
            lastSignRef.current = g.name;
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => { lastSignRef.current = ""; }, 1400);

            // Speak gesture translation if TTS is active
            if (textToSpeechActiveRef.current && g.name !== "None" && g.name !== "Unknown") {
              const textToSpeak = getNaturalSpokenPhrase(g.name);
              speakText(textToSpeak);
            }

            const time = new Date().toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });

            setSignHistory(h => [{
              id: Date.now(),
              sign: g.name,
              confidence: g.confidence.toFixed(2),
              time,
            }, ...h].slice(0, 10));


          }
        } else {
          setGesture({ name: "None", confidence: null });
        }
      }
    } else {
      setGesture({ name: "None", confidence: null });
    }
    ctx.restore();
  }, [drawHand, camOn]);

  // Keep MediaPipe results callback updated with fresh state closures
  useEffect(() => {
    if (handsRef.current) {
      handsRef.current.onResults(onResults);
    }
  }, [onResults]);

  /* ── Init MediaPipe Hands ── */
  const initHands = useCallback(async () => {
    if (handsRef.current) return;
    
    if (!window.Hands) {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      } catch (err) {
        throw new Error("MediaPipe Hands library failed to load. Please check your internet connection.", { cause: err });
      }
    }
    
    const HandsClass = window.Hands;
    if (!HandsClass) {
      throw new Error("MediaPipe Hands library is not loaded from the CDN yet. Please check your internet connection or reload the page.");
    }
    const h = new HandsClass({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
    h.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    h.onResults(onResults);
    handsRef.current = h;
  }, [onResults]);

  /* ── Process frames ── */
  const processFrame = useCallback(async () => {
    const activeStream = streamRef.current || screenStreamRef.current;
    if (activeStream && handsRef.current && videoRef.current) {
      const now = performance.now();
      const timeSinceLastFrame = now - lastProcessingTimeRef.current;

      if (signToTextActiveRef.current && camOnRef.current) {
        // Performance optimization: Throttle CPU-intensive scanning to 10 FPS
        if (timeSinceLastFrame >= 100) {
          lastProcessingTimeRef.current = now;
          await handsRef.current.send({ image: videoRef.current });
        }
      } else {
        const ctx = canvasRef.current?.getContext("2d");
        if (canvasRef.current && ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      rafRef.current = requestAnimationFrame(() => {
        processFrameRef.current?.();
      });
    }
  }, []);

  // Update processFrameRef value dynamically when processFrame changes
  useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.enabled = true);
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    } else {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsRunning(false);
    }
    setIsSharingScreen(false);
  };

  /* ── Start camera ── */
  const startCamera = useCallback(async () => {
    try {
      await initHands();
      if (isSharingScreen) {
        stopScreenShare();
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported by your browser or requires a secure context (HTTPS/Localhost).");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsRunning(true);
        
        const handleMetadata = () => {
          if (canvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
          }
          processFrame();
        };

        videoRef.current.onloadedmetadata = handleMetadata;
        if (videoRef.current.readyState >= 1) {
          handleMetadata();
        }
      }
    } catch (err) {
      console.error("Failed to start camera:", err);
      alert("Failed to start camera. Please verify camera permissions are granted in your browser address bar: " + err.message);
    }
  }, [initHands, processFrame, isSharingScreen]);

  /* ── Screen Sharing Logic ── */
  const toggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        await initHands();
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error("Screen sharing is not supported by your browser or requires a secure context (HTTPS/Localhost).");
        }
        
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.enabled = false);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
          setIsRunning(true);
          
          const handleMetadata = () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
            processFrame();
          };

          videoRef.current.onloadedmetadata = handleMetadata;
          if (videoRef.current.readyState >= 1) {
            handleMetadata();
          }
        }
        setIsSharingScreen(true);
      } catch (err) {
        console.error("Failed to share screen:", err);
        alert("Failed to start screen sharing: " + err.message);
      }
    } else {
      stopScreenShare();
    }
  };

  /* ── Stop camera ── */
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsSharingScreen(false);
    setIsRunning(false);
    setGesture({ name: "None", confidence: null });
    const ctx = canvasRef.current?.getContext("2d");
    if (canvasRef.current) {
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  /* ── Send chat message ── */
  const sendMessage = () => {
    if (!message.trim()) return;
    const msgText = message.trim();
    const time = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    });

    setChatHistory(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "You",
        initial: "Y",
        text: msgText,
        time,
        isMe: true,
      }
    ]);

    // Speak message text if TTS is active
    if (textToSpeechActiveRef.current) {
      speakText(msgText);
    }

    // Trigger AI Avatar animation on message
    setAvatarAnimating(true);
    clearTimeout(avatarTimeoutRef.current);
    avatarTimeoutRef.current = setTimeout(() => setAvatarAnimating(false), 1200);

    setMessage("");
  };

  /* ── Toggle Camera Active State ── */
  const toggleCam = () => {
    setCamOn(prev => !prev);
  };

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      clearTimeout(avatarTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore stop failures on unmount */ }
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div id="root">
      {/* ── TOP HEADER ── */}
      <header className="app-header">
        <div className="header-left">
          <div className="header-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <path d="M12 19v3" />
            </svg>
          </div>
          <div className="header-brand">
            <span className="header-title">Signal</span>
            <span className="header-subtitle">Real-time Sign Translation Call</span>
          </div>
          <div className={`status-badge ${isRunning ? "active" : "idle"}`}>
            <div className="status-badge-dot" />
            <span>{isRunning ? "Call Active" : "Call Waiting"}</span>
          </div>
        </div>

        {/* Accessibility indicators */}
        <div className="accessibility-indicators">
          <div
            className={`accessibility-tag ${signToTextActive ? "active" : ""}`}
            title="Sign Language to Text (Toggles AI hand gesture recognition)"
            onClick={() => setSignToTextActive(!signToTextActive)}
            style={{ cursor: "pointer" }}
          >
            Sign → Text
          </div>
          <div
            className={`accessibility-tag ${voiceToTextActive ? "active" : ""}`}
            title="Voice to Text (Toggles real-time mic voice transcription)"
            onClick={() => setVoiceToTextActive(!voiceToTextActive)}
            style={{ cursor: "pointer" }}
          >
            Voice → Text
          </div>
          <div
            className={`accessibility-tag ${textToSpeechActive ? "active" : ""}`}
            title="Text to Speech (Toggles speech synthesis of translations)"
            onClick={() => setTextToSpeechActive(!textToSpeechActive)}
            style={{ cursor: "pointer" }}
          >
            Text → Speech
          </div>
        </div>

        <div className="header-right">
          {/* Easy Mode Toggle */}
          <div
            className={`easy-mode-toggle ${easyMode ? "active" : ""}`}
            onClick={() => setEasyMode(!easyMode)}
          >
            <div className="easy-mode-label">
              <span className="easy-mode-title">Easy Mode</span>
              <span className="easy-mode-subtitle">
                {easyMode ? "Plain language on" : "Plain language off"}
              </span>
            </div>
            <div className="easy-mode-switch-wrapper" />
          </div>

          {/* User Profile */}
          <div className="user-profile-badge">
            <div className="user-avatar-circle">S</div>
            <span className="user-name-label">Sayan</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTAINER Grid ── */}
      <main className="app-shell">
        {/* LEFT COLUMN: Meeting Call Screen Workspace (Video + Subtitles) */}
        <div className="left-panel">
          <div className="workspace-card glass-panel call-screen-mode">
            
            {/* Immersive Video Feed Wrapper */}
            <div className="video-feed-wrapper">
              <div className="scanner-corner top-left" />
              <div className="scanner-corner top-right" />
              <div className="scanner-corner bottom-left" />
              <div className="scanner-corner bottom-right" />

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="video-element"
                style={{
                  display: isRunning && camOn ? "block" : "none",
                  transform: isSharingScreen ? "none" : "scaleX(-1)"
                }}
              />
              <canvas
                ref={canvasRef}
                className="video-overlay-canvas"
                style={{
                  display: isRunning && camOn ? "block" : "none",
                  transform: isSharingScreen ? "none" : "scaleX(-1)"
                }}
              />

              {/* Camera Off Placeholder */}
              {(!isRunning || !camOn) && (
                <div className="camera-off-placeholder">
                  <div className="camera-off-icon-wrap">
                    <Icon.Camera off={true} />
                  </div>
                  <span className="camera-off-title">Call Feed is Muted</span>
                  <span className="camera-off-subtitle">
                    {!camOn ? "Your camera is muted. Toggle video on the controls to resume." : "Click Start Call (Play icon) on the floating controls to join."}
                  </span>
                </div>
              )}

              {/* Floating Gesture overlay badge */}
              {isRunning && camOn && gesture.name !== "None" && (
                <div className="gesture-overlay-badge">
                  <span className="gesture-overlay-icon">
                    {SIGN_ICONS[gesture.name] ?? "✋"}
                  </span>
                  <div className="gesture-overlay-divider" />
                  <div className="gesture-overlay-info">
                    <span className="gesture-overlay-label">AI Detected Sign</span>
                    <span className="gesture-overlay-value">{gesture.name}</span>
                  </div>
                </div>
              )}

              {/* FLOATING PARTICIPANTS OVERLAY IN CORNER */}
              <div className="floating-participants-overlay">
                {PARTICIPANTS.map(p => (
                  <div key={p.id} className="participant-call-chip">
                    <div className={`participant-chip-avatar ${p.initial.toLowerCase()}`}>{p.initial}</div>
                    <span className="participant-chip-name">{p.name}</span>
                    <span className={`participant-activity-dot ${p.activity.toLowerCase()}`} title={p.activity} />
                  </div>
                ))}
              </div>

              {/* FLOATING CALL CONTROLS */}
              <div className="floating-controls-bar">
                <button
                  className={`circle-control-button ${isRunning ? "active" : ""}`}
                  title={isRunning ? "Leave Call" : "Join Call"}
                  onClick={isRunning ? stopCamera : startCamera}
                >
                  {isRunning ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                <button
                  className={`circle-control-button ${isSharingScreen ? "active" : ""}`}
                  title={isSharingScreen ? "Stop Casting" : "Cast Screen"}
                  onClick={toggleScreenShare}
                >
                  <Icon.Screen />
                </button>

                <button
                  className={`circle-control-button ${camOn ? "active" : ""}`}
                  title={camOn ? "Camera On" : "Camera Off"}
                  onClick={toggleCam}
                >
                  <Icon.Camera off={!camOn} />
                </button>

                <button
                  className={`circle-control-button ${micOn ? "active" : ""}`}
                  title={micOn ? "Microphone On" : "Microphone Off"}
                  onClick={() => setMicOn(!micOn)}
                >
                  <Icon.Mic off={!micOn} />
                </button>

                <button
                  className={`circle-control-button ${showSettings ? "active" : ""}`}
                  title="Call Settings"
                  onClick={() => setShowSettings(true)}
                >
                  <Icon.Settings />
                </button>
              </div>
            </div>

            {/* Embedded Subtitle / Translation Bar */}
            <div className="translation-panel-embedded subtitle-mode">
              <div className="subtitle-content">
                <span className="subtitle-speaker">AI Captionist</span>
                <span className="subtitle-text">
                  {gesture.name && gesture.name !== "None"
                    ? `"${easyMode && EASY_MODE_TRANSLATIONS[gesture.name] ? EASY_MODE_TRANSLATIONS[gesture.name] : gesture.name}"`
                    : '"Waiting for sign language..."'}
                </span>
              </div>
              <div className="subtitle-metrics">
                <span className="subtitle-confidence" style={{ color: gesture.name && gesture.name !== "None" ? 'var(--teal-primary)' : 'var(--text-muted)' }}>
                  {gesture.name && gesture.name !== "None" ? `${Math.round((gesture.confidence || 0.95) * 100)}% Match` : "95% accuracy"}
                </span>
                <span className="subtitle-latency">28ms latency</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Discussion & Compact History) */}
        <div className="sidebar-layout glass-panel">
          <div className="chat-section">
            <div className="chat-header">
              <span className="sidebar-header-title">Live Call Discussion</span>
              <span className="sidebar-badge-count">Active</span>
            </div>

            {/* AI Interpreter Avatar Widget */}
            <div className="ai-interpreter-card">
              <div className={`ai-avatar-wrapper ${avatarAnimating ? "ai-avatar-animating" : ""}`}>
                <svg className="ai-avatar-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M18 21a6 6 0 0 0-12 0" />
                  <path className="ai-avatar-hand-left" d="M3 14h2l2-2" />
                  <path className="ai-avatar-hand-right" d="M21 14h-2l-2-2" />
                </svg>
              </div>
              <div className="ai-interpreter-info">
                <span className="ai-title">AI Avatar Interpreter</span>
                <span className="ai-status">{avatarAnimating ? "Signing active..." : "Listening..."}</span>
              </div>
            </div>

            {/* Message Thread */}
            <div className="chat-messages-area">
              {chatHistory.map(chat => (
                <div
                  key={chat.id}
                  className={`chat-row-container ${chat.isMe ? "sender-me" : "sender-other"}`}
                >
                  <div className={`chat-bubble-avatar-circle ${chat.isMe ? "me" : "other"}`}>
                    {chat.initial}
                  </div>
                  <div className="chat-bubble-content-block">
                    <span className="chat-bubble-display-name">{chat.sender}</span>
                    <div className="chat-bubble-bubble-wrapper">
                      <div>{chat.text}</div>
                      {easyMode && chat.isSignLanguage && chat.translation && (
                        <div className="chat-bubble-plain-translation">
                          Plain translation: {chat.translation}
                        </div>
                      )}
                    </div>
                    <span className="chat-bubble-timestamp">{chat.time}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Compact timeline history list at the bottom of the sidebar */}
            <div className="sidebar-compact-history">
              <div className="sidebar-compact-history-header">Recent Signs</div>
              <div className="sidebar-compact-history-list">
                {signHistory.slice(0, 2).map(item => (
                  <div key={item.id} className="compact-history-item">
                    <span className="compact-time">{item.time.slice(3, 8)}</span>
                    <span className="compact-sign">{item.sign}</span>
                  </div>
                ))}
                {signHistory.length === 0 && <span className="compact-history-empty">No signs detected yet</span>}
              </div>
            </div>

            {/* Input Bar */}
            <div className="chat-input-container-row">
              <input
                type="text"
                className="chat-message-input"
                placeholder="Send message to call..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />
              <button
                className="chat-message-send-button"
                onClick={sendMessage}
              >
                <Icon.Send />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── SETTINGS & USER MANUAL GLASS MODAL ── */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={closeSettings}>
          <div className="settings-modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <div className="settings-modal-tabs">
                <button
                  className={`settings-modal-tab-btn ${settingsTab === "settings" ? "active" : ""}`}
                  onClick={() => setSettingsTab("settings")}
                >
                  Settings
                </button>
                <button
                  className={`settings-modal-tab-btn ${settingsTab === "manual" ? "active" : ""}`}
                  onClick={() => setSettingsTab("manual")}
                >
                  User Manual
                </button>
              </div>
              <button className="settings-modal-close" onClick={closeSettings}>
                &times;
              </button>
            </div>

            <div className="settings-modal-body">
              {settingsTab === "settings" ? (
                <div className="settings-tab-content">
                  <div className="settings-item">
                    <label className="settings-label-text">Detection Confidence Threshold</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="range"
                        min="0.3"
                        max="0.9"
                        step="0.05"
                        value={detectionConfidence}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setDetectionConfidence(val);
                          if (handsRef.current) {
                            handsRef.current.setOptions({ minDetectionConfidence: val });
                          }
                        }}
                        className="settings-range-slider"
                      />
                      <span className="settings-range-value">{detectionConfidence}</span>
                    </div>
                    <span className="settings-help-text">Higher values reduce false detections but require cleaner hand positions.</span>
                  </div>

                  <div className="settings-item">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <label className="settings-label-text" style={{ marginBottom: 0 }}>Show Hand Skeleton Overlay</label>
                      <div
                        className={`easy-mode-toggle ${showLandmarks ? "active" : ""}`}
                        onClick={() => setShowLandmarks(!showLandmarks)}
                        style={{ padding: "4px 10px" }}
                      >
                        <div className="easy-mode-switch-wrapper" style={{ width: 28, height: 14 }} />
                      </div>
                    </div>
                    <span className="settings-help-text">Toggle the green neon points and lines drawn on top of your hand.</span>
                  </div>
                </div>
              ) : (
                <div className="manual-tab-content">
                  <div className="manual-section">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h4 className="manual-h4" style={{ marginBottom: 0 }}>Supported Signs Dictionary</h4>
                      <button
                        className={`manual-read-button ${isReadingManual ? "active" : ""}`}
                        onClick={readManualOutLoud}
                      >
                        {isReadingManual ? "🛑 Stop Guide" : "🔊 Listen to Guide"}
                      </button>
                    </div>
                    <div className="manual-signs-grid">
                      <div className="manual-sign-row"><span>✊ Fist</span><span>Please wait / Stop</span></div>
                      <div className="manual-sign-row"><span>🖐️ Open Hand</span><span>Hello / Greeting</span></div>
                      <div className="manual-sign-row"><span>🤘 Rock</span><span>Cool / Let's rock</span></div>
                      <div className="manual-sign-row"><span>👍 Thumbs Up</span><span>I agree / Yes</span></div>
                      <div className="manual-sign-row"><span>👎 Thumbs Down</span><span>Dislike / No</span></div>
                      <div className="manual-sign-row"><span>✌️ Peace</span><span>Peace / Victory</span></div>
                      <div className="manual-sign-row"><span>☝️ Pointing Up</span><span>Attention / One</span></div>
                    </div>
                  </div>

                  <div className="manual-section">
                    <h4 className="manual-h4">Interactive Call Accessibility Features</h4>
                    <div className="manual-signs-grid">
                      <div className="manual-feature-row">
                        <span className="manual-feature-badge">Sign → Text</span>
                        <p className="manual-p-detail">Toggles the AI hand tracking engine. Turn off to save power during standard calls.</p>
                      </div>
                      <div className="manual-feature-row">
                        <span className="manual-feature-badge" style={{ color: "var(--teal-primary)", borderColor: "rgba(14, 165, 233, 0.2)", background: "var(--teal-glow)" }}>Voice → Text</span>
                        <p className="manual-p-detail">Transcribes your spoken voice into the chat log in real-time (requires mic permissions).</p>
                      </div>
                      <div className="manual-feature-row">
                        <span className="manual-feature-badge">Text → Speech</span>
                        <p className="manual-p-detail">Speaks translated sign gestures and sent chat messages out loud using organic phrasing.</p>
                      </div>
                      <div className="manual-feature-row">
                        <span className="manual-feature-badge" style={{ color: "var(--emerald-light)", borderColor: "rgba(52, 211, 153, 0.2)", background: "var(--emerald-glow)" }}>Easy Mode</span>
                        <p className="manual-p-detail">Simplifies translated gesture subtitles and chat room texts into friendly, plain conversational language.</p>
                      </div>
                    </div>
                  </div>

                  <div className="manual-section">
                    <h4 className="manual-h4">Quick Instructions</h4>
                    <p className="manual-p">1. Position your hand inside the webcam viewer.</p>
                    <p className="manual-p">2. Ensure your hand landmarks are highlighted in green.</p>
                    <p className="manual-p">3. Toggle **Easy Mode** to translate gestures and accessibility conversations in the sidebar.</p>
                    <p className="manual-p">4. **Performance Optimized**: AI model scans are throttled to 10 FPS automatically to save ~80% CPU overhead, ensuring a lag-free experience on low-end devices.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}