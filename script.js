(() => {
  "use strict";

  // ==========================================
  // D.I.S.C.O. — CORE SETTINGS
  // ==========================================

  const MODEL = "gemini-3.8-flash";
  const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL +
    ":generateContent";

  const KEY_STORE = "disco_gemini_key_v4";
  const MEMORY_STORE = "disco_memory_v4";
  const LANGUAGE_STORE = "disco_language_v1";

  const $ = (id) => document.getElementById(id);

  const ui = {
    menu: $("menuBtn"),
    agents: $("agentBtn"),
    key: $("keyBtn"),
    clear: $("clearBtn"),

    status: $("statusText"),
    agentStatus: $("agentStatus"),
    welcome: $("welcome"),
    chatSection: $("chatSection"),
    chat: $("chat"),

    message: $("msg"),
    send: $("sendBtn"),
    mic: $("micBtn"),

    imageBtn: $("imageBtn"),
    imageInput: $("imageInput"),
    imageWrap: $("imageWrap"),
    imagePreview: $("imagePreview"),
    imageName: $("imageName"),
    removeImage: $("removeImageBtn"),

    clock: $("clock"),

    modal: $("keyModal"),
    apiKey: $("apiKeyInput"),
    saveKey: $("saveKeyBtn"),
    removeKey: $("removeKeyBtn"),
    closeKey: $("closeKeyBtn"),

    toast: $("toast")
  };

  let apiKey = localStorage.getItem(KEY_STORE) || "";
  let language =
    localStorage.getItem(LANGUAGE_STORE) || "en";

  let agentsActive = true;
  let selectedImage = null;
  let busy = false;
  let toastTimer = null;
  let timerId = null;

  // Recent conversation used for follow-up questions.
  const conversation = [];

  // ==========================================
  // SMALL HELPERS
  // ==========================================

  function showToast(message) {
    if (!ui.toast) return;

    ui.toast.textContent = message;
    ui.toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      ui.toast.classList.remove("show");
    }, 2600);
  }

  function setStatus(message) {
    if (ui.status) {
      ui.status.textContent = message;
    }
  }

  function getMemory() {
    try {
      return JSON.parse(
        localStorage.getItem(MEMORY_STORE) || "{}"
      );
    } catch {
      return {};
    }
  }

  function saveMemory(memory) {
    localStorage.setItem(
      MEMORY_STORE,
      JSON.stringify(memory)
    );
  }

  function showMemory() {
    const memory = getMemory();
    const entries = Object.entries(memory);

    if (!entries.length) {
      return language === "te"
        ? "ఇంకా ఏమీ గుర్తుంచుకోలేదు. ఉదాహరణకు: Remember my favourite colour is black."
        : "I haven't saved any memories yet. Try: Remember my favourite colour is black.";
    }

    return entries
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === "te" ? "te" : "en";

    localStorage.setItem(
      LANGUAGE_STORE,
      language
    );

    if (ui.agentStatus) {
      ui.agentStatus.textContent = agentsActive
        ? "AGENTS ACTIVE"
        : "AGENTS PAUSED";
    }

    showToast(
      language === "te"
        ? "ఇకపై తెలుగులో మాట్లాడతాను."
        : "I'll speak in English."
    );
  }

  function detectLanguageCommand(text) {
    const value = text.toLowerCase().trim();

    const teluguRequests = [
      "talk to me in telugu",
      "speak in telugu",
      "telugu lo maatladu",
      "telugu lo matladu",
      "talk in telugu",
      "తెలుగులో మాట్లాడు",
      "తెలుగులో మాట్లాడండి"
    ];

    const englishRequests = [
      "talk to me in english",
      "speak in english",
      "talk in english",
      "english lo maatladu",
      "english lo matladu",
      "ఇంగ్లీషులో మాట్లాడు"
    ];

    if (
      teluguRequests.some((item) =>
        value.includes(item)
      )
    ) {
      setLanguage("te");

      return "సరే! ఇకపై మీతో సహజమైన ఆంధ్ర తెలుగు భాషలో మాట్లాడతాను. మీకు ఏం కావాలో చెప్పండి.";
    }

    if (
      englishRequests.some((item) =>
        value.includes(item)
      )
    ) {
      setLanguage("en");

      return "Of course! I'll speak with you in English from now on.";
    }

    return null;
  }

  // ==========================================
  // CHAT DISPLAY
  // ==========================================

  function openChat() {
    if (ui.welcome) {
      ui.welcome.style.display = "none";
    }

    if (ui.chatSection) {
      ui.chatSection.classList.add("active");
    }
  }

  function addMessage(role, text) {
    openChat();

    const row = document.createElement("div");
    row.className = `message ${role}`;

    const label = document.createElement("div");
    label.className = "message-label";
    label.textContent =
      role === "user" ? "YOU" : "D.I.S.C.O.";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    // textContent prevents pasted HTML from executing.
    bubble.textContent = text;

    row.append(label, bubble);
    ui.chat.appendChild(row);

    // Keep the page lightweight on a phone.
    while (ui.chat.children.length > 40) {
      ui.chat.removeChild(ui.chat.firstElementChild);
    }

    ui.chat.scrollTop = ui.chat.scrollHeight;

    return row;
  }

  function addTyping() {
    const row = addMessage("assistant", "Thinking...");

    row.classList.add("typing-message");

    return row;
  }

  function clearConversation() {
    conversation.length = 0;

    if (ui.chat) {
      ui.chat.replaceChildren();
    }

    if (ui.chatSection) {
      ui.chatSection.classList.remove("active");
    }

    if (ui.welcome) {
      ui.welcome.style.display = "";
    }

    showToast(
      language === "te"
        ? "చాట్ క్లియర్ అయింది."
        : "Chat cleared."
    );
  }

  // ==========================================
  // VOICE OUTPUT
  // ==========================================

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      text.slice(0, 1800)
    );

    utterance.lang =
      language === "te" ? "te-IN" : "en-GB";

    utterance.rate = 0.92;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  // ==========================================
  // CLOCK
  // ==========================================

  function updateClock() {
    if (!ui.clock) return;

    ui.clock.textContent =
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date());
  }

  updateClock();

  // Update once per minute to save resources.
  setInterval(updateClock, 60000);

  // ==========================================
  // IMAGE PREVIEW
  // ==========================================

  function removeSelectedImage() {
    selectedImage = null;

    if (ui.imageInput) {
      ui.imageInput.value = "";
    }

    if (ui.imagePreview) {
      ui.imagePreview.removeAttribute("src");
    }

    if (ui.imageName) {
      ui.imageName.textContent = "";
    }

    if (ui.imageWrap) {
      ui.imageWrap.hidden = true;
    }
  }

  if (ui.imageBtn && ui.imageInput) {
    ui.imageBtn.addEventListener("click", () => {
      ui.imageInput.click();
    });
  }

  if (ui.imageInput) {
    ui.imageInput.addEventListener("change", () => {
      const file = ui.imageInput.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("Please select an image.");
        removeSelectedImage();
        return;
      }

      // Avoid sending huge images from a phone.
      if (file.size > 4 * 1024 * 1024) {
        showToast("Choose an image smaller than 4 MB.");
        removeSelectedImage();
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        const base64 = dataUrl.split(",")[1];

        if (!base64) {
          showToast("Could not load that image.");
          return;
        }

        selectedImage = {
          mimeType: file.type,
          data: base64
        };

        if (ui.imagePreview) {
          ui.imagePreview.src = dataUrl;
        }

        if (ui.imageName) {
          ui.imageName.textContent = file.name;
        }

        if (ui.imageWrap) {
          ui.imageWrap.hidden = false;
        }
      };

      reader.onerror = () => {
        showToast("Could not read that image.");
      };

      reader.readAsDataURL(file);
    });
  }

  if (ui.removeImage) {
    ui.removeImage.addEventListener(
      "click",
      removeSelectedImage
    );
  }

  // ==========================================
  // API KEY SETTINGS
  // ==========================================

  function openKeyModal() {
    if (!ui.modal) return;

    ui.apiKey.value = apiKey;
    ui.modal.hidden = false;
    ui.apiKey.focus();
  }

  function closeKeyModal() {
    if (ui.modal) {
      ui.modal.hidden = true;
    }
  }

  if (ui.key) {
    ui.key.addEventListener("click", openKeyModal);
  }

  if (ui.closeKey) {
    ui.closeKey.addEventListener(
      "click",
      closeKeyModal
    );
  }

  if (ui.modal) {
    ui.modal.addEventListener("click", (event) => {
      if (event.target === ui.modal) {
        closeKeyModal();
      }
    });
  }

  if (ui.saveKey) {
    ui.saveKey.addEventListener("click", () => {
      const value = ui.apiKey.value.trim();

      if (!value) {
        showToast("Paste your Gemini API key first.");
        return;
      }

      apiKey = value;

      localStorage.setItem(KEY_STORE, apiKey);

      closeKeyModal();
      showToast("API key saved in this browser.");
      setStatus("AI KEY SAVED");
    });
  }

  if (ui.removeKey) {
    ui.removeKey.addEventListener("click", () => {
      apiKey = "";

      localStorage.removeItem(KEY_STORE);

      if (ui.apiKey) {
        ui.apiKey.value = "";
      }

      showToast("API key removed.");
      setStatus("API KEY REQUIRED");
    });
  }

  // Note: a browser-stored API key is not secret
  // from people who can access this website/browser.
    // ==========================================
  // MEMORY COMMANDS
  // ==========================================

  function handleMemoryCommand(text) {
    const value = text.trim();

    const rememberMatch = value.match(
      /^remember\s+(?:that\s+)?(.+?)\s+(?:is|are|=)\s+(.+)$/i
    );

    if (rememberMatch) {
      const key = rememberMatch[1].trim();
      const memoryValue = rememberMatch[2].trim();

      const memory = getMemory();
      memory[key] = memoryValue;
      saveMemory(memory);

      return language === "te"
        ? `సరే! "${key}" గురించి గుర్తుంచుకున్నాను.`
        : `Got it! I'll remember ${key}: ${memoryValue}.`;
    }

    if (
      /^(show|view|check)\s+(my\s+)?memory$/i.test(value) ||
      /^(what do you remember|show my memories)$/i.test(value)
    ) {
      return showMemory();
    }

    if (/^(clear|delete|forget)\s+(all\s+)?memory$/i.test(value)) {
      saveMemory({});

      return language === "te"
        ? "సేవ్ చేసిన జ్ఞాపకాలను క్లియర్ చేశాను."
        : "Saved memories cleared.";
    }

    return null;
  }

  // ==========================================
  // SIMPLE CALCULATOR
  // ==========================================

  function calculate(text) {
    let expression = text.trim();

    expression = expression.replace(
      /^(calculate|calc|what is)\s+/i,
      ""
    );

    expression = expression.replace(/[×x]/g, "*");
    expression = expression.replace(/÷/g, "/");

    // Accept arithmetic only, never arbitrary JavaScript.
    if (!/^[\d+\-*/().%\s]+$/.test(expression)) {
      return null;
    }

    if (!/\d/.test(expression)) {
      return null;
    }

    try {
      const result = Function(
        '"use strict"; return (' + expression + ');'
      )();

      if (
        typeof result !== "number" ||
        !Number.isFinite(result)
      ) {
        return "That calculation has no finite result.";
      }

      return `${expression} = ${result}`;
    } catch {
      return null;
    }
  }

  // ==========================================
  // WEATHER — VISAKHAPATNAM
  // ==========================================

  async function getWeather() {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=17.6868" +
      "&longitude=83.2185" +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
      "&timezone=Asia%2FKolkata";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Weather service unavailable.");
    }

    const data = await response.json();
    const current = data.current;

    const weatherNames = {
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
      82: "Violent rain showers",
      95: "Thunderstorm"
    };

    return [
      "Weather in Visakhapatnam:",
      `Conditions: ${weatherNames[current.weather_code] || "Unknown"}`,
      `Temperature: ${current.temperature_2m}°C`,
      `Feels like: ${current.apparent_temperature}°C`,
      `Humidity: ${current.relative_humidity_2m}%`,
      `Wind: ${current.wind_speed_10m} km/h`
    ].join("\n");
  }

  // ==========================================
  // LOCAL COMMANDS
  // Unknown questions go to Gemini.
  // ==========================================

  async function localCommand(text) {
    const value = text.trim();
    const lower = value.toLowerCase();

    const languageReply = detectLanguageCommand(value);

    if (languageReply) {
      return languageReply;
    }

    const memoryReply = handleMemoryCommand(value);

    if (memoryReply !== null) {
      return memoryReply;
    }

    if (
      /^(what time is it|current time|time now|clock)$/i.test(value)
    ) {
      return new Date().toLocaleTimeString(
        "en-GB",
        { hour: "2-digit", minute: "2-digit" }
      );
    }

    if (
      /^(what is the date|today's date|current date|date today)$/i.test(value)
    ) {
      return new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }

    if (
      lower.includes("weather") &&
      (
        lower.includes("visakhapatnam") ||
        lower.includes("vizag") ||
        lower.includes("weather")
      )
    ) {
      try {
        return await getWeather();
      } catch {
        return language === "te"
          ? "క్షమించండి, ప్రస్తుతం వాతావరణ వివరాలు పొందలేకపోయాను."
          : "Sorry, I couldn't retrieve the weather right now. Please try again later.";
      }
    }

    if (/^(open )?youtube$/i.test(value)) {
      window.open("https://www.youtube.com/", "_blank", "noopener");
      return "Opening YouTube.";
    }

    if (/^(open )?google$/i.test(value)) {
      window.open("https://www.google.com/", "_blank", "noopener");
      return "Opening Google.";
    }

    if (/^(open )?github$/i.test(value)) {
      window.open("https://github.com/", "_blank", "noopener");
      return "Opening GitHub.";
    }

    if (/^(open )?instagram$/i.test(value)) {
      window.open("https://www.instagram.com/", "_blank", "noopener");
      return "Opening Instagram.";
    }

    if (/^search\s+(.+)$/i.test(value)) {
      const query = value.replace(/^search\s+/i, "");

      window.open(
        "https://www.google.com/search?q=" +
          encodeURIComponent(query),
        "_blank",
        "noopener"
      );

      return `Searching the web for: ${query}`;
    }

    if (/^(activate|enable)\s+agents$/i.test(value)) {
      agentsActive = true;

      if (ui.agentStatus) {
        ui.agentStatus.textContent = "AGENTS ACTIVE";
      }

      return "Agents activated.";
    }

    if (/^(deactivate|disable|pause)\s+agents$/i.test(value)) {
      agentsActive = false;

      if (ui.agentStatus) {
        ui.agentStatus.textContent = "AGENTS PAUSED";
      }

      return "Agents paused.";
    }

    const mathResult = calculate(
      value.replace(/^calculate\s+/i, "")
    );

    if (mathResult !== null) {
      return mathResult;
    }

    return null;
  }

  // ==========================================
  // GEMINI AI
  // ==========================================

  function systemInstruction() {
    const memoryText = showMemory();

    const languageInstruction = language === "te"
      ? "Reply in natural Andhra Pradesh Telugu. Use clear, everyday Telugu. Keep technical terms in English when useful, and explain them simply."
      : "Reply in clear, simple British English. Avoid unnecessary complicated words.";

    return [
      "You are D.I.S.C.O., a helpful personal AI assistant.",
      "Be friendly, practical, honest, and concise.",
      "Call the user Boss occasionally, not in every sentence.",
      languageInstruction,
      "Do not claim you performed actions you did not perform.",
      "If you are unsure about a fact, say so.",
      "Use the saved user memory only when relevant.",
      "Saved memories:",
      memoryText
    ].join("\n");
  }

  async function askGemini(text, image) {
    if (!apiKey) {
      openKeyModal();

      throw new Error(
        "Add your Gemini API key using the key button first."
      );
    }

    const parts = [{ text }];

    if (image) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data
        }
      });
    }

    const contents = conversation.slice(-10).map((item) => ({
      role: item.role,
      parts: [{ text: item.text }]
    }));

    contents.push({
      role: "user",
      parts
    });

    const response = await fetch(
      `${API_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: systemInstruction()
            }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const apiMessage =
        data?.error?.message ||
        `Request failed (${response.status}).`;

      throw new Error(apiMessage);
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!answer) {
      throw new Error(
        "Gemini returned no text. Please try again."
      );
    }

    conversation.push(
      { role: "user", text },
      { role: "model", text: answer }
    );

    // Keep only the most recent exchanges.
    if (conversation.length > 20) {
      conversation.splice(
        0,
        conversation.length - 20
      );
    }

    return answer;
  }

  // ==========================================
  // SEND MESSAGE
  // ==========================================

  async function sendMessage(forcedText) {
    if (busy) return;

    const text = (
      typeof forcedText === "string"
        ? forcedText
        : ui.message.value
    ).trim();

    if (!text && !selectedImage) return;

    if (ui.message) {
      ui.message.value = "";
      ui.message.style.height = "auto";
    }

    const imageForRequest = selectedImage;

    addMessage(
      "user",
      text || "Please describe this image."
    );

    removeSelectedImage();

    busy = true;
    ui.send.disabled = true;

    const typing = addTyping();

    try {
      const reply = await localCommand(text);

      let answer;

      if (reply !== null) {
        answer = reply;
      } else {
        answer = await askGemini(
          text || "Please describe this image.",
          imageForRequest
        );
      }

      typing.remove();

      addMessage("assistant", answer);

      // Speak AI responses only when voice output is supported.
      // The mic button can still be used for speech input.
      if ("speechSynthesis" in window) {
        // Voice output is intentionally not automatic.
        // Use your device's read-aloud feature if preferred.
      }
    } catch (error) {
      typing.remove();

      let message = error?.message || "Something went wrong.";

      if (
        /model|not found|not supported|permission|api key|invalid/i.test(message)
      ) {
        message +=
          "\n\nCheck that your Gemini API key is valid and that the selected model is available to your account.";
      }

      addMessage("assistant", message);
    } finally {
      busy = false;

      if (ui.send) {
        ui.send.disabled = false;
      }

      if (ui.message) {
        ui.message.focus();
      }
    }
  }

  // ==========================================
  // INPUT EVENTS
  // ==========================================

  if (ui.send) {
    ui.send.addEventListener("click", () => {
      sendMessage();
    });
  }

  if (ui.message) {
    ui.message.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        sendMessage();
      }
    });

    ui.message.addEventListener("input", () => {
      ui.message.style.height = "auto";

      ui.message.style.height =
        Math.min(ui.message.scrollHeight, 140) + "px";
    });
  }

  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.prompt || "");
    });
  });

  if (ui.clear) {
    ui.clear.addEventListener("click", clearConversation);
  }

  if (ui.agents) {
    ui.agents.addEventListener("click", () => {
      agentsActive = !agentsActive;

      if (ui.agentStatus) {
        ui.agentStatus.textContent = agentsActive
          ? "AGENTS ACTIVE"
          : "AGENTS PAUSED";
      }

      showToast(
        agentsActive
          ? "Agents activated."
          : "Agents paused."
      );
    });
  }

  if (ui.menu) {
    ui.menu.addEventListener("click", () => {
      showToast(
        "D.I.S.C.O. · Personal AI assistant"
      );
    });
  }

  // ==========================================
  // VOICE INPUT
  // ==========================================

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (ui.mic) {
    if (!SpeechRecognition) {
      ui.mic.addEventListener("click", () => {
        showToast(
          "Speech input is not supported in this browser."
        );
      });
    } else {
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        ui.mic.classList.add("listening");

        showToast(
          language === "te"
            ? "వింటున్నాను…"
            : "Listening…"
        );
      };

      recognition.onresult = (event) => {
        const transcript =
          event.results?.[0]?.[0]?.transcript || "";

        if (ui.message) {
          ui.message.value = transcript;
          ui.message.dispatchEvent(
            new Event("input", { bubbles: true })
          );
        }
      };

      recognition.onerror = () => {
        showToast(
          "Microphone unavailable. Check browser permission."
        );
      };

      recognition.onend = () => {
        ui.mic.classList.remove("listening");
      };

      ui.mic.addEventListener("click", () => {
        recognition.lang =
          language === "te" ? "te-IN" : "en-IN";

        try {
          recognition.start();
        } catch {
          showToast("Please wait, then tap the microphone again.");
        }
      });
    }
  }

  // ==========================================
  // KEYBOARD SHORTCUTS & NETWORK STATUS
  // ==========================================

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeKeyModal();
    }
  });

  window.addEventListener("offline", () => {
    setStatus("NETWORK OFFLINE");
  });

  window.addEventListener("online", () => {
    setStatus("SYSTEM READY");
  });

  // ==========================================
  // INITIAL STATE
  // ==========================================

  if (ui.agentStatus) {
    ui.agentStatus.textContent = agentsActive
      ? "AGENTS ACTIVE"
      : "AGENTS PAUSED";
  }

  setStatus(
    apiKey ? "AI KEY SAVED" : "SYSTEM READY"
  );

  console.log("D.I.S.C.O. initialised.");
})();
 
