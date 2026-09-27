// ======================================================
// D.I.S.C.O. MOBILE AI CORE
// FULL COMMANDING VERSION
// ======================================================

const MODEL = "gemini-3.8-flash";

const API_KEY_STORAGE = "disco_api_key";
const MEMORY_STORAGE = "disco_memory";

let memory = JSON.parse(
    localStorage.getItem(MEMORY_STORAGE) || "{}"
);

let selectedImage = null;

let timerTimeout = null;
let alarmTimeout = null;
let reminderTimeout = null;


// ======================================================
// ELEMENTS
// ======================================================

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clearBtn");
const keyBtn = document.getElementById("keyBtn");
const imgInput = document.getElementById("imgInput");

const stateText = document.getElementById("stateText");
const networkStatus = document.getElementById("networkStatus");
const voiceStatus = document.getElementById("voiceStatus");
const memoryStatus = document.getElementById("memoryStatus");


// ======================================================
// STATE
// ======================================================

function setState(state) {

    document.body.classList.remove(
        "listening",
        "reasoning",
        "speaking"
    );

    if (state === "listening") {

        document.body.classList.add("listening");

        if (stateText) {
            stateText.textContent = "● LISTENING";
        }
    }

    else if (state === "reasoning") {

        document.body.classList.add("reasoning");

        if (stateText) {
            stateText.textContent = "◈ REASONING";
        }
    }

    else if (state === "speaking") {

        document.body.classList.add("speaking");

        if (stateText) {
            stateText.textContent = "✦ SPEAKING";
        }
    }

    else {

        if (stateText) {
            stateText.textContent = "◈ READY";
        }
    }
}


// ======================================================
// CHAT
// ======================================================

function addMessage(sender, text) {

    const div = document.createElement("div");

    if (sender === "D.I.S.C.O.") {

        div.className = "message ai-message";

    } else {

        div.className = "message user-message";
    }

    div.innerHTML = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


// ======================================================
// MEMORY SAVE
// ======================================================

function saveMemory() {

    localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memory)
    );

    if (memoryStatus) {
        memoryStatus.textContent = "ONLINE";
    }
}


// ======================================================
// MEMORY CLEAR
// ======================================================

function clearMemory() {

    memory = {};

    localStorage.removeItem(
        MEMORY_STORAGE
    );

    if (memoryStatus) {
        memoryStatus.textContent = "CLEARED";
    }

    addMessage(
        "D.I.S.C.O.",
        "Memory cleared successfully, Boss."
    );

    speak(
        "Memory cleared successfully, Boss."
    );
}


// ======================================================
// REMEMBER INFORMATION
// ======================================================

function rememberInformation(text) {

    let changed = false;

    // NAME
    const nameMatch = text.match(
        /(?:my name is|name is)\s+(.+)/i
    );

    if (nameMatch) {

        let name = nameMatch[1]
            .replace(
                /\s+(and|my favourite|my favorite).*$/i,
                ""
            )
            .trim();

        if (name) {

            memory.name = name;

            changed = true;
        }
    }


    // FAVOURITE COLOUR
    const colourMatch = text.match(
        /(?:my favourite colour is|my favorite color is|my favourite color is|my favorite colour is)\s+([a-zA-Z]+)/i
    );

    if (colourMatch) {

        memory.favouriteColour =
            colourMatch[1].trim();

        changed = true;
    }


    if (changed) {

        saveMemory();

        addMessage(
            "D.I.S.C.O.",
            "Got it, Boss. I have saved that in memory."
        );

        speak(
            "Got it Boss. I have saved that in memory."
        );

        return true;
    }

    return false;
}


// ======================================================
// MEMORY QUESTIONS
// ======================================================

function answerMemoryQuestion(text) {

    const lower = text.toLowerCase();


    // NAME
    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name")
    ) {

        if (memory.name) {

            const answer =
                `Your name is <b>${memory.name}</b>, Boss.`;

            addMessage(
                "D.I.S.C.O.",
                answer
            );

            speak(
                `Your name is ${memory.name}, Boss.`
            );

        } else {

            addMessage(
                "D.I.S.C.O.",
                "Boss, I don't have your name saved yet."
            );
        }

        return true;
    }


    // COLOUR
    if (
        lower.includes("favourite colour") ||
        lower.includes("favorite color") ||
        lower.includes("favourite color") ||
        lower.includes("favorite colour")
    ) {

        if (memory.favouriteColour) {

            const answer =
                `Your favourite colour is <b>${memory.favouriteColour}</b>, Boss.`;

            addMessage(
                "D.I.S.C.O.",
                answer
            );

            speak(
                `Your favourite colour is ${memory.favouriteColour}, Boss.`
            );

        } else {

            addMessage(
                "D.I.S.C.O.",
                "Boss, I don't have your favourite colour saved yet."
            );
        }

        return true;
    }

    return false;
}


// ======================================================
// TIME
// ======================================================

function tellTime() {

    const now = new Date();

    const time =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    addMessage(
        "D.I.S.C.O.",
        `The current time is <b>${time}</b>, Boss.`
    );

    speak(
        `The current time is ${time}, Boss.`
    );
}


// ======================================================
// DATE
// ======================================================

function tellDate() {

    const now = new Date();

    const date =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    addMessage(
        "D.I.S.C.O.",
        `Today is <b>${date}</b>, Boss.`
    );

    speak(
        `Today is ${date}, Boss.`
    );
}


// ======================================================
// LOCATION
// ======================================================

function getMyLocation() {

    if (!navigator.geolocation) {

        addMessage(
            "D.I.S.C.O.",
            "Boss, your browser does not support location access."
        );

        return;
    }

    if (!navigator.onLine) {

        addMessage(
            "D.I.S.C.O.",
            "Boss, the browser is offline. Please reconnect to the internet and reload the page."
        );

        return;
    }

    setState("reasoning");

    addMessage(
        "D.I.S.C.O.",
        "Checking your location, Boss..."
    );

    navigator.geolocation.getCurrentPosition(

        async function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            try {

                const response =
                    await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
                    );

                if (!response.ok) {
                    throw new Error(
                        "Reverse location lookup failed"
                    );
                }

                const data =
                    await response.json();

                const address =
                    data.address || {};

                const city =
                    address.city ||
                    address.town ||
                    address.village ||
                    address.municipality ||
                    address.county ||
                    "Unknown location";

                const state =
                    address.state || "";

                const country =
                    address.country || "";

                const result =
                    `Boss, you are currently in <b>${city}</b>${state ? `, ${state}` : ""}${country ? `, ${country}` : ""}.`;

                addMessage(
                    "D.I.S.C.O.",
                    result
                );

                speak(
                    `Boss, you are currently in ${city}${state ? `, ${state}` : ""}.`
                );

            }

            catch (error) {

                addMessage(
                    "D.I.S.C.O.",
                    `Boss, I found your coordinates.<br><br>
                    Latitude: ${latitude.toFixed(5)}<br>
                    Longitude: ${longitude.toFixed(5)}`
                );
            }

            setState("idle");
        },

        function(error) {

            setState("idle");

            if (error.code === 1) {

                addMessage(
                    "D.I.S.C.O.",
                    "Boss, location permission was denied. Allow Location permission for this website and try again."
                );
            }

            else if (error.code === 2) {

                addMessage(
                    "D.I.S.C.O.",
                    "Boss, your location is currently unavailable."
                );
            }

            else if (error.code === 3) {

                addMessage(
                    "D.I.S.C.O.",
                    "Boss, location detection timed out. Please try again."
                );
            }

            else {

                addMessage(
                    "D.I.S.C.O.",
                    "Boss, I couldn't access your location."
                );
            }
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}


// ======================================================
// YOUTUBE
// ======================================================

function openYouTube() {

    window.open(
        "https://www.youtube.com",
        "_blank"
    );

    addMessage(
        "D.I.S.C.O.",
        "Opening YouTube, Boss."
    );

    speak(
        "Opening YouTube, Boss."
    );
}


// ======================================================
// BATTERY
// ======================================================

async function getBattery() {

    if (!navigator.getBattery) {

        addMessage(
            "D.I.S.C.O.",
            "Battery information is not available in this browser."
        );

        return;
    }

    try {

        const battery =
            await navigator.getBattery();

        const level =
            Math.round(
                battery.level * 100
            );

        addMessage(
            "D.I.S.C.O.",
            `Boss, your battery is at <b>${level}%</b>.`
        );

        speak(
            `Boss, your battery is at ${level} percent.`
        );

    }

    catch {

        addMessage(
            "D.I.S.C.O.",
            "Boss, I couldn't read the battery status."
        );
    }
}


// ======================================================
// NETWORK
// ======================================================

function checkNetwork() {

    const status =
        navigator.onLine
            ? "ONLINE"
            : "OFFLINE";

    if (networkStatus) {
        networkStatus.textContent = status;
    }

    addMessage(
        "D.I.S.C.O.",
        `Network status: <b>${status}</b>.`
    );
}


// ======================================================
// CALCULATOR
// ======================================================

function calculator(text) {

    let expression =
        text
            .replace(/calculate/gi, "")
            .replace(/what is/gi, "")
            .replace(/plus/gi, "+")
            .replace(/minus/gi, "-")
            .replace(/times/gi, "*")
            .replace(/multiplied by/gi, "*")
            .replace(/divided by/gi, "/")
            .trim();

    if (
        !/^[0-9+\-*/().%\s]+$/.test(
            expression
        )
    ) {
        return false;
    }

    try {

        const result =
            Function(
                `"use strict"; return (${expression})`
            )();

        addMessage(
            "D.I.S.C.O.",
            `The answer is <b>${result}</b>, Boss.`
        );

        speak(
            `The answer is ${result}, Boss.`
        );

        return true;

    }

    catch {

        return false;
    }
}


// ======================================================
// TIMER
// ======================================================

function startTimer(seconds) {

    if (timerTimeout) {

        clearTimeout(
            timerTimeout
        );
    }

    if (!seconds || seconds <= 0) {

        addMessage(
            "D.I.S.C.O.",
            "Boss, please give me a valid timer duration."
        );

        return;
    }

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;

    let durationText = "";

    if (minutes > 0) {

        durationText +=
            `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    if (remainingSeconds > 0) {

        if (durationText) {
            durationText += " ";
        }

        durationText +=
            `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`;
    }

    addMessage(
        "D.I.S.C.O.",
        `Timer started for <b>${durationText}</b>, Boss.`
    );

    speak(
        `Timer started for ${durationText}, Boss.`
    );

    timerTimeout =
        setTimeout(
            function() {

                addMessage(
                    "D.I.S.C.O.",
                    "⏱️ <b>Timer finished, Boss.</b>"
                );

                speak(
                    "Boss, your timer is finished."
                );

                alert(
                    "D.I.S.C.O. TIMER FINISHED"
                );

            },
            seconds * 1000
        );
}


// ======================================================
// PARSE TIMER
// ======================================================

function parseTimer(text) {

    const lower =
        text.toLowerCase();

    let seconds = 0;

    const hourMatch =
        lower.match(
            /(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs)/
        );

    const minuteMatch =
        lower.match(
            /(\d+(?:\.\d+)?)\s*(minute|minutes|min|mins)/
        );

    const secondMatch =
        lower.match(
            /(\d+(?:\.\d+)?)\s*(second|seconds|sec|secs)/
        );

    if (hourMatch) {

        seconds +=
            Number(hourMatch[1]) * 3600;
    }

    if (minuteMatch) {

        seconds +=
            Number(minuteMatch[1]) * 60;
    }

    if (secondMatch) {

        seconds +=
            Number(secondMatch[1]);
    }

    return seconds;
}


// ======================================================
// ALARM
// ======================================================

function setAlarm(timeString) {

    const parts =
        timeString.split(":");

    if (parts.length < 2) {

        addMessage(
            "D.I.S.C.O.",
            "Boss, use a time such as 7:30 PM."
        );

        return;
    }

    let hours =
        parseInt(parts[0], 10);

    let minutes =
        parseInt(parts[1], 10);

    const ampm =
        parts[2]
            ? parts[2].trim().toUpperCase()
            : "";

    if (ampm === "PM" && hours < 12) {
        hours += 12;
    }

    if (ampm === "AM" && hours === 12) {
        hours = 0;
    }

    const now =
        new Date();

    const alarm =
        new Date();

    alarm.setHours(
        hours,
        minutes,
        0,
        0
    );

    if (
        alarm.getTime() <=
        now.getTime()
    ) {

        alarm.setDate(
            alarm.getDate() + 1
        );
    }

    const delay =
        alarm.getTime() -
        now.getTime();

    if (alarmTimeout) {

        clearTimeout(
            alarmTimeout
        );
    }

    addMessage(
        "D.I.S.C.O.",
        `⏰ Alarm set for <b>${alarm.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit"
        })}</b>, Boss.`
    );

    speak(
        "Alarm set successfully, Boss."
    );

    alarmTimeout =
        setTimeout(
            function() {

                addMessage(
                    "D.I.S.C.O.",
                    "⏰ <b>ALARM! Boss, your alarm is ringing.</b>"
                );

                speak(
                    "Boss, your alarm is ringing."
                );

                alert(
                    "D.I.S.C.O. ALARM"
                );

            },
            delay
        );
}


// ======================================================
// REMINDER
// ======================================================

function setReminder(seconds, reminderText) {

    if (!seconds || seconds <= 0) {

        addMessage(
            "D.I.S.C.O.",
            "Boss, please give me a valid reminder time."
        );

        return;
    }

    if (reminderTimeout) {

        clearTimeout(
            reminderTimeout
        );
    }

    addMessage(
        "D.I.S.C.O.",
        `🔔 Reminder set, Boss: <b>${reminderText}</b>`
    );

    speak(
        "Reminder set successfully, Boss."
    );

    reminderTimeout =
        setTimeout(
            function() {

                addMessage(
                    "D.I.S.C.O.",
                    `🔔 <b>Reminder:</b> ${reminderText}`
                );

                speak(
                    `Boss, reminder. ${reminderText}`
                );

                alert(
                    `D.I.S.C.O. REMINDER\n\n${reminderText}`
                );

            },
            seconds * 1000
        );
}


// ======================================================
// VOICE OUTPUT
// ======================================================

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    window.speechSynthesis.cancel();

    const cleanText =
        text.replace(
            /<[^>]*>/g,
            ""
        );

    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );

    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 0.8;
    utterance.volume = 1;

    const voices =
        window.speechSynthesis.getVoices();

    const preferred =
        voices.find(
            voice =>
                /en-IN/i.test(voice.lang) &&
                /male|ravi|raj|david|daniel|alex|mark|james|george/i.test(
                    voice.name
                )
        )
        ||
        voices.find(
            voice =>
                /en-IN/i.test(voice.lang)
        )
        ||
        voices.find(
            voice =>
                /en/i.test(voice.lang)
        );

    if (preferred) {

        utterance.voice =
            preferred;
    }

        utterance.onstart =
        function() {

            setState("speaking");

            if (voiceStatus) {
                voiceStatus.textContent =
                    "SPEAKING";
            }
        };

    utterance.onend =
        function() {

            setState("idle");

            if (voiceStatus) {
                voiceStatus.textContent =
                    "READY";
            }
        };

    utterance.onerror =
        function() {

            setState("idle");

            if (voiceStatus) {
                voiceStatus.textContent =
                    "READY";
            }
        };

    window.speechSynthesis.speak(
        utterance
    );
}


// ======================================================
// API KEY
// ======================================================

function getApiKey() {

    let key =
        localStorage.getItem(
            API_KEY_STORAGE
        );

    if (!key) {

        key =
            prompt(
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

    const key =
        prompt(
            "Enter your new Gemini API key:"
        );

    if (!key) {
        return;
    }

    localStorage.setItem(
        API_KEY_STORAGE,
        key.trim()
    );

    addMessage(
        "D.I.S.C.O.",
        "API key updated successfully, Boss."
    );

    speak(
        "API key updated successfully, Boss."
    );
}


// ======================================================
// OFFLINE / ONLINE
// ======================================================

window.addEventListener(
    "online",
    function() {

        if (networkStatus) {
            networkStatus.textContent =
                "ONLINE";
        }
    }
);


window.addEventListener(
    "offline",
    function() {

        if (networkStatus) {
            networkStatus.textContent =
                "OFFLINE";
        }
    }
);


// ======================================================
// GEMINI
// ======================================================

async function askGemini(question) {

    const apiKey =
        getApiKey();

    if (!apiKey) {

        addMessage(
            "D.I.S.C.O.",
            "Boss, I need a Gemini API key to answer that."
        );

        return;
    }

    setState("reasoning");

    try {

        const memoryText =
            JSON.stringify(memory);

        const systemInstruction =
            `
You are D.I.S.C.O., a personal AI assistant.

Call the user Boss.

Use simple, clear English.

Use Indian English.

Be helpful and concise.

Saved memory:
${memoryText}
`;

        const body = {

            system_instruction: {

                parts: [
                    {
                        text: systemInstruction
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

                maxOutputTokens: 700
            }
        };


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
                        JSON.stringify(body)
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.error?.message ||
                "Gemini request failed"
            );
        }


        const answer =
            data?.candidates?.[0]
                ?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();


        if (!answer) {

            throw new Error(
                "No response received from Gemini."
            );
        }


        addMessage(
            "D.I.S.C.O.",
            answer
        );


        speak(
            answer
        );

    }

    catch (error) {

        setState("idle");

        addMessage(
            "D.I.S.C.O.",
            `Boss, I couldn't connect to Gemini.<br><br><small>${error.message}</small>`
        );
    }
}


// ======================================================
// DIRECT COMMANDS
// ======================================================

async function processCommand(text) {

    const lower =
        text.toLowerCase().trim();


    // MEMORY SAVE
    if (
        rememberInformation(text)
    ) {
        return;
    }


    // MEMORY QUESTIONS
    if (
        answerMemoryQuestion(text)
    ) {
        return;
    }


    // CLEAR MEMORY
    if (
        lower.includes("clear memory") ||
        lower.includes("forget everything") ||
        lower.includes("forget all memory")
    ) {

        clearMemory();

        return;
    }


    // TIME
    if (
        lower === "time" ||
        lower.includes("what time is it") ||
        lower.includes("current time") ||
        lower.includes("tell me the time")
    ) {

        tellTime();

        return;
    }


    // DATE
    if (
        lower === "date" ||
        lower.includes("what is today's date") ||
        lower.includes("what's today's date") ||
        lower.includes("today's date") ||
        lower.includes("what day is it")
    ) {

        tellDate();

        return;
    }


    // LOCATION
    if (
        lower.includes("where am i") ||
        lower.includes("my location") ||
        lower.includes("where are we") ||
        lower.includes("locate me")
    ) {

        getMyLocation();

        return;
    }


    // YOUTUBE
    if (
        lower === "youtube" ||
        lower.includes("open youtube") ||
        lower.includes("launch youtube")
    ) {

        openYouTube();

        return;
    }


    // BATTERY
    if (
        lower.includes("battery") ||
        lower.includes("battery percentage") ||
        lower.includes("battery level")
    ) {

        await getBattery();

        return;
    }


    // NETWORK
    if (
        lower.includes("network status") ||
        lower.includes("internet status") ||
        lower === "network"
    ) {

        checkNetwork();

        return;
    }


    // TIMER
    if (
        lower.includes("set a timer") ||
        lower.includes("set timer") ||
        lower.includes("start a timer") ||
        lower.includes("start timer")
    ) {

        const seconds =
            parseTimer(lower);

        if (seconds > 0) {

            startTimer(seconds);

        } else {

            addMessage(
                "D.I.S.C.O.",
                "Boss, tell me the timer duration. For example: set a timer for 5 minutes."
            );
        }

        return;
    }


    // ALARM
    if (
        lower.includes("set an alarm") ||
        lower.includes("set alarm") ||
        lower.includes("alarm for")
    ) {

        const match =
            lower.match(
                /(?:set an alarm|set alarm|alarm for)\s*(?:at\s*)?(\d{1,2}:\d{2}(?:\s*(?:am|pm))?)/i
            );

        if (match) {

            setAlarm(
                match[1]
            );

        } else {

            addMessage(
                "D.I.S.C.O.",
                "Boss, tell me the alarm time. For example: set an alarm for 7:30 PM."
            );
        }

        return;
    }


    // REMINDER
    if (
        lower.includes("remind me")
    ) {

        const timerSeconds =
            parseTimer(lower);

        const match =
            lower.match(
                /remind me\s+(?:in\s+)?(?:\d+(?:\.\d+)?\s*(?:hour|hours|hr|hrs|minute|minutes|min|mins|second|seconds|sec|secs))\s+(?:to\s+)?(.+)/i
            );

        if (
            timerSeconds > 0 &&
            match
        ) {

            setReminder(
                timerSeconds,
                match[1].trim()
            );

        } else {

            addMessage(
                "D.I.S.C.O.",
                "Boss, try: remind me in 10 minutes to study."
            );
        }

        return;
    }


    // CALCULATOR
    if (
        lower.startsWith("calculate ") ||
        lower.startsWith("what is ")
    ) {

        if (
            calculator(text)
        ) {
            return;
        }
    }


    // GREETINGS
    if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey" ||
        lower.includes("good morning") ||
        lower.includes("good afternoon") ||
        lower.includes("good evening")
    ) {

        addMessage(
            "D.I.S.C.O.",
            "Hello Boss. D.I.S.C.O. is ready."
        );

        speak(
            "Hello Boss. D.I.S.C.O. is ready."
        );

        return;
    }


    // ABOUT D.I.S.C.O.
    if (
        lower.includes("who are you") ||
        lower.includes("what are you") ||
        lower.includes("tell me about yourself") ||
        lower.includes("tell me about your self")
    ) {

        addMessage(
            "D.I.S.C.O.",
            "I am D.I.S.C.O., your personal AI assistant, Boss. I can handle commands, memory, voice, location, timers, alarms, reminders, calculations and AI conversations."
        );

        speak(
            "I am D.I.S.C.O., your personal AI assistant, Boss."
        );

        return;
    }


    // HELP
    if (
        lower === "help" ||
        lower.includes("what can you do") ||
        lower.includes("your commands")
    ) {

        addMessage(
            "D.I.S.C.O.",
            `
            <b>Available commands:</b><br><br>
            • What is my name?<br>
            • What is my favourite colour?<br>
            • Remember that my name is...<br>
            • What time is it?<br>
            • What is today's date?<br>
            • Where am I?<br>
            • Open YouTube<br>
            • Battery status<br>
            • Network status<br>
            • Set a timer for 5 minutes<br>
            • Set an alarm for 7:30 PM<br>
            • Remind me in 10 minutes to study<br>
            • Calculate 25 + 50<br>
            • Clear memory<br>
            • Change API key
            `
        );

        return;
    }


    // NORMAL AI QUESTION
    await askGemini(text);
}


// ======================================================
// SEND
// ======================================================

async function sendMessage() {

    const text =
        msg.value.trim();

    if (!text) {
        return;
    }

    addMessage(
        "USER",
        text
    );

    msg.value = "";

    await processCommand(
        text
    );
}


if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );
}


if (msg) {

    msg.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

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
        changeApiKey
    );
}


// ======================================================
// IMAGE / VISION
// ======================================================

if (imgInput) {

    imgInput.addEventListener(
        "change",
        function(event) {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }

            selectedImage =
                file;

            addMessage(
                "USER",
                `📷 Image selected: <b>${file.name}</b>`
            );

            addMessage(
                "D.I.S.C.O.",
                "Vision image received, Boss."
            );
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

    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    recognition.onstart =
        function() {

            setState(
                "listening"
            );

            if (voiceStatus) {
                voiceStatus.textContent =
                    "LISTENING";
            }
        };


    recognition.onresult =
        function(event) {

            const text =
                event.results[0][0].transcript;

            msg.value =
                text;

            sendMessage();
        };


    recognition.onerror =
        function() {

            setState(
                "idle"
            );

            if (voiceStatus) {
                voiceStatus.textContent =
                    "READY";
            }
        };


    recognition.onend =
        function() {

            setState(
                "idle"
            );

            if (voiceStatus) {
                voiceStatus.textContent =
                    "READY";
            }
        };


    if (mic) {

        mic.addEventListener(
            "click",
            function() {

                try {

                    recognition.start();

                }

                catch {

                    // Prevent duplicate recognition start errors
                }
            }
        );
    }

}


// ======================================================
// SPEECH VOICE LOADING
// ======================================================

if (
    "speechSynthesis" in window
) {

    window.speechSynthesis.onvoiceschanged =
        function() {
            window.speechSynthesis.getVoices();
        };
}


// ======================================================
// STARTUP
// ======================================================

if (networkStatus) {

    networkStatus.textContent =
        navigator.onLine
            ? "ONLINE"
            : "OFFLINE";
}

if (memoryStatus) {

    memoryStatus.textContent =
        Object.keys(memory).length
            ? "ONLINE"
            : "ONLINE";
}

if (voiceStatus) {

    voiceStatus.textContent =
        "READY";
}

setState("idle");
