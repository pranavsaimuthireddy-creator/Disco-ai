"use strict";

/* =====================================================
   D.I.S.C.O
   COMPLETE WORKING SCRIPT
   ===================================================== */

const MODEL = "gemini-3.6-flash";

const API_KEY_STORAGE = "disco_api_key";
const MEMORY_STORAGE = "disco_memory";


/* =====================================================
   ELEMENTS
   ===================================================== */

const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKey = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");
const chat = document.getElementById("chat");


/* =====================================================
   MEMORY
   ===================================================== */

let memory = [];

try {
    memory = JSON.parse(
        localStorage.getItem(MEMORY_STORAGE) || "[]"
    );

    if (!Array.isArray(memory)) {
        memory = [];
    }
} catch (error) {
    memory = [];
}


function saveMemory() {
    localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memory)
    );
}


function remember(text) {

    memory.push({
        text: text,
        time: new Date().toISOString()
    });

    saveMemory();
}


/* =====================================================
   CHAT
   ===================================================== */

function addUserMessage(text) {

    if (!chat) return;

    const div = document.createElement("div");

    div.className = "msg user";

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


function addAIMessage(text) {

    if (!chat) return;

    const div = document.createElement("div");

    div.className = "msg ai";

    div.textContent = "D.I.S.C.O: " + text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


/* =====================================================
   SPEECH
   ===================================================== */

function speak(text) {

    if (!window.speechSynthesis) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            String(text)
        );

    speech.lang = "en-IN";
    speech.rate = 0.95;
    speech.pitch = 0.9;
    speech.volume = 1;

    const voices =
        window.speechSynthesis.getVoices();

    const voice =
        voices.find(function (v) {
            return v.lang === "en-IN";
        }) ||
        voices.find(function (v) {
            return v.lang.startsWith("en");
        });

    if (voice) {
        speech.voice = voice;
    }

    window.speechSynthesis.speak(speech);
}


/* =====================================================
   API KEY
   ===================================================== */

function getKey() {

    return localStorage.getItem(
        API_KEY_STORAGE
    );
}


function changeAPIKey() {

    const key = prompt(
        "Enter your Gemini API key:"
    );

    if (!key || !key.trim()) {
        return;
    }

    localStorage.setItem(
        API_KEY_STORAGE,
        key.trim()
    );

    addAIMessage(
        "API key saved successfully, Boss."
    );

    speak(
        "API key saved successfully, Boss."
    );
}


/* =====================================================
   MEMORY LEARNING
   ===================================================== */

function learn(text) {

    const lower = text.toLowerCase();

    if (
        lower.startsWith("remember that") ||
        lower.startsWith("remember ")
    ) {

        let saved = text
            .replace(/^remember that\s*/i, "")
            .replace(/^remember\s*/i, "")
            .trim();

        if (saved) {

            remember(saved);

            return "I will remember that, Boss.";
        }
    }

    return null;
}


/* =====================================================
   MEMORY ANSWER
   ===================================================== */

function memoryAnswer(text) {

    const lower = text.toLowerCase();


    /* NAME */

    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
        lower.includes("whats my name")
    ) {

        for (
            let i = memory.length - 1;
            i >= 0;
            i--
        ) {

            const match =
                memory[i].text.match(
                    /my\s+name\s+is\s+(.+)/i
                );

            if (match) {

                return (
                    "Your name is " +
                    match[1].trim() +
                    ", Boss."
                );
            }
        }

        return (
            "I don't have your name in my memory yet, Boss."
        );
    }


    /* COLOUR */

    if (
        lower.includes("favourite colour") ||
        lower.includes("favorite colour") ||
        lower.includes("favourite color") ||
        lower.includes("favorite color")
    ) {

        for (
            let i = memory.length - 1;
            i >= 0;
            i--
        ) {

            const match =
                memory[i].text.match(
                    /my\s+(?:favourite|favorite)\s+colou?r\s+is\s+(.+)/i
                );

            if (match) {

                return (
                    "Your favourite colour is " +
                    match[1].trim() +
                    ", Boss."
                );
            }
        }

        return (
            "I don't have your favourite colour in my memory yet, Boss."
        );
    }


    /* BIKE */

    if (
        lower.includes("favourite bike") ||
        lower.includes("favorite bike")
    ) {

        for (
            let i = memory.length - 1;
            i >= 0;
            i--
        ) {

            const match =
                memory[i].text.match(
                    /my\s+(?:favourite|favorite)\s+bike\s+is\s+(.+)/i
                );

            if (match) {

                return (
                    "Your favourite bike is " +
                    match[1].trim() +
                    ", Boss."
                );
            }
        }

        return (
            "I don't have your favourite bike in my memory yet, Boss."
        );
    }


    /* FOOD */

    if (
        lower.includes("favourite food") ||
        lower.includes("favorite food")
    ) {

        for (
            let i = memory.length - 1;
            i >= 0;
            i--
        ) {

            const match =
                memory[i].text.match(
                    /my\s+(?:favourite|favorite)\s+food\s+is\s+(.+)/i
                );

            if (match) {

                return (
                    "Your favourite food is " +
                    match[1].trim() +
                    ", Boss."
                );
            }
        }

        return (
            "I don't have your favourite food in my memory yet, Boss."
        );
    }


    /* SHOW MEMORY */

    if (
        lower.includes("what do you remember") ||
        lower.includes("show my memory")
    ) {

        if (memory.length === 0) {
            return "My memory is empty, Boss.";
        }

        return (
            "Here is what I remember, Boss:\n" +
            memory
                .map(function (item, index) {
                    return (
                        (index + 1) +
                        ". " +
                        item.text
                    );
                })
                .join("\n")
        );
    }


    return null;
}


/* =====================================================
   TOOL 1 — TIME
   ===================================================== */

function toolTime(text) {

    const lower = text.toLowerCase();

    if (
        lower.includes("what time") ||
        lower === "time" ||
        lower.includes("current time")
    ) {

        return (
            "The current time is " +
            new Date().toLocaleTimeString(
                "en-IN"
            ) +
            ", Boss."
        );
    }

    return null;
}


/* =====================================================
   TOOL 2 — DATE
   ===================================================== */

function toolDate(text) {

    const lower = text.toLowerCase();

    if (
        lower.includes("today's date") ||
        lower.includes("todays date") ||
        lower === "date" ||
        lower.includes("what date")
    ) {

        return (
            "Today is " +
            new Date().toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            ) +
            ", Boss."
        );
    }

    return null;
}


/* =====================================================
   TOOL 3 — WEATHER
   ===================================================== */

async function toolWeather(text) {

    const lower = text.toLowerCase();

    if (!lower.includes("weather")) {
        return null;
    }

    try {

        const match =
            text.match(
                /weather\s+(?:in|at|for)\s+(.+)/i
            );

        let latitude;
        let longitude;
        let placeName = "your location";


        /* CITY WEATHER */

        if (match) {

            const city =
                match[1]
                    .replace(/[?.!]+$/, "")
                    .trim();

            const geoURL =
                "https://geocoding-api.open-meteo.com/v1/search" +
                "?name=" +
                encodeURIComponent(city) +
                "&count=1&language=en&format=json";

            const geoResponse =
                await fetch(geoURL);

            const geo =
                await geoResponse.json();

            if (
                !geo.results ||
                geo.results.length === 0
            ) {

                return (
                    "I could not find that city, Boss."
                );
            }

            latitude =
                geo.results[0].latitude;

            longitude =
                geo.results[0].longitude;

            placeName =
                geo.results[0].name;
        }


        /* CURRENT LOCATION */

        else {

            if (!navigator.geolocation) {

                return (
                    "Location is not supported by this browser, Boss."
                );
            }

            const position =
                await new Promise(
                    function (resolve, reject) {

                        navigator.geolocation
                            .getCurrentPosition(
                                resolve,
                                reject,
                                {
                                    timeout: 10000
                                }
                            );
                    }
                );

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;
        }


        const weatherURL =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" +
            latitude +
            "&longitude=" +
            longitude +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code" +
            "&timezone=auto";


        const response =
            await fetch(weatherURL);

        const data =
            await response.json();

        const current =
            data.current;

        if (!current) {

            return (
                "Weather information is unavailable, Boss."
            );
        }

        return (
            "Weather in " +
            placeName +
            ": " +
            current.temperature_2m +
            "°C. Feels like " +
            current.apparent_temperature +
            "°C. Humidity is " +
            current.relative_humidity_2m +
            "% and wind speed is " +
            current.wind_speed_10m +
            " km/h, Boss."
        );

    } catch (error) {

        return (
            "I could not get the weather. Please allow location access, Boss."
        );
    }
}


/* =====================================================
   TOOL 4 — TIMER
   ===================================================== */

let activeTimer = null;

function toolTimer(text) {

    const match =
        text.match(
            /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
        );

    if (
        !match ||
        !text.toLowerCase().includes("timer")
    ) {
        return null;
    }

    const amount =
        Number(match[1]);

    const unit =
        match[2].toLowerCase();

    let milliseconds;


    if (
        unit.startsWith("second") ||
        unit.startsWith("sec")
    ) {

        milliseconds =
            amount * 1000;

    } else if (
        unit.startsWith("hour") ||
        unit.startsWith("hr")
    ) {

        milliseconds =
            amount * 60 * 60 * 1000;

    } else {

        milliseconds =
            amount * 60 * 1000;
    }


    if (activeTimer) {
        clearTimeout(activeTimer);
    }


    activeTimer =
        setTimeout(function () {

            const message =
                "Boss, your " +
                amount +
                " " +
                unit +
                " timer is finished.";

            addAIMessage(message);

            speak(message);

            activeTimer = null;

        }, milliseconds);


    return (
        "Timer set for " +
        amount +
        " " +
        unit +
        ", Boss."
    );
}


/* =====================================================
   TOOL 5 — TRANSLATE
   ===================================================== */

async function toolTranslate(text) {

    if (
        !text
            .toLowerCase()
            .startsWith("translate")
    ) {
        return null;
    }

    const query =
        text
            .replace(/^translate\s*/i, "")
            .trim();

    if (!query) {

        return (
            "Tell me what you want me to translate, Boss."
        );
    }

    try {

        const url =
            "https://api.mymemory.translated.net/get" +
            "?q=" +
            encodeURIComponent(query) +
            "&langpair=en|te";

        const response =
            await fetch(url);

        const data =
            await response.json();

        return (
            "In Telugu: " +
            data.responseData.translatedText
        );

    } catch (error) {

        return (
            "Translation service is unavailable, Boss."
        );
    }
}


/* =====================================================
   TOOL 6 — YOUTUBE SEARCH
   ===================================================== */

function toolYouTube(text) {

    const lower =
        text.toLowerCase();

    if (
        lower.startsWith("play ") ||
        lower.startsWith("youtube search ")
    ) {

        let query =
            text
                .replace(/^play\s+/i, "")
                .replace(/^youtube\s+search\s+/i, "")
                .trim();

        if (!query) {

            return (
                "Tell me what you want to search on YouTube, Boss."
            );
        }

        window.open(
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query),
            "_blank"
        );

        return (
            "Searching YouTube for " +
            query +
            ", Boss."
        );
    }

    return null;
}


/* =====================================================
   TOOL 7 — GOOGLE SEARCH
   ===================================================== */

function toolGoogle(text) {

    const lower =
        text.toLowerCase();

    if (
        lower.startsWith("google ") ||
        lower.startsWith("search google ") ||
        lower.startsWith("search for ")
    ) {

        const query =
            text
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

        return (
            "Searching Google for " +
            query +
            ", Boss."
        );
    }

    return null;
}


/* =====================================================
   TOOL 8 — CALCULATOR
   ===================================================== */

function toolCalculator(text) {

    const lower =
        text.toLowerCase();

    if (
        !lower.startsWith("calculate ") &&
        !lower.startsWith("calc ")
    ) {
        return null;
    }

    let expression =
        text
            .replace(/^calculate\s+/i, "")
            .replace(/^calc\s+/i, "")
            .trim();

    expression =
        expression.replace(/×/g, "*");

    expression =
        expression.replace(/÷/g, "/");

    if (
        !/^[0-9+\-*/().%\s]+$/.test(
            expression
        )
    ) {

        return (
            "I can calculate basic mathematical expressions only, Boss."
        );
    }

    try {

        const answer =
            Function(
                '"use strict"; return (' +
                expression +
                ")"
            )();

        return (
            "The answer is " +
            answer +
            ", Boss."
        );

    } catch (error) {

        return (
            "I could not calculate that, Boss."
        );
    }
}


/* =====================================================
   TOOL 9 — CANCEL TIMER
   ===================================================== */

function toolCancelTimer(text) {

    const lower =
        text.toLowerCase();

    if (
        lower.includes("cancel timer") ||
        lower.includes("stop timer")
    ) {

        if (activeTimer) {

            clearTimeout(activeTimer);

            activeTimer = null;

            return (
                "Timer cancelled, Boss."
            );
        }

        return (
            "There is no active timer, Boss."
        );
    }

    return null;
}


/* =====================================================
   TOOL 10 — OPEN YOUTUBE
   ===================================================== */

function toolOpenYouTube(text) {

    if (
        text
            .toLowerCase()
            .trim() === "open youtube"
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
   TOOL 11 — OPEN GOOGLE
   ===================================================== */

function toolOpenGoogle(text) {

    if (
        text
            .toLowerCase()
            .trim() === "open google"
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
   TOOL 12 — OPEN GITHUB
   ===================================================== */

function toolGitHub(text) {

    if (
        text
            .toLowerCase()
            .trim() === "open github"
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
   TOOL 13 — BATTERY
   ===================================================== */

async function toolBattery(text) {

    if (
        !text
            .toLowerCase()
            .includes("battery")
    ) {
        return null;
    }

    if (!navigator.getBattery) {

        return (
            "Battery information is not supported by this browser, Boss."
        );
    }

    try {

        const battery =
            await navigator.getBattery();

        const level =
            Math.round(
                battery.level * 100
            );

        return (
            "Battery level is " +
            level +
            "%. " +
            (
                battery.charging
                    ? "The device is charging."
                    : "The device is not charging."
            ) +
            " Boss."
        );

    } catch (error) {

        return (
            "I could not read the battery status, Boss."
        );
    }
}


/* =====================================================
   TOOL 14 — DEVICE INFORMATION
   ===================================================== */

function toolDevice(text) {

    const lower =
        text.toLowerCase();

    if (
        lower.includes("device information") ||
        lower.includes("device info")
    ) {

        return (
            "Your browser reports this device as: " +
            navigator.userAgent +
            ", Boss."
        );
    }

    return null;
}


/* =====================================================
   TOOL 15 — NETWORK
   ===================================================== */

function toolNetwork(text) {

    const lower =
        text.toLowerCase();

    if (
        lower.includes("internet status") ||
        lower.includes("network status") ||
        lower.includes("am i online")
    ) {

        return navigator.onLine
            ? "You are currently online, Boss."
            : "You are currently offline, Boss.";
    }

    return null;
}


/* =====================================================
   RUN ALL TOOLS
   ===================================================== */

async function runTools(text) {

    let result;


    result = toolTime(text);
    if (result) return result;


    result = toolDate(text);
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


    result = toolNetwork(text);
    if (result) return result;


    return null;
}


/* =====================================================
   GEMINI
   ===================================================== */

async function askGemini(question) {

    let apiKey =
        localStorage.getItem(
            API_KEY_STORAGE
        );


    if (!apiKey) {

        apiKey =
            prompt(
                "Enter your Gemini API key:"
            );

        if (!apiKey) {

            return (
                "Gemini API key was not entered, Boss."
            );
        }

        apiKey =
            apiKey.trim();

        localStorage.setItem(
            API_KEY_STORAGE,
            apiKey
        );
    }


    const storedMemory =
        memory.length
            ? memory
                .map(function (item) {
                    return item.text;
                })
                .join("\n")
            : "No memory stored.";


    const promptText =
        "You are D.I.S.C.O, a helpful personal AI assistant. " +
        "Call the user Boss. Use simple Indian English. " +
        "Answer the actual question clearly. " +
        "Do not give the same answer to every question.\n\n" +
        "USER MEMORY:\n" +
        storedMemory +
        "\n\nUSER QUESTION:\n" +
        question;


    try {

        const response =
            await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                MODEL +
                ":generateContent",
                {
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
                                parts: [
                                    {
                                        text:
                                            promptText
                                    }
                                ]
                            }
                        ]
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                return (
                    "The Gemini API key was rejected, Boss. Press KEY to change it."
                );
            }


            if (
                response.status === 429
            ) {

                return (
                    "Gemini request limit reached. Please wait and try again, Boss."
                );
            }


            return (
                "Gemini error: " +
                (
                    data.error &&
                    data.error.message
                        ? data.error.message
                        : "Unknown error"
                )
            );
        }


        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
        ) {

            return data.candidates[0]
                .content
                .parts
                .map(function (part) {
                    return part.text || "";
                })
                .join("")
                .trim();
        }


        return (
            "Gemini returned an empty answer, Boss."
        );

    } catch (error) {

        return (
            "Network error. Please check your internet connection, Boss."
        );
    }
}


/* =====================================================
   MAIN SEND FUNCTION
   ===================================================== */

async function sendMessage() {

    if (!msg) {
        return;
    }

    const text =
        msg.value.trim();


    if (!text) {
        return;
    }


    addUserMessage(text);

    msg.value = "";


    /* MEMORY LEARNING */

    const learned =
        learn(text);

    if (learned) {

        addAIMessage(learned);
        speak(learned);

        return;
    }


    /* MEMORY ANSWER */

    const memoryReply =
        memoryAnswer(text);

    if (memoryReply) {

        addAIMessage(memoryReply);
        speak(memoryReply);

        return;
    }


    /* TOOLS */

    const toolReply =
        await runTools(text);

    if (toolReply) {

        addAIMessage(toolReply);
        speak(toolReply);

        return;
    }


    /* GEMINI */

    addAIMessage(
        "Processing..."
    );


    const answer =
        await askGemini(text);


    const messages =
        chat.querySelectorAll(
            ".msg.ai"
        );


    if (messages.length > 0) {

        const last =
            messages[
                messages.length - 1
            ];

        if (
            last.textContent.includes(
                "Processing..."
            )
        ) {
            last.remove();
        }
    }


    addAIMessage(answer);

    speak(answer);
}


/* =====================================================
   SEND BUTTON
   ===================================================== */

if (send) {

    send.addEventListener(
        "click",
        function () {

            sendMessage();

        }
    );
}


/* =====================================================
   ENTER KEY
   ===================================================== */

if (msg) {

    msg.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


/* =====================================================
   CLEAR BUTTON
   ===================================================== */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            memory = [];

            localStorage.removeItem(
                MEMORY_STORAGE
            );

            if (chat) {
                chat.innerHTML = "";
            }

            const message =
                "Memory cleared. Fresh system ready, Boss.";

            addAIMessage(message);

            speak(message);
        }
    );
}


/* =====================================================
   KEY BUTTON
   ===================================================== */

if (changeKey) {

    changeKey.addEventListener(
        "click",
        function () {

            changeAPIKey();

        }
    );
}


/* =====================================================
   MICROPHONE
   ===================================================== */

let recognition = null;


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    recognition.onstart =
        function () {

            if (mic) {
                mic.textContent = "👂";
            }
        };


    recognition.onresult =
        function (event) {

            const transcript =
                event.results[0][0]
                    .transcript;

            if (msg) {
                msg.value =
                    transcript;
            }

            sendMessage();
        };


    recognition.onerror =
        function () {

            if (mic) {
                mic.textContent = "🎙️";
            }

            addAIMessage(
                "I could not hear you clearly, Boss."
            );
        };


    recognition.onend =
        function () {

            if (mic) {
                mic.textContent = "🎙️";
            }
        };
}


if (mic) {

    mic.addEventListener(
        "click",
        function () {

            if (!recognition) {

                addAIMessage(
                    "Voice recognition is not supported by this browser, Boss."
                );

                return;
            }

            try {

                recognition.start();

            } catch (error) {

                /* Prevent repeated microphone errors */
            }
        }
    );
}


/* =====================================================
   IMAGE BUTTON
   ===================================================== */

if (imgBtn && imgInput) {

    imgBtn.addEventListener(
        "click",
        function () {

            imgInput.click();

        }
    );


    imgInput.addEventListener(
        "change",
        function () {

            const file =
                imgInput.files[0];

            if (!file) {
                return;
            }

            addUserMessage(
                "🖼️ " + file.name
            );

            addAIMessage(
                "Image selected, Boss. Image analysis can be connected to your Gemini vision model."
            );

            speak(
                "Image selected, Boss."
            );

            imgInput.value = "";
        }
    );
}


/* =====================================================
   ONLINE / OFFLINE
   ===================================================== */

window.addEventListener(
    "online",
    function () {

        addAIMessage(
            "Network connection restored, Boss."
        );
    }
);


window.addEventListener(
    "offline",
    function () {

        addAIMessage(
            "Network connection lost, Boss."
        );
    }
);


/* =====================================================
   START
   ===================================================== */

console.log(
    "D.I.S.C.O loaded successfully."
);

console.log(
    "15 tools loaded."
);

console.log(
    "SEND button ready."
);
