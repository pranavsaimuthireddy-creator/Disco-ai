(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  const MEMORY_KEY = 'disco_memory_v3';
  const API_KEY = 'disco_gemini_key_v3';

  let chosenImage = null;
  let recognition = null;
  let toastTimer;
  let timerHandle = null;
  let agentsActive = true;

  const chat = $('chat');
  const form = $('commandForm');
  const input = $('msg');
  const sendBtn = $('sendBtn');

  const norm = text =>
    text.toLowerCase().trim().replace(/[’']/g, "'");

  // ---------- NOTIFICATIONS ----------

  function toast(message) {
    const el = $('toast');
    if (!el) return;

    el.textContent = message;
    el.classList.add('show');

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
  }

  // ---------- SYSTEM STATUS ----------

  function status(message) {
    if ($('coreState')) {
      $('coreState').textContent = message.toUpperCase();
    }

    if ($('systemStatus')) {
      $('systemStatus').textContent = message.toUpperCase();
    }
  }

  function busy(isBusy) {
    if (sendBtn) sendBtn.disabled = isBusy;

    document.querySelector('.core-area')
      ?.classList.toggle('processing', isBusy);

    status(isBusy ? 'Processing' : 'Awaiting input');
  }

  // ---------- CLOCK ----------

  function tick() {
    const now = new Date();

    if ($('clockTime')) {
      $('clockTime').textContent =
        now.toLocaleTimeString('en-GB', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
    }

    if ($('clockDate')) {
      $('clockDate').textContent =
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        }).toUpperCase();
    }
  }

  tick();
  setInterval(tick, 1000);

  // ---------- CHAT MESSAGES ----------

  function addMessage(
    message,
    who = 'assistant',
    tag = 'CORE RESPONSE',
    image = null
  ) {
    const row = document.createElement('div');

    row.className =
      'message' + (who === 'user' ? ' user' : '');

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = who === 'user' ? 'B' : 'D';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = who === 'user' ? 'BOSS' : 'D.I.S.C.O.';

    const label = document.createElement('span');
    label.textContent = tag;
    meta.appendChild(label);

    bubble.appendChild(meta);

    if (image) {
      const preview = document.createElement('img');

      preview.src = image;
      preview.alt = 'Attached image';
      preview.style.maxWidth = '100%';
      preview.style.borderRadius = '10px';

      bubble.appendChild(preview);
    }

    const paragraph = document.createElement('p');
    paragraph.textContent = String(message);

    bubble.appendChild(paragraph);
    row.append(avatar, bubble);
    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;

    return row;
  }

  // ---------- LOCAL MEMORY ----------

  function memory() {
    try {
      return JSON.parse(
        localStorage.getItem(MEMORY_KEY) || '{}'
      );
    } catch {
      return {};
    }
  }

  function saveMemory(data) {
    localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify(data)
    );
  }

  function memoryCommand(text) {
    const data = memory();

    const rememberMatch = text.match(
      /^(?:please\s+)?remember(?: that)?\s+(.+)/i
    );

    if (rememberMatch) {
      const detail = rememberMatch[1]
        .replace(/[.!?]+$/, '')
        .trim();

      const pair = detail.match(
        /^my\s+(.+?)\s+is\s+(.+)$/i
      );

      if (pair) {
        data[pair[1].toLowerCase()] = pair[2];
      } else {
        data.notes = Array.isArray(data.notes)
          ? data.notes
          : [];

        data.notes.push(detail);
      }

      saveMemory(data);

      return `Saved to your local memory, Boss: "${detail}".`;
    }

    if (
      /show my memory|what do you remember|what is my favourite|what is my favorite|what's my favourite|what's my favorite/i
        .test(text)
    ) {
      const entries = Object.entries(data).flatMap(
        ([key, value]) => {
          if (key === 'notes') {
            return value.map(note => `Note: ${note}`);
          }

          return [`${key}: ${value}`];
        }
      );

      return entries.length
        ? 'LOCAL MEMORY\n' + entries.join('\n')
        : 'Your memory is empty. Try: "Remember that my favourite colour is black."';
    }

    if (/forget my memory|clear memory|delete my memory/i.test(text)) {
      localStorage.removeItem(MEMORY_KEY);
      return 'Your local memory has been cleared, Boss.';
    }

    return null;
  }

  // ---------- CONNECTION STATUS ----------

  function refreshStatus() {
    if ($('neuralStatus')) {
      $('neuralStatus').textContent =
        localStorage.getItem(API_KEY)
          ? 'CONNECTED'
          : 'LOCAL MODE';
    }

    if ($('agentStatus')) {
      $('agentStatus').textContent =
        agentsActive ? 'ACTIVE' : 'STANDBY';
    }

    if ($('voiceStatus') &&
        !$('micBtn')?.classList.contains('recording')) {
      $('voiceStatus').textContent = 'READY';
    }

    if ($('networkStatus')) {
      $('networkStatus').textContent =
        navigator.onLine
          ? 'NETWORK: ONLINE'
          : 'NETWORK: OFFLINE';
    }
  }

  refreshStatus();

  window.addEventListener('online', refreshStatus);
  window.addEventListener('offline', refreshStatus);

  // ---------- CALCULATOR ----------

  function calculate(raw) {
    let expression = raw
      .replace(/^(calculate|calc|what is|solve)\s*/i, '')
      .trim();

    if (
      !expression ||
      !/^[\d\s()+\-*/%.^]+$/.test(expression)
    ) {
      return null;
    }

    const tokens = expression.match(
      /\d*\.?\d+|[()+\-*/%^]/g
    );

    if (
      !tokens ||
      tokens.join('') !== expression.replace(/\s+/g, '')
    ) {
      return null;
    }

    let index = 0;

    const peek = () => tokens[index];
    const take = () => tokens[index++];

    function atom() {
      if (peek() === '+') {
        take();
        return atom();
      }

      if (peek() === '-') {
        take();
        return -atom();
      }

      if (peek() === '(') {
        take();

        const value = add();

        if (take() !== ')') {
          throw Error('Missing closing bracket.');
        }

        return value;
      }

      const value = take();

      if (
        value === undefined ||
        !/^(\d*\.?\d+)$/.test(value)
      ) {
        throw Error('Check the calculation.');
      }

      return Number(value);
    }

    function power() {
      const value = atom();

      if (peek() === '^') {
        take();
        return Math.pow(value, power());
      }

      return value;
    }

    function multiply() {
      let value = power();

      while (['*', '/', '%'].includes(peek())) {
        const operator = take();
        const next = power();

        if (
          (operator === '/' || operator === '%') &&
          next === 0
        ) {
          throw Error('Cannot divide by zero.');
        }

        if (operator === '*') value *= next;
        if (operator === '/') value /= next;
        if (operator === '%') value %= next;
      }

      return value;
    }

    function add() {
      let value = multiply();

      while (peek() === '+' || peek() === '-') {
        const operator = take();
        const next = multiply();

        value = operator === '+'
          ? value + next
          : value - next;
      }

      return value;
    }

    const result = add();

    if (index !== tokens.length || !Number.isFinite(result)) {
      throw Error('Could not calculate that.');
    }

    return result;
  }

  // ---------- TOMORROW'S PLAN ----------

  function tomorrowPlan() {
    const date = new Date();
    date.setDate(date.getDate() + 1);

    return `TOMORROW'S MISSION PLAN
${date.toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
})}

07:00  Wake up and have breakfast
08:00  Study your most important subject
09:30  Take a short break
09:45  Practise exam questions
11:15  Take a break
11:30  Complete notes or assignments
13:00  Lunch and rest
14:00  Complete college work
16:00  Take a break
16:30  Exercise or go for a walk
17:15  Revise what you learnt
18:15  Free time and hobbies
19:30  Dinner
20:15  Light revision
21:15  Relax and reduce screen time
22:00  Sleep

Adjust the times to your college schedule, Boss.`;
  }

  // ---------- WEATHER ----------

  async function weather(place) {
    const name = place || 'Visakhapatnam';

    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`
    );

    if (!geoResponse.ok) {
      throw Error('Location service unavailable.');
    }

    const location =
      (await geoResponse.json()).results?.[0];

    if (!location) {
      throw Error(`Could not find ${name}.`);
    }

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
    );

    if (!response.ok) {
      throw Error('Weather service unavailable.');
    }

    const current = (await response.json()).current;

    const conditions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Fog',
      51: 'Light drizzle',
      53: 'Drizzle',
      55: 'Dense drizzle',
      61: 'Light rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      80: 'Rain showers',
      81: 'Rain showers',
      82: 'Heavy showers',
      95: 'Thunderstorm'
    };

    return `WEATHER SCAN — ${location.name}, ${location.country || ''}
${conditions[current.weather_code] || 'Current conditions'}
Temperature: ${current.temperature_2m}°C
Feels like: ${current.apparent_temperature}°C
Humidity: ${current.relative_humidity_2m}%
Wind: ${current.wind_speed_10m} km/h
Updated: ${current.time}`;
  }

  // ---------- GEMINI AI ----------

  async function gemini(prompt, imageData = null) {
    const key = localStorage.getItem(API_KEY);

    if (!key) {
      return `I can run local tools, Boss, but AI chat needs a Gemini API key.

Tap the ⌘ button to connect Gemini.

You can still use local tools such as:
• calculate 12*8
• weather in Visakhapatnam
• plan tomorrow
• what time is it
• remember that my favourite colour is black`;
    }

    const parts = [{
      text:
        `You are D.I.S.C.O., a helpful futuristic assistant.
Call the user Boss.
Use clear, simple British English.
Answer accurately and explain things step by step when needed.

User request: ${prompt || 'Please describe this image.'}`
    }];

    if (imageData) {
      const match = imageData.match(
        /^data:(image\/[\w.+-]+);base64,(.+)$/
      );

      if (match) {
        parts.push({
          inline_data: {
            mime_type: match[1],
            data: match[2]
          }
        });
      }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 900
          }
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 429) {
        throw Error(
          'Gemini rate limit reached. Wait a little and try again.'
        );
      }

      throw Error(
        data.error?.message ||
        `AI request failed (${response.status}). Check your API key.`
      );
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('\n')
      .trim();

    if (!answer) {
      throw Error('AI returned no text. Please try again.');
    }

    return answer;
}
    // ===== COMMAND ROUTER =====
  function openTab(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function route(text) {
    const q = text.trim();
    const lower = q.toLowerCase();

    if (!q) return "Please enter a command, Boss.";

    // Greetings
    if (/^(hi|hello|hey|good morning|good evening)\b/i.test(lower)) {
      return "Hello, Boss! D.I.S.C.O. is ready. How can I help you?";
    }

    // Help
    if (/^(help|commands|what can you do)/i.test(lower)) {
      return [
        "Here are some commands, Boss:",
        "• What time is it?",
        "• What is today's date?",
        "• Calculate 25 * 4",
        "• Make a plan for tomorrow",
        "• Weather in Visakhapatnam",
        "• Open YouTube",
        "• Open Google",
        "• Remember my favourite colour is black",
        "• What is my favourite colour?",
        "• Search for Python tutorials",
        "• Tell me about artificial intelligence"
      ].join("\n");
    }

    // Time and date
    if (/\b(time|clock)\b/.test(lower)) {
      return "The current time is " +
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit"
        });
    }

    if (/\b(date|today's date|today date)\b/.test(lower)) {
      return "Today is " +
        new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        });
    }

    // Calculator
    if (/^(calculate|solve|what is|what's)\s+[\d\s()+*/%.,-]+$/i.test(q)) {
      const expression = q
        .replace(/^(calculate|solve|what is|what's)\s+/i, "")
        .replace(/,/g, "");

      if (/^[\d\s()+*/%.-]+$/.test(expression)) {
        try {
          const result = Function(
            '"use strict"; return (' + expression + ')'
          )();

          if (Number.isFinite(result)) {
            return "The answer is " + result + ", Boss.";
          }
        } catch (error) {
          return "I couldn't calculate that expression.";
        }
      }
    }

    // Memory
    if (
      /remember|save to memory|memorise|memorize/i.test(lower) &&
      !/\bwhat do you remember\b/i.test(lower)
    ) {
      const result = remember(q);
      return result || "I couldn't save that memory.";
    }

    if (
      /what is my favourite colour|what is my favorite color|what is my favourite color|what is my favorite colour/i.test(lower)
    ) {
      const saved = getMemory();
      const colour = saved.find(item =>
        /favo[u]?rite colou?r/i.test(item)
      );

      return colour
        ? "Your saved favourite colour is black, Boss."
        : "I don't have your favourite colour saved yet, Boss.";
    }

    if (/what do you remember|show my memories|my memory/i.test(lower)) {
      const saved = getMemory();

      return saved.length
        ? "Here is what I remember:\n" +
          saved.map((item, index) => `${index + 1}. ${item}`).join("\n")
        : "Your memory list is empty, Boss.";
    }

    if (/forget everything|clear all memories/i.test(lower)) {
      localStorage.removeItem("disco_memory_v3");
      return "Your saved D.I.S.C.O. memories have been cleared.";
    }

    // Tomorrow's plan
    if (/plan.*tomorrow|tomorrow.*plan/i.test(lower)) {
      return tomorrowPlan();
    }

    // Weather
    if (/weather|temperature|forecast/i.test(lower)) {
      const match = q.match(/\bin\s+(.+)$/i);
      const place = match ? match[1].trim() : "Visakhapatnam";
      return await weather(place);
    }

    // Open websites
    const websites = [
      {
        pattern: /\b(open|launch|go to)\s+(youtube|yt)\b/i,
        url: "https://www.youtube.com/"
      },
      {
        pattern: /\b(open|launch|go to)\s+google\b/i,
        url: "https://www.google.com/"
      },
      {
        pattern: /\b(open|launch|go to)\s+github\b/i,
        url: "https://github.com/"
      },
      {
        pattern: /\b(open|launch|go to)\s+instagram\b/i,
        url: "https://www.instagram.com/"
      }
    ];

    for (const site of websites) {
      if (site.pattern.test(q)) {
        openTab(site.url);
        return "Opening the website, Boss.";
      }
    }

    // Google search
    if (/^(search for|search|google)\s+/i.test(q)) {
      const searchText = q.replace(/^(search for|search|google)\s+/i, "");
      openTab(
        "https://www.google.com/search?q=" +
        encodeURIComponent(searchText)
      );
      return "Searching Google for: " + searchText;
    }

    // YouTube search
    if (/^(youtube search|search youtube for)\s+/i.test(q)) {
      const searchText = q.replace(/^(youtube search|search youtube for)\s+/i, "");
      openTab(
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(searchText)
      );
      return "Searching YouTube for: " + searchText;
    }

    // Battery status
    if (/battery|battery status/i.test(lower)) {
      if ("getBattery" in navigator) {
        try {
          const battery = await navigator.getBattery();
          return `Battery level: ${Math.round(battery.level * 100)}%. ` +
            (battery.charging ? "The device is charging." : "The device is not charging.");
        } catch (error) {
          return "I couldn't read the battery status in this browser.";
        }
      }

      return "This browser does not provide battery information.";
    }

    // AI response
    return await gemini(q);
  }

  // ===== SEND MESSAGE =====
  async function sendMessage() {
    const input = document.getElementById("msg");
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = "";

    addMessage("user", text);

    const sendBtn = document.getElementById("sendBtn");
    if (sendBtn) sendBtn.disabled = true;

    try {
      const reply = await route(text);
      addMessage("assistant", reply);
      speak(reply);
    } catch (error) {
      console.error("D.I.S.C.O. error:", error);
      addMessage(
        "assistant",
        "Something went wrong, Boss. Please check your internet connection or API key."
      );
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
  }

  // ===== VOICE OUTPUT =====
  function speak(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      String(text).replace(/https?:\/\/\S+/g, "website")
    );

    utterance.lang = "en-GB";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }

  window.discoSpeak = speak;

  // ===== BUTTONS AND FORM =====
  const form = document.getElementById("commandForm");

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      sendMessage();
    });
  }

  const clearBtn = document.getElementById("clearBtn");

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const chat = document.getElementById("chat");
      if (chat) chat.innerHTML = "";
    });
  }

  const activateBtn = document.getElementById("activateBtn");

  if (activateBtn) {
    activateBtn.addEventListener("click", () => {
      const status = document.getElementById("coreState");

      if (status) status.textContent = "CORE ACTIVE";

      addMessage(
        "assistant",
        "D.I.S.C.O. is online and ready, Boss."
      );

      speak("D.I.S.C.O. is online and ready, Boss.");
    });
  }

  // Suggested prompts
  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      const input = document.getElementById("msg");
      if (!input) return;

      input.value = button.dataset.prompt || "";
      input.focus();
    });
  });

  // ===== API KEY SETTINGS =====
  const keyBtn = document.getElementById("keyBtn");
  const keyModal = document.getElementById("keyModal");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const closeKeyBtn = document.getElementById("closeKeyBtn");
  const saveKeyBtn = document.getElementById("saveKeyBtn");
  const removeKeyBtn = document.getElementById("removeKeyBtn");

  if (keyBtn && keyModal) {
    keyBtn.addEventListener("click", () => {
      if (apiKeyInput) {
        apiKeyInput.value =
          localStorage.getItem("disco_gemini_key_v3") || "";
      }

      keyModal.classList.add("show");
      keyModal.setAttribute("aria-hidden", "false");
    });
  }

  function closeKeyModal() {
    if (!keyModal) return;

    keyModal.classList.remove("show");
    keyModal.setAttribute("aria-hidden", "true");
  }

  if (closeKeyBtn) {
    closeKeyBtn.addEventListener("click", closeKeyModal);
  }

  if (saveKeyBtn) {
    saveKeyBtn.addEventListener("click", () => {
      const key = apiKeyInput ? apiKeyInput.value.trim() : "";

      if (!key) {
        alert("Please enter your Gemini API key.");
        return;
      }

      localStorage.setItem("disco_gemini_key_v3", key);
      closeKeyModal();
      addMessage("assistant", "API key saved in this browser, Boss.");
    });
  }

  if (removeKeyBtn) {
    removeKeyBtn.addEventListener("click", () => {
      localStorage.removeItem("disco_gemini_key_v3");

      if (apiKeyInput) apiKeyInput.value = "";

      closeKeyModal();

      addMessage("assistant", "API key removed from this browser.");
    });
  }

  // Close modal by clicking outside it
  if (keyModal) {
    keyModal.addEventListener("click", event => {
      if (event.target === keyModal) {
        closeKeyModal();
      }
    });
  }

  // ===== IMAGE UPLOAD =====
  const imageBtn = document.getElementById("imageBtn");
  const cameraBtn = document.getElementById("cameraBtn");
  const imageInput = document.getElementById("imageInput");
  const removeImageBtn = document.getElementById("removeImageBtn");

  let selectedImage = null;

  function chooseImage() {
    if (imageInput) imageInput.click();
  }

  if (imageBtn) {
    imageBtn.addEventListener("click", chooseImage);
  }

  if (cameraBtn) {
    cameraBtn.addEventListener("click", chooseImage);
  }

  const coreOrb = document.getElementById("coreOrb");

  if (coreOrb) {
    coreOrb.addEventListener("dblclick", chooseImage);
  }

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files && imageInput.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        addMessage("assistant", "Please choose an image file.");
        imageInput.value = "";
        return;
      }

      selectedImage = file;

      const preview = document.getElementById("imagePreview");
      const imageWrap = document.getElementById("imageWrap");
      const imageName = document.getElementById("imageName");

      if (preview) preview.src = URL.createObjectURL(file);
      if (imageName) imageName.textContent = file.name;
      if (imageWrap) imageWrap.hidden = false;
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", () => {
      selectedImage = null;

      if (imageInput) imageInput.value = "";

      const imageWrap = document.getElementById("imageWrap");
      if (imageWrap) imageWrap.hidden = true;
    });
  }

  // ===== MICROPHONE =====
  const micBtn = document.getElementById("micBtn");
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (!SpeechRecognition) {
        addMessage(
          "assistant",
          "Voice input is not supported in this browser. Try Chrome."
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-GB";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      micBtn.disabled = true;
      micBtn.textContent = "Listening...";

      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById("msg");

        if (input) {
          input.value = transcript;
          sendMessage();
        }
      };

      recognition.onerror = event => {
        console.error("Microphone error:", event.error);
        addMessage(
          "assistant",
          "I couldn't hear that clearly. Please check microphone permission and try again."
        );
      };

      recognition.onend = () => {
        micBtn.disabled = false;
        micBtn.textContent = "🎙️";
      };

      try {
        recognition.start();
      } catch (error) {
        micBtn.disabled = false;
        micBtn.textContent = "🎙️";
      }
    });
  }

  // ===== KEYBOARD SHORTCUTS =====
  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();

      if (keyModal) {
        keyModal.classList.add("show");
        keyModal.setAttribute("aria-hidden", "false");
      }
    }

    if (event.key === "Escape") {
      closeKeyModal();
    }
  });

  // ===== STARTUP =====
  refreshStatus();

  addMessage(
    "assistant",
    "Systems online. D.I.S.C.O. is ready to assist you, Boss. Type 'help' to see available commands."
  );

})();
