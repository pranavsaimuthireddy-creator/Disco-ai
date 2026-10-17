(() => {
  "use strict";

  // ==========================================
  // D.I.S.C.O. 3000 — CORE SYSTEM
  // PART 1 OF 2
  // ==========================================

  const $ = (selector) => document.querySelector(selector);

  const chat = $("#chat");
  const form = $("#commandForm");
  const msgInput = $("#msg");
  const sendBtn = $("#sendBtn");
  const clearBtn = $("#clearBtn");
  const micBtn = $("#micBtn");
  const imageBtn = $("#imageBtn");
  const imageInput = $("#imageInput");
  const imageWrap = $("#imageWrap");
  const imagePreview = $("#imagePreview");
  const imageName = $("#imageName");
  const removeImageBtn = $("#removeImageBtn");

  const keyModal = $("#keyModal");
  const keyBtn = $("#keyBtn");
  const closeKeyBtn = $("#closeKeyBtn");
  const apiKeyInput = $("#apiKeyInput");
  const saveKeyBtn = $("#saveKeyBtn");
  const removeKeyBtn = $("#removeKeyBtn");

  const activateBtn = $("#activateBtn");
  const coreOrb = $("#coreOrb");
  const cameraBtn = $("#cameraBtn");

  const systemStatus = $("#systemStatus");
  const neuralStatus = $("#neuralStatus");
  const agentStatus = $("#agentStatus");
  const memoryStatus = $("#memoryStatus");
  const voiceStatus = $("#voiceStatus");
  const coreState = $("#coreState");
  const networkStatus = $("#networkStatus");

  const clockTime = $("#clockTime");
  const clockDate = $("#clockDate");
  const toastElement = $("#toast");

  const MEMORY_KEY = "disco_memory_v3";
  const API_KEY = "disco_gemini_key_v3";

  let agentsActive = true;
  let selectedImage = null;
  let toastTimer = null;
  let activeTimer = null;
  let recognition = null;
  let isListening = false;

  // ==========================================
  // SAFE LOCAL STORAGE
  // ==========================================

  function storageGet(key, fallback = "") {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      showToast("Browser storage is unavailable.");
      return false;
    }
  }

  function getMemory() {
    try {
      const saved = JSON.parse(storageGet(MEMORY_KEY, "{}"));

      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        return saved;
      }
    } catch {
      // Start with empty memory if saved data is invalid.
    }

    return {};
  }

  function saveMemory(memory) {
    return storageSet(MEMORY_KEY, JSON.stringify(memory));
  }

  // ==========================================
  // STATUS AND NOTIFICATIONS
  // ==========================================

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function showToast(message) {
    if (!toastElement) {
      console.log(message);
      return;
    }

    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toastElement.classList.remove("show");
    }, 2800);
  }

  function setSystemState(message) {
    setText(systemStatus, message);
    setText(coreState, message);
  }

  function setNetworkState(message) {
    setText(networkStatus, "NETWORK: " + message);
  }

  function setThinking(thinking) {
    if (sendBtn) {
      sendBtn.disabled = thinking;

      const label = sendBtn.querySelector("span");

      if (label) {
        label.textContent = thinking ? "PROCESSING" : "TRANSMIT";
      }
    }

    if (msgInput) {
      msgInput.disabled = thinking;
    }

    if (thinking) {
      setSystemState("PROCESSING COMMAND");
    } else {
      setSystemState("SYSTEM READY");
    }
  }

  // ==========================================
  // CLOCK — INDIA STANDARD TIME
  // ==========================================

  function updateClock() {
    const now = new Date();

    try {
      setText(
        clockTime,
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }).format(now)
      );

      setText(
        clockDate,
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          weekday: "long",
          day: "2-digit",
          month: "short",
          year: "numeric"
        }).format(now).toUpperCase()
      );
    } catch (error) {
      setText(clockTime, now.toLocaleTimeString());
      setText(clockDate, now.toDateString().toUpperCase());
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ==========================================
  // CHAT MESSAGE DISPLAY
  // ==========================================

  function addMessage(text, sender = "disco") {
    if (!chat) return;

    const row = document.createElement("div");
    row.className = "message";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = sender === "user" ? "B" : "D";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const meta = document.createElement("div");
    meta.className = "meta";

    const title = document.createElement("span");
    title.textContent = sender === "user" ? "BOSS" : "D.I.S.C.O.";

    const status = document.createElement("span");
    status.textContent = sender === "user" ? "COMMAND" : "CORE RESPONSE";

    meta.append(title, status);

    const paragraph = document.createElement("p");
    paragraph.textContent = String(text);

    bubble.append(meta, paragraph);
    row.append(avatar, bubble);
    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;
  }

  function clearConversation() {
    if (!chat) return;

    chat.replaceChildren();

    addMessage(
      "Conversation cleared, Boss. D.I.S.C.O. is ready for your next command.",
      "disco"
    );

    showToast("Conversation cleared.");
  }

  // ==========================================
  // LOCAL MEMORY
  // ==========================================

  function rememberFact(key, value) {
    const memory = getMemory();

    memory[key] = value;

    if (saveMemory(memory)) {
      return `Saved to local memory, Boss: ${key} = ${value}`;
    }

    return "I couldn't save that to browser memory.";
  }

  function readMemory() {
    const memory = getMemory();
    const entries = Object.entries(memory);

    if (entries.length === 0) {
      return (
        "Your memory vault is empty, Boss. " +
        "You can teach me something using: remember favourite colour is black"
      );
    }

    return (
      "Here is what I have saved in this browser:\n\n" +
      entries
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join("\n")
    );
  }

  function forgetMemory() {
    try {
      localStorage.removeItem(MEMORY_KEY);
      return "Local memory cleared, Boss.";
    } catch {
      return "I couldn't clear browser memory.";
    }
  }

  function parseRememberCommand(text) {
    const match = text.match(
      /^remember\s+(.+?)\s+(?:is|=|:)\s+(.+)$/i
    );

    if (!match) return null;

    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();

    if (!key || !value) return null;

    return { key, value };
  }

  // ==========================================
  // AGENT STATUS
  // ==========================================

  function updateAgentStatus() {
    setText(
      agentStatus,
      agentsActive ? "ACTIVE" : "STANDBY"
    );

    setText(
      neuralStatus,
      storageGet(API_KEY) ? "AI CONNECTED" : "LOCAL MODE"
    );

    setText(
      memoryStatus,
      "ONLINE"
    );

    setText(
      voiceStatus,
      "READY"
    );

    if (activateBtn) {
      activateBtn.textContent = agentsActive
        ? "DEACTIVATE AGENTS ↘"
        : "ACTIVATE AGENTS ↗";
    }
  }

  function toggleAgents() {
    agentsActive = !agentsActive;

    updateAgentStatus();

    if (agentsActive) {
      setSystemState("AGENTS ACTIVATED");
      addMessage("All available local agents are active, Boss.");
      showToast("Agents activated.");
    } else {
      setSystemState("AGENTS ON STANDBY");
      addMessage(
        "Agents are now on standby. The clock and basic interface remain available."
      );
      showToast("Agents on standby.");
    }
  }

  // ==========================================
  // API KEY SETTINGS
  // ==========================================

  function openKeyModal() {
    if (!keyModal) return;

    apiKeyInput.value = storageGet(API_KEY);
    keyModal.hidden = false;
  }

  function closeKeyModal() {
    if (!keyModal) return;

    keyModal.hidden = true;
  }

  function saveApiKey() {
    const key = apiKeyInput.value.trim();

    if (!key) {
      showToast("Enter your Gemini API key first.");
      apiKeyInput.focus();
      return;
    }

    if (storageSet(API_KEY, key)) {
      updateAgentStatus();
      closeKeyModal();
      showToast("AI key saved in this browser.");
      addMessage(
        "AI connection settings saved. I will try the AI service when you send a question."
      );
    }
  }

  function deleteApiKey() {
    try {
      localStorage.removeItem(API_KEY);
    } catch {
      // Nothing else to do.
    }

    if (apiKeyInput) {
      apiKeyInput.value = "";
    }

    updateAgentStatus();
    showToast("AI key removed.");
  }

  // ==========================================
  // TEXT NORMALISATION
  // ==========================================

  function normalise(text) {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, " ");
  }

  function hasAny(text, phrases) {
    return phrases.some((phrase) => text.includes(phrase));
  }

  // ==========================================
  // BASIC CALCULATOR
  // ==========================================

  function calculateExpression(expression) {
    const cleaned = expression
      .replace(/^calculate\s+/i, "")
      .replace(/^what\s+is\s+/i, "")
      .replace(/\?+$/, "")
      .trim();

    if (!cleaned) return null;

    // Only allow numbers and basic arithmetic symbols.
    if (!/^[\d\s()+\-*/%.]+$/.test(cleaned)) {
      return null;
    }

    if (!/\d/.test(cleaned)) {
      return null;
    }

    try {
      const result = Function(
        '"use strict"; return (' + cleaned + ');'
      )();

      if (typeof result !== "number" || !Number.isFinite(result)) {
        return "That calculation does not produce a valid number.";
      }

      return `${cleaned} = ${result}`;
    } catch {
      return null;
    }
  }

  // ==========================================
  // TIMER
  // ==========================================

  function startTimer(text) {
    const match = text.match(
      /(?:timer\s+for|set\s+(?:a\s+)?timer\s+for)\s+(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
    );

    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    let multiplier = 1000;

    if (unit.startsWith("min") || unit.startsWith("m")) {
      multiplier = 60 * 1000;
    } else if (unit.startsWith("hour") || unit.startsWith("hr")) {
      multiplier = 60 * 60 * 1000;
    }

    const milliseconds = amount * multiplier;

    if (amount <= 0 || milliseconds > 24 * 60 * 60 * 1000) {
      return "Please choose a timer between 1 second and 24 hours.";
    }

    clearTimeout(activeTimer);

    activeTimer = setTimeout(() => {
      showToast("⏰ Timer finished, Boss!");
      addMessage("Your timer has finished, Boss.");
      speak("Boss, your timer has finished.");
    }, milliseconds);

    return `Timer started for ${amount} ${unit}, Boss.`;
  }

  // ==========================================
  // VOICE OUTPUT
  // ==========================================

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(String(text));
      utterance.lang = "en-GB";
      utterance.rate = 0.92;
      utterance.pitch = 0.95;

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn("Voice output unavailable:", error);
    }
  }

  // Part 2 continues below.
   // ==========================================
  // WEATHER — OPEN-METEO
  // ==========================================

  async function getWeather() {
    try {
      const geoUrl =
        "https://geocoding-api.open-meteo.com/v1/search" +
        "?name=Visakhapatnam&count=1&language=en&format=json";

      const geoResponse = await fetch(geoUrl);

      if (!geoResponse.ok) {
        throw new Error("Location search failed.");
      }

      const geoData = await geoResponse.json();
      const place = geoData.results && geoData.results[0];

      if (!place) {
        throw new Error("Location not found.");
      }

      const weatherUrl =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${place.latitude}` +
        `&longitude=${place.longitude}` +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code" +
        "&timezone=Asia%2FKolkata";

      const weatherResponse = await fetch(weatherUrl);

      if (!weatherResponse.ok) {
        throw new Error("Weather service unavailable.");
      }

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;

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
        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",
        80: "Rain showers",
        81: "Moderate rain showers",
        82: "Heavy rain showers",
        95: "Thunderstorm"
      };

      const condition =
        descriptions[current.weather_code] || "Current conditions";

      return (
        `Current weather in ${place.name}, Boss:\n` +
        `Condition: ${condition}\n` +
        `Temperature: ${current.temperature_2m}°C\n` +
        `Feels like: ${current.apparent_temperature}°C\n` +
        `Humidity: ${current.relative_humidity_2m}%\n` +
        `Wind speed: ${current.wind_speed_10m} km/h`
      );
    } catch (error) {
      console.error(error);

      return (
        "I couldn't retrieve the live weather just now. " +
        "Please check your internet connection and try again."
      );
    }
  }

  // ==========================================
  // OPEN WEBSITES AND SEARCH
  // ==========================================

  function openWebsite(text) {
    const query = text
      .replace(/^(please\s+)?(open|launch|go to)\s+/i, "")
      .trim();

    const sites = [
      {
        words: ["youtube"],
        url: "https://www.youtube.com/"
      },
      {
        words: ["google"],
        url: "https://www.google.com/"
      },
      {
        words: ["github"],
        url: "https://github.com/"
      },
      {
        words: ["instagram"],
        url: "https://www.instagram.com/"
      },
      {
        words: ["whatsapp"],
        url: "https://web.whatsapp.com/"
      },
      {
        words: ["gmail"],
        url: "https://mail.google.com/"
      }
    ];

    const found = sites.find((site) =>
      site.words.some((word) => query.includes(word))
    );

    if (found) {
      window.open(found.url, "_blank", "noopener,noreferrer");
      return `Opening ${query}, Boss.`;
    }

    if (/^search\s+/i.test(text)) {
      const searchQuery = text.replace(/^search\s+/i, "").trim();

      if (searchQuery) {
        window.open(
          "https://www.google.com/search?q=" +
            encodeURIComponent(searchQuery),
          "_blank",
          "noopener,noreferrer"
        );

        return `Searching the web for "${searchQuery}", Boss.`;
      }
    }

    return null;
  }

  // ==========================================
  // GEMINI AI CONNECTION
  // ==========================================

  async function askGemini(prompt, imageData = null) {
    const key = storageGet(API_KEY).trim();

    if (!key) {
      return (
        "I can handle basic local commands, Boss, but AI chat needs a Gemini API key. " +
        "Tap the ⌘ button at the top to configure it."
      );
    }

    const parts = [{ text: String(prompt) }];

    if (imageData) {
      parts.push({
        inline_data: {
          mime_type: imageData.mimeType,
          data: imageData.base64
        }
      });
    }

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      "gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(key);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts
            }
          ],
          system_instruction: {
            parts: [
              {
                text:
                  "You are D.I.S.C.O., a helpful personal AI assistant. " +
                  "Address the user as Boss. Use clear, simple British English. " +
                  "Be friendly, accurate, concise, and honest. " +
                  "Never claim to have performed an action you did not perform."
              }
            ]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 900
          }
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiMessage =
          data.error && data.error.message
            ? data.error.message
            : `HTTP ${response.status}`;

        if (response.status === 429) {
          return (
            "The Gemini service has reached its current request limit, Boss. " +
            "Please wait a little and try again."
          );
        }

        if (response.status === 400 || response.status === 403) {
          return (
            "Gemini rejected the request. Check that your API key is correct, " +
            "that the model is available to your account, and that the key has the required access. " +
            `Details: ${apiMessage}`
          );
        }

        return `The AI service returned an error: ${apiMessage}`;
      }

      const answer = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("\n")
        .trim();

      if (!answer) {
        return "The AI service returned an empty answer. Please try again, Boss.";
      }

      return answer;
    } catch (error) {
      console.error("Gemini request failed:", error);

      return (
        "I couldn't reach the AI service, Boss. " +
        "Check your internet connection and try again."
      );
    }
  }

  // ==========================================
  // IMAGE PREVIEW
  // ==========================================

  function clearSelectedImage() {
    selectedImage = null;

    if (imageInput) {
      imageInput.value = "";
    }

    if (imagePreview) {
      imagePreview.removeAttribute("src");
    }

    if (imageName) {
      imageName.textContent = "";
    }

    if (imageWrap) {
      imageWrap.hidden = true;
    }
  }

  function readImage(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.");
      return;
    }

    const maximumSize = 4 * 1024 * 1024;

    if (file.size > maximumSize) {
      showToast("Please choose an image smaller than 4 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result);
      const commaIndex = dataUrl.indexOf(",");

      if (commaIndex < 0) {
        showToast("Couldn't read that image.");
        return;
      }

      selectedImage = {
        mimeType: file.type,
        base64: dataUrl.slice(commaIndex + 1)
      };

      if (imagePreview) {
        imagePreview.src = dataUrl;
      }

      if (imageName) {
        imageName.textContent = file.name;
      }

      if (imageWrap) {
        imageWrap.hidden = false;
      }

      showToast("Image ready to send, Boss.");
    };

    reader.onerror = () => {
      showToast("Couldn't read that image.");
    };

    reader.readAsDataURL(file);
  }

  // ==========================================
  // LOCAL COMMAND ROUTER
  // ==========================================

  async function runLocalCommand(originalText) {
    const text = normalise(originalText);

    if (!text) return null;

    // Remember something.
    const memoryCommand = parseRememberCommand(originalText);

    if (memoryCommand) {
      return rememberFact(memoryCommand.key, memoryCommand.value);
    }

    // Read saved memory.
    if (
      hasAny(text, [
        "show my memory",
        "read my memory",
        "memory vault",
        "what do you remember",
        "show memory"
      ])
    ) {
      return readMemory();
    }

    // Clear saved memory.
    if (
      text === "forget everything" ||
      text === "clear memory" ||
      text === "delete memory"
    ) {
      return forgetMemory();
    }

    // Greetings.
    if (
      /^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(text)
    ) {
      return "Hello, Boss. D.I.S.C.O. is online. What shall we work on?";
    }

    // Identity.
    if (
      hasAny(text, [
        "who are you",
        "your name",
        "what is disco"
      ])
    ) {
      return "I am D.I.S.C.O. — your Digital Intelligence System Control Operator, Boss.";
    }

    // Date and time.
    if (
      hasAny(text, [
        "what time",
        "current time",
        "time now",
        "what is the date",
        "today's date",
        "current date"
      ])
    ) {
      const now = new Date();

      return (
        "Current India time: " +
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          dateStyle: "full",
          timeStyle: "medium"
        }).format(now)
      );
    }

    // Weather.
    if (hasAny(text, ["weather", "forecast"])) {
      return await getWeather();
    }

    // Timer.
    if (text.includes("timer")) {
      return startTimer(text) ||
        "Try a command such as: set a timer for 5 minutes";
    }

    // Calculator.
    if (
      text.startsWith("calculate ") ||
      text.startsWith("what is ") ||
      text.startsWith("what's ")
    ) {
      const expression = calculateExpression(
        originalText.replace(/^what's\s+/i, "what is ")
      );

      if (expression) {
        return expression;
      }
    }

    // Agent control.
    if (
      text === "activate agents" ||
      text === "turn on agents"
    ) {
      if (!agentsActive) {
        agentsActive = true;
        updateAgentStatus();
      }

      return "All available agents are activated, Boss.";
    }

    if (
      text === "deactivate agents" ||
      text === "turn off agents"
    ) {
      if (agentsActive) {
        agentsActive = false;
        updateAgentStatus();
      }

      return "Agents are now on standby, Boss.";
    }

    // Battery.
    if (text.includes("battery")) {
      if ("getBattery" in navigator) {
        try {
          const battery = await navigator.getBattery();
          const percentage = Math.round(battery.level * 100);

          return (
            `Battery level: ${percentage}%. ` +
            (battery.charging ? "The device is charging." : "The device is not charging.")
          );
        } catch {
          return "Your browser does not allow me to read the battery level.";
        }
      }

      return "Battery information is not available in this browser.";
    }

    // Website opening and search.
    const websiteResult = openWebsite(text);

    if (websiteResult) {
      return websiteResult;
    }

    // Study / planning shortcuts.
    if (text.includes("plan tomorrow")) {
      return (
        "Tomorrow's planning template, Boss:\n\n" +
        "1. Choose your three most important tasks.\n" +
        "2. Start with the hardest task while fresh.\n" +
        "3. Work in focused 25-minute sessions.\n" +
        "4. Take short breaks between sessions.\n" +
        "5. Review what you completed in the evening.\n\n" +
        "Tell me your tasks and I can help organise them."
      );
    }

    return null;
  }

  // ==========================================
  // SEND COMMAND
  // ==========================================

  async function sendCommand(text) {
    const command = String(text || "").trim();

    if (!command && !selectedImage) {
      showToast("Enter a command first, Boss.");
      return;
    }

    if (!agentsActive) {
      showToast("Activate agents to process commands.");
      return;
    }

    if (command) {
      addMessage(command, "user");
    } else {
      addMessage("Please analyse this image.", "user");
    }

    const imageForRequest = selectedImage;

    clearSelectedImage();
    msgInput.value = "";

    setThinking(true);

    try {
      let answer = await runLocalCommand(command);

      if (answer === null || imageForRequest) {
        answer = await askGemini(
          command || "Describe this image clearly.",
          imageForRequest
        );
      }

      addMessage(answer, "disco");
    } catch (error) {
      console.error(error);

      addMessage(
        "Something went wrong while processing that command. Please try again, Boss.",
        "disco"
      );
    } finally {
      setThinking(false);

      if (msgInput) {
        msgInput.focus();
      }
    }
  }

  // ==========================================
  // MICROPHONE INPUT
  // ==========================================

  function setupMicrophone() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setText(voiceStatus, "UNAVAILABLE");
      showToast("Voice input is not supported by this browser.");
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;

      if (micBtn) {
        micBtn.classList.add("listening");
      }

      setText(voiceStatus, "LISTENING");
      showToast("Listening, Boss…");
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;

      if (transcript && msgInput) {
        msgInput.value = transcript;
        msgInput.focus();
      }
    };

    recognition.onerror = (event) => {
      console.warn("Microphone error:", event.error);

      if (event.error === "not-allowed") {
        showToast("Allow microphone permission in your browser settings.");
      } else {
        showToast("Voice input stopped. Please try again.");
      }
    };

    recognition.onend = () => {
      isListening = false;

      if (micBtn) {
        micBtn.classList.remove("listening");
      }

      setText(voiceStatus, "READY");
    };
  }

  function toggleMicrophone() {
    if (!recognition) {
      setupMicrophone();
    }

    if (!recognition) return;

    try {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } catch (error) {
      console.warn("Microphone could not start:", error);
      showToast("Please wait a moment and try the microphone again.");
    }
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      sendCommand(msgInput.value);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearConversation);
  }

  if (activateBtn) {
    activateBtn.addEventListener("click", toggleAgents);
  }

  if (coreOrb) {
    coreOrb.addEventListener("click", () => {
      showToast("D.I.S.C.O. core is online, Boss.");
    });

    coreOrb.addEventListener("dblclick", openKeyModal);
  }

  if (keyBtn) {
    keyBtn.addEventListener("click", openKeyModal);
  }

  if (closeKeyBtn) {
    closeKeyBtn.addEventListener("click", closeKeyModal);
  }

  if (saveKeyBtn) {
    saveKeyBtn.addEventListener("click", saveApiKey);
  }

  if (removeKeyBtn) {
    removeKeyBtn.addEventListener("click", deleteApiKey);
  }

  if (keyModal) {
    keyModal.addEventListener("click", (event) => {
      if (event.target === keyModal) {
        closeKeyModal();
      }
    });
  }

  if (apiKeyInput) {
    apiKeyInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        saveApiKey();
      }
    });
  }

  if (micBtn) {
    micBtn.addEventListener("click", toggleMicrophone);
  }

  if (imageBtn && imageInput) {
    imageBtn.addEventListener("click", () => {
      imageInput.click();
    });
  }

  if (cameraBtn && imageInput) {
    cameraBtn.addEventListener("click", () => {
      imageInput.click();
    });
  }

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files?.[0];

      if (file) {
        readImage(file);
      }
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", clearSelectedImage);
  }

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.getAttribute("data-prompt");

      if (prompt) {
        sendCommand(prompt);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openKeyModal();
    }

    if (event.key === "Escape") {
      closeKeyModal();
    }
  });

  // ==========================================
  // STARTUP
  // ==========================================

  updateAgentStatus();

  setNetworkState(navigator.onLine ? "ONLINE" : "OFFLINE");

  window.addEventListener("online", () => {
    setNetworkState("ONLINE");
  });

  window.addEventListener("offline", () => {
    setNetworkState("OFFLINE");
  });

  // Optional voice output function for browser console use.
  window.discoSpeak = speak;

  setSystemState("SYSTEM READY");

  console.log("D.I.S.C.O. 3000 initialised successfully.");
})();
