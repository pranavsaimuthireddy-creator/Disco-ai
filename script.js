// =========================================
// D.I.S.C.O. ADVANCED MAIN SCRIPT
// =========================================

const MODEL = "gemini-3.8-flash";

const KEY_NAME = "disco_api_key";
const MEMORY_NAME = "disco_memory";

let timerID = null;
let recognition = null;
let isListening = false;


// =========================================
// ELEMENTS
// =========================================

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");

const clearBtn =
    document.getElementById("clear-btn");

const keyBtn =
    document.getElementById("key-btn");

const imgInput =
    document.getElementById("img-input");

const stateText =
    document.getElementById("stateText");

const activity =
    document.getElementById("activity");

const memoryStatus =
    document.getElementById("memoryStatus");

const voiceStatus =
    document.getElementById("voiceStatus");

const visionStatus =
    document.getElementById("visionStatus");

const networkStatus =
    document.getElementById("networkStatus");


// =========================================
// STATE
// =========================================

function setState(mode, text, activityText) {

    document.body.classList.remove(
        "listening",
        "reasoning",
        "speaking"
    );

    if (mode) {
        document.body.classList.add(mode);
    }

    if (stateText) {
        stateText.textContent =
            text || "READY";
    }

    if (activity) {
        activity.textContent =
            activityText || "SYSTEM READY";
    }
}


// =========================================
// CHAT
// =========================================

function addMessage(text, type = "ai") {

    if (!chat) return;

    const box =
        document.createElement("div");

    box.className =
        `message ${type}`;

    box.textContent =
        text;

    chat.appendChild(box);

    chat.scrollTop =
        chat.scrollHeight;
}


// =========================================
// MEMORY
// =========================================

function getMemory() {

    try {

        return JSON.parse(
            localStorage.getItem(
                MEMORY_NAME
            ) || "{}"
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

    updateMemoryStatus();
}


function updateMemoryStatus() {

    const memory =
        getMemory();

    if (!memoryStatus) return;

    if (
        memory.name ||
        memory.favouriteColour
    ) {

        memoryStatus.textContent =
            "DATA SAVED";

    } else {

        memoryStatus.textContent =
            "ONLINE";
    }
}


function remember(text) {

    const memory =
        getMemory();


    // NAME

    const nameMatch =
        text.match(
            /my\s+name\s+is\s+([a-zA-Z][a-zA-Z\s'-]*?)(?=\s+and\s+my\s+|\s+my\s+favourite|\s+my\s+favorite|[.!?]|$)/i
        );


    if (nameMatch) {

        memory.name =
            nameMatch[1]
                .trim();
    }


    // FAVOURITE COLOUR

    const colourMatch =
        text.match(
            /my\s+(?:favourite|favorite)\s+(?:colour|color)\s+is\s+([a-zA-Z\s'-]+?)(?=[.!?]|$)/i
        );


    if (colourMatch) {

        memory.favouriteColour =
            colourMatch[1]
                .trim();
    }


    saveMemory(memory);

    return memory;
}


// =========================================
// TIME
// =========================================

function currentTime() {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone:
                "Asia/Kolkata",

            hour:
                "numeric",

            minute:
                "2-digit",

            second:
                "2-digit",

            hour12:
                true
        }
    ).format(
        new Date()
    );
}


// =========================================
// DATE
// =========================================

function currentDate() {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone:
                "Asia/Kolkata",

            weekday:
                "long",

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"
        }
    ).format(
        new Date()
    );
}


// =========================================
// SPEECH OUTPUT
// =========================================

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    window.speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.lang =
        "en-IN";

    utterance.rate =
        0.92;

    utterance.pitch =
        0.78;


    const voices =
        window.speechSynthesis
            .getVoices();


    const preferredVoice =
        voices.find(
            voice =>
                /male|ravi|david|daniel|alex|mark|george|james/i
                    .test(
                        voice.name
                    )
        ) ||

        voices.find(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    === "en-in"
        ) ||

        voices.find(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("en")
        );


    if (preferredVoice) {

        utterance.voice =
            preferredVoice;
    }


    utterance.onstart =
        () => {

            setState(
                "speaking",
                "SPEAKING",
                "D.I.S.C.O. SPEAKING"
            );
        };


    utterance.onend =
        () => {

            setState(
                "",
                "READY",
                "SYSTEM READY"
            );
        };


    utterance.onerror =
        () => {

            setState(
                "",
                "READY",
                "VOICE READY"
            );
        };


    window.speechSynthesis
        .speak(
            utterance
        );
}


if (
    "speechSynthesis" in window
) {

    window.speechSynthesis
        .onvoiceschanged =
        () => {

            window.speechSynthesis
                .getVoices();
        };
}


// =========================================
// API KEY
// =========================================

function getAPIKey() {

    return localStorage.getItem(
        KEY_NAME
    );
}


function changeAPIKey() {

    const key =
        prompt(
            "Enter your Gemini API key:"
        );


    if (!key) return;


    localStorage.setItem(
        KEY_NAME,
        key.trim()
    );


    addMessage(
        "API key updated successfully.",
        "ai"
    );


    speak(
        "API key updated successfully."
    );
}


// =========================================
// CLEAR MEMORY
// =========================================

function clearMemory() {

    localStorage.removeItem(
        MEMORY_NAME
    );

    updateMemoryStatus();

    addMessage(
        "Memory cleared successfully.",
        "ai"
    );

    speak(
        "Memory cleared successfully."
    );
}


// =========================================
// CALCULATOR
// =========================================

function calculate(text) {

    let expression =
        text

            .replace(
                /what is/gi,
                ""
            )

            .replace(
                /calculate/gi,
                ""
            )

            .replace(
                /plus/gi,
                "+"
            )

            .replace(
                /minus/gi,
                "-"
            )

            .replace(
                /multiplied by/gi,
                "*"
            )

            .replace(
                /times/gi,
                "*"
            )

            .replace(
                /divided by/gi,
                "/"
            )

            .trim();


    if (
        !/^[0-9+\-*/().%\s]+$/
            .test(expression)
    ) {

        return null;
    }


    try {

        const result =
            Function(
                `"use strict"; return (${expression})`
            )();


        if (
            typeof result === "number" &&
            Number.isFinite(result)
        ) {

            return `The answer is ${result}.`;
        }

    } catch {

        return null;
    }


    return null;
}


// =========================================
// BATTERY
// =========================================

async function batteryInfo() {

    if (!navigator.getBattery) {

        return "Battery information is not available in this browser.";
    }


    try {

        const battery =
            await navigator.getBattery();


        const percentage =
            Math.round(
                battery.level * 100
            );


        return battery.charging

            ? `Your battery is at ${percentage}% and it is charging.`

            : `Your battery is at ${percentage}% and it is not charging.`;

    } catch {

        return "I could not access the battery information.";
    }
}


// =========================================
// NETWORK
// =========================================

function networkInfo() {

    return navigator.onLine

        ? "Network connection is online."

        : "Network connection is offline.";
}


// =========================================
// WEATHER
// =========================================

async function weatherInfo() {

    if (
        !navigator.geolocation
    ) {

        return "Location access is not supported by this browser.";
    }


    return new Promise(
        resolve => {

            navigator.geolocation
                .getCurrentPosition(

                    async position => {

                        try {

                            const lat =
                                position.coords.latitude;

                            const lon =
                                position.coords.longitude;


                            const url =
                                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;


                            const response =
                                await fetch(
                                    url
                                );


                            if (
                                !response.ok
                            ) {

                                throw new Error(
                                    "Weather error"
                                );
                            }


                            const data =
                                await response.json();


                            const current =
                                data.current;


                            resolve(
                                `The current temperature is ${current.temperature_2m} degrees Celsius, with ${current.relative_humidity_2m}% humidity and wind speed of ${current.wind_speed_10m} kilometres per hour.`
                            );

                        } catch {

                            resolve(
                                "I could not get the weather information."
                            );
                        }
                    },


                    () => {

                        resolve(
                            "Location permission was not provided, so I cannot get your local weather."
                        );
                    }
                );
        }
    );
}


// =========================================
// TIMER
// =========================================

function startTimer(seconds) {

    clearTimeout(timerID);


    timerID =
        setTimeout(
            () => {

                addMessage(
                    "Timer finished.",
                    "ai"
                );

                speak(
                    "Timer finished."
                );

            },
            seconds * 1000
        );


    return `Timer set for ${seconds} seconds.`;
}


function stopTimer() {

    if (timerID) {

        clearTimeout(
            timerID
        );

        timerID = null;

        return "Timer stopped.";
    }


    return "There is no active timer.";
}


// =========================================
// YOUTUBE
// =========================================

function youtubeSearch(query) {

    const url =
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;


    window.open(
        url,
        "_blank"
    );


    return `Opening YouTube search for ${query}.`;
}


// =========================================
// DIRECT COMMANDS
// =========================================

async function processCommand(text) {

    const lower =
        text
            .toLowerCase()
            .trim();


    // TIME

    if (
        lower === "time" ||
        lower.includes("what time") ||
        lower.includes("current time") ||
        lower.includes("time now") ||
        lower.includes("what is the time")
    ) {

        return `The current time is ${currentTime()}.`;
    }


    // DATE

    if (
        lower === "date" ||
        lower.includes("today's date") ||
        lower.includes("todays date") ||
        lower.includes("what date") ||
        lower.includes("today date")
    ) {

        return `Today is ${currentDate()}.`;
    }


    // MEMORY SAVE

    if (
        lower.includes("remember that") ||
        lower.includes("my name is") ||
        lower.includes("my favourite colour is") ||
        lower.includes("my favorite color is")
    ) {

        const memory =
            remember(text);


        if (
            memory.name &&
            memory.favouriteColour
        ) {

            return `Got it, Boss. I will remember that your name is ${memory.name} and your favourite colour is ${memory.favouriteColour}.`;
        }


        if (memory.name) {

            return `Got it, Boss. I will remember that your name is ${memory.name}.`;
        }


        if (
            memory.favouriteColour
        ) {

            return `Got it, Boss. I will remember that your favourite colour is ${memory.favouriteColour}.`;
        }


        return "I have saved that in memory.";
    }


    // MEMORY

    const memory =
        getMemory();


    // BOTH

    if (
        lower.includes("my name") &&
        (
            lower.includes("favourite colour") ||
            lower.includes("favorite color")
        )
    ) {

        if (
            memory.name &&
            memory.favouriteColour
        ) {

            return `Your name is ${memory.name} and your favourite colour is ${memory.favouriteColour}.`;
        }


        return "I do not have both pieces of information saved yet.";
    }


    // NAME

    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
        lower === "who am i"
    ) {

        return memory.name

            ? `Your name is ${memory.name}.`

            : "You have not told me your name yet.";
    }


    // COLOUR

    if (
        lower.includes("what is my favourite colour") ||
        lower.includes("what's my favourite colour") ||
        lower.includes("what is my favorite color") ||
        lower.includes("what's my favorite color")
    ) {

        return memory.favouriteColour

            ? `Your favourite colour is ${memory.favouriteColour}.`

            : "You have not told me your favourite colour yet.";
    }


    // CLEAR MEMORY

    if (
        lower === "clear memory" ||
        lower === "forget everything" ||
        lower === "delete memory"
    ) {

        clearMemory();

        return null;
    }


    // BATTERY

    if (
        lower.includes("battery")
    ) {

        return await batteryInfo();
    }


    // NETWORK

    if (
        lower === "network" ||
        lower.includes("network status") ||
        lower.includes("internet status") ||
        lower.includes("am i online")
    ) {

        return networkInfo();
    }


    // WEATHER

    if (
        lower.includes("weather") ||
        lower.includes("temperature")
    ) {

        return await weatherInfo();
    }


    // TIMER

    const timerMatch =
        lower.match(
            /(?:set|start)\s+(?:a\s+)?timer\s+(?:for\s+)?(\d+)\s*(seconds?|secs?|minutes?|mins?)/i
        );


    if (timerMatch) {

        let value =
            Number(
                timerMatch[1]
            );


        const unit =
            timerMatch[2]
                .toLowerCase();


        if (
            unit.startsWith("minute") ||
            unit.startsWith("min")
        ) {

            value *= 60;
        }


        return startTimer(
            value
        );
    }


    // STOP TIMER

    if (
        lower === "stop timer" ||
        lower === "cancel timer"
    ) {

        return stopTimer();
    }


    // YOUTUBE

    if (
        lower.startsWith("youtube ")
    ) {

        const query =
            text
                .substring(8)
                .trim();


        if (query) {

            return youtubeSearch(
                query
            );
        }
    }


    // CALCULATOR

    if (
        lower.startsWith("calculate ") ||
        lower.startsWith("what is ")
    ) {

        const result =
            calculate(text);


        if (result) {

            return result;
        }
    }


    // GREETINGS

    if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey"
    ) {

        return "Hello Boss. D.I.S.C.O. is ready.";
    }


    // HOW ARE YOU

    if (
        lower.includes("how are you")
    ) {

        return "All systems are operating normally, Boss.";
    }


    // FEATURES

    if (
        lower.includes("what can you do") ||
        lower === "features"
    ) {

        return `
I can remember information, answer questions using Gemini, tell you the time and date, check battery and network status, get weather information, calculate expressions, set timers, search YouTube, understand your voice and analyse images.
        `.trim();
    }


    // GEMINI

    return await askGemini(
        text
    );
}


// =========================================
// GEMINI
// =========================================

async function askGemini(text) {

    const apiKey =
        getAPIKey();


    if (!apiKey) {

        return "Gemini API key is not set. Press API KEY and add your key.";
    }


    setState(
        "reasoning",
        "REASONING",
        "D.I.S.C.O. THINKING..."
    );


    const memory =
        getMemory();


    const systemPrompt = `
You are D.I.S.C.O., a personal AI assistant.

Call the user Boss.

Use simple, natural Indian English.

Be helpful and concise.

Do not invent memories.

Saved memory:
Name: ${memory.name || "Not saved"}
Favourite colour: ${memory.favouriteColour || "Not saved"}

If the user asks about saved memory, use the saved memory above.
`;


    const body = {

        system_instruction: {

            parts: [
                {
                    text:
                        systemPrompt
                }
            ]
        },

        contents: [

            {
                role: "user",

                parts: [

                    {
                        text:
                            text
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
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
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
                            body
                        )
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Gemini API error:",
                data
            );


            if (
                response.status === 400
            ) {

                return "Gemini rejected the request. Please check your API key and model settings.";
            }


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                return "The Gemini API key was rejected. Please press API KEY and enter a valid key.";
            }


            if (
                response.status === 429
            ) {

                return "Gemini quota has been reached. Please wait and try again later.";
            }


            return `Gemini error: ${
                data?.error?.message ||
                "Unknown API error"
            }`;
        }


        const answer =
            data?.candidates?.[0]
                ?.content
                ?.parts
                ?.map(
                    part =>
                        part.text || ""
                )
                .join("")
                .trim();


        if (!answer) {

            return "Gemini returned an empty response.";
        }


        return answer;

    } catch (error) {

        console.error(
            "Network error:",
            error
        );


        return "I could not connect to Gemini. Check that your phone is online and reload the page.";
    }
}


// =========================================
// SEND MESSAGE
// =========================================

async function sendMessage() {

    const text =
        msg.value.trim();


    if (!text) return;


    addMessage(
        text,
        "user"
    );


    msg.value = "";


    setState(
        "reasoning",
        "REASONING",
        "PROCESSING COMMAND..."
    );


    try {

        const answer =
            await processCommand(
                text
            );


        if (answer) {

            addMessage(
                answer,
                "ai"
            );


            speak(
                answer
            );

        } else {

            setState(
                "",
                "READY",
                "SYSTEM READY"
            );
        }

    } catch (error) {

        console.error(
            error
        );


        const errorText =
            "Something went wrong while processing your command.";


        addMessage(
            errorText,
            "ai"
        );


        speak(
            errorText
        );
    }
}


// =========================================
// ENTER KEY
// =========================================

if (msg) {

    msg.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


// =========================================
// SEND BUTTON
// =========================================

if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );
}


// =========================================
// API BUTTON
// =========================================

if (keyBtn) {

    keyBtn.addEventListener(
        "click",
        changeAPIKey
    );
}


// =========================================
// CLEAR MEMORY BUTTON
// =========================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        clearMemory
    );
}


// =========================================
// VOICE INPUT
// =========================================

function setupVoiceRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        if (voiceStatus) {

            voiceStatus.textContent =
                "UNAVAILABLE";
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

            isListening =
                true;


            setState(
                "listening",
                "LISTENING",
                "D.I.S.C.O. LISTENING..."
            );


            if (voiceStatus) {

                voiceStatus.textContent =
                    "LISTENING";
            }
        };


    recognition.onresult =
        event => {

            const transcript =
                event
                    .results[0][0]
                    .transcript;


            msg.value =
                transcript;


            isListening =
                false;


            setState(
                "reasoning",
                "REASONING",
                "VOICE COMMAND RECEIVED"
            );


            sendMessage();
        };


    recognition.onerror =
        event => {

            console.error(
                "Speech recognition:",
                event.error
            );


            isListening =
                false;


            setState(
                "",
                "READY",
                "VOICE READY"
            );


            if (voiceStatus) {

                voiceStatus.textContent =
                    "READY";
            }
        };


    recognition.onend =
        () => {

            isListening =
                false;


            if (
                !document.body.classList
                    .contains("reasoning") &&
                !document.body.classList
                    .contains("speaking")
            ) {

                setState(
                    "",
                    "READY",
                    "SYSTEM READY"
                );
            }


            if (voiceStatus) {

                voiceStatus.textContent =
                    "READY";
            }
        };
}


setupVoiceRecognition();


if (mic) {

    mic.addEventListener(
        "click",
        () => {

            if (!recognition) {

                addMessage(
                    "Voice input is not supported by this browser.",
                    "ai"
                );

                return;
            }


            if (isListening) {

                recognition.stop();

                return;
            }


            try {

                recognition.start();

            } catch (error) {

                console.log(
                    error
                );
            }
        }
    );
}


// =========================================
// IMAGE / VISION
// =========================================

if (imgInput) {

    imgInput.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files[0];


            if (!file) return;


            const apiKey =
                getAPIKey();


            if (!apiKey) {

                addMessage(
                    "Please set your Gemini API key first.",
                    "ai"
                );

                return;
            }


            visionStatus.textContent =
                "ANALYSING";


            setState(
                "reasoning",
                "REASONING",
                "VISION ANALYSIS..."
            );


            addMessage(
                "Analysing image...",
                "ai"
            );


            try {

                const base64 =
                    await fileToBase64(
                        file
                    );


                const cleanBase64 =
                    base64.split(",")[1];


                const body = {

                    contents: [

                        {

                            parts: [

                                {
                                    text:
                                        "Analyse this image and explain clearly what you see."
                                },

                                {

                                    inline_data: {

                                        mime_type:
                                            file.type,

                                        data:
                                            cleanBase64
                                    }
                                }

                            ]
                        }

                    ]
                };


                const response =
                    await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "x-goog-api-key":
                                    apiKey
                            },

                            body:
                                JSON.stringify(
                                    body
                                )
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data?.error?.message ||
                        "Vision API error"
                    );
                }


                const answer =
                    data?.candidates?.[0]
                        ?.content
                        ?.parts
                        ?.map(
                            part =>
                                part.text || ""
                        )
                        .join("")
                        .trim();


                const finalAnswer =
                    answer ||
                    "I could not understand the image.";


                addMessage(
                    finalAnswer,
                    "ai"
                );


                speak(
                    finalAnswer
                );


                visionStatus.textContent =
                    "READY";

            } catch (error) {

                console.error(
                    error
                );


                addMessage(
                    `Vision error: ${error.message}`,
                    "ai"
                );


                visionStatus.textContent =
                    "ERROR";


                setState(
                    "",
                    "READY",
                    "SYSTEM READY"
                );
            }


            imgInput.value = "";
        }
    );
}


// =========================================
// FILE TO BASE64
// =========================================

function fileToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => resolve(
                    reader.result
                );


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );
        }
    );
}


// =========================================
// NETWORK STATUS
// =========================================

function updateNetworkStatus() {

    if (!networkStatus) return;


    networkStatus.textContent =
        navigator.onLine
            ? "ONLINE"
            : "OFFLINE";
}


window.addEventListener(
    "online",
    updateNetworkStatus
);

window.addEventListener(
    "offline",
    updateNetworkStatus
);


// =========================================
// INITIALISE
// =========================================

updateMemoryStatus();

updateNetworkStatus();


if (voiceStatus) {

    voiceStatus.textContent =
        recognition
            ? "READY"
            : "BROWSER";
}


if (visionStatus) {

    visionStatus.textContent =
        "READY";
}


setState(
    "",
    "READY",
    "SYSTEM READY"
);

console.log(
    "D.I.S.C.O. system loaded successfully."
);
