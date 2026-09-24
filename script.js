// ============================================================
// D.I.S.C.O — MOBILE AI SYSTEM
// COMPLETE SCRIPT
// Gemini + Memory + Voice + Vision + 15 Tools
// ============================================================


// ============================================================
// SETTINGS
// ============================================================

const MODEL = "gemini-3.8-flash";

const API_KEY_STORAGE = "disco_api_key";
const MEMORY_STORAGE = "disco_memory";


// ============================================================
// ELEMENTS
// ============================================================

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKeyBtn = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");


// ============================================================
// MEMORY
// ============================================================

let memory = JSON.parse(
    localStorage.getItem(MEMORY_STORAGE) || "[]"
);


function saveMemory() {
    localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memory)
    );
}


function addMemory(text) {

    const clean = text
        .replace(/^remember that\s*/i, "")
        .trim();

    if (!clean) {
        return;
    }

    if (!memory.includes(clean)) {
        memory.push(clean);
        saveMemory();
    }
}


function clearMemory() {

    memory = [];

    localStorage.removeItem(MEMORY_STORAGE);

    addMessage(
        "ai",
        "Memory cleared successfully, Boss."
    );

    speak("Memory cleared successfully, Boss.");
}


function memoryAnswer(question) {

    const q = question.toLowerCase();

    if (memory.length === 0) {
        return null;
    }


    // Name
    if (
        q.includes("what is my name") ||
        q.includes("what's my name") ||
        q.includes("who am i")
    ) {

        for (const item of memory) {

            const match = item.match(
                /(?:my name is|name is)\s+(.+)/i
            );

            if (match) {
                return "Your name is " + match[1] + ", Boss.";
            }
        }
    }


    // Favourite colour
    if (
        q.includes("favourite colour") ||
        q.includes("favorite colour") ||
        q.includes("favourite color") ||
        q.includes("favorite color")
    ) {

        for (const item of memory) {

            const match = item.match(
                /(?:my favourite colour is|my favorite colour is|my favourite color is|my favorite color is)\s+(.+)/i
            );

            if (match) {
                return "Your favourite colour is " +
                    match[1] +
                    ", Boss.";
            }
        }
    }


    // Favourite bike
    if (
        q.includes("favourite bike") ||
        q.includes("favorite bike")
    ) {

        for (const item of memory) {

            const match = item.match(
                /(?:my favourite bike is|my favorite bike is)\s+(.+)/i
            );

            if (match) {
                return "Your favourite bike is " +
                    match[1] +
                    ", Boss.";
            }
        }
    }


    // Favourite food
    if (
        q.includes("favourite food") ||
        q.includes("favorite food") ||
        q.includes("what food do i like")
    ) {

        for (const item of memory) {

            const match = item.match(
                /(?:my favourite food is|my favorite food is|i like to eat)\s+(.+)/i
            );

            if (match) {
                return "You like to eat " +
                    match[1] +
                    ", Boss.";
            }
        }
    }


    // AC
    if (
        q.includes("what ac do i have") ||
        q.includes("which ac do i have") ||
        q.includes("my ac")
    ) {

        for (const item of memory) {

            const match = item.match(
                /(?:i have|my ac is|i own)\s+(.+ac.*)/i
            );

            if (match) {
                return "You have " +
                    match[1] +
                    ", Boss.";
            }
        }
    }


    // Search any memory containing the important word
    for (const item of memory) {

        const words = q
            .split(/\s+/)
            .filter(word => word.length > 3);

        for (const word of words) {

            if (item.toLowerCase().includes(word)) {
                return "I remember this: " +
                    item +
                    ", Boss.";
            }
        }
    }

    return null;
}


// ============================================================
// AUTOMATIC PERSONAL MEMORY
// ============================================================

function detectMemory(text) {

    const patterns = [
        /my name is\s+(.+)/i,
        /my favourite colour is\s+(.+)/i,
        /my favorite colour is\s+(.+)/i,
        /my favourite color is\s+(.+)/i,
        /my favorite color is\s+(.+)/i,
        /my favourite bike is\s+(.+)/i,
        /my favorite bike is\s+(.+)/i,
        /my favourite food is\s+(.+)/i,
        /my favorite food is\s+(.+)/i,
        /i like to eat\s+(.+)/i,
        /i have\s+(.+)/i,
        /i own\s+(.+)/i
    ];

    for (const pattern of patterns) {

        if (pattern.test(text)) {

            addMemory(text);
            return true;
        }
    }

    return false;
}


// ============================================================
// CHAT MESSAGE
// ============================================================

function addMessage(type, text) {

    if (!chat) {
        return;
    }

    const div = document.createElement("div");

    div.className =
        type === "user"
            ? "msg user"
            : "msg ai";

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


// ============================================================
// SPEECH OUTPUT
// ============================================================

let voices = [];


function loadVoices() {
    voices = speechSynthesis.getVoices();
}


if ("speechSynthesis" in window) {

    speechSynthesis.onvoiceschanged = loadVoices;

    loadVoices();
}


function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 0.85;
    utterance.volume = 1;

    const indianVoice = voices.find(
        voice =>
            voice.lang &&
            voice.lang.toLowerCase().startsWith("en-in")
    );

    const englishVoice = voices.find(
        voice =>
            voice.lang &&
            voice.lang.toLowerCase().startsWith("en")
    );

    if (indianVoice) {
        utterance.voice = indianVoice;
    }
    else if (englishVoice) {
        utterance.voice = englishVoice;
    }

    speechSynthesis.speak(utterance);
}


// ============================================================
// GEMINI API KEY
// ============================================================

function getApiKey() {

    let key =
        localStorage.getItem(API_KEY_STORAGE);

    if (!key) {

        key = prompt(
            "Enter your Gemini API key:"
        );

        if (key) {

            localStorage.setItem(
                API_KEY_STORAGE,
                key.trim()
            );
        }
    }

    return key;
}


function changeApiKey() {

    const newKey = prompt(
        "Enter your new Gemini API key:"
    );

    if (!newKey) {
        return;
    }

    localStorage.setItem(
        API_KEY_STORAGE,
        newKey.trim()
    );

    addMessage(
        "ai",
        "Gemini API key changed successfully, Boss."
    );

    speak(
        "Gemini API key changed successfully, Boss."
    );
}


// ============================================================
// GEMINI PROMPT
// ============================================================

function createPrompt(question) {

    let memoryText = "No saved memory.";

    if (memory.length > 0) {

        memoryText = memory
            .map((item, index) =>
                (index + 1) + ". " + item
            )
            .join("\n");
    }

    return `
You are D.I.S.C.O, a helpful personal AI assistant.

Call the user "Boss".

Use simple and clear English.

The user is using a mobile AI system.

IMPORTANT:
Use the saved memory when it is relevant.

SAVED MEMORY:
${memoryText}

USER QUESTION:
${question}

Answer naturally and directly.
`;
}


// ============================================================
// IMAGE TO BASE64
// ============================================================

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => {

            const result = reader.result;

            const base64 =
                result.split(",")[1];

            resolve(base64);
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}


// ============================================================
// GEMINI TEXT REQUEST
// ============================================================

async function askGemini(question) {

    const apiKey = getApiKey();

    if (!apiKey) {

        return "Gemini API key is required, Boss.";
    }


    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL +
        ":generateContent";


    const response = await fetch(
        url,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },

            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: createPrompt(question)
                            }
                        ]
                    }
                ]
            })
        }
    );


    const data = await response.json();


    if (!response.ok) {

        console.error(
            "Gemini error:",
            data
        );

        if (response.status === 429) {

            return "Gemini is temporarily rate-limited, Boss. Please try again shortly.";
        }

        if (response.status === 400) {

            return "The Gemini request was rejected. Please check your API key or model settings, Boss.";
        }

        return "Gemini returned an error, Boss.";
    }


    const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;


    if (!answer) {

        return "I did not receive a response from Gemini, Boss.";
    }


    return answer.trim();
}


// ============================================================
// GEMINI IMAGE REQUEST
// ============================================================

async function askGeminiImage(question, file) {

    const apiKey = getApiKey();

    if (!apiKey) {

        return "Gemini API key is required for image analysis, Boss.";
    }


    const base64 =
        await fileToBase64(file);


    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL +
        ":generateContent";


    const response = await fetch(
        url,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },

            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text:
                                    question ||
                                    "Describe and analyse this image."
                            },
                            {
                                inline_data: {
                                    mime_type: file.type,
                                    data: base64
                                }
                            }
                        ]
                    }
                ]
            })
        }
    );


    const data = await response.json();


    if (!response.ok) {

        console.error(
            "Gemini image error:",
            data
        );

        return "I could not analyse the image, Boss.";
    }


    const answer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;


    if (!answer) {

        return "I could not get an image analysis from Gemini, Boss.";
    }


    return answer.trim();
}


// ============================================================
// TOOLS — THE HANDS
// 15 TOOLS
// ============================================================

async function handleTools(text) {

    const t =
        text.toLowerCase().trim();


    // --------------------------------------------------------
    // TOOL 1 — TIME
    // --------------------------------------------------------

    if (
        /\btime\b/.test(t) ||
        t.includes("what time") ||
        t.includes("current time")
    ) {

        return (
            "The time is " +
            new Date().toLocaleTimeString("en-IN") +
            ", Boss."
        );
    }


    // --------------------------------------------------------
    // TOOL 2 — DATE
    // --------------------------------------------------------

    if (
        /\bdate\b/.test(t) ||
        t.includes("today's date") ||
        t.includes("today date") ||
        t.includes("what day")
    ) {

        return (
            "Today is " +
            new Date().toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            ) +
            ", Boss."
        );
    }


    // --------------------------------------------------------
    // TOOL 3 — WEATHER
    // --------------------------------------------------------

    if (
        t.includes("weather") ||
        t.includes("temperature") ||
        t.includes("how hot") ||
        t.includes("how cold")
    ) {

        return await new Promise(resolve => {

            if (!navigator.geolocation) {

                resolve(
                    "Location is not supported on this device, Boss."
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                async position => {

                    try {

                        const latitude =
                            position.coords.latitude;

                        const longitude =
                            position.coords.longitude;


                        const url =
                            "https://api.open-meteo.com/v1/forecast" +
                            "?latitude=" +
                            latitude +
                            "&longitude=" +
                            longitude +
                            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code" +
                            "&timezone=auto";


                        const response =
                            await fetch(url);


                        if (!response.ok) {
                            throw new Error(
                                "Weather request failed"
                            );
                        }


                        const data =
                            await response.json();


                        const current =
                            data.current;


                        resolve(
                            "The current temperature is " +
                            current.temperature_2m +
                            " degrees Celsius. " +
                            "It feels like " +
                            current.apparent_temperature +
                            " degrees. " +
                            "Humidity is " +
                            current.relative_humidity_2m +
                            " percent. " +
                            "Wind speed is " +
                            current.wind_speed_10m +
                            " kilometres per hour, Boss."
                        );

                    }
                    catch (error) {

                        resolve(
                            "I could not get the weather right now, Boss."
                        );
                    }
                },

                () => {

                    resolve(
                        "I need location permission to check the weather, Boss."
                    );
                }
            );
        });
    }


    // --------------------------------------------------------
    // TOOL 4 — TIMER
    // --------------------------------------------------------

    const timerMatch =
        t.match(
            /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/
        );


    if (
        t.includes("timer") &&
        timerMatch
    ) {

        const amount =
            parseInt(timerMatch[1], 10);

        const unit =
            timerMatch[2];


        let milliseconds;


        if (
            /^hours?$/i.test(unit) ||
            /^hrs?$/i.test(unit)
        ) {

            milliseconds =
                amount * 60 * 60 * 1000;
        }

        else if (
            /^seconds?$/i.test(unit) ||
            /^secs?$/i.test(unit)
        ) {

            milliseconds =
                amount * 1000;
        }

        else {

            milliseconds =
                amount * 60 * 1000;
        }


        setTimeout(() => {

            const message =
                "Timer complete, Boss. " +
                amount +
                " " +
                unit +
                " finished.";


            addMessage(
                "ai",
                message
            );

            speak(message);

        }, milliseconds);


        return (
            "Timer set for " +
            amount +
            " " +
            unit +
            ", Boss."
        );
    }


    // --------------------------------------------------------
    // TOOL 5 — TRANSLATE TO TELUGU
    // --------------------------------------------------------

    if (
        t.startsWith("translate ") ||
        t.startsWith("translate this ")
    ) {

        const query =
            text
                .replace(
                    /^translate\s+(this\s+)?/i,
                    ""
                )
                .trim();


        if (!query) {

            return (
                "Tell me what you want me to translate, Boss."
            );
        }


        try {

            const url =
                "https://api.mymemory.translated.net/get?q=" +
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

        }
        catch (error) {

            return (
                "Translation service error, Boss."
            );
        }
    }


    // --------------------------------------------------------
    // TOOL 6 — YOUTUBE SEARCH
    // --------------------------------------------------------

    if (
        t.startsWith("play ") ||
        t.startsWith("youtube ") ||
        t.includes("search youtube")
    ) {

        let query =
            text
                .replace(/^play\s+/i, "")
 
