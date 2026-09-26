// ===============================
// D.I.S.C.O. - MAIN SCRIPT
// ===============================

const MODEL = "gemini-3.8-flash";

const KEY_NAME = "disco_api_key";
const MEMORY_NAME = "disco_memory";

let timerID = null;
let recognition = null;


// ===============================
// ELEMENTS
// ===============================

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const keyBtn = document.getElementById("key-btn");
const imgInput = document.getElementById("img-input");

const stateText = document.getElementById("stateText");
const activity = document.getElementById("activity");
const networkStatus = document.getElementById("networkStatus");


// ===============================
// STATE
// ===============================

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
        stateText.textContent = text || "READY";
    }

    if (activity) {
        activity.textContent =
            activityText || "SYSTEM READY";
    }
}


// ===============================
// CHAT
// ===============================

function addMessage(text, type = "ai") {

    if (!chat) return;

    const box = document.createElement("div");

    box.className = `message ${type}`;

    box.textContent = text;

    chat.appendChild(box);

    chat.scrollTop = chat.scrollHeight;
}


// ===============================
// MEMORY
// ===============================

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


function remember(text) {

    const memory = getMemory();

    const lower = text.toLowerCase();


    // NAME

    const nameMatch =
        text.match(
            /(?:my name is|remember that my name is)\s+(.+)/i
        );

    if (nameMatch) {

        memory.name =
            nameMatch[1]
                .trim()
                .replace(/[.!?]+$/, "");

    }


    // FAVOURITE COLOUR

    const colourMatch =
        text.match(
            /(?:my favourite colour is|my favorite color is)\s+(.+)/i
        );

    if (colourMatch) {

        memory.favouriteColour =
            colourMatch[1]
                .trim()
                .replace(/[.!?]+$/, "");
    }


    saveMemory(memory);

    return memory;
}


// ===============================
// CURRENT TIME
// ===============================

function currentTime() {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    ).format(new Date());
}


// ===============================
// CURRENT DATE
// ===============================

function currentDate() {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(new Date());
}


// ===============================
// VOICE OUTPUT
// ===============================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";

    utterance.rate = 0.92;

    utterance.pitch = 0.78;

    const voices =
        window.speechSynthesis.getVoices();

    const preferredVoice =
        voices.find(v =>
            /male|ravi|david|daniel|alex|mark|george|james/i
                .test(v.name)
        ) ||
        voices.find(v =>
            v.lang &&
            v.lang.toLowerCase() === "en-in"
        ) ||
        voices.find(v =>
            v.lang &&
            v.lang.toLowerCase().startsWith("en")
        );

    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {

        setState(
            "speaking",
            "SPEAKING",
            "D.I.S.C.O. SPEAKING"
        );

    };

    utterance.onend = () => {

        setState(
            "",
            "READY",
            "SYSTEM READY"
        );

    };

    window.speechSynthesis.speak(utterance);
}


// Load voices when browser provides them

if ("speechSynthesis" in window) {

    window.speechSynthesis.onvoiceschanged =
        () => {
            window.speechSynthesis.getVoices();
        };
}


// ===============================
// API KEY
// ===============================

function getAPIKey() {

    return localStorage.getItem(KEY_NAME);
}


function changeAPIKey() {

    const key =
        prompt("Enter your Gemini API key:");

    if (!key) return;

    localStorage.setItem(
        KEY_NAME,
        key.trim()
    );

    addMessage(
        "API key updated successfully.",
        "ai"
    );

    speak("API key updated successfully.");
}


// ===============================
// CLEAR MEMORY
// ===============================

function clearMemory() {

    localStorage.removeItem(MEMORY_NAME);

    addMessage(
        "Memory cleared successfully.",
        "ai"
    );

    speak(
        "Memory cleared successfully."
    );
}


// ===============================
// CALCULATOR
// ===============================

function calculate(text) {

    let expression =
        text
            .replace(/what is/gi, "")
            .replace(/calculate/gi, "")
            .replace(/calculate the/gi, "")
            .replace(/plus/gi, "+")
            .replace(/minus/gi, "-")
            .replace(/multiplied by/gi, "*")
            .replace(/times/gi, "*")
            .replace(/divided by/gi, "/")
            .trim();


    if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
        return null;
    }


    try {

        const result =
            Function(
                `"use strict"; return (${expression})`
            )();

        if (typeof result === "number" &&
            Number.isFinite(result)) {

            return `The answer is ${result}.`;
        }

    } catch {

        return null;
    }

    return null;
}


// ===============================
// BATTERY
// ===============================

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

        const charging =
            battery.charging
                ? "and it is charging"
                : "and it is not charging";

        return `Your battery is at ${percentage}% ${charging}.`;

    } catch {

        return "I could not access the battery information.";

    }
}


// ===============================
// NETWORK
// ===============================

function networkInfo() {

    return navigator.onLine
        ? "Network connection is online."
        : "Network connection is offline.";
}


// ===============================
// WEATHER
// ===============================

async function weatherInfo() {

    if (!navigator.geolocation) {

        return "Location access is not supported by this browser.";

    }


    return new Promise(resolve => {

        navigator.geolocation.getCurrentPosition(

            async position => {

                try {

                    const lat =
                        position.coords.latitude;

                    const lon =
                        position.coords.longitude;


                    const url =
                        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;


                    const response =
                        await fetch(url);


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

    });
}


// ===============================
// TIMER
// ===============================

function startTimer(seconds) {

    clearTimeout(timerID);

    timerID =
        setTimeout(() => {

            addMessage(
                "Timer finished.",
                "ai"
            );

            speak("Timer finished.");

        }, seconds * 1000);


    return `Timer set for ${seconds} seconds.`;
}


function stopTimer() {

    if (timerID) {

        clearTimeout(timerID);

        timerID = null;

        return "Timer stopped.";

    }

    return "There is no active timer.";
}


// ===============================
// YOUTUBE
// ===============================

function youtubeSearch(query) {

    const url =
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    window.open(url, "_blank");

    return `Opening YouTube search for ${query}.`;
}


// ===============================
// OPEN LAST ACTION
// ===============================

let lastURL = null;

function openLastAction() {

    if (!lastURL) {

        return "There is no previous page to open.";

    }

    window.open(
        lastURL,
        "_blank"
    );

    return "Opening the previous page.";
}


// ===============================
// DIRECT COMMANDS
// ===============================

async function processCommand(text) {

    const lower =
        text.toLowerCase().trim();


    // ===========================
    // TIME
    // ===========================

    if (
        lower === "time" ||
        lower.includes("what time") ||
        lower.includes("current time") ||
        lower.includes("tell me the time") ||
        lower.includes("tell me current time") ||
        lower.includes("time now") ||
        lower.includes("what's the time") ||
        lower.includes("what is the time") ||
        lower.includes("time please")
    ) {

        return `The current time is ${currentTime()}.`;
    }


    // ===========================
    // DATE
    // ===========================

    if (
        lower.includes("today's date") ||
        lower.includes("todays date") ||
        lower.includes("what date") ||
        lower === "date" ||
        lower.includes("today date")
    ) {

        return `Today is ${currentDate()}.`;
    }


    // ===========================
    // MEMORY
    // ===========================

    if (
        lower.includes("remember that") ||
        lower.includes("my name is") ||
        lower.includes("my favourite colour is") ||
        lower.includes("my favorite color is")
    ) {

        const memory =
            remember(text);

        if (memory.name &&
            memory.favouriteColour) {

            return `Got it. I will remember that your name is ${memory.name} and your favourite colour is ${memory.favouriteColour}.`;

        }

        if (memory.name) {

            return `Got it. I will remember that your name is ${memory.name}.`;

        }

        if (memory.favouriteColour) {

            return `Got it. I will remember that your favourite colour is ${memory.favouriteColour}.`;
        }

        return "I have saved that in memory.";
    }


    // ===========================
    // COMBINED MEMORY QUESTION
    // ===========================

    const memory =
        getMemory();


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


    // ===========================
    // NAME
    // ===========================

    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
        lower.includes("who am i")
    ) {

        if (memory.name) {

            return `Your name is ${memory.name}.`;

        }

        return "You have not told me your name yet.";
    }


    // ===========================
    // FAVOURITE COLOUR
    // ===========================

    if (
        lower.includes("what is my favourite colour") ||
        lower.includes("what's my favourite colour") ||
        lower.includes("what is my favorite color") ||
        lower.includes("what's my favorite color")
    ) {

        if (memory.favouriteColour) {

            return `Your favourite colour is ${memory.favouriteColour}.`;

        }

        return "You have not told me your favourite colour yet.";
    }


    // ===========================
    // CLEAR MEMORY
    // ===========================

    if (
        lower === "clear memory" ||
        lower === "forget everything" ||
        lower === "delete memory"
    ) {

        clearMemory();

        return null;
    }


    // ===========================
    // BATTERY
    // ===========================

    if (
        lower.includes("battery") ||
        lower.includes("battery percentage")
    ) {

        return await batteryInfo();
    }


    // ===========================
    // NETWORK
    // ===========================

    if (
        lower === "network" ||
        lower.includes("internet status") ||
        lower.includes("network status") ||
        lower.includes("am i online")
    ) {

        return networkInfo();
    }


    // ===========================
    // WEATHER
    // ===========================

    if (
        lower.includes("weather") ||
        lower.includes("temperature")
    ) {

        return await weatherInfo();
    }


    // ===========================
    // TIMER
    // ===========================

    const timerMatch =
        lower.match(
            /(?:set|start)\s+(?:a\s+)?timer\s+(?:for\s+)?(\d+)\s*(seconds?|secs?|minutes?|mins?)/i
        );


    if (timerMatch) {

        let value =
            Number(timerMatch[1]);

        const unit =
            timerMatch[2].toLowerCase();


        if (unit.startsWith("minute") ||
            unit.startsWith("min")) {

            value *= 60;
        }


        return startTimer(value);
    }


    if (
        lower === "stop timer" ||
        lower === "cancel timer"
    ) {

        return stopTimer();
    }


    // ===========================
    // YOUTUBE
    // ===========================

    if (
        lower.startsWith("youtube ")
    ) {

        const query =
            text.substring(8).trim();

        if (query) {

            return youtubeSearch(query);

        }
    }


    if (
        lower.startsWith("search youtube for ")
    ) {

        const query =
            text
                .replace(
                    /search youtube for /i,
                    ""
                )
                .trim();


        if (query) {

            return youtubeSearch(query);

        }
    }


    // ===========================
    // OPEN LAST
    // ===========================

    if (
        lower === "open last" ||
        lower === "open previous"
    ) {

        return openLastAction();
    }


    // ===========================
    // CALCULATOR
    // ===========================

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


    // ===========================
    // GREETINGS
    // ===========================

    if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey"
    ) {

        return "Hello Boss. D.I.S.C.O. is ready.";
    }


    if (
        lower.includes("how are you")
    ) {

        return "All systems are operating normally, Boss.";
    }


    // ===========================
    // FEATURES
    // ===========================

    if (
        lower.includes("what can you do") ||
        lower === "features"
    ) {

        return `
I can tell you the time and date, remember information, check battery and network status, get weather information, set timers, search YouTube, calculate expressions, understand your voice, analyse images, and answer questions using Gemini.
        `.trim();
    }


    // ===========================
    // GEMINI
    // ===========================

    return await askGemini(text);
}


// ===============================
// GEMINI
// ===============================

async function askGemini(text) {

    const apiKey =
        getAPIKey();


    if (!apiKey) {

        return "Gemini API key is not set. Press the API KEY button and add your key.";
    }


    setState(
        "reasoning",
        "REASONING",
        "D.I.S.C.O. THINKING"
    );


    const memory =
        getMemory();


    const systemPrompt = `
You are D.I.S.C.O., a helpful personal AI assistant.

Call the user Boss.

Answer clearly and simply.

Use Indian English.

Do not invent personal memories.

Saved memory:
Name: ${memory.name || "Not saved"}
Favourite colour: ${memory.favouriteColour || "Not saved"}
`;


    const body = {

        contents: [

            {
                role: "user",

                parts: [

                    {
                        text:
                            `${systemPrompt}

User question:
${text}`
                    }

                ]
            }

        ]

    };


    let lastError = null;


    for (
        let attempt = 0;
        attempt < 3;
        attempt++
    ) {

        try {

            const response =
                await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                lastError =
                    data?.error?.message ||
                    `API error ${response.status}`;


                if (
                    response.status === 429 ||
                    response.status === 503
                ) {

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                1500 *
                                (attempt + 1)
                            )
                    );

                    continue;
                }


                break;
            }
           const answer =
                data?.candidates?.[0]?.content?.parts
                    ?.map(part => part.text || "")
                    .join("")
                    .trim();


            if (answer) {

                return answer;
            }


            return "I received an empty response from Gemini.";


        } catch (error) {

            lastError =
                error.message;


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        1000 *
                        (attempt + 1)
                    )
            );
        }

    }


    return `Gemini could not respond right now. ${lastError || ""}`;
}


// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage() {

    const text =
        msg.value.trim();


    if (!text) return;


    msg.value = "";


    addMessage(
        text,
        "user"
    );


    setState(
        "reasoning",
        "REASONING",
        "PROCESSING REQUEST"
    );


    try {

        const response =
            await processCommand(text);


        if (response) {

            addMessage(
                response,
                "ai"
            );

            speak(response);

        }

    } catch (error) {

        const errorMessage =
            "Something went wrong while processing your request.";

        addMessage(
            errorMessage,
            "ai"
        );

        speak(errorMessage);

        console.error(error);

    } finally {

        if (
            !window.speechSynthesis?.speaking
        ) {

            setState(
                "",
                "READY",
                "SYSTEM READY"
            );
        }

    }
}


// ===============================
// ENTER KEY
// ===============================

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


// ===============================
// SEND BUTTON
// ===============================

if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );
}


// ===============================
// API KEY BUTTON
// ===============================

if (keyBtn) {

    keyBtn.addEventListener(
        "click",
        changeAPIKey
    );
}


// ===============================
// CLEAR MEMORY BUTTON
// ===============================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        clearMemory
    );
}


// ===============================
// MICROPHONE
// ===============================

function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        if (mic) {

            mic.addEventListener(
                "click",
                () => {

                    addMessage(
                        "Voice recognition is not supported in this browser.",
                        "ai"
                    );

                }
            );

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

            setState(
                "listening",
                "LISTENING",
                "LISTENING FOR COMMAND"
            );

        };


    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0].transcript;


            msg.value =
                transcript;


            sendMessage();

        };


    recognition.onerror =
        event => {

            console.error(
                "Speech recognition error:",
                event.error
            );


            setState(
                "",
                "READY",
                "SYSTEM READY"
            );

        };


    recognition.onend =
        () => {

            if (
                !document.body.classList.contains(
                    "reasoning"
                ) &&
                !document.body.classList.contains(
                    "speaking"
                )
            ) {

                setState(
                    "",
                    "READY",
                    "SYSTEM READY"
                );

            }

        };


    if (mic) {

        mic.addEventListener(
            "click",
            () => {

                try {

                    recognition.start();

                } catch (error) {

                    console.log(
                        "Recognition already running."
                    );

                }

            }
        );

    }
}


setupSpeechRecognition();


// ===============================
// IMAGE ANALYSIS
// ===============================

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
                    "Please add your Gemini API key first.",
                    "ai"
                );

                return;
            }


            addMessage(
                "Image selected. Analysing...",
                "ai"
            );


            setState(
                "reasoning",
                "REASONING",
                "ANALYSING IMAGE"
            );


            try {

                const base64 =
                    await fileToBase64(file);


                const body = {

                    contents: [

                        {

                            role: "user",

                            parts: [

                                {
                                    text:
                                        "Analyse this image and describe what you see clearly and simply."
                                },

                                {

                                    inline_data: {

                                        mime_type:
                                            file.type,

                                        data:
                                            base64

                                    }

                                }

                            ]

                        }

                    ]

                };


                const response =
                    await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(body)
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data?.error?.message ||
                        "Image analysis failed."
                    );

                }


                const answer =
                    data?.candidates?.[0]?.content?.parts
                        ?.map(part => part.text || "")
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


            } catch (error) {

                console.error(error);


                const message =
                    `Image analysis failed: ${error.message}`;


                addMessage(
                    message,
                    "ai"
                );


                speak(message);

            } finally {

                imgInput.value = "";

            }

        }
    );
}


// ===============================
// FILE TO BASE64
// ===============================

function fileToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    const result =
                        reader.result;

                    const base64 =
                        result.split(",")[1];

                    resolve(base64);
                };


            reader.onerror =
                reject;


            reader.readAsDataURL(file);

        }
    );
}


// ===============================
// NETWORK STATUS
// ===============================

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


updateNetworkStatus();


// ===============================
// STARTUP
// ===============================

setState(
    "",
    "READY",
    "SYSTEM READY"
);

console.log(
    "D.I.S.C.O. system loaded successfully."
);


           
