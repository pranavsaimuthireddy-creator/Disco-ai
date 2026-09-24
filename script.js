"use strict";

/* =====================================================
   D.I.S.C.O — STABLE SCRIPT
   15 TOOLS + MEMORY + GEMINI + VOICE + LOCATION
   ===================================================== */

const MODEL = "gemini-3.6-flash";

const KEY_NAME = "disco_api_key";
const MEMORY_NAME = "disco_memory";

const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const keyBtn = document.getElementById("change-key");
const imageBtn = document.getElementById("img-btn");
const imageInput = document.getElementById("img-input");
const chat = document.getElementById("chat");

let memory = [];
let timer = null;


/* =====================================================
   MEMORY
   ===================================================== */

try {
    memory = JSON.parse(localStorage.getItem(MEMORY_NAME) || "[]");

    if (!Array.isArray(memory)) {
        memory = [];
    }
} catch (e) {
    memory = [];
}

function saveMemory() {
    localStorage.setItem(MEMORY_NAME, JSON.stringify(memory));
}

function remember(text) {
    memory.push({
        text: text,
        time: Date.now()
    });

    saveMemory();
}


/* =====================================================
   CHAT
   ===================================================== */

function addUser(text) {
    if (!chat) return;

    const div = document.createElement("div");
    div.className = "msg user";
    div.textContent = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function addAI(text) {
    if (!chat) return;

    const div = document.createElement("div");
    div.className = "msg ai";
    div.textContent = "D.I.S.C.O: " + text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}


/* =====================================================
   VOICE OUTPUT
   ===================================================== */

function speak(text) {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(
        String(text)
    );

    speech.lang = "en-IN";
    speech.rate = 0.95;
    speech.pitch = 0.9;
    speech.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    let voice = voices.find(function(v) {
        return v.lang === "en-IN";
    });

    if (!voice) {
        voice = voices.find(function(v) {
            return v.lang.startsWith("en");
        });
    }

    if (voice) {
        speech.voice = voice;
    }

    window.speechSynthesis.speak(speech);
}


/* =====================================================
   MEMORY LEARNING
   ===================================================== */

function learnMemory(text) {
    const lower = text.toLowerCase();

    if (
        lower.startsWith("remember that ") ||
        lower.startsWith("remember ")
    ) {
        let value = text
            .replace(/^remember that\s*/i, "")
            .replace(/^remember\s*/i, "")
            .trim();

        if (value) {
            remember(value);
            return "I will remember that, Boss.";
        }
    }

    return null;
}


/* =====================================================
   MEMORY QUESTIONS
   ===================================================== */

function memoryAnswer(text) {
    const lower = text.toLowerCase();

    /* NAME */

    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
        lower.includes("whats my name")
    ) {
        for (let i = memory.length - 1; i >= 0; i--) {
            const match = memory[i].text.match(
                /my\s+name\s+is\s+(.+)/i
            );

            if (match) {
                return "Your name is " +
                    match[1].trim() +
                    ", Boss.";
            }
        }

        return "I don't know your name yet, Boss.";
    }


    /* FAVOURITE COLOUR */

    if (
        lower.includes("favourite colour") ||
        lower.includes("favorite colour") ||
        lower.includes("favourite color") ||
        lower.includes("favorite color")
    ) {
        for (let i = memory.length - 1; i >= 0; i--) {
            const match = memory[i].text.match(
                /my\s+(?:favourite|favorite)\s+colou?r\s+is\s+(.+)/i
            );

            if (match) {
                return "Your favourite colour is " +
                    match[1].trim() +
                    ", Boss.";
            }
        }

        return "I don't know your favourite colour yet, Boss.";
    }


    /* FAVOURITE BIKE */

    if (
        lower.includes("favourite bike") ||
        lower.includes("favorite bike")
    ) {
        for (let i = memory.length - 1; i >= 0; i--) {
            const match = memory[i].text.match(
                /my\s+(?:favourite|favorite)\s+bike\s+is\s+(.+)/i
            );

            if (match) {
                return "Your favourite bike is " +
                    match[1].trim() +
                    ", Boss.";
            }
        }

        return "I don't know your favourite bike yet, Boss.";
    }


    /* FAVOURITE FOOD */

    if (
        lower.includes("favourite food") ||
        lower.includes("favorite food")
    ) {
        for (let i = memory.length - 1; i >= 0; i--) {
            const match = memory[i].text.match(
                /my\s+(?:favourite|favorite)\s+food\s+is\s+(.+)/i
            );

            if (match) {
                return "Your favourite food is " +
                    match[1].trim() +
                    ", Boss.";
            }
        }

        return "I don't know your favourite food yet, Boss.";
    }


    /* SHOW MEMORY */

    if (
        lower.includes("what do you remember") ||
        lower.includes("show my memory")
    ) {
        if (memory.length === 0) {
            return "My memory is empty, Boss.";
        }

        return "I remember:\n" +
            memory.map(function(item, index) {
                return (index + 1) + ". " + item.text;
            }).join("\n");
    }

    return null;
}


/* =====================================================
   TOOL 1 — TIME
   ===================================================== */

function toolTime(text) {
    const t = text.toLowerCase();

    if (
        t === "time" ||
        t.includes("what time") ||
        t.includes("current time") ||
        t.includes("tell me the time")
    ) {
        return "The current time is " +
            new Date().toLocaleTimeString("en-IN") +
            ", Boss.";
    }

    return null;
}


/* =====================================================
   TOOL 2 — DATE
   ===================================================== */

function toolDate(text) {
    const t = text.toLowerCase();

    if (
        t === "date" ||
        t.includes("today's date") ||
        t.includes("todays date") ||
        t.includes("what is the date") ||
        t.includes("what day is today")
    ) {
        return "Today is " +
            new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }) +
            ", Boss.";
    }

    return null;
}


/* =====================================================
   TOOL 3 — LOCATION
   ===================================================== */

async function toolLocation(text) {
    const t = text.toLowerCase();

    if (
        !t.includes("where am i") &&
        !t.includes("my location") &&
        !t.includes("current location") &&
        !t.includes("my current location")
    ) {
        return null;
    }

    if (!navigator.geolocation) {
        return "Location is not supported by this browser, Boss.";
    }

    try {
        const position = await new Promise(function(resolve, reject) {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 60000
                }
            );
        });

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const url =
            "https://geocoding-api.open-meteo.com/v1/reverse" +
            "?latitude=" + lat +
            "&longitude=" + lon +
            "&language=en" +
            "&format=json";

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.address) {
            const a = data.address;

            const place =
                a.city ||
                a.town ||
                a.village ||
                a.municipality ||
                a.county ||
                "your current area";

            const state = a.state || "";
            const country = a.country || "";

            return "You are currently around " +
                place +
                (state ? ", " + state : "") +
                (country ? ", " + country : "") +
                ", Boss.";
        }

        return "I found your location, but I could not identify the city name, Boss.";

    } catch (error) {
        return "I could not access your location. Please allow location permission for this website, Boss.";
    }
}


/* =====================================================
   TOOL 4 — WEATHER
   ===================================================== */

async function toolWeather(text) {
    const t = text.toLowerCase();

    if (!t.includes("weather")) {
        return null;
    }

    try {
        let lat;
        let lon;
        let place = "your location";

        const cityMatch = text.match(
            /weather\s+(?:in|at|for)\s+(.+)/i
        );

        /* WEATHER FOR A CITY */

        if (cityMatch) {
            const city = cityMatch[1]
                .replace(/[?.!]+$/, "")
                .trim();

            const geoURL =
                "https://geocoding-api.open-meteo.com/v1/search" +
                "?name=" + encodeURIComponent(city) +
                "&count=1" +
                "&language=en" +
                "&format=json";

            const geoResponse = await fetch(geoURL);
            const geoData = await geoResponse.json();

            if (
                !geoData.results ||
                geoData.results.length === 0
            ) {
                return "I could not find that city, Boss.";
            }

            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            place = geoData.results[0].name;

        } else {

            /* WEATHER USING DEVICE LOCATION */

            if (!navigator.geolocation) {
                return "Location is not supported by this browser, Boss.";
            }

            const position = await new Promise(function(resolve, reject) {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: false,
                        timeout: 15000,
                        maximumAge: 60000
                    }
                );
            });

            lat = position.coords.latitude;
            lon = position.coords.longitude;
        }

        const weatherURL =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + lat +
            "&longitude=" + lon +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code" +
            "&timezone=auto";

        const weatherResponse = await fetch(weatherURL);
        const weather = await weatherResponse.json();

        if (!weather.current) {
            return "Weather information is unavailable right now, Boss.";
        }

        const c = weather.current;

        return "Current weather in " +
            place +
            " is " +
            c.temperature_2m +
            "°C. It feels like " +
            c.apparent_temperature +
            "°C, humidity is " +
            c.relative_humidity_2m +
            "%, and wind speed is " +
            c.wind_speed_10m +
            " km/h, Boss.";

    } catch (error) {
        return "I could not get the weather. Please allow location permission or specify a city, Boss.";
    }
}


/* =====================================================
   TOOL 5 — TIMER
   ===================================================== */

function toolTimer(text) {
    const t = text.toLowerCase();

    if (!t.includes("timer")) {
        return null;
    }

    const match = t.match(
        /(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/
    );

    if (!match) {
        return "Tell me the timer duration, Boss. For example: set a timer for 5 minutes.";
    }

    const amount = Number(match[1]);
    const unit = match[2];

    let milliseconds;

    if (
        unit.startsWith("second") ||
        unit.startsWith("sec")
    ) {
        milliseconds = amount * 1000;
    } else if (
        unit.startsWith("hour") ||
        unit.startsWith("hr")
    ) {
        milliseconds = amount * 60 * 60 * 1000;
    } else {
        milliseconds = amount * 60 * 1000;
    }

    if (timer) {
        clearTimeout(timer);
    }

    timer = setTimeout(function() {
        const message =
            "Boss, your timer is finished.";

        addAI(message);
        speak(message);

        timer = null;
    }, milliseconds);

    return "Timer set for " +
        amount +
        " " +
        unit +
        ", Boss.";
}


/* =====================================================
   TOOL 6 — TRANSLATE
   ===================================================== */

async function toolTranslate(text) {
    if (!text.toLowerCase().startsWith("translate")) {
        return null;
    }

    const query = text
        .replace(/^translate\s*/i, "")
        .trim();

    if (!query) {
        return "Tell me what you want me to translate, Boss.";
    }

    try {
        const url =
            "https://api.mymemory.translated.net/get" +
            "?q=" + encodeURIComponent(query) +
            "&langpair=en|te";

        const response = await fetch(url);
        const data = await response.json();

        return "In Telugu: " +
            data.responseData.translatedText;

    } catch (error) {
        return "Translation service is unavailable, Boss.";
    }
}


/* =====================================================
   TOOL 7 — YOUTUBE SEARCH
   ===================================================== */

function toolYouTube(text) {
    const t = text.toLowerCase();

    if (
        t.startsWith("play ") ||
        t.startsWith("youtube search ")
    ) {
        let query = text
            .replace(/^play\s+/i, "")
            .replace(/^youtube\s+search\s+/i, "")
            .trim();

        if (!query) {
            return "Tell me what to search on YouTube, Boss.";
        }

        window.open(
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query),
            "_blank"
        );

        return "Searching YouTube for " +
            query +
            ", Boss.";
    }

    return null;
}


/* =====================================================
   TOOL 8 — GOOGLE SEARCH
   ===================================================== */

function toolGoogle(text) {
    const t = text.toLowerCase();

    if (
        t.startsWith("google ") ||
        t.startsWith("search google ") ||
        t.startsWith("search for ")
    ) {
        const query = text
            .replace(/^google\s+/i, "")
            .replace(/^search\s+google\s+/i, "")
            .replace(/^search\s+for\s+/i, "")
            .trim();

        if (!query) {
            return "Tell me what to search for, Boss.";
        }

        window.open(
            "https://www.google.com/search?q=" +
            encodeURIComponent(query),
            "_blank"
        );

        return "Searching Google for " +
            query +
            ", Boss.";
    }

    return null;
}


/* =====================================================
   TOOL 9 — CALCULATOR
   ===================================================== */

function toolCalculator(text) {
    const t = text.toLowerCase();

    if (
        !t.startsWith("calculate ") &&
        !t.startsWith("calc ")
    ) {
        return null;
    }

    let expression = text
        .replace(/^calculate\s+/i, "")
        .replace(/^calc\s+/i, "")
        .trim();

    expression = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/");

    if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
        return "I can only calculate basic mathematical expressions, Boss.";
    }

    try {
        const result = Function(
            '"use strict"; return (' +
            expression +
            ")"
        )();

        return "The answer is " +
            result +
            ", Boss.";

    } catch (error) {
        return "I could not calculate that, Boss.";
    }
}


/* =====================================================
   TOOL 10 — CANCEL TIMER
   ===================================================== */

function toolCancelTimer(text) {
    const t = text.toLowerCase();

    if (
        t.includes("cancel timer") ||
        t.includes("stop timer")
    ) {
        if (timer) {
            clearTimeout(timer);
            timer = null;

            return "Timer cancelled, Boss.";
        }

        return "There is no active timer, Boss.";
    }

    return null;
}


/* =====================================================
   TOOL 11 — OPEN YOUTUBE
   ===================================================== */

function toolOpenYouTube(text) {
    if (
        text.toLowerCase().trim() === "open youtube"
    ) {
        window.open(
            "https://www.youtube.com/",
            "_blank"
        );

        return "Opening YouTube, Boss.";
    }

    return null;
}


/* =====================================================
   TOOL 12 — OPEN GOOGLE
   ===================================================== */

function toolOpenGoogle(text) {
    if (
        text.toLowerCase().trim() === "open google"
    ) {
        window.open(
            "https://www.google.com/",
            "_blank"
        );

        return "Opening Google, Boss.";
    }

    return null;
}


/* =====================================================
   TOOL 13 — OPEN GITHUB
   ===================================================== */

function toolGitHub(text) {
    if (
        text.toLowerCase().trim() === "open github"
    ) {
        window.open(
            "https://github.com/",
            "_blank"
        );

        return "Opening GitHub, Boss.";
    }

    return null;
}


/* =====================================================
   TOOL 14 — BATTERY
   ===================================================== */

async function toolBattery(text) {
    if (!text.toLowerCase().includes("battery")) {
        return null;
    }

    if (!navigator.getBattery) {
        return "Battery information is not supported by this browser, Boss.";
    }

    try {
        const battery =
            await navigator.getBattery();

        const level =
            Math.round(battery.level * 100);

        return "Battery is at " +
            level +
            "%. " +
            (
                battery.charging
                    ? "The device is charging."
                    : "The device is not charging."
            ) +
            " Boss.";

    } catch (error) {
        return "I could not read the battery status, Boss.";
    }
}


/* =====================================================
   TOOL 15 — NETWORK / DEVICE
   ===================================================== */

function toolDevice(text) {
    const t = text.toLowerCase();

    if (
        t.includes("device info") ||
        t.includes("device information")
    ) {
        return "You are using: " +
            navigator.userAgent +
            ", Boss.";
    }

    if (
        t.includes("internet status") ||
        t.includes("network status") ||
        t.includes("am i online")
    ) {
        return navigator.onLine
            ? "You are currently online, Boss."
            : "You are currently offline, Boss.";
    }

    return null;
}


/* =====================================================
   RUN TOOLS
   ===================================================== */

async function runTools(text) {
    let result;

    result = toolTime(text);
    if (result) return result;

    result = toolDate(text);
    if (result) return result;

    result = await toolLocation(text);
    if (result) return result;

    result = await toolWeather(text);
    if (result) return result;

    result = toolTimer(text);
    if (result) return result;

    result = await toolTranslate(text);
    if (result) return result;

    result = toolYouTube(text);
    if (result) return result;

    result = toolGoogle(text);
    if (result) return result;

    result = toolCalculator(text);
    if (result) return result;

    result = toolCancelTimer(text);
    if (result) return result;

    result = toolOpenYouTube(text);
    if (result) return result;

    result = toolOpenGoogle(text);
    if (result) return result;

    result = toolGitHub(text);
    if (result) return result;

    result = await toolBattery(text);
    if (result) return result;

    result = toolDevice(text);
    if (result) return result;

    return null;
}


/* =====================================================
   GEMINI
   ===================================================== */

async function askGemini(question) {
    let key = localStorage.getItem(KEY_NAME);

    if (!key) {
        key = prompt("Enter your Gemini API key:");

        if (!key) {
            return "Gemini API key was not entered, Boss.";
        }

        localStorage.setItem(KEY_NAME, key.trim());
    }

    const memoryText = memory.length
        ? memory.map(function(item) {
            return item.text;
        }).join("\n")
        : "No stored memory.";

    const promptText =
        "You are D.I.S.C.O, a helpful AI assistant. " +
        "Call the user Boss. Use simple Indian English. " +
        "Answer the actual question clearly.\n\n" +
        "MEMORY:\n" +
        memoryText +
        "\n\nQUESTION:\n" +
        question;

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            MODEL +
            ":generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": key
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: promptText
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (
                response.status === 401 ||
                response.status === 403
            ) {
                return "The Gemini API key was rejected, Boss. Press KEY to change it.";
            }

            if (response.status === 429) {
                return "Gemini request limit reached. Please try again later, Boss.";
            }

            return "Gemini error: " +
                (
                    data.error &&
                    data.error.message
                        ? data.error.message
                        : "Unknown error"
                );
        }

        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content
        ) {
            return data.candidates[0]
                .content
                .parts
                .map(function(part) {
                    return part.text || "";
                })
                .join("")
                .trim();
        }

        return "Gemini returned no answer, Boss.";

    } catch (error) {
        return "Network error while contacting Gemini, Boss.";
    }
}


/* =====================================================
   MAIN SEND
   ===================================================== */

async function sendMessage() {
    if (!msg) return;

    const text = msg.value.trim();

    if (!text) return;

    addUser(text);

    msg.value = "";

    /* MEMORY */

    const learned = learnMemory(text);

    if (learned) {
        addAI(learned);
        speak(learned);
        return;
    }

    const remembered = memoryAnswer(text);

    if (remembered) {
        addAI(remembered);
        speak(remembered);
        return;
    }

    /* TOOLS */

    const toolResult = await runTools(text);

    if (toolResult) {
        addAI(toolResult);
        speak(toolResult);
        return;
    }

    /* GEMINI */

    addAI("Processing...");

    const answer = await askGemini(text);

    const aiMessages =
        chat.querySelectorAll(".msg.ai");

    if (aiMessages.length > 0) {
        const last =
            aiMessages[aiMessages.length - 1];

        if (
            last.textContent.includes("Processing...")
        ) {
            last.remove();
        }
    }

    addAI(answer);
    speak(answer);
}


/* =====================================================
   SEND BUTTON
   ===================================================== */

if (send) {
    send.onclick = function() {
        sendMessage();
    };
}


/* =====================================================
   ENTER KEY
   ===================================================== */

if (msg) {
    msg.onkeydown = function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    };
}


/* =====================================================
   CLEAR BUTTON
   ===================================================== */

if (clearBtn) {
    clearBtn.onclick = function() {
        memory = [];
        localStorage.removeItem(MEMORY_NAME);

        if (chat) {
            chat.innerHTML = "";
        }

        const message =
            "Memory cleared. I am ready, Boss.";

        addAI(message);
        speak(message);
    };
}


/* =====================================================
   KEY BUTTON
   ===================================================== */

if (keyBtn) {
    keyBtn.onclick = function() {
        const key = prompt(
            "Enter your new Gemini API key:"
        );

        if (key && key.trim()) {
            localStorage.setItem(
                KEY_NAME,
                key.trim()
            );

            const message =
                "Gemini API key updated, Boss.";

            addAI(message);
            speak(message);
        }
    };
}


/* =====================================================
   MICROPHONE
   ===================================================== */

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {
        if (mic) {
            mic.textContent = "🔴";
        }
    };

    recognition.onresult = function(event) {
        const spoken =
            event.results[0][0].transcript;

        if (msg) {
            msg.value = spoken;
        }

        sendMessage();
    };

    recognition.onerror = function() {
        if (mic) {
            mic.textContent = "🎙️";
        }

        addAI(
            "I could not hear you clearly, Boss."
        );
    };

    recognition.onend = function() {
        if (mic) {
            mic.textContent = "🎙️";
        }
    };
}

if (mic) {
    mic.onclick = function() {
        if (!recognition) {
            addAI(
                "Voice recognition is not supported by this browser, Boss."
            );
            return;
        }

        try {
            recognition.start();
        } catch (e) {
            /* Prevent repeated start error */
        }
    };
}


/* =====================================================
   IMAGE BUTTON
   ===================================================== */

if (imageBtn && imageInput) {
    imageBtn.onclick = function() {
        imageInput.click();
    };

    imageInput.onchange = function() {
        const file = imageInput.files[0];

        if (!file) return;

        addUser("🖼️ " + file.name);

        addAI(
            "Image selected, Boss. You can connect your Gemini vision request here."
        );

        imageInput.value = "";
    };
}


/* =====================================================
   STARTUP
   ===================================================== */

console.log("D.I.S.C.O loaded successfully.");
console.log("SEND button ready.");
console.log("15 tools ready.");
