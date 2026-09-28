
/* =====================================================
   D.I.S.C.O — MOBILE AI CORE
   PART 1 OF 10
   Configuration, storage and core setup
   ===================================================== */

"use strict";

/* ================= CONFIGURATION ================= */

const DISCO_CONFIG = {
  name: "D.I.S.C.O",
  model: "gemini-3.6-flash",
  language: "en-GB",
  temperature: 0.7,
  maxOutputTokens: 1500
};

const DISCO_STORAGE = {
  apiKey: "disco_api_key",
  memory: "disco_memory",
  history: "disco_chat_history"
};

/* ================= DOM ELEMENTS ================= */

const $ = (id) => document.getElementById(id);

const discoUI = {
  chat: $("chat"),
  input: $("msg"),
  send: $("send"),
  mic: $("mic") || $("mic-btn"),
  imageInput: $("imgInput") || $("img-input"),
  clear: $("clearBtn") || $("clear-btn"),
  key: $("keyBtn") || $("key-btn"),
  network: $("networkStatus"),
  voice: $("voiceStatus"),
  memory: $("memoryStatus"),
  state: $("stateText"),
  core: $("coreImage")
};

/* ================= CORE VARIABLES ================= */

let discoApiKey = localStorage.getItem(DISCO_STORAGE.apiKey) || "";
let discoBusy = false;
let discoListening = false;
let discoRecognition = null;
let discoSelectedImage = null;
let discoTimerInterval = null;
let discoTimerEnd = 0;

let discoHistory = [];

try {
  const savedHistory = JSON.parse(
    localStorage.getItem(DISCO_STORAGE.history) || "[]"
  );

  if (Array.isArray(savedHistory)) {
    discoHistory = savedHistory;
  }
} catch {
  discoHistory = [];
}

/* ================= STATUS HELPERS ================= */

function discoSetStatus(element, message) {
  if (element) {
    element.textContent = message;
  }
}

function discoSetCoreState(message) {
  discoSetStatus(discoUI.state, message);
}

function discoSetBusy(value) {
  discoBusy = value;

  if (discoUI.send) {
    discoUI.send.disabled = value;
  }

  if (discoUI.input) {
    discoUI.input.disabled = value;
  }

  discoSetCoreState(value ? "PROCESSING" : "CORE ACTIVE");
}

/* ================= CHAT DISPLAY ================= */

function discoAddMessage(role, message) {
  const chat = discoUI.chat;

  if (!chat) {
    console.log(`${role}: ${message}`);
    return null;
  }

  const item = document.createElement("div");
  item.className =
    `message ${role === "user" ? "user-message" : "ai-message"}`;

  const heading = document.createElement("strong");
  heading.textContent =
    role === "user" ? "BOSS" : "D.I.S.C.O";

  const content = document.createElement("div");
  content.className = "message-text";
  content.textContent = String(message);

  item.append(heading, content);
  chat.appendChild(item);

  chat.scrollTop = chat.scrollHeight;

  return item;
}

function discoUpdateMessage(item, message) {
  const content = item?.querySelector(".message-text");

  if (content) {
    content.textContent = String(message);
  }
}

function discoShowError(message) {
  discoAddMessage("assistant", `Sorry, Boss. ${message}`);
}

/* ================= INPUT HELPERS ================= */

function discoGetInput() {
  return (discoUI.input?.value || "").trim();
}

function discoClearInput() {
  if (discoUI.input) {
    discoUI.input.value = "";
  }
}

/* ================= API KEY SETTINGS ================= */

function discoConfigureAPIKey() {
  const enteredKey = prompt(
    "Enter your Gemini API key, Boss:"
  );

  if (enteredKey === null) return;

  const key = enteredKey.trim();

  if (!key) {
    discoApiKey = "";
    localStorage.removeItem(DISCO_STORAGE.apiKey);

    discoAddMessage(
      "assistant",
      "The saved API key has been removed."
    );

    return;
  }

  discoApiKey = key;

  localStorage.setItem(
    DISCO_STORAGE.apiKey,
    discoApiKey
  );

  discoAddMessage(
    "assistant",
    "API key saved in this browser, Boss."
  );
}

/* ================= NETWORK STATUS ================= */

function discoUpdateNetworkStatus() {
  discoSetStatus(
    discoUI.network,
    navigator.onLine ? "NETWORK ONLINE" : "NETWORK OFFLINE"
  );
}

window.addEventListener("online", discoUpdateNetworkStatus);
window.addEventListener("offline", discoUpdateNetworkStatus);

/* ================= PART 1 COMPLETE ================= */
/* =====================================================
   D.I.S.C.O — PART 2 OF 10
   Persistent memory system
   ===================================================== */

function discoGetMemory() {
  try {
    const data = JSON.parse(
      localStorage.getItem(DISCO_STORAGE.memory) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function discoUpdateMemoryStatus() {
  const memories = discoGetMemory();

  discoSetStatus(
    discoUI.memory,
    memories.length > 0
      ? `MEMORY ONLINE (${memories.length})`
      : "MEMORY EMPTY"
  );
}

function discoSaveMemory(text) {
  const value = String(text || "").trim();

  if (!value) {
    return "Boss, please tell me what to remember.";
  }

  const memories = discoGetMemory();

  memories.push({
    text: value.slice(0, 1000),
    date: new Date().toISOString()
  });

  // Keep the most recent 100 memories.
  localStorage.setItem(
    DISCO_STORAGE.memory,
    JSON.stringify(memories.slice(-100))
  );

  discoUpdateMemoryStatus();

  return "I have saved that to memory, Boss.";
}

function discoSearchMemory(query) {
  const searchTerm = String(query || "").trim().toLowerCase();

  if (!searchTerm) {
    return "Boss, please tell me what memory to search for.";
  }

  const results = discoGetMemory().filter((item) =>
    item.text.toLowerCase().includes(searchTerm)
  );

  if (results.length === 0) {
    return "I couldn't find a matching memory, Boss.";
  }

  return results
    .slice(-10)
    .map((item, index) => `${index + 1}. ${item.text}`)
    .join("\n");
}

function discoShowAllMemories() {
  const memories = discoGetMemory();

  if (memories.length === 0) {
    return "Your memory is empty, Boss.";
  }

  return memories
    .map((item, index) => {
      const date = new Date(item.date).toLocaleDateString("en-GB");

      return `${index + 1}. ${item.text} (${date})`;
    })
    .join("\n");
}

function discoClearMemory() {
  const confirmed = confirm(
    "Boss, do you want to permanently clear all saved memories?"
  );

  if (!confirmed) {
    return "Memory clearing cancelled.";
  }

  localStorage.removeItem(DISCO_STORAGE.memory);

  discoUpdateMemoryStatus();

  return "All saved memories have been cleared, Boss.";
}

function discoHandleMemoryCommand(message) {
  const text = String(message || "").trim();

  let match = text.match(
    /^(?:remember|save to memory|remember that)\s+(.+)$/i
  );

  if (match) {
    return discoSaveMemory(match[1]);
  }

  match = text.match(
    /^(?:recall|search memory|find memory)\s+(.+)$/i
  );

  if (match) {
    return discoSearchMemory(match[1]);
  }

  if (/^(?:show|list|view)\s+(?:all\s+)?memories$/i.test(text)) {
    return discoShowAllMemories();
  }

  if (/^(?:clear|delete|erase)\s+(?:all\s+)?memories$/i.test(text)) {
    return discoClearMemory();
  }

  return null;
}

/* ================= PART 2 COMPLETE ================= */
/* =====================================================
   D.I.S.C.O — PART 3 OF 10
   Gemini API connection and conversation context
   ===================================================== */

async function discoAskGemini(message, imageFile = null) {
  if (!discoApiKey) {
    discoConfigureAPIKey();

    if (!discoApiKey) {
      throw new Error("A Gemini API key is required.");
    }
  }

  const contents = [];

  // Include recent conversation context.
  const recentHistory = discoHistory.slice(-10);

  for (const entry of recentHistory) {
    if (!entry || !entry.text || !entry.role) continue;

    contents.push({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text: String(entry.text) }]
    });
  }

  const parts = [{ text: String(message) }];

  // Attach an image when one has been selected.
  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      throw new Error("Please select a valid image.");
    }

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");
        resolve(result.split(",")[1] || "");
      };

      reader.onerror = () => reject(
        new Error("Could not read the selected image.")
      );

      reader.readAsDataURL(imageFile);
    });

    parts.push({
      inline_data: {
        mime_type: imageFile.type,
        data: base64
      }
    });
  }

  contents.push({
    role: "user",
    parts
  });

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${DISCO_CONFIG.model}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": discoApiKey
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{
          text:
            "You are D.I.S.C.O, a helpful mobile AI assistant. " +
            "Address the user as Boss. Use clear, simple British English. " +
            "Answer naturally and accurately. Never claim an action was " +
            "completed unless it actually was."
        }]
      },
      contents,
      generationConfig: {
        temperature: DISCO_CONFIG.temperature,
        maxOutputTokens: DISCO_CONFIG.maxOutputTokens
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const detail = data.error?.message || `HTTP ${response.status}`;

    if (response.status === 429) {
      throw new Error(
        "Gemini quota or rate limit reached. Check your API quota. " + detail
      );
    }

    throw new Error(`Gemini API error: ${detail}`);
  }

  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!answer) {
    throw new Error("Gemini returned an empty response.");
  }

  return answer;
}

/* ================= PART 3 COMPLETE ================= */

/* =====================================================
   D.I.S.C.O — PART 4 OF 10
   Voice input and British English voice output
   ===================================================== */

/* ================= VOICE OUTPUT ================= */

function discoSpeak(text) {
  if (!("speechSynthesis" in window)) {
    discoSetStatus(discoUI.voice, "VOICE OUTPUT UNSUPPORTED");
    return;
  }

  window.speechSynthesis.cancel();

  const message = String(text || "").trim();
  if (!message) return;

  const utterance = new SpeechSynthesisUtterance(message);

  utterance.lang = DISCO_CONFIG.language;
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();

  const britishVoice = voices.find(
    voice => /^en-GB$/i.test(voice.lang)
  );

  if (britishVoice) {
    utterance.voice = britishVoice;
  }

  utterance.onstart = () => {
    discoSetStatus(discoUI.voice, "SPEAKING");
  };

  utterance.onend = () => {
    discoSetStatus(discoUI.voice, "VOICE READY");
  };

  utterance.onerror = () => {
    discoSetStatus(discoUI.voice, "VOICE ERROR");
  };

  window.speechSynthesis.speak(utterance);
}

/* ================= VOICE INPUT SETUP ================= */

function discoSetupVoiceInput() {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    discoRecognition = null;
    discoSetStatus(discoUI.voice, "VOICE INPUT UNSUPPORTED");
    return false;
  }

  discoRecognition = new SpeechRecognition();

  discoRecognition.lang = DISCO_CONFIG.language;
  discoRecognition.continuous = false;
  discoRecognition.interimResults = false;
  discoRecognition.maxAlternatives = 1;

  discoRecognition.onstart = () => {
    discoListening = true;
    discoSetStatus(discoUI.voice, "LISTENING");
    discoSetCoreState("LISTENING");
  };

  discoRecognition.onresult = (event) => {
    const result = event.results?.[0]?.[0];
    const transcript = result?.transcript?.trim();

    if (transcript && discoUI.input) {
      discoUI.input.value = transcript;

      // Part 10 will connect this to the main agent.
      discoSetStatus(discoUI.voice, "VOICE CAPTURED");
    }
  };

  discoRecognition.onerror = (event) => {
    discoListening = false;
    discoSetStatus(
      discoUI.voice,
      `VOICE ERROR: ${event.error}`
    );
    discoSetCoreState("CORE ACTIVE");
  };

  discoRecognition.onend = () => {
    discoListening = false;
    discoSetCoreState("CORE ACTIVE");

    if (discoUI.voice?.textContent === "LISTENING") {
      discoSetStatus(discoUI.voice, "VOICE READY");
    }
  };

  discoSetStatus(discoUI.voice, "VOICE READY");
  return true;
}

/* ================= START / STOP LISTENING ================= */

function discoToggleVoiceInput() {
  if (!discoRecognition) {
    const ready = discoSetupVoiceInput();

    if (!ready) {
      discoShowError(
        "voice input is not supported in this browser. Try a supported browser."
      );
      return;
    }
  }

  if (discoListening) {
    discoRecognition.stop();
    return;
  }

  try {
    discoRecognition.start();
  } catch (error) {
    console.error("D.I.S.C.O voice input:", error);

    discoSetStatus(discoUI.voice, "VOICE START FAILED");

    discoShowError(
      "I could not start voice recognition. Please try again."
    );
  }
}

/* ================= PART 4 COMPLETE ================= */

/* =====================================================
   D.I.S.C.O — PART 5 OF 10
   Weather report and current time/date
   ===================================================== */

/* ================= WEATHER REPORT ================= */

async function discoGetWeather(place = "Hyderabad") {
  const locationURL =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(place)}` +
    "&count=1&language=en&format=json";

  const locationResponse = await fetch(locationURL);

  if (!locationResponse.ok) {
    throw new Error("Unable to find the weather location.");
  }

  const locationData = await locationResponse.json();
  const location = locationData.results?.[0];

  if (!location) {
    return `Boss, I couldn't find the location "${place}".`;
  }

  const weatherURL =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    "&current=temperature_2m,relative_humidity_2m," +
    "apparent_temperature,precipitation,weather_code,wind_speed_10m" +
    "&daily=temperature_2m_max,temperature_2m_min," +
    "precipitation_probability_max" +
    "&timezone=auto";

  const weatherResponse = await fetch(weatherURL);

  if (!weatherResponse.ok) {
    throw new Error("The weather service is unavailable.");
  }

  const data = await weatherResponse.json();
  const current = data.current;
  const daily = data.daily;

  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Heavy rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm with hail"
  };

  return [
    `WEATHER REPORT — ${location.name}, ${location.country || ""}`,
    `Condition: ${descriptions[current.weather_code] || "Unknown conditions"}`,
    `Temperature: ${current.temperature_2m} °C`,
    `Feels like: ${current.apparent_temperature} °C`,
    `Humidity: ${current.relative_humidity_2m}%`,
    `Wind speed: ${current.wind_speed_10m} km/h`,
    `Precipitation: ${current.precipitation} mm`,
    `Today's maximum: ${daily.temperature_2m_max[0]} °C`,
    `Today's minimum: ${daily.temperature_2m_min[0]} °C`,
    `Maximum rain probability: ${daily.precipitation_probability_max[0]}%`
  ].join("\n");
}

/* ================= CURRENT TIME AND DATE ================= */

function discoGetCurrentTime() {
  const now = new Date();

  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const date = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone
  });

  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone
  });

  return [
    `Date: ${date}`,
    `Time: ${time}`,
    `Time zone: ${timeZone}`
  ].join("\n");
}

/* ================= PART 5 COMPLETE ================= */

/* =====================================================
   D.I.S.C.O — PART 6 OF 10
   Timer, cancellation and calculator
   ===================================================== */

/* ================= TIMER ================= */

function discoStopTimer(announce = true) {
  if (discoTimerInterval) {
    clearInterval(discoTimerInterval);
  }

  discoTimerInterval = null;
  discoTimerEnd = 0;

  discoSetStatus($("timerStatus"), "TIMER OFF");

  if (announce) {
    return "Timer cancelled, Boss.";
  }

  return "Timer stopped.";
}

function discoStartTimer(seconds) {
  const duration = Number(seconds);

  if (!Number.isFinite(duration) || duration <= 0) {
    return "Boss, please provide a timer duration greater than zero.";
  }

  discoStopTimer(false);

  const safeDuration = Math.min(Math.floor(duration), 86400);

  discoTimerEnd = Date.now() + safeDuration * 1000;

  discoTimerInterval = setInterval(() => {
    const remaining = Math.max(
      0,
      Math.ceil((discoTimerEnd - Date.now()) / 1000)
    );

    if (remaining <= 0) {
      discoStopTimer(false);

      discoSetStatus($("timerStatus"), "TIMER FINISHED");

      discoAddMessage(
        "assistant",
        "Boss, your timer has finished."
      );

      discoSpeak("Boss, your timer has finished.");
      return;
    }

    const minutes = Math.floor(remaining / 60);
    const secondsLeft = remaining % 60;

    discoSetStatus(
      $("timerStatus"),
      `TIMER ${minutes}:${String(secondsLeft).padStart(2, "0")}`
    );
  }, 250);

  return `Timer started for ${safeDuration} seconds, Boss.`;
}

/* ================= CALCULATOR ================= */

function discoCalculate(expression) {
  const input = String(expression || "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .trim();

  if (!input) {
    return "Boss, please provide a calculation.";
  }

  // Only allow basic arithmetic characters.
  if (!/^[0-9+\-*/().%\s]+$/.test(input)) {
    return "Use numbers and basic arithmetic operators only.";
  }

  if (!/\d/.test(input)) {
    return "Please provide a valid arithmetic expression.";
  }

  try {
    // The character whitelist above prevents other JavaScript
    // expressions from being evaluated.
    const result = Function(
      `"use strict"; return (${input});`
    )();

    if (typeof result !== "number" || !Number.isFinite(result)) {
      return "That calculation has no finite result.";
    }

    return `Answer: ${result}`;
  } catch {
    return "Boss, I couldn't calculate that expression.";
  }
}

/* ================= PART 6 COMPLETE ================= */

/* =====================================================
   D.I.S.C.O — PART 7 OF 10
   Camera, image selection and AI image analysis
   ===================================================== */

/* ================= OPEN CAMERA ================= */

function discoOpenCamera() {
  if (!discoUI.imageInput) {
    discoShowError(
      "the image input is missing from index.html."
    );
    return;
  }

  discoUI.imageInput.accept = "image/*";
  discoUI.imageInput.setAttribute("capture", "environment");
  discoUI.imageInput.click();
}

/* ================= IMAGE INPUT ================= */

function discoSetupImageInput() {
  const input = discoUI.imageInput;

  if (!input) {
    console.warn("D.I.S.C.O: image input element not found.");
    return;
  }

  input.accept = "image/*";

  input.addEventListener("change", () => {
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      discoShowError("please select an image file.");
      input.value = "";
      return;
    }

    discoSelectedImage = file;

    discoAddMessage(
      "assistant",
      `Image selected: ${file.name}. Boss, type your question about the image and press SEND.`
    );
  });
}

/* ================= IMAGE TO BASE64 ================= */

function discoImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataURL = String(reader.result || "");
      const base64 = dataURL.split(",")[1];

      if (!base64) {
        reject(new Error("Could not convert the image."));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Could not read the image file."));
    };

    reader.readAsDataURL(file);
  });
}

/* ================= ANALYSE IMAGE ================= */

async function discoAnalyseImage(file, question) {
  if (!file) {
    return "Boss, select an image first.";
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("The selected file is not an image.");
  }

  const base64 = await discoImageToBase64(file);

  const prompt = question?.trim() ||
    "Describe this image and explain what can be seen.";

  return discoAskGemini(
    prompt,
    new File(
      [file],
      file.name,
      { type: file.type }
    )
  );
}

/* ================= IMAGE COMMAND HANDLER ================= */

function discoHandleImageCommand(message) {
  const text = String(message || "").trim();

  if (
    /^(?:open camera|take photo|take a photo|choose image|select image)$/i
      .test(text)
  ) {
    discoOpenCamera();

    return "Boss, choose or capture an image, then send your question.";
  }

  if (
    /^(?:cancel image|remove image|clear image)$/i.test(text)
  ) {
    discoSelectedImage = null;

    if (discoUI.imageInput) {
      discoUI.imageInput.value = "";
    }

    return "Selected image cleared, Boss.";
  }

  return null;
}

/* ================= PART 7 COMPLETE ================= */

/* =====================================================
   D.I.S.C.O — PART 8 OF 10
   YouTube, Google, GitHub, URLs and subtitles
   ===================================================== */

/* ================= YOUTUBE SEARCH ================= */

function discoSearchYouTube(query) {
  const search = String(query || "").trim();

  if (!search) {
    return "Boss, please tell me what you want to search on YouTube.";
  }

  const url =
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(search);

  window.open(url, "_blank", "noopener,noreferrer");

  return `YouTube search opened for: ${search}`;
}

/* ================= GOOGLE SEARCH ================= */

function discoSearchGoogle(query) {
  const search = String(query || "").trim();

  if (!search) {
    return "Boss, please tell me what you want to search for.";
  }

  const url =
    "https://www.google.com/search?q=" +
    encodeURIComponent(search);

  window.open(url, "_blank", "noopener,noreferrer");

  return `Google search opened for: ${search}`;
}

/* ================= OPEN WEBSITE ================= */

function discoOpenURL(address) {
  let value = String(address || "").trim();

  if (!value) {
    return "Boss, please provide a website address.";
  }

  if (!/^https?:\/\//i.test(value)) {
    value = "https://" + value;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "Only normal web addresses can be opened.";
    }

    window.open(
      url.href,
      "_blank",
      "noopener,noreferrer"
    );

    return `Opened ${url.hostname}, Boss.`;
  } catch {
    return "Boss, that website address is not valid.";
  }
}

/* ================= GITHUB ================= */

function discoOpenGitHub(query = "") {
  const search = String(query || "").trim();

  if (!search) {
    window.open(
      "https://github.com/",
      "_blank",
      "noopener,noreferrer"
    );

    return "GitHub opened, Boss.";
  }

  const url =
    "https://github.com/search?q=" +
    encodeURIComponent(search);

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

  return `GitHub search opened for: ${search}`;
}

/* ================= SUBTITLE SEARCH ================= */

function discoSearchSubtitles(query) {
  const search = String(query || "").trim();

  if (!search) {
    return "Boss, please provide the video or topic.";
  }

  const youtubeURL =
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(
      `${search} subtitles transcript captions`
    );

  window.open(
    youtubeURL,
    "_blank",
    "noopener,noreferrer"
  );

  return (
    `I opened a subtitle and transcript search for "${search}", Boss.\n` +
    "If the video provides captions, they can be opened from the video."
  );
}

/* ================= SEARCH COMMANDS ================= */

function discoHandleSearchCommand(message) {
  const text = String(message || "").trim();

  let match;

  /* YouTube */

  match = text.match(
    /^(?:search youtube|youtube search)\s+(.+)$/i
  );

  if (match) {
    return discoSearchYouTube(match[1]);
  }

  /* Google */

  match = text.match(
    /^(?:search google|google search|web search|search the web)\s+(.+)$/i
  );

  if (match) {
    return discoSearchGoogle(match[1]);
  }

  /* Website */

  match = text.match(
    /^(?:open website|open site|open url)\s+(.+)$/i
  );

  if (match) {
    return discoOpenURL(match[1]);
  }

  /* GitHub */

  match = text.match(
    /^(?:open github|github search)\s*(.*)$/i
  );

  if (match) {
    return discoOpenGitHub(match[1]);
  }

  /* Subtitles */

  match = text.match(
    /^(?:search subtitles|find subtitles|search captions|find captions)\s*(.*)$/i
  );

  if (match) {
    return discoSearchSubtitles(
      match[1] || "YouTube video"
    );
  }

  return null;
}

/* ================= PART 8 COMPLETE ================= */
/* =====================================================
   D.I.S.C.O — PART 9 OF 10
   Battery • Device • Network • Telugu Translation
   ===================================================== */

/* ================= BATTERY ================= */

async function discoGetBattery() {
  if (!navigator.getBattery) {
    return "Boss, battery information is not supported by this browser.";
  }

  const battery = await navigator.getBattery();

  const level = Math.round(battery.level * 100);

  return [
    `Battery level: ${level}%`,
    `Charging: ${battery.charging ? "Yes" : "No"}`
  ].join("\n");
}

/* ================= DEVICE INFORMATION ================= */

function discoGetDeviceInfo() {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  return [
    `Platform: ${navigator.platform || "Unknown"}`,
    `Language: ${navigator.language || "Unknown"}`,
    `Online: ${navigator.onLine ? "Yes" : "No"}`,
    `Screen: ${screen.width} × ${screen.height}`,
    `Connection: ${connection?.effectiveType || "Unknown"}`,
    `Downlink: ${
      connection?.downlink != null
        ? connection.downlink + " Mbps"
        : "Unknown"
    }`,
    `Browser: ${navigator.userAgent}`
  ].join("\n");
}

/* ================= TELUGU TRANSLATION ================= */

async function discoTranslateTelugu(text, direction) {
  const value = String(text || "").trim();

  if (!value) {
    return "Boss, please provide the text to translate.";
  }

  const mode = direction || "English to Telugu";

  return discoAskGemini(
    `Translate the following text from ${mode}.
Return only the translation.
Keep the original meaning.

Text:
${value}`
  );
}

/* ================= TOOL COMMAND HANDLER ================= */

async function discoHandleUtilityCommand(message) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  /* Battery */

  if (
    /\b(battery|battery level|charging status|charging)\b/.test(lower)
  ) {
    return await discoGetBattery();
  }

  /* Device */

  if (
    /\b(device info|device information|system info|system information)\b/.test(lower)
  ) {
    return discoGetDeviceInfo();
  }

  /* Network */

  if (
    /\b(network info|network information|internet status|connection status)\b/.test(lower)
  ) {
    return discoGetDeviceInfo();
  }

  /* English → Telugu */

  let match = text.match(
    /^(?:translate to telugu|english to telugu)\s*[:\-]?\s*(.+)$/i
  );

  if (match) {
    return await discoTranslateTelugu(
      match[1],
      "English to Telugu"
    );
  }

  /* Telugu → English */

  match = text.match(
    /^(?:translate to english|telugu to english)\s*[:\-]?\s*(.+)$/i
  );

  if (match) {
    return await discoTranslateTelugu(
      match[1],
      "Telugu to English"
    );
  }

  return null;
}

/* ================= PART 9 COMPLETE ================= */
/* =====================================================
   D.I.S.C.O — PART 10 OF 10
   FINAL AGENT • TOOL ROUTER • BUTTONS • STARTUP
   ===================================================== */

/* ================= MAIN TOOL ROUTER ================= */

async function discoRunTool(message) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();

  if (!text) {
    return null;
  }

  /* ---------- MEMORY ---------- */

  const memoryResult = discoHandleMemoryCommand(text);

  if (memoryResult !== null) {
    return memoryResult;
  }

  /* ---------- IMAGE / CAMERA ---------- */

  const imageResult = discoHandleImageCommand(text);

  if (imageResult !== null) {
    return imageResult;
  }

  /* ---------- SEARCH / GITHUB / URL / SUBTITLES ---------- */

  const searchResult = discoHandleSearchCommand(text);

  if (searchResult !== null) {
    return searchResult;
  }

  /* ---------- BATTERY / DEVICE / NETWORK / TRANSLATION ---------- */

  const utilityResult = await discoHandleUtilityCommand(text);

  if (utilityResult !== null) {
    return utilityResult;
  }

  /* ---------- TIMER CANCEL ---------- */

  if (
    /^(?:cancel|stop|clear)\s+(?:the\s+)?timer$/i.test(text)
  ) {
    return discoStopTimer(true);
  }

  /* ---------- TIMER START ---------- */

  let match = text.match(
    /^(?:start|set)\s+(?:a\s+)?timer\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)$/i
  );

  if (match) {
    let seconds = Number(match[1]);
    const unit = match[2].toLowerCase();

    if (/minute|min/.test(unit)) {
      seconds *= 60;
    }

    if (/hour|hr/.test(unit)) {
      seconds *= 3600;
    }

    return discoStartTimer(seconds);
  }

  /* ---------- TIME / DATE ---------- */

  if (
    /\b(current time|what time is it|what's the time|time now|date today|today's date|current date)\b/i
      .test(lower)
  ) {
    return discoGetCurrentTime();
  }

  /* ---------- WEATHER ---------- */

  match = text.match(
    /^(?:weather|weather report)(?:\s+(?:in|at|for))?\s*(.*)$/i
  );

  if (match) {
    const place = match[1].trim() || "Hyderabad";

    return await discoGetWeather(place);
  }

  /* ---------- CALCULATOR ---------- */

  match = text.match(
    /^(?:calculate|calculator|compute|solve)\s+(.+)$/i
  );

  if (match) {
    return discoCalculate(match[1]);
  }

  /* Direct arithmetic */

  if (
    /^[0-9+\-*/().%\s×÷−]+$/.test(text) &&
    /\d/.test(text)
  ) {
    return discoCalculate(text);
  }

  /* ---------- CAMERA ---------- */

  if (
    /^(?:camera|open camera|take photo|take a photo)$/i.test(text)
  ) {
    return discoOpenCamera();
  }

  /* ---------- OTHERWISE USE GEMINI ---------- */

  return null;
}


/* ================= MAIN D.I.S.C.O AGENT ================= */

async function discoAgent(message) {
  const text = String(message || "").trim();

  if (!text) {
    return;
  }

  if (discoBusy) {
    return;
  }

  discoSetBusy(true);

  const userMessage = discoAddMessage(
    "user",
    text
  );

  discoHistory.push({
    role: "user",
    text,
    time: Date.now()
  });

   localStorage.setItem(
    DISCO_STORAGE.history,
    JSON.stringify(discoHistory.slice(-50))
  );

  discoClearInput();

  const replyMessage = discoAddMessage(
    "assistant",
    "Processing, Boss..."
  );

  try {
    let answer = null;

    /* ---------- IMAGE QUESTION ---------- */

    if (discoSelectedImage) {
      const image = discoSelectedImage;

      discoSelectedImage = null;

      if (discoUI.imageInput) {
        discoUI.imageInput.value = "";
      }

      answer = await discoAskGemini(
        text,
        image
      );
    }

    /* ---------- LOCAL TOOL ---------- */

    if (answer === null) {
      answer = await discoRunTool(text);
    }

    /* ---------- GEMINI AI ---------- */

    if (answer === null) {
      answer = await discoAskGemini(text);
    }

    /* ---------- DISPLAY ---------- */

    discoUpdateMessage(
      replyMessage,
      answer
    );

    discoHistory.push({
      role: "assistant",
      text: answer,
      time: Date.now()
    });

    localStorage.setItem(
      DISCO_STORAGE.history,
      JSON.stringify(discoHistory.slice(-50))
    );

    /* ---------- VOICE ---------- */

    discoSpeak(answer);

  } catch (error) {

    console.error(
      "D.I.S.C.O ERROR:",
      error
    );

    const errorMessage =
      error?.message ||
      "An unexpected error occurred.";

    discoUpdateMessage(
      replyMessage,
      `Sorry, Boss. ${errorMessage}`
    );

  } finally {

    discoSetBusy(false);
  }
}


/* ================= SEND BUTTON ================= */

function discoSendMessage() {
  const message = discoGetInput();

  if (!message) {
    return;
  }

  discoAgent(message);
}


/* ================= ENTER KEY ================= */

function discoSetupInput() {

  if (!discoUI.input) {
    return;
  }

  discoUI.input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        discoSendMessage();
      }
    }
  );
}


/* ================= SEND BUTTON EVENT ================= */

function discoSetupSendButton() {

  if (!discoUI.send) {
    return;
  }

  discoUI.send.addEventListener(
    "click",
    discoSendMessage
  );
}


/* ================= MIC BUTTON ================= */

function discoSetupMicButton() {

  if (!discoUI.mic) {
    return;
  }

  discoUI.mic.addEventListener(
    "click",
    discoToggleVoiceInput
  );
}


/* ================= API KEY BUTTON ================= */

function discoSetupKeyButton() {

  if (!discoUI.key) {
    return;
  }

  discoUI.key.addEventListener(
    "click",
    discoConfigureAPIKey
  );
}


/* ================= CLEAR CHAT ================= */

function discoSetupClearButton() {

  if (!discoUI.clear) {
    return;
  }

  discoUI.clear.addEventListener(
    "click",
    () => {

      const confirmed = confirm(
        "Boss, clear the chat history?"
      );

      if (!confirmed) {
        return;
      }

      if (discoUI.chat) {
        discoUI.chat.replaceChildren();
      }

      discoHistory = [];

      localStorage.removeItem(
        DISCO_STORAGE.history
      );

      discoAddMessage(
        "assistant",
        "Chat cleared, Boss. Your memories are still محفوظ."
      );
    }
  );
}


/* ================= CAMERA BUTTON ================= */

function discoSetupCameraButton() {

  if (!discoUI.core) {
    return;
  }

  discoUI.core.addEventListener(
    "dblclick",
    () => {
      discoOpenCamera();
    }
  );
}


/* ================= SPEECH VOICES ================= */

function discoLoadVoices() {

  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.getVoices();

  discoSetStatus(
    discoUI.voice,
    "VOICE READY"
  );
}

if ("speechSynthesis" in window) {

  window.speechSynthesis.onvoiceschanged =
    discoLoadVoices;
}


/* ================= STARTUP ================= */

function discoInitialise() {

  /* Network */

  discoUpdateNetworkStatus();

  /* Memory */

  discoUpdateMemoryStatus();

  /* Voice */

  discoSetupVoiceInput();

  /* Image */

  discoSetupImageInput();

  /* Buttons */

  discoSetupInput();
  discoSetupSendButton();
  discoSetupMicButton();
  discoSetupKeyButton();
  discoSetupClearButton();
  discoSetupCameraButton();

  /* Voice */

  discoLoadVoices();

  /* Core */

  discoSetCoreState(
    "CORE ACTIVE"
  );

  /* Timer */

  discoSetStatus(
    $("timerStatus"),
    "TIMER OFF"
  );

  console.log(
    "D.I.S.C.O MOBILE AI CORE ONLINE"
  );
}


/* ================= START D.I.S.C.O ================= */

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    discoInitialise
  );

} else {

  discoInitialise();

}


/* =====================================================
   D.I.S.C.O — 10 PARTS COMPLETE
   ===================================================== */
        
