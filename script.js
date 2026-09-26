// ======================================================
// D.I.S.C.O - MOBILE AI CORE
// Complete script.js
// ======================================================

const MODEL = "gemini-3.8-flash";

const API_KEY_NAME = "disco_api_key";
const MEMORY_NAME = "disco_memory";

let lastActionUrl = "";
let timerId = null;
let voices = [];

// ======================================================
// ELEMENTS
// ======================================================

const chat = document.getElementById("chat");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const keyBtn = document.getElementById("key-btn");
const imgInput = document.getElementById("img-input");

// ======================================================
// VOICES
// ======================================================

function loadVoices() {
    voices = speechSynthesis.getVoices();
}

loadVoices();

if ("onvoiceschanged" in speechSynthesis) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

// Try to select a male-sounding English voice.
// The actual available voices depend on the device/browser.
function getMaleVoice() {
    const englishVoices = voices.filter(v =>
        v.lang &&
        (
            v.lang.toLowerCase().startsWith("en-in") ||
            v.lang.toLowerCase().startsWith("en-gb") ||
            v.lang.toLowerCase().startsWith("en-us") ||
            v.lang.toLowerCase().startsWith("en")
        )
    );

    const maleWords = [
        "male",
        "man",
        "ravi",
        "david",
        "mark",
        "george",
        "daniel",
        "alex",
        "james",
        "john"
    ];

    const maleVoice = englishVoices.find(v => {
        const name = v.name.toLowerCase();
        return maleWords.some(word => name.includes(word));
    });

    return maleVoice || englishVoices.find(v =>
        v.lang.toLowerCase().startsWith("en-in")
    ) || englishVoices[0] || voices[0];
}

// ======================================================
// SPEECH
// ======================================================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const voice = getMaleVoice();

    if (voice) {
        utterance.voice = voice;
    }

    utterance.lang = "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 0.78;
    utterance.volume = 1;

    document.body.classList.add("speaking");

    utterance.onend = () => {
        document.body.classList.remove("speaking");
    };

    utterance.onerror = () => {
        document.body.classList.remove("speaking");
    };

    speechSynthesis.speak(utterance);
}

// ======================================================
// CHAT DISPLAY
// ======================================================

function addMessage(text, sender = "ai") {

    if (!chat) return;

    const box = document.createElement("div");

    box.className = sender === "user"
        ? "msg user-msg"
        : "msg ai-msg";

    box.innerHTML = `
        <div class="msg-label">
            ${sender === "user" ? "BOSS" : "D.I.S.C.O"}
        </div>
        <div class="msg-text"></div>
    `;

    box.querySelector(".msg-text").textContent = text;

    chat.appendChild(box);

    chat.scrollTop = chat.scrollHeight;
}

// ======================================================
// MEMORY
// ======================================================

function getMemory() {

    try {
        return JSON.parse(
            localStorage.getItem(MEMORY_NAME) || "{}"
        );
    } catch {
        return {};
    }
}

function saveMemory(memory) {

    localStorage.setItem(
        MEMORY_NAME,
        JSON.stringify(memory)
    );
}

// ======================================================
// REMEMBER INFORMATION
// ======================================================

function rememberInformation(text) {

    const memory = getMemory();

    let changed = false;

    // Name
    const nameMatch = text.match(
        /(?:my name is|remember that my name is)\s+([a-zA-Z][a-zA-Z ]{1,30})/i
    );

    if (nameMatch) {

        let name = nameMatch[1]
            .trim()
            .replace(/[.!?,]+$/, "");

        // If another memory phrase follows, stop there.
        name = name.split(
            /\s+(?:and|my favourite|my favorite)\s+/i
        )[0].trim();

        memory.name = name;
        changed = true;
    }

    // Favourite colour
    const colourMatch = text.match(
        /(?:my favourite colour is|my favorite colour is|my favourite color is|my favorite color is)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i
    );

    if (colourMatch) {

        const colour = colourMatch[1]
            .trim()
            .replace(/[.!?,]+$/, "");

        memory.favouriteColour = colour;
        changed = true;
    }

    // Generic remember statement
    const genericMatch = text.match(
        /remember that\s+(.+)/i
    );

    if (genericMatch && !changed) {

        if (!memory.notes) {
            memory.notes = [];
        }

        memory.notes.push(
            genericMatch[1].trim()
        );

        changed = true;
    }

    if (changed) {
        saveMemory(memory);
        return true;
    }

    return false;
}

// ======================================================
// MEMORY QUESTIONS
// ======================================================

function answerMemoryQuestion(text) {

    const memory = getMemory();

    const lower = text.toLowerCase();

    // Name
    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
        lower.includes("tell me my name")
    ) {

        if (memory.name) {
            return `Your name is ${memory.name}.`;
        }

        return "Boss, I don't have your name saved yet.";
    }

    // Favourite colour
    if (
        lower.includes("what is my favourite colour") ||
        lower.includes("what's my favourite colour") ||
        lower.includes("what is my favorite colour") ||
        lower.includes("what's my favorite colour") ||
        lower.includes("what is my favourite color") ||
        lower.includes("what's my favourite color") ||
        lower.includes("what is my favorite color") ||
        lower.includes("what's my favorite color")
    ) {

        if (memory.favouriteColour) {
            return `Your favourite colour is ${memory.favouriteColour}.`;
        }

        return "Boss, I don't have your favourite colour saved yet.";
    }

    // Combined question
    const asksName =
        lower.includes("my name") &&
        (
            lower.includes("what") ||
            lower.includes("tell")
        );

    const asksColour =
        lower.includes("favourite colour") ||
        lower.includes("favorite colour") ||
        lower.includes("favourite color") ||
        lower.includes("favorite color");

    if (asksName && asksColour) {

        const name = memory.name
            ? `Your name is ${memory.name}.`
            : "I don't have your name saved.";

        const colour = memory.favouriteColour
            ? `Your favourite colour is ${memory.favouriteColour}.`
            : "I don't have your favourite colour saved.";

        return `${name} ${colour}`;
    }

    // Show all memory
    if (
        lower === "show my memory" ||
        lower === "what do you remember about me" ||
        lower === "what do you remember"
    ) {

        const items = [];

        if (memory.name) {
            items.push(`Your name is ${memory.name}.`);
        }

        if (memory.favouriteColour) {
            items.push(
                `Your favourite colour is ${memory.favouriteColour}.`
            );
        }

        if (memory.notes && memory.notes.length) {
            items.push(
                ...memory.notes.map(
                    note => `You asked me to remember: ${note}.`
                )
            );
        }

        if (!items.length) {
            return "Boss, I don't have anything saved yet.";
        }

        return items.join(" ");
    }

    return null;
}

// ======================================================
// CLEAR MEMORY
// ======================================================

function clearMemory() {

    localStorage.removeItem(MEMORY_NAME);

    addMessage(
        "Memory cleared successfully, Boss.",
        "ai"
    );

    speak("Memory cleared successfully, Boss.");
}

// ======================================================
// TIME
// ======================================================

function getCurrentTime() {

    const now = new Date();

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    ).format(now);
}

function getCurrentDate() {

    const now = new Date();

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(now);
}

// ======================================================
// CALCULATOR
// ======================================================

function calculate(expression) {

    try {

        expression = expression
            .replace(/what is/gi, "")
            .replace(/calculate/gi, "")
            .replace(/plus/gi, "+")
            .replace(/minus/gi, "-")
            .replace(/times/gi, "*")
            .replace(/multiplied by/gi, "*")
            .replace(/divided by/gi, "/")
            .replace(/into/gi, "*")
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .trim();

        // Only allow calculator characters.
        if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
            return null;
        }

        const result = Function(
            `"use strict"; return (${expression})`
        )();

        if (!Number.isFinite(result)) {
            return null;
        }

        return result;

    } catch {
        return null;
    }
}

// ======================================================
// BATTERY
// ======================================================

async function getBattery() {

    if (!navigator.getBattery) {
        return "Boss, battery information is not available in this browser.";
    }

    try {

        const battery = await navigator.getBattery();

        const percentage =
            Math.round(battery.level * 100);

        const charging =
            battery.charging
                ? "and the device is charging"
                : "and the device is not charging";

        return `Battery is ${percentage}% ${charging}.`;

    } catch {

        return "Boss, I couldn't read the battery information.";
    }
}

// ======================================================
// NETWORK
// ======================================================

function getNetwork() {

    if (navigator.onLine) {
        return "Network is online.";
    }

    return "Boss, the device appears to be offline.";
}

// ======================================================
// DEVICE
// ======================================================

function getDeviceInfo() {

    return `
Browser: ${navigator.userAgent}.
Platform: ${navigator.platform || "Unknown"}.
Online: ${navigator.onLine ? "Yes" : "No"}.
`;
}

// ======================================================
// TIMER
// ======================================================

function startTimer(minutes) {

    if (timerId) {
        clearTimeout(timerId);
    }

    const ms = minutes * 60 * 1000;

    timerId = setTimeout(() => {

        addMessage(
            "Boss, your timer is finished.",
            "ai"
        );

        speak("Boss, your timer is finished.");

        timerId = null;

    }, ms);

    return `Timer started for ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

function stopTimer() {

    if (!timerId) {
        return "Boss, there is no active timer.";
    }

    clearTimeout(timerId);

    timerId = null;

    return "Timer stopped.";
}

// ======================================================
// YOUTUBE
// ======================================================

function openYouTubeSearch(query) {

    const cleanQuery = query
        .replace(/^on youtube/i, "")
        .replace(/^youtube/i, "")
        .replace(/^open/i, "")
        .replace(/^search/i, "")
        .replace(/^and play/i, "")
        .replace(/^play/i, "")
        .trim();

    if (!cleanQuery) {
        return "Boss, tell me what you want to search for on YouTube.";
    }

    const url =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(cleanQuery);

    lastActionUrl = url;

    window.open(url, "_blank");

    return `Opening YouTube search for ${cleanQuery}.`;
}

// ======================================================
// OPEN LAST ACTION
// ======================================================

function openLastAction() {

    if (!lastActionUrl) {
        return "Boss, there is nothing recent for me to open.";
    }

    window.open(lastActionUrl, "_blank");

    return "Opening the last requested page.";
}

// ======================================================
// WEATHER
// ======================================================

async function getWeather() {

    if (!navigator.geolocation) {
        return "Boss, location is not available in this browser.";
    }

    return new Promise(resolve => {

        navigator.geolocation.getCurrentPosition(

            async position => {

                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;

                try {

                    const url =
                        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;

                    const response =
                        await fetch(url);

                    const data =
                        await response.json();

                    const current =
                        data.current;

                    resolve(
                        `The current temperature is ${current.temperature_2m}°C, humidity is ${current.relative_humidity_2m}%, and wind speed is ${current.wind_speed_10m} km/h.`
                    );

                } catch {

                    resolve(
                        "Boss, I couldn't retrieve the weather right now."
                    );
                }
            },

            () => {

                resolve(
                    "Boss, location permission is required to check your local weather."
                );
            }
        );
    });
}

// ======================================================
// LOCATION
// ======================================================

function getLocation() {

    if (!navigator.geolocation) {
        return Promise.resolve(
            "Boss, location is not available."
        );
    }

    return new Promise(resolve => {

        navigator.geolocation.getCurrentPosition(

            position => {

                const lat =
                    position.coords.latitude.toFixed(4);

                const lon =
                    position.coords.longitude.toFixed(4);

                resolve(
                    `Your approximate coordinates are latitude ${lat} and longitude ${lon}.`
                );
            },

            () => {

                resolve(
                    "Boss, location permission was not granted."
                );
            }
        );
    });
}

// ======================================================
// GEMINI API KEY
// ======================================================

function getApiKey() {

    return localStorage.getItem(API_KEY_NAME);
}

function setApiKey() {

    const key = prompt(
        "Enter your Gemini API key:"
    );

    if (!key) {
        return;
    }

    localStorage.setItem(
        API_KEY_NAME,
        key.trim()
    );

    addMessage(
        "Gemini API key updated.",
        "ai"
    );
}

// ======================================================
// GEMINI REQUEST
// ======================================================

async function askGemini(userText, imageData = null) {

    const apiKey = getApiKey();

    if (!apiKey) {

        return "Boss, Gemini is not configured yet. Press the KEY button and add your Gemini API key.";
    }

    const memory = getMemory();

    let memoryText = "";

    if (memory.name) {
        memoryText += `User's name: ${memory.name}\n`;
    }

    if (memory.favouriteColour) {
        memoryText += `User's favourite colour: ${memory.favouriteColour}\n`;
    }

    if (memory.notes) {
        memoryText +=
            `Other saved memories: ${memory.notes.join("; ")}\n`;
    }

    const systemInstruction = `
You are D.I.S.C.O., a helpful personal AI assistant.

Call the user "Boss".

Use simple, clear Indian English.

Do not claim that you performed an action unless the browser actually performed it.

Answer naturally and directly.

Saved memory:
${memoryText || "No saved memory."}
`;

    const parts = [
        {
            text:
                systemInstruction +
                "\n\nUser says:\n" +
                userText
        }
    ];

    if (imageData) {

        parts.push({
            inline_data: {
                mime_type: imageData.mimeType,
                data: imageData.base64
            }
        });
    }

    const body = {
        contents: [
            {
                role: "user",
                parts: parts
            }
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
        }
    };

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    // Retry transient 429 / 503 errors.
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {

        try {

            const response = await fetch(url, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },

                body: JSON.stringify(body)
            });

            const data = await response.json();

            // Successful response
            if (response.ok) {

                const answer =
                    data?.candidates?.[0]?.content?.parts
                        ?.map(part => part.text || "")
                        .join("")
                        .trim();

                if (answer) {
                    return answer;
                }

                return "Boss, Gemini returned an empty response.";
            }

            // 429 = quota/rate limit
            if (response.status === 429) {

                if (attempt < maxRetries) {

                    const delay =
                        1500 * Math.pow(2, attempt) +
                        Math.random() * 700;

                    await sleep(delay);

                    continue;
                }

                return "Boss, Gemini has reached its current quota or rate limit. Please wait and try again.";
            }

            // 503 = temporary overload
            if (response.status === 503) {

                if (attempt < maxRetries) {

                    const delay =
                        1500 * Math.pow(2, attempt) +
                        Math.random() * 700;

                    await sleep(delay);

                    continue;
                }

                return "Boss, Gemini is temporaroverloaded. Please try again shortly.";
            }

            // 400
            if (response.status === 400) {

                return "Boss, Gemini rejected the request. Please check the model and request settings.";
            }

            // 401 / 403
            if (
                response.status === 401 ||
                response.status === 403
            ) {

                return "Boss, the Gemini API key is invalid or does not have permission.";
            }

            // Other errors
            const errorMessage =
                data?.error?.message ||
                "Unknown Gemini error.";

            return `Boss, Gemini returned an error: ${errorMessage}`;

        } catch (error) {

            if (attempt < maxRetries) {

                const delay =
                    1500 * Math.pow(2, attempt) +
                    Math.random() * 700;

                await sleep(delay);

                continue;
            }

            return "Boss, I couldn't connect to Gemini. Please check your internet connection.";
        }
    }

    return "Boss, Gemini is temporarily unavailable.";
}

// ======================================================
// SLEEP
// ======================================================

function sleep(ms) {

    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}

// ======================================================
// COMMAND ROUTER
// ======================================================

async function processCommand(text, imageData = null) {

    const lower = text.toLowerCase().trim();

    // --------------------------------------------------
    // MEMORY
    // --------------------------------------------------

    if (
        lower.includes("remember that") ||
        lower.startsWith("remember my")
    ) {

        const saved =
            rememberInformation(text);

        if (saved) {

            return "Done, Boss. I will remember that.";
        }
    }

    const memoryAnswer =
        answerMemoryQuestion(text);

    if (memoryAnswer) {
        return memoryAnswer;
    }

    // --------------------------------------------------
    // CLEAR MEMORY
    // --------------------------------------------------

    if (
        lower === "clear memory" ||
        lower === "forget everything" ||
        lower === "delete memory"
    ) {

        clearMemory();

        return null;
    }

    // --------------------------------------------------
    // TIME
    // --------------------------------------------------

    if (
        lower.includes("what time is it") ||
        lower === "time" ||
        lower.includes("current time")
    ) {

        return `The current time is ${getCurrentTime()}.`;
    }

    // --------------------------------------------------
    // DATE
    // --------------------------------------------------

    if (
        lower.includes("what is today's date") ||
        lower.includes("what is the date") ||
        lower === "date" ||
        lower.includes("today's date")
    ) {

        return `Today is ${getCurrentDate()}.`;
    }

    // --------------------------------------------------
    // BATTERY
    // --------------------------------------------------

    if (
        lower.includes("battery") ||
        lower.includes("battery percentage")
    ) {

        return await getBattery();
    }

    // --------------------------------------------------
    // NETWORK
    // --------------------------------------------------

    if (
        lower.includes("internet") ||
        lower.includes("network") ||
        lower.includes("am i online")
    ) {

        return getNetwork();
    }

    // --------------------------------------------------
    // DEVICE
    // --------------------------------------------------

    if (
        lower.includes("device information") ||
        lower.includes("device info") ||
        lower.includes("about my device")
    ) {

        return getDeviceInfo();
    }

    // --------------------------------------------------
    // WEATHER
    // --------------------------------------------------

    if (
        lower.includes("weather") ||
        lower.includes("temperature outside") ||
        lower.includes("temperature now")
    ) {

        return await getWeather();
    }

    // --------------------------------------------------
    // LOCATION
    // --------------------------------------------------

    if (
        lower === "where am i" ||
        lower.includes("my location") ||
        lower.includes("current location")
    ) {

        return await getLocation();
    }

    // --------------------------------------------------
    // TIMER
    // --------------------------------------------------

    const timerMatch =
        lower.match(
            /(?:set|start)\s+(?:a\s+)?timer\s+(?:for\s+)?(\d+)\s*(minute|minutes|min|mins|second|seconds|sec|secs)?/i
        );

    if (timerMatch) {

        let amount =
            Number(timerMatch[1]);

        const unit =
            (timerMatch[2] || "minutes").toLowerCase();

        if (
            unit.startsWith("second") ||
            unit.startsWith("sec")
        ) {
            amount = amount / 60;
        }

        return startTimer(amount);
    }

    if (
        lower === "stop timer" ||
        lower === "cancel timer"
    ) {

        return stopTimer();
    }

    // --------------------------------------------------
    // YOUTUBE
    // --------------------------------------------------

    if (
        lower.includes("open youtube") ||
        lower.includes("search youtube") ||
        lower.startsWith("play ") ||
        lower.startsWith("search youtube for ")
    ) {

        return openYouTubeSearch(text);
    }

    // --------------------------------------------------
    // OPEN LAST THING
    // --------------------------------------------------

    if (
        lower === "open it" ||
        lower === "open that" ||
        lower === "open the last one"
    ) {

        return openLastAction();
    }

    // --------------------------------------------------
    // CALCULATOR
    // --------------------------------------------------

    if (
        lower.startsWith("calculate ") ||
        lower.startsWith("what is ")
    ) {

        const result =
            calculate(text);

        if (result !== null) {

            return `The answer is ${result}.`;
        }
    }

    // --------------------------------------------------
    // SIMPLE GREETINGS
    // --------------------------------------------------

    if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey"
    ) {

        return "Hello, Boss. D.I.S.C.O. is ready.";
    }

    // --------------------------------------------------
    // ABOUT D.I.S.C.O.
    // --------------------------------------------------

    if (
        lower.includes("what can you do") ||
        lower.includes("what are your features") ||
        lower.includes("what can you do for me")
    ) {

        return `
Boss, I can answer questions with Gemini, remember information, tell the time and date, check weather, check battery and network status, calculate numbers, set timers, use your microphone, analyse images, and open YouTube searches.
        `.trim();
    }

    // --------------------------------------------------
    // GEMINI
    // --------------------------------------------------

    return await askGemini(text, imageData);
}

// ======================================================
// SEND MESSAGE
// ======================================================

async function sendMessage() {

    if (!msgInput) return;

    const text =
        msgInput.value.trim();

    if (!text) return;

    msgInput.value = "";

    addMessage(text, "user");

    if (sendBtn) {
        sendBtn.disabled = true;
    }

    const response =
        await processCommand(text);

    if (response) {

        addMessage(response, "ai");

        speak(response);
    }

    if (sendBtn) {
        sendBtn.disabled = false;
    }
}

// ======================================================
// SEND BUTTON
// ======================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );
}

// ======================================================
// ENTER KEY
// ======================================================

if (msgInput) {

    msgInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}

// ======================================================
// CLEAR BUTTON
// ======================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        clearMemory
    );
}

// ======================================================
// API KEY BUTTON
// ======================================================

if (keyBtn) {

    keyBtn.addEventListener(
        "click",
        setApiKey
    );
}

// ======================================================
// IMAGE INPUT
// ======================================================

if (imgInput) {

    imgInput.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                addMessage(
                    "Boss, please select an image file.",
                    "ai"
                );

                return;
            }

            addMessage(
                `Image selected: ${file.name}`,
                "user"
            );

            const reader =
                new FileReader();

            reader.onload = async () => {

                const result =
                    reader.result;

                const base64 =
                    result.split(",")[1];

                const imageData = {
                    mimeType: file.type,
                    base64: base64
                };

                addMessage(
                    "Analysing the image...",
                    "ai"
                );

                const answer =
                    await askGemini(
                        "Analyse this image and describe what you can see clearly.",
                        imageData
                    );

                addMessage(
                    answer,
                    "ai"
                );

                speak(answer);
            };

            reader.readAsDataURL(file);

            imgInput.value = "";
        }
    );
}

// ======================================================
// MICROPHONE
// ======================================================

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.onstart = () => {

        document.body.classList.add(
            "listening"
        );

        if (micBtn) {
            micBtn.textContent = "LISTENING...";
        }
    };

    recognition.onend = () => {

        document.body.classList.remove(
            "listening"
        );

        if (micBtn) {
            micBtn.textContent = "MIC";
        }
    };

    recognition.onerror = () => {

        document.body.classList.remove(
            "listening"
        );

        if (micBtn) {
            micBtn.textContent = "MIC";
        }
    };

    recognition.onresult = event => {

        const transcript =
            event.results[0][0].transcript;

        if (msgInput) {
            msgInput.value = transcript;
        }

        sendMessage();
    };

    if (micBtn) {

        micBtn.addEventListener(
            "click",
            () => {

                try {
                    recognition.start();
                } catch {
                    // Already running.
                }
            }
        );
    }

} else {

    if (micBtn) {

        micBtn.addEventListener(
            "click",
            () => {

                addMessage(
                    "Boss, speech recognition is not supported by this browser.",
                    "ai"
                );

                speak(
                    "Boss, speech recognition is not supported by this browser."
                );
            }
        );
    }
}

// ======================================================
// STARTUP
// ======================================================

window.addEventListener(
    "load",
    () => {

        setTimeout(() => {

            const memory =
                getMemory();

            let startup =
                "Systems online. How may I assist you, Boss?";

            if (memory.name) {
                startup =
                    `Systems online, ${memory.name}. How may I assist you, Boss?`;
            }

            // Do not automatically speak on page load
            // because some browsers block autoplay speech.

        }, 500);
    }
);
