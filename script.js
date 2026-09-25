"use strict";

/* =========================================================
   D.I.S.C.O MOBILE EDITION
   COMPLETE SCRIPT
   ========================================================= */


/* =========================
   SETTINGS
   ========================= */

const MODEL = "gemini-3.8-flash";

const API_KEY_STORAGE = "disco_api_key";
const MEMORY_STORAGE = "disco_memory";


/* =========================
   ELEMENTS
   ========================= */

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");

const clearBtn = document.getElementById("clear-btn");
const keyBtn = document.getElementById("change-key");

const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");


/* =========================
   VARIABLES
   ========================= */

let timer = null;
let recognition = null;
let memory = [];

try {
    memory = JSON.parse(
        localStorage.getItem(MEMORY_STORAGE) || "[]"
    );

    if (!Array.isArray(memory)) {
        memory = [];
    }

} catch {
    memory = [];
}


/* =========================
   CHAT FUNCTIONS
   ========================= */

function addMessage(text, type = "ai") {

    const div = document.createElement("div");

    div.className = `message ${type}`;

    const label =
        type === "user"
            ? "<b>Boss:</b> "
            : "<b>D.I.S.C.O:</b> ";

    div.innerHTML =
        label +
        escapeHTML(String(text))
            .replace(/\n/g, "<br>");

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function userMessage(text) {
    addMessage(text, "user");
}


function aiMessage(text) {
    addMessage(text, "ai");
}


/* =========================
   VOICE OUTPUT
   ========================= */

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";

    utterance.rate = 0.95;
    utterance.pitch = 0.85;
    utterance.volume = 1;

    const voices =
        window.speechSynthesis.getVoices();

    const indianVoice =
        voices.find(v =>
            v.lang &&
            v.lang.toLowerCase() === "en-in"
        );

    if (indianVoice) {
        utterance.voice = indianVoice;
    }

    window.speechSynthesis.speak(utterance);
}


window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};


/* =========================
   API KEY
   ========================= */

function getAPIKey() {

    let key =
        localStorage.getItem(API_KEY_STORAGE);

    if (!key) {

        key = prompt(
            "Boss, enter your Gemini API key.\n\n" +
            "Your key stays in this browser's local storage."
        );

        if (key) {

            key = key.trim();

            localStorage.setItem(
                API_KEY_STORAGE,
                key
            );
        }
    }

    return key;
}


/* =========================
   EXACT INDIA TIME
   ========================= */

function getExactTime() {

    const now = new Date();

    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }).format(now);
}


/* =========================
   EXACT INDIA DATE
   ========================= */

function getExactDate() {

    const now = new Date();

    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(now);
}


/* =========================
   LOCATION
   ========================= */

function getLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {

            reject(
                new Error(
                    "Geolocation is not supported."
                )
            );

            return;
        }

        navigator.geolocation.getCurrentPosition(

            async position => {

                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;

                try {

                    const response =
                        await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
                        );

                    const data =
                        await response.json();

                    const address =
                        data.address || {};

                    const city =
                        address.city ||
                        address.town ||
                        address.village ||
                        address.county ||
                        "Unknown place";

                    const state =
                        address.state ||
                        "";

                    resolve(
                        `${city}, ${state}`
                    );

                } catch {

                    resolve(
                        `Latitude ${lat.toFixed(4)}, Longitude ${lon.toFixed(4)}`
                    );
                }
            },

            error => {

                reject(
                    new Error(
                        "Location permission was not available."
                    )
                );
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}


/* =========================
   WEATHER
   ========================= */

async function getWeather() {

    if (!navigator.geolocation) {
        throw new Error("Location is not supported.");
    }

    const position =
        await new Promise((resolve, reject) => {

            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );

        });

    const lat =
        position.coords.latitude;

    const lon =
        position.coords.longitude;


    const weatherResponse =
        await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`
        );


    if (!weatherResponse.ok) {
        throw new Error("Weather service unavailable.");
    }


    const weather =
        await weatherResponse.json();


    const current =
        weather.current;


    const code =
        Number(current.weather_code);


    const description =
        weatherDescription(code);


    return {
        temperature:
            current.temperature_2m,

        feels:
            current.apparent_temperature,

        humidity:
            current.relative_humidity_2m,

        wind:
            current.wind_speed_10m,

        description
    };
}


function weatherDescription(code) {

    const descriptions = {

        0: "clear sky",

        1: "mainly clear",
        2: "partly cloudy",
        3: "overcast",

        45: "foggy",
        48: "depositing rime fog",

        51: "light drizzle",
        53: "moderate drizzle",
        55: "dense drizzle",

        61: "slight rain",
        63: "moderate rain",
        65: "heavy rain",

        71: "slight snow",
        73: "moderate snow",
        75: "heavy snow",

        80: "slight rain showers",
        81: "moderate rain showers",
        82: "violent rain showers",

        95: "thunderstorm",
        96: "thunderstorm with hail",
        99: "heavy thunderstorm with hail"
    };

    return descriptions[code] || "unknown conditions";
}


/* =========================
   TIMER
   ========================= */

function startTimer(seconds) {

    seconds =
        Number(seconds);

    if (!Number.isFinite(seconds) || seconds <= 0) {

        aiMessage(
            "Boss, please give me a valid timer duration."
        );

        return;
    }


    if (timer) {
        clearTimeout(timer);
    }


    const totalSeconds =
        Math.round(seconds);


    aiMessage(
        `Timer started for ${totalSeconds} seconds.`
    );

    speak(
        `Timer started for ${totalSeconds} seconds.`
    );


    timer =
        setTimeout(() => {

            aiMessage(
                "Boss, your timer is finished."
            );

            speak(
                "Boss, your timer is finished."
            );

            timer = null;

        }, totalSeconds * 1000);
}


function stopTimer() {

    if (!timer) {

        aiMessage(
            "Boss, there is no active timer."
        );

        return;
    }


    clearTimeout(timer);

    timer = null;


    aiMessage(
        "Timer cancelled, Boss."
    );

    speak(
        "Timer cancelled, Boss."
    );
}


/* =========================
   CALCULATOR
   ========================= */

function calculate(expression) {

    let clean =
        expression
            .replace(/what is/gi, "")
            .replace(/calculate/gi, "")
            .replace(/calculator/gi, "")
            .replace(/plus/gi, "+")
            .replace(/minus/gi, "-")
            .replace(/times/gi, "*")
            .replace(/multiplied by/gi, "*")
            .replace(/divided by/gi, "/")
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
            .trim();


    if (!/^[0-9+\-*/().%\s]+$/.test(clean)) {

        return null;
    }


    try {

        const result =
            Function(
                `"use strict"; return (${clean})`
            )();

        if (!Number.isFinite(result)) {
            return null;
        }

        return result;

    } catch {

        return null;
    }
}


/* =========================
   MEMORY
   ========================= */

function saveMemory(text) {

    memory.push(text);

    localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memory)
    );
}


function learnFromSentence(question) {

    const match =
        question.match(
            /remember that\s+(.+)/i
        );

    if (!match) {
        return false;
    }


    const fact =
        match[1].trim();


    saveMemory(fact);


    aiMessage(
        `Got it, Boss. I will remember: ${fact}`
    );

    speak(
        "Got it Boss. I will remember that."
    );

    return true;
}


function memoryAnswer(question) {

    const q =
        question.toLowerCase();


    if (
        q.includes("what is my name") ||
        q.includes("what's my name")
    ) {

        const fact =
            memory.find(m =>
                /name\s+(is|:)/i.test(m)
            );


        if (fact) {

            const match =
                fact.match(
                    /name\s+(?:is|:)\s*(.+)/i
                );


            if (match) {

                const name =
                    match[1]
                        .replace(/[.!?]+$/, "")
                        .trim();

                aiMessage(
                    `Your name is ${name}, Boss.`
                );

                speak(
                    `Your name is ${name}, Boss.`
                );

                return true;
            }
        }
    }


    if (
        q.includes("favourite colour") ||
        q.includes("favorite colour") ||
        q.includes("favourite color") ||
        q.includes("favorite color")
    ) {

        const fact =
            memory.find(m =>
                /favo?u?rite\s+colo[u]?r/i.test(m)
            );


        if (fact) {

            const match =
                fact.match(
                    /favo?u?rite\s+colo[u]?r\s+(?:is|:)\s*(.+)/i
                );


            if (match) {

                const colour =
                    match[1]
                        .replace(/[.!?]+$/, "")
                        .trim();

                aiMessage(
                    `Your favourite colour is ${colour}, Boss.`
                );

                speak(
                    `Your favourite colour is ${colour}, Boss.`
                );

                return true;
            }
        }
    }


    for (const fact of memory) {

        const words =
            q
                .replace(/[?.,!]/g, "")
                .split(/\s+/)
                .filter(Boolean);


        const factLower =
            fact.toLowerCase();


        if (
            words.length >= 2 &&
            words.some(word =>
                word.length > 3 &&
                factLower.includes(word)
            )
        ) {
            aiMessage(
                `Boss, I remember: ${fact}`
            );

            speak(
                `Boss, I remember: ${fact}`
            );

            return true;
        }
    }


    return false;
}


/* =========================
   OPEN / SEARCH
   ========================= */

function openYouTube() {

    window.open(
        "https://www.youtube.com/",
        "_blank"
    );
}


function openGoogle() {

    window.open(
        "https://www.google.com/",
        "_blank"
    );
}


function openGitHub() {

    window.open(
        "https://github.com/",
        "_blank"
    );
}


function searchYouTube(query) {

    window.open(
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(query),
        "_blank"
    );
}


function searchGoogle(query) {

    window.open(
        "https://www.google.com/search?q=" +
        encodeURIComponent(query),
        "_blank"
    );
}


/* =========================
   BATTERY
   ========================= */

async function getBatteryInfo() {

    if (!navigator.getBattery) {

        return "Battery information is not available in this browser.";
    }


    const battery =
        await navigator.getBattery();


    const level =
        Math.round(
            battery.level * 100
        );


    const charging =
        battery.charging
            ? "and the device is charging"
            : "and the device is not charging";


    return `Battery is at ${level} percent ${charging}.`;
}


/* =========================
   DEVICE INFORMATION
   ========================= */

function getDeviceInfo() {

    const ua =
        navigator.userAgent;


    let device =
        "Unknown device";


    if (/Android/i.test(ua)) {
        device = "Android device";
    }

    else if (/iPhone/i.test(ua)) {
        device = "iPhone";
    }

    else if (/iPad/i.test(ua)) {
        device = "iPad";
    }

    else if (/Windows/i.test(ua)) {
        device = "Windows computer";
    }

    else if (/Mac/i.test(ua)) {
        device = "Mac computer";
    }


    return {
        device,
        browser: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        screen:
            `${screen.width} x ${screen.height}`
    };
}


/* =========================
   NETWORK
   ========================= */

function getNetworkInfo() {

    const online =
        navigator.onLine;


    let type =
        "unknown connection";


    if (navigator.connection) {

        type =
            navigator.connection.effectiveType ||
            navigator.connection.type ||
            "unknown connection";
    }


    return online
        ? `Internet connection is online. Connection type: ${type}.`
        : "Internet connection is offline.";
}


/* =========================
   DIRECT TOOLS
   ========================= */

async function handleDirectTool(question) {

    const q =
        question.toLowerCase().trim();


    /* TIME */

    if (
        q === "time" ||
        q.includes("what time is it") ||
        q.includes("current time") ||
        q.includes("exact time") ||
        q.includes("tell me the time")
    ) {

        const time =
            getExactTime();

        aiMessage(
            `The exact current time in India is ${time}, Boss.`
        );

        speak(
            `The exact current time in India is ${time}, Boss.`
        );

        return true;
    }


    /* DATE */

    if (
        q === "date" ||
        q.includes("what is today's date") ||
        q.includes("what's today's date") ||
        q.includes("today's date") ||
        q.includes("current date") ||
        q.includes("what day is it")
    ) {

        const date =
            getExactDate();

        aiMessage(
            `Today is ${date}, Boss.`
        );

        speak(
            `Today is ${date}, Boss.`
        );

        return true;
    }


    /* LOCATION */

    if (
        q === "location" ||
        q.includes("where am i") ||
        q.includes("my location") ||
        q.includes("current location")
    ) {

        try {

            const location =
                await getLocation();

            aiMessage(
                `Boss, your approximate current location is ${location}.`
            );

            speak(
                `Boss, your approximate current location is ${location}.`
            );

        } catch {

            aiMessage(
                "Boss, I could not access your location. Please allow location permission for this website."
            );
        }

        return true;
    }


    /* WEATHER */

    if (
        q === "weather" ||
        q.includes("weather") ||
        q.includes("temperature")
    ) {

        try {

            const weather =
                await getWeather();


            const answer =
                `Current weather: ${weather.description}. ` +
                `Temperature ${weather.temperature} degrees Celsius. ` +
                `Feels like ${weather.feels} degrees. ` +
                `Humidity ${weather.humidity} percent. ` +
                `Wind speed ${weather.wind} kilometres per hour.`;

            aiMessage(answer);

            speak(answer);

        } catch {

            aiMessage(
                "Boss, I could not get the weather. Please allow location permission and make sure you are connected to the internet."
            );
        }

        return true;
    }


    /* TIMER */

    const timerMatch =
        q.match(
            /(?:set|start|create)\s+(?:a\s+)?timer\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(seconds?|minutes?|mins?|hours?|hrs?)/i
        );


    if (timerMatch) {

        let amount =
            Number(timerMatch[1]);

        const unit =
            timerMatch[2].toLowerCase();


        if (unit.startsWith("minute") || unit.startsWith("min")) {
            amount *= 60;
        }

        else if (
            unit.startsWith("hour") ||
            unit.startsWith("hr")
        ) {
            amount *= 3600;
        }


        startTimer(amount);

        return true;
    }


    if (
        q.includes("stop timer") ||
        q.includes("cancel timer") ||
        q === "stop"
    ) {

        stopTimer();

        return true;
    }


    /* CALCULATOR */

    if (
        q.startsWith("calculate ") ||
        q.startsWith("calculator ") ||
        /^what is\s+[0-9]/i.test(q) ||
        /^[0-9]+\s*[+\-*/×÷]/.test(q)
    ) {

        const result =
            calculate(q);


        if (result !== null) {

            const answer =
                `The answer is ${result}, Boss.`;

            aiMessage(answer);

            speak(answer);

            return true;
        }
    }


    /* YOUTUBE */

    if (
        q.startsWith("youtube search ") ||
        q.startsWith("search youtube for ")
    ) {

        const query =
            q
                .replace(
                    /^youtube search\s*/i,
                   )
                .replace(
                    /^search youtube for\s*/i,
                    ""
                )
                .trim();


        if (query) {

            searchYouTube(query);

            aiMessage(
                `Opening YouTube results for "${query}", Boss.`
            );

            return true;
        }
    }


    /* GOOGLE */

    if (
        q.startsWith("google search ") ||
        q.startsWith("search google for ")
    ) {

        const query =
            q
                .replace(
                    /^google search\s*/i,
                    ""
                )
                .replace(
                    /^search google for\s*/i,
                    ""
                )
                .trim();


        if (query) {

            searchGoogle(query);

            aiMessage(
                `Opening Google results for "${query}", Boss.`
            );

            return true;
        }
    }


    /* OPEN YOUTUBE */

    if (
        q === "open youtube" ||
        q === "launch youtube"
    ) {

        openYouTube();

        aiMessage(
            "Opening YouTube, Boss."
        );

        return true;
    }


    /* OPEN GOOGLE */

    if (
        q === "open google" ||
        q === "launch google"
    ) {

        openGoogle();

        aiMessage(
            "Opening Google, Boss."
        );

        return true;
    }


    /* OPEN GITHUB */

    if (
        q === "open github" ||
        q === "launch github"
    ) {

        openGitHub();

        aiMessage(
            "Opening GitHub, Boss."
        );

        return true;
    }


    /* BATTERY */

    if (
        q.includes("battery") ||
        q.includes("battery status")
    ) {

        const answer =
            await getBatteryInfo();

        aiMessage(
            `Boss, ${answer}`
        );

        speak(
            `Boss, ${answer}`
        );

        return true;
    }


    /* DEVICE */

    if (
        q.includes("device information") ||
        q.includes("device info") ||
        q === "my device"
    ) {

        const info =
            getDeviceInfo();


        const answer =
            `You are using an ${info.device}. ` +
            `Screen size is ${info.screen}. ` +
            `Browser language is ${info.language}.`;


        aiMessage(answer);

        speak(answer);

        return true;
    }


    /* NETWORK */

    if (
        q.includes("internet status") ||
        q.includes("network status") ||
        q.includes("internet connection")
    ) {

        const answer =
            getNetworkInfo();

        aiMessage(
            `Boss, ${answer}`
        );

        speak(
            `Boss, ${answer}`
        );

        return true;
    }


    return false;
}


/* =========================
   QUICK TOOL BUTTONS
   ========================= */

async function runTool(tool) {

    if (tool === "time") {

        const time =
            getExactTime();

        aiMessage(
            `The exact current time in India is ${time}, Boss.`
        );

        speak(
            `The exact current time in India is ${time}, Boss.`
        );

        return;
    }


    if (tool === "date") {

        const date =
            getExactDate();

        aiMessage(
            `Today is ${date}, Boss.`
        );

        speak(
            `Today is ${date}, Boss.`
        );

        return;
    }


    if (tool === "weather") {

        await handleDirectTool("weather");

        return;
    }


    if (tool === "location") {

        await handleDirectTool("location");

        return;
    }


    if (tool === "timer") {

        const seconds =
            prompt(
                "Boss, how many seconds should I set?"
            );


        if (seconds !== null) {
            startTimer(seconds);
        }

        return;
    }


    if (tool === "stop") {

        stopTimer();

        return;
    }


    if (tool === "calculator") {

        const expression =
            prompt(
                "Boss, enter the calculation.\nExample: 25 * 4 + 10"
            );


        if (expression) {

            const result =
                calculate(expression);


            if (result !== null) {

                aiMessage(
                    `The answer is ${result}, Boss.`
                );

                speak(
                    `The answer is ${result}, Boss.`
                );

            } else {

                aiMessage(
                    "Boss, I could not calculate that expression."
                );
            }
        }

        return;
    }


    if (tool === "translate") {

        msg.value =
            "Translate this to Telugu: ";

        msg.focus();

        return;
    }


    if (tool === "youtube") {

        const query =
            prompt(
                "Boss, what should I search on YouTube?"
            );


        if (query) {

            searchYouTube(query);

            aiMessage(
                `Opening YouTube results for "${query}", Boss.`
            );
        }

        return;
    }


    if (tool === "google") {

        const query =
            prompt(
                "Boss, what should I search on Google?"
            );


        if (query) {

            searchGoogle(query);

            aiMessage(
                `Opening Google results for "${query}", Boss.`
            );
        }

        return;
    }


    if (tool === "github") {

        openGitHub();

        aiMessage(
            "Opening GitHub, Boss."
        );

        return;
    }


    if (tool === "openyoutube") {

        openYouTube();

        aiMessage(
            "Opening YouTube, Boss."
        );

        return;
    }


    if (tool === "opengoogle") {

        openGoogle();

        aiMessage(
            "Opening Google, Boss."
        );

        return;
    }


    if (tool === "battery") {

        const answer =
            await getBatteryInfo();

        aiMessage(
            `Boss, ${answer}`
        );

        speak(
            `Boss, ${answer}`
        );

        return;
    }


    if (tool === "device") {

        const info =
            getDeviceInfo();

        const answer =
            `You are using an ${info.device}. ` +
            `Screen size is ${info.screen}.`;

        aiMessage(answer);

        speak(answer);

        return;
    }


    if (tool === "network") {

        const answer =
            getNetworkInfo();

        aiMessage(
            `Boss, ${answer}`
        );

        speak(
            `Boss, ${answer}`
        );

        return;
    }
}


/* =========================
   GEMINI
   ========================= */

async function askGemini(question) {

    const apiKey =
        getAPIKey();


    if (!apiKey) {

        aiMessage(
            "Boss, no Gemini API key was provided."
        );

        return;
    }


    const systemPrompt = `
You are D.I.S.C.O, a helpful personal AI assistant.

Address the user as Boss.

Use simple Indian English.

Give clear and useful answers.

Do not invent the current time, date, weather or location.
Those are handled by D.I.S.C.O's direct tools.

If the user asks about something that needs current information,
say that a live web search may be required.

If the user asks for Telugu translation,
translate the requested sentence into natural Telugu.

Keep answers reasonably concise unless the user asks for detail.
`;


    const requestBody = {

        systemInstruction: {
            parts: [
                {
                    text: systemPrompt
                }
            ]
        },

        contents: [
            {
                role: "user",

                parts: [
                    {
                        text: question
                    }
                ]
            }
        ],

        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
        }
    };


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

                    body:
                        JSON.stringify(
                            requestBody
                        )
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Gemini error:",
                data
            );


            if (
                response.status === 400 ||
                response.status === 401 ||
                response.status === 403
            ) {

                aiMessage(
                    "Boss, the Gemini API key was rejected. Use CHANGE API KEY and enter a valid key."
                );

                return;
            }


            if (response.status === 404) {

                aiMessage(
                    "Boss, the selected Gemini model is not available for this API request."
                );

                return;
            }


            if (response.status === 429) {

                aiMessage(
                    "Boss, Gemini has reached its current request limit. Please wait and try again."
                );

                return;
            }


            if (response.status === 503) {

                aiMessage(
                    "Boss, Gemini is temporarily busy. Please try again shortly."
                );

                return;
            }


            aiMessage(
                "Boss, Gemini returned an error. Please check the API key and try again."
            );

            return;
        }


        const answer =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();


        if (!answer) {

            aiMessage(
                "Boss, I did not receive a usable answer from Gemini."
            );

            return;
        }


        aiMessage(answer);

        speak(answer);


    } catch (error) {

        console.error(
            "Gemini connection error:",
            error
        );


        aiMessage(
            "Boss, I could not connect to Gemini. Please check your internet connection."
        );
    }
}


/* =========================
   SEND MESSAGE
   ========================= */

async function sendMessage() {

    const question =
        msg.value.trim();


    if (!question) {
        return;
    }


    userMessage(question);

    msg.value = "";


    /* MEMORY LEARNING */

    if (
        learnFromSentence(question)
    ) {
        return;
    }


    /* MEMORY QUESTIONS */

    if (
        memoryAnswer(question)
    ) {
        return;
    }


    /* DIRECT TOOLS */

    const usedTool =
        await handleDirectTool(question);


    if (usedTool) {
        return;
    }


    /* GEMINI */

    await askGemini(question);
}


/* =========================
   SEND BUTTON
   ========================= */

if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );
}


/* =========================
   ENTER KEY
   ========================= */

if (msg) {

    msg.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


/* =========================
   CLEAR MEMORY
   ========================= */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Boss, clear all D.I.S.C.O memory?"
                );


            if (!confirmed) {
                return;
            }


            memory = [];


            localStorage.removeItem(
                MEMORY_STORAGE
            );


            aiMessage(
                "Memory cleared, Boss."
            );

            speak(
                "Memory cleared, Boss."
            );
        }
    );
}


/* =========================
   CHANGE API KEY
   ========================= */

if (keyBtn) {

    keyBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                API_KEY_STORAGE
            );


            const key =
                prompt(
                    "Boss, enter your new Gemini API key."
                );


            if (key) {

                localStorage.setItem(
                    API_KEY_STORAGE,
                    key.trim()
                );


                aiMessage(
                    "Gemini API key updated, Boss."
                );

            } else {

                aiMessage(
                    "API key was not changed."
                );
            }
        }
    );
}


/* =========================
   VOICE INPUT
   ========================= */

function setupVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        if (mic) {
            mic.disabled = true;
            mic.title =
                "Voice input is not supported by this browser";
        }

        return;
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

            if (mic) {
                mic.textContent = "🔴";
            }
        };


    recognition.onend =
        () => {

            if (mic) {
                mic.textContent = "🎤";
            }
        };


    recognition.onerror =
        error => {

            console.error(
                "Voice error:",
                error
            );

            if (mic) {
                mic.textContent = "🎤";
            }
        };


    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0].transcript;


            msg.value =
                transcript;


            sendMessage();
        };


    if (mic) {

        mic.addEventListener(
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
}


setupVoiceInput();


/* =========================
   IMAGE BUTTON
   ========================= */

if (imgBtn && imgInput) {

    imgBtn.addEventListener(
        "click",
        () => {
            imgInput.click();
        }
    );


    imgInput.addEventListener(
        "change",
        () => {

            const file =
                imgInput.files?.[0];


            if (!file) {
                return;
            }


            aiMessage(
                `Boss, I received the image "${file.name}". Image analysis can be connected to Gemini vision when your API/model supports image input.`
            );


            imgInput.value = "";
        }
    );
}


/* =========================
   ONLINE / OFFLINE
   ========================= */

window.addEventListener(
    "online",
    () => {

        aiMessage(
            "Network connection restored, Boss."
        );
    }
);


window.addEventListener(
    "offline",
    () => {

        aiMessage(
            "Boss, the device is currently offline."
        );
    }
);


/* =========================
   STARTUP
   ========================= */

console.log(
    "D.I.S.C.O MOBILE EDITION loaded successfully."
);
