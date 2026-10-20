(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const chat = $("chat");
  const msg = $("msg");
  const sendBtn = $("sendBtn");
  const statusText = $("statusText");

  let selectedImage = null;
  let busy = false;
  let lastWeather = null;

  const getKey = name => localStorage.getItem(name) || "";

  function toast(text) {
    const element = $("toast");
    element.textContent = text;
    element.classList.remove("hidden");

    setTimeout(() => element.classList.add("hidden"), 3000);
  }

  function status(text) {
    statusText.textContent = text;
  }

  function addMessage(text, who = "bot") {
    const box = document.createElement("div");
    box.className = `message ${who}`;

    const title = document.createElement("strong");
    title.textContent = who === "user" ? "YOU" : "D.I.S.C.O";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    box.append(title, paragraph);
    chat.appendChild(box);
    chat.scrollTop = chat.scrollHeight;

    return paragraph;
  }

  // INDIAN TIME
  function updateClock() {
    const now = new Date();

    $("clock").textContent = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    $("date").textContent = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium"
    });
  }

  updateClock();
  setInterval(updateClock, 1000);

  // WEATHER
  async function loadWeather(city = "Visakhapatnam") {
    $("weatherText").textContent = "Updating...";

    const cities = {
      visakhapatnam: [17.6868, 83.2185],
      vizag: [17.6868, 83.2185],
      hyderabad: [17.385, 78.4867],
      delhi: [28.6139, 77.209],
      mumbai: [19.076, 72.8777],
      bengaluru: [12.9716, 77.5946],
      chennai: [13.0827, 80.2708],
      guntur: [16.3067, 80.4365],
      ongole: [15.5057, 80.0499]
    };

    const coordinates = cities[city.toLowerCase()];

    if (!coordinates) {
      $("weatherText").textContent = "City not supported";
      return null;
    }

    try {
      const [lat, lon] = coordinates;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=1`
      );

      if (!response.ok) throw new Error("Weather request failed");

      const data = await response.json();

      const conditions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Fog",
        51: "Light drizzle",
        53: "Drizzle",
        55: "Heavy drizzle",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        80: "Rain showers",
        81: "Rain showers",
        82: "Heavy showers",
        95: "Thunderstorm",
        96: "Thunderstorm",
        99: "Thunderstorm"
      };

      const current = data.current;
      const daily = data.daily;

      lastWeather = {
        city,
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        condition: conditions[current.weather_code] || "Unknown",
        wind: current.wind_speed_10m,
        max: daily.temperature_2m_max[0],
        min: daily.temperature_2m_min[0],
        rainChance: daily.precipitation_probability_max[0],
        updatedAt: current.time
      };

      $("temperature").textContent =
        `${lastWeather.temperature}°C`;

      $("weatherText").textContent =
        `${city} · ${lastWeather.condition}`;

      return lastWeather;
    } catch (error) {
      $("weatherText").textContent = "Weather unavailable";
      return null;
    }
  }

  $("weatherBtn").addEventListener("click", async () => {
    await loadWeather();
    toast(lastWeather ? "Weather updated" : "Weather unavailable");
  });

  // CURRENCY
  async function loadCurrency() {
    try {
      const response = await fetch(
        "https://open.er-api.com/v6/latest/USD"
      );

      if (!response.ok) throw new Error("Currency request failed");

      const data = await response.json();

      if (data.result !== "success" || !data.rates?.INR) {
        throw new Error("Exchange rate unavailable");
      }

      const rate = data.rates.INR;

      $("exchange").textContent = `₹${rate.toFixed(2)}`;
      $("reverseExchange").textContent =
        `₹1 = $${(1 / rate).toFixed(6)}`;

      return {
        usdToInr: rate,
        inrToUsd: 1 / rate,
        updatedAt: data.time_last_update_utc
      };
    } catch (error) {
      $("exchange").textContent = "Unavailable";
      $("reverseExchange").textContent = "Try again later";
      return null;
    }
  }

  // GOLD
  async function loadGold() {
    const key = getKey("disco_gold_key");

    if (!key) {
      $("gold24").textContent = "API key needed";
      $("gold22").textContent = "Add GoldAPI key in settings";
      return null;
    }

    $("gold24").textContent = "Loading...";

    try {
      const response = await fetch(
        "https://www.goldapi.io/api/XAU/INR",
        {
          headers: {
            "x-access-token": key,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) throw new Error("Gold API failed");

      const data = await response.json();

      if (typeof data.price !== "number") {
        throw new Error("Invalid gold price");
      }

      const gram = data.price / 31.1034768;

      const result = {
        karat24: gram,
        karat22: gram * 22 / 24,
        karat18: gram * 18 / 24,
        updatedAt: data.timestamp || null
      };

      $("gold24").textContent =
        `₹${result.karat24.toFixed(2)}/g`;

      $("gold22").textContent =
        `22K: ₹${result.karat22.toFixed(2)}/g`;

      return result;
    } catch (error) {
      $("gold24").textContent = "Unavailable";
      $("gold22").textContent = "Check API key";
      return null;
    }
  }

  $("goldBtn").addEventListener("click", async () => {
    const result = await loadGold();
    toast(result ? "Gold rate updated" : "Gold rate unavailable");
  });

  // API SETTINGS
  $("keyBtn").addEventListener("click", () => {
    $("apiKeyInput").value = getKey("disco_gemini_key");
    $("goldKeyInput").value = getKey("disco_gold_key");
    $("keyModal").classList.remove("hidden");
  });

  $("closeKeyBtn").addEventListener("click", () => {
    $("keyModal").classList.add("hidden");
  });

  $("saveKeyBtn").addEventListener("click", async () => {
    const gemini = $("apiKeyInput").value.trim();
    const gold = $("goldKeyInput").value.trim();

    if (gemini) {
      localStorage.setItem("disco_gemini_key", gemini);
    }

    if (gold) {
      localStorage.setItem("disco_gold_key", gold);
    }

    $("keyModal").classList.add("hidden");
    toast("Settings saved");

    await loadGold();
  });

  $("removeKeyBtn").addEventListener("click", () => {
    localStorage.removeItem("disco_gemini_key");
    localStorage.removeItem("disco_gold_key");

    $("apiKeyInput").value = "";
    $("goldKeyInput").value = "";

    $("gold24").textContent = "API key needed";
    $("gold22").textContent = "Add GoldAPI key in settings";

    toast("Saved keys removed");
  });

  // IMAGE UPLOAD
  $("imageBtn").addEventListener("click", () => {
    $("imageInput").click();
  });

  $("imageInput").addEventListener("change", () => {
    const file = $("imageInput").files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select an image");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast("Image must be smaller than 4 MB");
      $("imageInput").value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      selectedImage = {
        data: reader.result.split(",")[1],
        mimeType: file.type,
        name: file.name
      };

      $("imageName").textContent = file.name;
      $("imagePreview").classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  });

  $("removeImageBtn").addEventListener("click", () => {
    selectedImage = null;
    $("imageInput").value = "";
    $("imagePreview").classList.add("hidden");
  });

  // LOCAL COMMANDS
  function localAnswer(message) {
    const text = message.toLowerCase();

    if (/\b(time|date|today's date)\b/.test(text)) {
      return `Current Indian time: ${$("clock").textContent}\nDate: ${$("date").textContent}`;
    }

    if (text.includes("weather") || text.includes("temperature")) {
      const match = text.match(
        /\b(?:in|for|at)\s+(visakhapatnam|vizag|hyderabad|delhi|mumbai|bengaluru|chennai|guntur|ongole)\b/
      );

      const city = match ? match[1] : "Visakhapatnam";

      return loadWeather(city).then(weather => {
        if (!weather) return "Weather is currently unavailable.";

        return `🌦️ WEATHER — ${weather.city}\n` +
          `Temperature: ${weather.temperature}°C\n` +
          `Feels like: ${weather.feelsLike}°C\n` +
          `Condition: ${weather.condition}\n` +
          `Humidity: ${weather.humidity}%\n` +
          `Wind: ${weather.wind} km/h\n` +
          `Today's range: ${weather.min}°C–${weather.max}°C\n` +
          `Rain chance: ${weather.rainChance ?? "Unavailable"}%`;
      });
    }

    if (
      text.includes("gold") ||
      text.includes("22k") ||
      text.includes("24k")
    ) {
      return loadGold().then(gold => {
        if (!gold) return "Gold rate unavailable. Check your GoldAPI key.";

        return `🥇 GOLD RATE — INDIA\n` +
          `24K: ₹${gold.karat24.toFixed(2)}/gram\n` +
          `22K: ₹${gold.karat22.toFixed(2)}/gram\n` +
          `18K: ₹${gold.karat18.toFixed(2)}/gram\n` +
          `Indicative metal prices; jewellery charges and taxes may differ.`;
      });
    }

    if (
      text.includes("dollar") ||
      text.includes("currency") ||
      text.includes("exchange rate") ||
      text.includes("rupee")
    ) {
      return loadCurrency().then(rate => {
        if (!rate) return "Exchange rate is currently unavailable.";

        return `💱 CURRENCY\n` +
          `$1 USD = ₹${rate.usdToInr.toFixed(4)}\n` +
          `₹1 INR = $${rate.inrToUsd.toFixed(6)}\n` +
          `Last update: ${rate.updatedAt}`;
      });
    }

    return null;
  }

  // GEMINI AI
  async function askGemini(message, image) {
    const key = getKey("disco_gemini_key");

    if (!key) {
      throw new Error("Add your Gemini API key using the 🔑 button.");
    }

    const model = "gemini-2.5-flash";

    const parts = [{ text: message }];

    if (image) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data
        }
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 700
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message || `Gemini error ${response.status}`
        );
      }

      const answer = result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

      if (!answer) throw new Error("Gemini returned an empty answer.");

      return answer;
    } finally {
      clearTimeout(timeout);
    }
  }

  // SEND MESSAGE
  async function sendMessage() {
    if (busy) return;

    const message = msg.value.trim();

    if (!message && !selectedImage) return;

    busy = true;
    sendBtn.disabled = true;
    status("Thinking...");

    const image = selectedImage;

    addMessage(
      message || "Please analyse this image.",
      "user"
    );

    msg.value = "";
    selectedImage = null;
    $("imageInput").value = "";
    $("imagePreview").classList.add("hidden");

    const reply = addMessage("Thinking...", "bot");

    try {
      const local = !image ? localAnswer(message) : null;

      let answer;

      if (local !== null) {
        answer = await local;
      } else {
        answer = await askGemini(message, image);
      }

      reply.textContent = answer;
      status("Ready");
    } catch (error) {
      reply.textContent =
        error.name === "AbortError"
          ? "The request timed out. Please try again."
          : `Error: ${error.message}`;

      status("Request failed");
    } finally {
      busy = false;
      sendBtn.disabled = false;
      msg.focus();
      chat.scrollTop = chat.scrollHeight;
    }
  }

  sendBtn.addEventListener("click", sendMessage);

  msg.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  // CLEAR CHAT
  $("clearBtn").addEventListener("click", () => {
    chat.replaceChildren();

    addMessage("Chat cleared. How may I help you?", "bot");
    status("Ready");
  });

  // VOICE INPUT
  $("micBtn").addEventListener("click", () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => status("Listening...");
    recognition.onresult = event => {
      msg.value = event.results[0][0].transcript;
      status("Voice captured");
    };

    recognition.onerror = () => status("Voice input failed");
    recognition.onend = () => {
      if (statusText.textContent === "Listening...") status("Ready");
    };

    recognition.start();
  });

  // INITIAL DATA
  loadWeather();
  loadCurrency();

})();
