(() => {
  "use strict";

  // SHADOW AI — Main JavaScript
  const $ = id => document.getElementById(id);

  const MODEL = "gemini-3.6-flash";

  const KEY_STORAGE = "shadow_api_key";
  const HISTORY_STORAGE = "shadow_chat_history_v1";
  const MEMORY_STORAGE = "shadow_memory_v1";
  const VOICE_STORAGE = "shadow_voice_enabled";

  let busy = false;
  let recognition = null;
  let voiceEnabled = localStorage.getItem(VOICE_STORAGE) !== "false";
  let toastTimer = null;

  let history = loadJSON(HISTORY_STORAGE, []);
  let memories = loadJSON(MEMORY_STORAGE, []);

  // LOAD SAVED DATA
  function loadJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  // NOTIFICATION
  function toast(message) {
    const element = $("toast");

    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      element.classList.remove("show");
    }, 2800);
  }

  // API KEY
  function getApiKey() {
    return (
      localStorage.getItem(KEY_STORAGE) ||
      localStorage.getItem("disco_api_key") ||
      localStorage.getItem("jarvis_key") ||
      ""
    );
  }

  function saveHistory() {
    try {
      localStorage.setItem(
        HISTORY_STORAGE,
        JSON.stringify(history.slice(-60))
      );
    } catch (error) {
      console.error("Could not save chat history:", error);
    }
  }

  function saveMemories() {
    try {
      localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memories.slice(-50))
      );
    } catch (error) {
      console.error("Could not save memories:", error);
    }
  }

  // DISPLAY MESSAGES
  function renderMessage(role, text) {
    $("welcome").hidden = true;

    const row = document.createElement("article");

    row.className =
      "message " +
      (role === "user" ? "user" : "assistant");

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "YOU" : "S";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    row.append(avatar, bubble);

    $("messages").appendChild(row);

    $("chat-area").scrollTop =
      $("chat-area").scrollHeight;

    return bubble;
  }

  // RESTORE CHAT HISTORY
  function restoreChat() {
    $("messages").replaceChildren();

    if (history.length === 0) {
      $("welcome").hidden = false;
      return;
    }

    $("welcome").hidden = true;

    history.forEach(item => {
      renderMessage(item.role, item.text);
    });
  }

  // CONNECTION STATUS
  function updateConnectionStatus() {
    const key = getApiKey();

    $("connection-label").textContent = key
      ? "Gemini key saved"
      : "API key required";
  }

  // API KEY SETTINGS
  function openKeyModal() {
    $("api-key-input").value = getApiKey();
    $("key-modal").hidden = false;
    $("api-key-input").focus();
  }

  function closeKeyModal() {
    $("key-modal").hidden = true;
  }

  // PERSONAL MEMORY
  function rememberInformation(text) {
    const match = text.match(
      /^\s*(?:please\s+)?remember(?:\s+that)?\s+(.+)$/i
    );

    if (!match) return false;

    const fact = match[1].trim();

    if (!fact) return false;

    memories.push(fact);
    memories = memories.slice(-50);

    saveMemories();

    const answer = "I'll remember that: " + fact;

    history.push(
      { role: "user", text: text },
      { role: "model", text: answer }
    );

    saveHistory();

    renderMessage("user", text);
    renderMessage("assistant", answer);

    return true;
  }

  // SEARCH SAVED MEMORIES
  function searchMemory(text) {
    const question = text.toLowerCase();

    const asksForMemory =
      question.includes("what do you remember") ||
      question.includes("what is my memory") ||
      question.includes("what is my favourite colour") ||
      question.includes("what is my favorite color") ||
      question.includes("what is my favourite color") ||
      question.includes("what is my favorite colour");

    if (!asksForMemory || memories.length === 0) {
      return null;
    }

    const colourQuestion =
      question.includes("favourite colour") ||
      question.includes("favorite color") ||
      question.includes("favourite color") ||
      question.includes("favorite colour");

    if (colourQuestion) {
      const colourMemory = memories.find(item =>
        /favou?rite colo[u]?r/i.test(item)
      );

      if (colourMemory) {
        return "You told me: " + colourMemory;
      }
    }

    return "Here is what I remember:\n• " +
      memories.join("\n• ");
  }

  // PART 2 CONTINUES BELOW THIS LINE
 (() => {
  "use strict";

  // SHADOW AI — Main JavaScript
  const $ = id => document.getElementById(id);

  const MODEL = "gemini-3.6-flash";

  const KEY_STORAGE = "shadow_api_key";
  const HISTORY_STORAGE = "shadow_chat_history_v1";
  const MEMORY_STORAGE = "shadow_memory_v1";
  const VOICE_STORAGE = "shadow_voice_enabled";

  let busy = false;
  let recognition = null;
  let voiceEnabled = localStorage.getItem(VOICE_STORAGE) !== "false";
  let toastTimer = null;

  let history = loadJSON(HISTORY_STORAGE, []);
  let memories = loadJSON(MEMORY_STORAGE, []);

  // LOAD SAVED DATA
  function loadJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  // NOTIFICATION
  function toast(message) {
    const element = $("toast");

    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      element.classList.remove("show");
    }, 2800);
  }

  // API KEY
  function getApiKey() {
    return (
      localStorage.getItem(KEY_STORAGE) ||
      localStorage.getItem("disco_api_key") ||
      localStorage.getItem("jarvis_key") ||
      ""
    );
  }

  function saveHistory() {
    try {
      localStorage.setItem(
        HISTORY_STORAGE,
        JSON.stringify(history.slice(-60))
      );
    } catch (error) {
      console.error("Could not save chat history:", error);
    }
  }

  function saveMemories() {
    try {
      localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memories.slice(-50))
      );
    } catch (error) {
      console.error("Could not save memories:", error);
    }
  }

  // DISPLAY MESSAGES
  function renderMessage(role, text) {
    $("welcome").hidden = true;

    const row = document.createElement("article");

    row.className =
      "message " +
      (role === "user" ? "user" : "assistant");

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "YOU" : "S";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    row.append(avatar, bubble);

    $("messages").appendChild(row);

    $("chat-area").scrollTop =
      $("chat-area").scrollHeight;

    return bubble;
  }

  // RESTORE CHAT HISTORY
  function restoreChat() {
    $("messages").replaceChildren();

    if (history.length === 0) {
      $("welcome").hidden = false;
      return;
    }

    $("welcome").hidden = true;

    history.forEach(item => {
      renderMessage(item.role, item.text);
    });
  }

  // CONNECTION STATUS
  function updateConnectionStatus() {
    const key = getApiKey();

    $("connection-label").textContent = key
      ? "Gemini key saved"
      : "API key required";
  }

  // API KEY SETTINGS
  function openKeyModal() {
    $("api-key-input").value = getApiKey();
    $("key-modal").hidden = false;
    $("api-key-input").focus();
  }

  function closeKeyModal() {
    $("key-modal").hidden = true;
  }

  // PERSONAL MEMORY
  function rememberInformation(text) {
    const match = text.match(
      /^\s*(?:please\s+)?remember(?:\s+that)?\s+(.+)$/i
    );

    if (!match) return false;

    const fact = match[1].trim();

    if (!fact) return false;

    memories.push(fact);
    memories = memories.slice(-50);

    saveMemories();

    const answer = "I'll remember that: " + fact;

    history.push(
      { role: "user", text: text },
      { role: "model", text: answer }
    );

    saveHistory();

    renderMessage("user", text);
    renderMessage("assistant", answer);

    return true;
  }

  // SEARCH SAVED MEMORIES
  function searchMemory(text) {
    const question = text.toLowerCase();

    const asksForMemory =
      question.includes("what do you remember") ||
      question.includes("what is my memory") ||
      question.includes("what is my favourite colour") ||
      question.includes("what is my favorite color") ||
      question.includes("what is my favourite color") ||
      question.includes("what is my favorite colour");

    if (!asksForMemory || memories.length === 0) {
      return null;
    }

    const colourQuestion =
      question.includes("favourite colour") ||
      question.includes("favorite color") ||
      question.includes("favourite color") ||
      question.includes("favorite colour");

    if (colourQuestion) {
      const colourMemory = memories.find(item =>
        /favou?rite colo[u]?r/i.test(item)
      );

      if (colourMemory) {
        return "You told me: " + colourMemory;
      }
    }

    return "Here is what I remember:\n• " +
      memories.join("\n• ");
  }

   // SEND MESSAGE TO GEMINI
  async function sendMessage(textOverride) {
    const input = $("chat-input");
    const text = (textOverride || input.value).trim();

    if (!text || busy) return;

    if (!getApiKey()) {
      openKeyModal();
      toast("Please add your Gemini API key.");
      return;
    }

    if (!textOverride) input.value = "";

    if (rememberInformation(text)) return;

    const savedAnswer = searchMemory(text);

    if (savedAnswer) {
      history.push(
        { role: "user", text: text },
        { role: "model", text: savedAnswer }
      );

      saveHistory();
      renderMessage("user", text);
      renderMessage("assistant", savedAnswer);
      return;
    }

    renderMessage("user", text);

    history.push({ role: "user", text: text });
    saveHistory();

    busy = true;
    $("send-btn").disabled = true;

    const loadingBubble = renderMessage(
      "assistant",
      "SHADOW is thinking..."
    );

    try {
      const memoryText = memories.length
        ? "\nSaved user memories:\n" +
          memories.map(item => "- " + item).join("\n")
        : "";

      const contents = history
        .filter(item => item.role === "user" || item.role === "model")
        .slice(-30)
        .map(item => ({
          role: item.role,
          parts: [{ text: item.text }]
        }));

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
          MODEL +
          ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": getApiKey()
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text:
                  "You are SHADOW, a helpful personal AI assistant. " +
                  "Call the user Boss. Answer in clear, simple English. " +
                  "Use saved memories when relevant. Do not claim to remember " +
                  "information that is not available to you." +
                  memoryText
              }]
            },
            contents: contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200
            }
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || "Gemini API request failed."
        );
      }

      const answer =
        data.candidates?.[0]?.content?.parts
          ?.map(part => part.text || "")
          .join("")
          .trim() || "I could not generate a reply. Please try again.";

      loadingBubble.textContent = answer;

      history.push({ role: "model", text: answer });
      saveHistory();

      if (voiceEnabled) speak(answer);

    } catch (error) {
      loadingBubble.textContent = "Error: " + error.message;
      console.error("SHADOW error:", error);
    } finally {
      busy = false;
      $("send-btn").disabled = false;
      $("chat-area").scrollTop = $("chat-area").scrollHeight;
      input.focus();
    }
  }

  // VOICE REPLY
  function speak(text) {
    if (!("speechSynthesis" in window)) {
      toast("Voice output is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.95;
    utterance.pitch = 0.9;

    window.speechSynthesis.speak(utterance);
  }

  // MICROPHONE INPUT
  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast("Voice input is not supported in this browser.");
      return;
    }

    if (recognition) {
      recognition.stop();
      recognition = null;
      $("mic-status").textContent = "";
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.continuous = false;

    $("mic-status").textContent = "Listening...";

    recognition.onresult = event => {
      const transcript =
        event.results[0][0].transcript;

      $("chat-input").value = transcript;
      $("mic-status").textContent = "";
      sendMessage();
    };

    recognition.onerror = event => {
      $("mic-status").textContent = "";
      toast("Microphone error: " + event.error);
    };

    recognition.onend = () => {
      $("mic-status").textContent = "";
      recognition = null;
    };

    recognition.start();
  }

  // CLEAR CHAT
  function newChat() {
    if (busy) {
      toast("Please wait for the current reply to finish.");
      return;
    }

    history = [];
    saveHistory();

    $("messages").replaceChildren();
    $("welcome").hidden = false;
    $("chat-input").value = "";

    toast("New chat started.");
  }

  // THEME
  function toggleTheme() {
    document.body.classList.toggle("light-theme");

    const light =
      document.body.classList.contains("light-theme");

    localStorage.setItem(
      "shadow_theme",
      light ? "light" : "dark"
    );
  }

  // BUTTON CONNECTIONS
  function connectButtons() {
    $("send-btn").addEventListener("click", () => {
      sendMessage();
    });

    $("chat-input").addEventListener("keydown", event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    });

    $("mic-btn").addEventListener("click", startListening);

    $("new-chat-btn").addEventListener("click", newChat);

    $("home-btn").addEventListener("click", () => {
      $("chat-area").scrollTop = 0;
      $("chat-input").focus();
    });

    $("memory-btn").addEventListener("click", () => {
      if (memories.length === 0) {
        toast("No saved memories yet. Type: Remember that my favourite colour is black.");
        return;
      }

      renderMessage(
        "assistant",
        "My saved memories:\n• " + memories.join("\n• ")
      );
    });

    $("api-key-btn").addEventListener("click", openKeyModal);

    $("close-key-modal").addEventListener("click", closeKeyModal);

    $("save-key-btn").addEventListener("click", () => {
      const key = $("api-key-input").value.trim();

      if (!key) {
        toast("Please enter your API key.");
        return;
      }

      localStorage.setItem(KEY_STORAGE, key);
      updateConnectionStatus();
      closeKeyModal();
      toast("API key saved on this device.");
    });

    $("remove-key-btn").addEventListener("click", () => {
      localStorage.removeItem(KEY_STORAGE);
      localStorage.removeItem("disco_api_key");
      localStorage.removeItem("jarvis_key");

      $("api-key-input").value = "";

      updateConnectionStatus();
      toast("Saved API key removed.");
    });

    $("theme-btn").addEventListener("click", toggleTheme);

    $("voice-toggle-btn").addEventListener("click", () => {
      voiceEnabled = !voiceEnabled;

      localStorage.setItem(
        VOICE_STORAGE,
        String(voiceEnabled)
      );

      $("voice-toggle-btn").textContent =
        voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off";

      if (!voiceEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      toast(voiceEnabled ? "Voice replies enabled." : "Voice replies disabled.");
    });

    $("menu-btn").addEventListener("click", () => {
      $("sidebar").classList.toggle("open");
    });

    document.querySelectorAll(".prompt-card").forEach(button => {
      button.addEventListener("click", () => {
        const prompt = button.dataset.prompt;

        if (prompt) sendMessage(prompt);
      });
    });

    $("key-modal").addEventListener("click", event => {
      if (event.target === $("key-modal")) {
        closeKeyModal();
      }
    });
  }

  // START SHADOW
  function init() {
    const savedTheme = localStorage.getItem("shadow_theme");

    if (savedTheme === "light") {
      document.body.classList.add("light-theme");
    }

    $("voice-toggle-btn").textContent =
      voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off";

    connectButtons();
    restoreChat();
    updateConnectionStatus();

    console.log("SHADOW initialised successfully.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
  // PART 2 CONTINUES BELOW THIS LINE
