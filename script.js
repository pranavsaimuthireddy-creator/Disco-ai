(() => {
  "use strict";

  const MODEL = "gemini-3.8-flash";
  const KEY_NAME = "disco_gemini_key";
  const MEMORY_NAME = "disco_memory";
  const PLAN_PENDING = "disco_plan_pending";

  const $ = id => document.getElementById(id);

  const chat = $("chat");
  const input = $("messageInput");
  const statusText = $("statusText");
  const systemStatus = $("systemStatus");
  const coreCaption = $("coreCaption");

  let selectedImage = null;
  let listening = false;
  let memoryItems = loadMemory();
  let pendingTomorrowPlan =
    localStorage.getItem(PLAN_PENDING) === "true";

  function setStatus(message) {
    statusText.textContent = message;
    systemStatus.textContent = message.toUpperCase();
  }

  function updateClock() {
    const now = new Date();

    $("clock").textContent = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    $("date").textContent = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).toUpperCase();
  }

  updateClock();
  setInterval(updateClock, 1000);

  function addMessage(text, who = "assistant") {
    const message = document.createElement("div");
    message.className = "message " +
      (who === "user" ? "user-message" : "assistant-message");

    const tag = document.createElement("span");
    tag.className = "message-tag";
    tag.textContent = who === "user" ? "BOSS" : "DISCO";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    message.append(tag, paragraph);
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
    return message;
  }

  function loadMemory() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(MEMORY_NAME) || "[]"
      );
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveMemory() {
    try {
      localStorage.setItem(
        MEMORY_NAME,
        JSON.stringify(memoryItems)
      );
      return true;
    } catch {
      addMessage("Browser storage is unavailable, Boss.");
      return false;
    }
  }

  function remember(text) {
    const cleanText = text.trim();
    if (!cleanText) return;

    memoryItems.push({
      text: cleanText,
      time: new Date().toISOString()
    });

    // Keep the newest 100 memories.
    memoryItems = memoryItems.slice(-100);
    saveMemory();
  }

  function findMaleVoice() {
    const voices = window.speechSynthesis
      ? window.speechSynthesis.getVoices()
      : [];

    const maleNames =
      /daniel|george|james|ryan|guy|david|mark|arthur|fred|oliver|male/i;

    return voices.find(v =>
      /^en-GB/i.test(v.lang) && maleNames.test(v.name)
    ) || voices.find(v =>
      /^en/i.test(v.lang) && maleNames.test(v.name)
    ) || voices.find(v =>
      /^en-GB/i.test(v.lang)
    ) || voices.find(v =>
      /^en/i.test(v.lang)
    ) || null;
  }

  function speakReply(text) {
    if (!("speechSynthesis" in window)) {
      addMessage(
        "Voice playback is not supported by this browser, Boss."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-GB";
    speech.rate = 0.92;
    speech.pitch = 0.82;

    const voice = findMaleVoice();
    if (voice) speech.voice = voice;

    speech.onerror = () => {
      setStatus("VOICE ERROR");
    };

    speech.onstart = () => {
      coreCaption.textContent = "DISCO IS SPEAKING";
    };

    speech.onend = () => {
      coreCaption.textContent = "READY TO ASSIST, BOSS";
      setStatus("READY");
    };

    window.speechSynthesis.speak(speech);
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      findMaleVoice();
    };
  }

  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    coreCaption.textContent = "READY TO ASSIST, BOSS";
  }

  function openSettings() {
    $("settingsModal").hidden = false;
    $("apiKeyInput").value = "";
    $("apiKeyInput").focus();
  }

  function closeSettings() {
    $("settingsModal").hidden = true;
  }

  // Part 2 continues immediately below.
 
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(
        new Error("Could not read the selected image.")
      );
      reader.readAsDataURL(file);
    });
  }

  async function askGemini(text, imageFile = null) {
    const apiKey = localStorage.getItem(KEY_NAME);

    if (!apiKey) {
      addMessage("Please save your Gemini API key first, Boss.");
      openSettings();
      return;
    }

    setStatus("THINKING");
    coreCaption.textContent = "PROCESSING REQUEST";

    try {
      const memoryContext = memoryItems
        .slice(-5)
        .map(item => item.text)
        .join("\n");

      const prompt = [
        "You are DISCO, Boss's personal AI assistant.",
        "Address the user as Boss.",
        "Use clear, simple British English.",
        "Answer helpfully and concisely.",
        memoryContext
          ? "Relevant saved memories:\n" + memoryContext
          : "",
        "User's message:\n" + text
      ].filter(Boolean).join("\n\n");

      const parts = [{ text: prompt }];

      if (imageFile) {
        if (!imageFile.type.startsWith("image/")) {
          throw new Error("Please select an image file.");
        }

        const dataURL = await fileToDataURL(imageFile);
        const base64 = dataURL.split(",")[1];

        parts.push({
          inline_data: {
            mime_type: imageFile.type,
            data: base64
          }
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 700
            }
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.error?.message || "";

        if (response.status === 429) {
          throw new Error(
            "Gemini is busy or your API quota has been reached. " +
            "Please wait and try again."
          );
        }

        if (response.status === 503 || response.status === 502) {
          throw new Error(
            "Gemini is temporarily overloaded. Please try again later."
          );
        }

        if (response.status === 400 || response.status === 404) {
          throw new Error(
            "The request or model was rejected. Check the configured " +
            "Gemini model and API settings. " + message
          );
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Gemini rejected the API key or its permissions. " +
            "Check your key settings."
          );
        }

        throw new Error(message || `Gemini error ${response.status}`);
      }

      const reply = (data.candidates?.[0]?.content?.parts || [])
        .map(part => part.text || "")
        .join("\n")
        .trim();

      if (!reply) {
        throw new Error(
          "Gemini returned no text. Please try another message."
        );
      }

      addMessage(reply);
      setStatus("READY");
      speakReply(reply);

    } catch (error) {
      console.error("DISCO request failed:", error);

      const message = error.message ||
        "Something went wrong. Please try again.";

      addMessage(message);
      setStatus("ERROR");
      coreCaption.textContent = "REQUEST FAILED";
      speakReply(message);

    } finally {
      selectedImage = null;
      $("cameraInput").value = "";
      $("imagePreview").hidden = true;
    }
  }

  async function handleUserMessage(rawText) {
    const text = rawText.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";
    stopSpeaking();

    // Save a memory when Boss says "remember that..."
    const rememberMatch = text.match(
      /^(?:disco[,\s]+)?remember(?:\s+that)?\s+(.+)$/i
    );

    if (rememberMatch) {
      remember(rememberMatch[1]);
      const reply = "Saved to memory, Boss.";
      addMessage(reply);
      speakReply(reply);
      setStatus("MEMORY SAVED");
      return;
    }

    // Start the tomorrow-planning conversation.
    if (
      /\bplan my tomorrow schedule\b/i.test(text) ||
      /\bplan tomorrow(?:'s)? schedule\b/i.test(text) ||
      /\bplan my schedule for tomorrow\b/i.test(text)
    ) {
      pendingTomorrowPlan = true;
      localStorage.setItem(PLAN_PENDING, "true");

      const reply = "What are your plans for tomorrow, Boss?";
      addMessage(reply);
      speakReply(reply);
      setStatus("PLANNING");
      return;
    }

    // The next message after that question becomes the plan.
    if (pendingTomorrowPlan) {
      remember("Tomorrow's plan: " + text);
      pendingTomorrowPlan = false;
      localStorage.removeItem(PLAN_PENDING);

      const reply =
        "I've saved your plans for tomorrow, Boss. " +
        "You can press Play Memory to hear them again.";

      addMessage(reply);
      speakReply(reply);
      setStatus("PLAN SAVED");
      return;
    }

    const imageToSend = selectedImage;
    await askGemini(
      text || (imageToSend ? "Describe this image, Boss." : ""),
      imageToSend
    );
  }

  async function sendMessage() {
    const text = input.value.trim();

    if (!text && !selectedImage) return;

    await handleUserMessage(
      text || "Describe this image, Boss."
    );
  }

  // Part 3 continues immediately below.
 
  // API key settings
  $("apiBtn").addEventListener("click", openSettings);
  $("closeSettings").addEventListener("click", closeSettings);

  $("settingsModal").addEventListener("click", event => {
    if (event.target === $("settingsModal")) {
      closeSettings();
    }
  });

  $("saveKeyBtn").addEventListener("click", () => {
    const key = $("apiKeyInput").value.trim();

    if (!key) {
      addMessage("Enter your Gemini API key first, Boss.");
      $("apiKeyInput").focus();
      return;
    }

    try {
      localStorage.setItem(KEY_NAME, key);
      closeSettings();
      setStatus("KEY SAVED");
      coreCaption.textContent = "AI CORE READY";

      addMessage(
        "API key saved in this browser, Boss. " +
        "Send a message to test the Gemini connection."
      );
    } catch {
      addMessage(
        "Could not save the key in this browser, Boss."
      );
    }
  });

  $("removeKeyBtn").addEventListener("click", () => {
    localStorage.removeItem(KEY_NAME);
    closeSettings();
    setStatus("KEY REMOVED");
    addMessage("The saved API key has been removed, Boss.");
  });

  // Send button and message form
  $("chatForm").addEventListener("submit", event => {
    event.preventDefault();
    sendMessage();
  });

  // Camera button
  $("cameraBtn").addEventListener("click", () => {
    $("cameraInput").click();
  });

  $("cameraInput").addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addMessage("Please choose an image, Boss.");
      return;
    }

    selectedImage = file;
    $("imageName").textContent = file.name;
    $("imagePreview").hidden = false;
    input.value = "Describe this image";
    input.focus();
  });

  $("removeImage").addEventListener("click", () => {
    selectedImage = null;
    $("cameraInput").value = "";
    $("imagePreview").hidden = true;
    input.value = "";
  });

  // Microphone button
  $("micBtn").addEventListener("click", () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addMessage(
        "Voice recognition is unavailable in this browser, Boss. " +
        "Try opening DISCO in Chrome."
      );
      return;
    }

    if (listening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      listening = true;
      setStatus("LISTENING");
      coreCaption.textContent = "I'M LISTENING, BOSS";
      $("micBtn").style.background = "#125b70";
    };

    recognition.onresult = event => {
      const transcript =
        event.results[0][0].transcript.trim();

      if (transcript) {
        input.value = transcript;
        handleUserMessage(transcript);
      }
    };

    recognition.onerror = event => {
      console.error("Microphone error:", event.error);
      addMessage(
        "I couldn't recognise that speech, Boss. " +
        "Please check microphone permission and try again."
      );
      setStatus("MIC ERROR");
    };

    recognition.onend = () => {
      listening = false;
      $("micBtn").style.background = "";
      coreCaption.textContent = "READY TO ASSIST, BOSS";
      if (statusText.textContent === "LISTENING") {
        setStatus("READY");
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
      addMessage("The microphone could not start. Try again, Boss.");
    }
  });

  // Memory button: show memories or save the first one.
  $("memoryBtn").addEventListener("click", () => {
    memoryItems = loadMemory();

    if (memoryItems.length === 0) {
      const text = window.prompt(
        "Boss, what would you like DISCO to remember?"
      );

      if (text && text.trim()) {
        remember(text);
        addMessage("I've saved that memory, Boss.");
        setStatus("MEMORY SAVED");
      } else {
        addMessage(
          "No memories saved yet. Say 'Remember that...' " +
          "or use the Memory button to add one."
        );
      }

      return;
    }

    const summary = memoryItems
      .slice(-10)
      .map((item, index) => `${index + 1}. ${item.text}`)
      .join("\n");

    addMessage("YOUR SAVED MEMORIES\n" + summary);
    setStatus("MEMORY LOADED");
  });

  // Play Memory button
  $("playMemoryBtn").addEventListener("click", () => {
    memoryItems = loadMemory();

    if (memoryItems.length === 0) {
      speakReply("There are no saved memories yet, Boss.");
      return;
    }

    const summary = memoryItems
      .slice(-10)
      .map((item, index) => `${index + 1}. ${item.text}`)
      .join(". ");

    speakReply("Here are your saved memories, Boss. " + summary);
  });

  // Keyboard shortcut for closing settings.
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeSettings();
    }
  });

  // Start the interface.
  if (localStorage.getItem(KEY_NAME)) {
    setStatus("KEY SAVED");
    coreCaption.textContent = "AI CORE READY";
  } else {
    setStatus("SETUP REQUIRED");
    coreCaption.textContent = "ADD YOUR GEMINI API KEY";
  }

  console.log("DISCO initialised.");
})();
