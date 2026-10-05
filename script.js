/* =========================================================
   DISCO AI
   SCRIPT.JS — PART 1 OF 3
========================================================= */


/* =========================
   CONFIGURATION
========================= */

const DISCO_NAME = "DISCO";

const GEMINI_MODEL = "gemini-2.5-flash";

const API_KEY_STORAGE = "disco_gemini_key";

const MEMORY_STORAGE = "disco_memory";

const TOMORROW_STORAGE = "disco_tomorrow_plan";

let recognition = null;

let isListening = false;

let cameraImage = null;


/* =========================
   ELEMENTS
========================= */

const msgInput = document.getElementById("msg");

const sendBtn = document.getElementById("send");

const micBtn = document.getElementById("mic");

const chat = document.getElementById("chat");

const clock = document.getElementById("clock");

const dateElement = document.getElementById("date");

const cameraBtn = document.getElementById("cameraBtn");

const cameraInput = document.getElementById("cameraInput");

const memoryBtn = document.getElementById("memoryBtn");

const playMemoryBtn = document.getElementById("playMemoryBtn");

const keyBtn = document.getElementById("keyBtn");

const keyModal = document.getElementById("keyModal");

const apiKeyInput = document.getElementById("apiKeyInput");

const saveKeyBtn = document.getElementById("saveKeyBtn");

const closeKeyBtn = document.getElementById("closeKeyBtn");


/* =========================
   CLOCK
========================= */

function updateClock() {

  const now = new Date();

  clock.textContent =
    now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  dateElement.textContent =
    now.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
}

updateClock();

setInterval(updateClock, 1000);


/* =========================
   CHAT MESSAGE
========================= */

function addMessage(text, sender = "disco") {

  const box = document.createElement("div");

  box.className =
    sender === "user"
      ? "message user-message"
      : "message disco-message";

  const name =
    sender === "user"
      ? "YOU"
      : "DISCO";

  box.innerHTML = `
    <div class="message-name">${name}</div>
    <div>${escapeHTML(text).replace(/\n/g, "<br>")}</div>
  `;

  chat.appendChild(box);

  chat.scrollTop = chat.scrollHeight;
}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   API KEY
========================= */

function getApiKey() {

  return localStorage.getItem(API_KEY_STORAGE) || "";
}


function saveApiKey(key) {

  localStorage.setItem(API_KEY_STORAGE, key.trim());
}


function openKeyModal() {

  apiKeyInput.value = getApiKey();

  keyModal.classList.remove("hidden");

  setTimeout(() => {
    apiKeyInput.focus();
  }, 100);
}


function closeKeyModal() {

  keyModal.classList.add("hidden");
}


keyBtn.addEventListener("click", openKeyModal);


closeKeyBtn.addEventListener("click", closeKeyModal);


saveKeyBtn.addEventListener("click", () => {

  const key = apiKeyInput.value.trim();

  if (!key) {

    addMessage(
      "Please enter your Gemini API key, Boss."
    );

    return;
  }

  saveApiKey(key);

  closeKeyModal();

  addMessage(
    "Gemini API key saved successfully, Boss."
  );

  speak(
    "Gemini API key saved successfully, Boss."
  );
});


/* =========================
   SPEECH
========================= */

function findMaleVoice() {

  const voices = speechSynthesis.getVoices();

  const preferredNames = [
    "Google UK English Male",
    "Microsoft George",
    "Microsoft Ryan",
    "Microsoft Guy",
    "Daniel",
    "Alex"
  ];

  for (const name of preferredNames) {

    const found = voices.find(v =>
      v.name.toLowerCase().includes(name.toLowerCase())
    );

    if (found) {
      return found;
    }
  }

  const englishVoice =
    voices.find(v =>
      /^en/i.test(v.lang)
    );

  return englishVoice || voices[0];
}


function speak(text) {

  if (!("speechSynthesis" in window)) {
    return;
  }

  speechSynthesis.cancel();

  const cleanText =
    String(text)
      .replace(/[*_#`]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  if (!cleanText) {
    return;
  }

  const utterance =
    new SpeechSynthesisUtterance(cleanText);

  const voice = findMaleVoice();

  if (voice) {
    utterance.voice = voice;
  }

  utterance.lang = "en-GB";

  utterance.rate = 0.95;

  utterance.pitch = 0.75;

  utterance.volume = 1;

  speechSynthesis.speak(utterance);
}


speechSynthesis.onvoiceschanged = () => {
  speechSynthesis.getVoices();
};


/* =========================
   MEMORY
========================= */

function getMemory() {

  try {

    return JSON.parse(
      localStorage.getItem(MEMORY_STORAGE) || "[]"
    );

  } catch {

    return [];
  }
}


function saveMemory(text) {

  const memory = getMemory();

  memory.push({
    text: text,
    time: new Date().toISOString()
  });

  localStorage.setItem(
    MEMORY_STORAGE,
    JSON.stringify(memory)
  );
}


function clearMemory() {

  localStorage.removeItem(MEMORY_STORAGE);

  addMessage(
    "Memory cleared, Boss."
  );

  speak(
    "Memory cleared, Boss."
  );
}


function memoryCommand(text) {

  const q = text.toLowerCase().trim();


  /* REMEMBER */

  if (
    /^(remember|save|memorise|memorize)\b/.test(q)
  ) {

    const value =
      text
        .replace(
          /^(remember|save|memorise|memorize)\s*(that\s*)?/i,
          ""
        )
        .trim();

    if (!value) {

      return "What should I remember, Boss?";
    }

    saveMemory(value);

    return `I remembered that, Boss: ${value}`;
  }


  /* SHOW MEMORY */

  if (
    /^(show|read|tell me|what is in)\b.*\bmemory\b/i.test(q) ||
    /what do you remember/i.test(q)
  ) {

    const memory = getMemory();

    if (!memory.length) {

      return "My memory is empty, Boss.";
    }

    return (
      "Here is what I remember, Boss:\n" +
      memory
        .map((item, index) =>
          `${index + 1}. ${item.text}`
        )
        .join("\n")
    );
  }


  /* CLEAR MEMORY */

  if (
    /^(forget everything|clear memory|erase memory|delete memory)$/i
      .test(q)
  ) {

    clearMemory();

    return null;
  }


  return undefined;
}


/* =========================
   TOMORROW PLAN
========================= */

function saveTomorrowPlan(plan) {

  localStorage.setItem(
    TOMORROW_STORAGE,
    JSON.stringify({
      plan: plan,
      savedAt: new Date().toISOString()
    })
  );
}


function getTomorrowPlan() {

  try {

    return JSON.parse(
      localStorage.getItem(TOMORROW_STORAGE)
    );

  } catch {

    return null;
  }
}


/* =========================
   TOOL: CURRENT TIME
========================= */

function getCurrentTime() {

  const now = new Date();

  return `The current time is ${now.toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  )}, Boss.`;
}


/* =========================
   TOOL: CURRENT DATE
========================= */

function getCurrentDate() {

  const now = new Date();

  return `Today is ${now.toLocaleDateString(
    "en-GB",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  )}, Boss.`;
}


/* =========================
   TOOL: CALCULATOR
========================= */

function calculate(expression) {

  let clean =
    expression
      .replace(/,/g, "")
      .replace(/\^/g, "**")
      .trim();

  if (
    !/^[0-9+\-*/().%\s*]+$/.test(clean)
  ) {
    return null;
  }

  try {

    const result = Function(
      `"use strict"; return (${clean})`
    )();

    if (!Number.isFinite(result)) {
      return null;
    }

    return `The answer is ${result}, Boss.`;

  } catch {

    return null;
  }
}


/* =========================
   TOOL: YOUTUBE
========================= */

function openYouTubeSearch(query) {

  const url =
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(query);

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

  return `I opened YouTube and searched for "${query}", Boss.`;
}


function openYouTube() {

  window.open(
    "https://www.youtube.com/",
    "_blank",
    "noopener,noreferrer"
  );

  return "YouTube is open, Boss.";
}
/* =========================================================
   DISCO AI
   SCRIPT.JS — PART 2 OF 3
========================================================= */


/* =========================
   WEATHER
========================= */

async function getWeather(place = "Visakhapatnam") {

  try {

    const geoURL =
      "https://geocoding-api.open-meteo.com/v1/search" +
      `?name=${encodeURIComponent(place)}` +
      "&count=1" +
      "&language=en" +
      "&format=json";

    const geoResponse =
      await fetch(geoURL);

    const geoData =
      await geoResponse.json();

    if (
      !geoData.results ||
      !geoData.results.length
    ) {

      return `I couldn't find ${place}, Boss.`;
    }

    const location =
      geoData.results[0];

    const latitude =
      location.latitude;

    const longitude =
      location.longitude;

    const forecastURL =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
      "&timezone=auto";

    const response =
      await fetch(forecastURL);

    const data =
      await response.json();

    const current =
      data.current;

    return (
      `Weather in ${location.name}, Boss:\n` +
      `Temperature: ${current.temperature_2m}°C\n` +
      `Feels like: ${current.apparent_temperature}°C\n` +
      `Humidity: ${current.relative_humidity_2m}%\n` +
      `Wind: ${current.wind_speed_10m} km/h`
    );

  } catch {

    return "I couldn't get the weather right now, Boss.";
  }
}


/* =========================
   LOCATION
========================= */

function getMyLocation() {

  return new Promise(resolve => {

    if (!navigator.geolocation) {

      resolve(
        "Your browser does not support location, Boss."
      );

      return;
    }


    navigator.geolocation.getCurrentPosition(

      position => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        resolve(
          `Your approximate coordinates are ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, Boss.`
        );
      },

      error => {

        if (error.code === 1) {

          resolve(
            "Location permission was denied, Boss. Please allow location access in your browser if you want DISCO to use your location."
          );

        } else {

          resolve(
            "I couldn't access your location right now, Boss."
          );
        }
      },

      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}


/* =========================
   OPEN WEBSITE
========================= */

function openWebsite(name) {

  const sites = {

    google:
      "https://www.google.com/",

    youtube:
      "https://www.youtube.com/",

    github:
      "https://github.com/",

    instagram:
      "https://www.instagram.com/"
  };


  const url =
    sites[name];

  if (!url) {

    return null;
  }

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

  return `${name} is open, Boss.`;
}


/* =========================
   GOOGLE SEARCH
========================= */

function googleSearch(query) {

  const url =
    "https://www.google.com/search?q=" +
    encodeURIComponent(query);

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

  return `I searched Google for "${query}", Boss.`;
}


/* =========================
   TOMORROW SCHEDULE
========================= */

let waitingForTomorrowPlan = false;


function startTomorrowPlanning() {

  waitingForTomorrowPlan = true;

  return (
    "Of course, Boss. What are your plans for tomorrow?"
  );
}


function handleTomorrowPlan(text) {

  if (!waitingForTomorrowPlan) {
    return null;
  }

  waitingForTomorrowPlan = false;

  saveTomorrowPlan(text);

  return (
    `Got it, Boss. I saved your plan for tomorrow:\n${text}`
  );
}


function showTomorrowPlan() {

  const data =
    getTomorrowPlan();

  if (!data) {

    return (
      "You don't have a tomorrow plan saved yet, Boss."
    );
  }

  return (
    `Your saved plan for tomorrow is:\n${data.plan}`
  );
}


/* =========================
   GEMINI
========================= */

async function askGemini(prompt, imageData = null) {

  const apiKey =
    getApiKey();

  if (!apiKey) {

    return (
      "I need your Gemini API key before I can answer that, Boss. Tap the API KEY button and save it."
    );
  }


  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


  const parts = [];


  parts.push({
    text:
      `You are DISCO, a helpful futuristic AI assistant.

Call the user Boss.

Use clear and simple English.

Do not claim to know the user's current time or GPS location unless that information is supplied by a tool.

If a tool result is supplied in the prompt, use it accurately.

Do not pretend that you performed an action when you did not.

User request:
${prompt}`
  });


  if (imageData) {

    parts.push({

      inline_data: {

        mime_type:
          imageData.mimeType,

        data:
          imageData.base64
      }
    });
  }


  try {

    const response =
      await fetch(endpoint, {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-goog-api-key":
            apiKey
        },

        body: JSON.stringify({

          contents: [
            {
              parts: parts
            }
          ],

          generationConfig: {

            temperature: 0.7,

            maxOutputTokens: 800
          }
        })
      });


    const data =
      await response.json();


    if (!response.ok) {

      if (
        response.status === 429 ||
        response.status === 503
      ) {

        return (
          "Gemini is temporarily busy, Boss. Your local DISCO tools are still working."
        );
      }

      return (
        data?.error?.message ||
        "Gemini returned an error, Boss."
      );
    }


    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();


    if (!answer) {

      return (
        "Gemini did not return an answer, Boss."
      );
    }


    return answer;

  } catch {

    return (
      "I couldn't connect to Gemini right now, Boss."
    );
  }
}


/* =========================
   COMMAND ROUTER
========================= */

async function routeCommand(text) {

  const original =
    text.trim();

  const q =
    original.toLowerCase().trim();


  /* --------------------------------
     TOMORROW PLAN RESPONSE
  -------------------------------- */

  const tomorrowAnswer =
    handleTomorrowPlan(original);

  if (tomorrowAnswer) {

    return tomorrowAnswer;
  }


  /* --------------------------------
     TOMORROW PLAN START
  -------------------------------- */

  if (
    /\b(plan|schedule|organize)\b.*\b(tomorrow)\b/i.test(q) ||
    /\btomorrow\b.*\b(schedule|plan)\b/i.test(q)
  ) {

    return startTomorrowPlanning();
  }


  /* --------------------------------
     SHOW TOMORROW PLAN
  -------------------------------- */

  if (
    /\b(show|read|tell me|what is)\b.*\b(tomorrow)\b.*\b(plan|schedule)\b/i.test(q)
  ) {

    return showTomorrowPlan();
  }


  /* --------------------------------
     TIME
  -------------------------------- */

  if (
    /\b(what(?:'s| is) the time|what time is it|time now|current time|tell me the time)\b/i
      .test(q)
  ) {

    return getCurrentTime();
  }


  /* --------------------------------
     DATE
  -------------------------------- */

  if (
    /\b(what(?:'s| is) the date|today(?:'s| is the) date|current date|what day is it)\b/i
      .test(q)
  ) {

    return getCurrentDate();
  }


  /* --------------------------------
     LOCATION
  -------------------------------- */

  if (
    /\b(where am i|my location|current location|where are we)\b/i
      .test(q)
  ) {

    return await getMyLocation();
  }


  /* --------------------------------
     MEMORY
  -------------------------------- */

  const memoryResult =
    memoryCommand(original);

  if (memoryResult !== undefined) {

    return memoryResult;
  }


  /* --------------------------------
     WEATHER
  -------------------------------- */

  if (
    /\b(weather|temperature|forecast)\b/i.test(q)
  ) {

    let place =
      "Visakhapatnam";

    const match =
      original.match(
        /\b(?:in|at|for|near)\s+(.+)$/i
      );

    if (match && match[1]) {

      place =
        match[1]
          .replace(/[?.!]+$/, "")
          .trim();
    }

    return await getWeather(place);
  }


  /* --------------------------------
     OPEN YOUTUBE
  -------------------------------- */

  if (
    /\bopen\s+(youtube|yt)\b/i.test(q) &&
    !/\bplay\b/i.test(q)
  ) {

    return openYouTube();
  }


  /* --------------------------------
     PLAY SONG
  -------------------------------- */

  if (
    /\bplay\b/i.test(q) &&
    (
      /\bsong\b/i.test(q) ||
      /\bmusic\b/i.test(q) ||
      /\btrack\b/i.test(q) ||
      /\bvideo\b/i.test(q)
    )
  ) {

    let song =
      original
        .replace(
          /\b(open|youtube|yt|and|please|play|song|music|track|video)\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim();


    if (!song) {

      return (
        "Which song should I search for, Boss?"
      );
    }


    return openYouTubeSearch(song);
  }


  /* --------------------------------
     YOUTUBE SEARCH
  -------------------------------- */

  if (
    /\b(youtube|yt)\b/i.test(q) &&
    /\b(search|find)\b/i.test(q)
  ) {

    let query =
      original
        .replace(
          /\b(youtube|yt|search|find|for)\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim();


    if (!query) {

      return (
        "What should I search for on YouTube, Boss?"
      );
    }


    return openYouTubeSearch(query);
  }


  /* --------------------------------
     OPEN WEBSITES
  -------------------------------- */

  const openMatch =
    q.match(
      /^open\s+(google|youtube|github|instagram)\s*$/
    );

  if (openMatch) {

    return openWebsite(
      openMatch[1]
    );
  }


  /* --------------------------------
     GOOGLE SEARCH
  -------------------------------- */

  if (
    /\b(search|google)\b/i.test(q)
  ) {

    let query =
      original
        .replace(
          /\b(search|google|on google|for)\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim();


    if (query) {

      return googleSearch(query);
    }
  }


  /* --------------------------------
     CALCULATOR
  -------------------------------- */

  if (
    /^(calculate|solve|what is)\s+/i.test(original)
  ) {

    const expression =
      original
        .replace(
          /^(calculate|solve|what is)\s+/i,
          ""
        )
        .trim();


    const result =
      calculate(expression);

    if (result) {

      return result;
    }
  }


  /* --------------------------------
     GREETING
  -------------------------------- */

  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i
      .test(q)
  ) {

    return (
      "Hello, Boss. DISCO is online and ready."
    );
  }


  /* --------------------------------
     CLEAR CHAT
  -------------------------------- */

  if (
    /^(clear chat|clear conversation)$/i.test(q)
  ) {

    clearChat();

    return null;
  }


  /* --------------------------------
     GEMINI FALLBACK
  -------------------------------- */

  return await askGemini(
    original,
    cameraImage
  );
    }
/* =========================================================
   DISCO AI
   SCRIPT.JS — PART 3 OF 3
========================================================= */


/* =========================
   SEND MESSAGE
========================= */

let processing = false;


async function sendMessage() {

  if (processing) {
    return;
  }


  const text =
    msgInput.value.trim();


  if (!text) {
    return;
  }


  processing = true;

  msgInput.value = "";

  addMessage(
    text,
    "user"
  );


  try {

    const answer =
      await routeCommand(text);


    if (answer) {

      addMessage(
        answer,
        "disco"
      );

      speak(answer);
    }

  } catch (error) {

    const message =
      "Something went wrong, Boss.";

    addMessage(
      message,
      "disco"
    );

    speak(message);

    console.error(
      "DISCO error:",
      error
    );

  } finally {

    processing = false;

    msgInput.focus();
  }
}


/* =========================
   SEND BUTTON
========================= */

sendBtn.addEventListener(
  "click",
  sendMessage
);


/* =========================
   ENTER KEY
========================= */

msgInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      sendMessage();
    }
  }
);


/* =========================
   CLEAR CHAT
========================= */

function clearChat() {

  chat.innerHTML = "";

  addMessage(
    "Conversation cleared, Boss."
  );
}


/* =========================
   MICROPHONE
========================= */

function setupSpeechRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    return false;
  }


  recognition =
    new SpeechRecognition();


  recognition.lang =
    "en-IN";


  recognition.continuous =
    false;


  recognition.interimResults =
    false;


  recognition.onstart =
    () => {

      isListening = true;

      micBtn.textContent = "🔴";
    };


  recognition.onend =
    () => {

      isListening = false;

      micBtn.textContent = "🎤";
    };


  recognition.onerror =
    event => {

      console.log(
        "Speech recognition:",
        event.error
      );

      isListening = false;

      micBtn.textContent = "🎤";
    };


  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0].transcript;

      msgInput.value =
        transcript;

      sendMessage();
    };


  return true;
}


setupSpeechRecognition();


micBtn.addEventListener(
  "click",
  () => {

    if (!recognition) {

      addMessage(
        "Voice input is not supported by this browser, Boss."
      );

      return;
    }


    if (isListening) {

      recognition.stop();

      return;
    }


    try {

      recognition.start();

    } catch (error) {

      console.log(error);
    }
  }
);


/* =========================
   CAMERA
========================= */

cameraBtn.addEventListener(
  "click",
  () => {

    cameraInput.click();
  }
);


cameraInput.addEventListener(
  "change",
  event => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    const reader =
      new FileReader();


    reader.onload =
      () => {

        const result =
          reader.result;


        const base64 =
          result.split(",")[1];


        cameraImage = {

          mimeType:
            file.type || "image/jpeg",

          base64:
            base64
        };


        addMessage(
          "Image captured, Boss. Ask me what you want to know about it."
        );


        speak(
          "Image captured, Boss. Ask me what you want to know about it."
        );
      };


    reader.readAsDataURL(file);
  }
);


/* =========================
   MEMORY BUTTON
========================= */

memoryBtn.addEventListener(
  "click",
  () => {

    const memory =
      getMemory();


    if (!memory.length) {

      const text =
        "My memory is empty, Boss.";

      addMessage(text);

      speak(text);

      return;
    }


    const text =
      "I remember:\n" +
      memory
        .map(
          (item, index) =>
            `${index + 1}. ${item.text}`
        )
        .join("\n");


    addMessage(text);

    speak(
      "I remember " +
      memory.map(
        item => item.text
      ).join(". ")
    );
  }
);


/* =========================
   PLAY MEMORY
========================= */

playMemoryBtn.addEventListener(
  "click",
  () => {

    const memory =
      getMemory();


    if (!memory.length) {

      speak(
        "My memory is empty, Boss."
      );

      return;
    }


    const text =
      memory
        .map(
          item => item.text
        )
        .join(". ");


    speak(
      "Boss, here is what I remember. " +
      text
    );
  }
);


/* =========================
   API KEY SHORTCUT
========================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape" &&
      !keyModal.classList.contains("hidden")
    ) {

      closeKeyModal();
    }
  }
);


/* =========================
   FIRST LOAD
========================= */

window.addEventListener(
  "load",
  () => {

    updateClock();

    msgInput.focus();

    if (!getApiKey()) {

      setTimeout(
        () => {

          openKeyModal();

        },
        700
      );
    }
  }
);


/* =========================
   GLOBAL DEBUG
========================= */

window.DISCO = {

  send:
    sendMessage,

  memory:
    getMemory,

  tomorrow:
    getTomorrowPlan,

  time:
    getCurrentTime,

  date:
    getCurrentDate,

  weather:
    getWeather,

  location:
    getMyLocation

};


console.log(
  "DISCO AI CORE ONLINE."
);
