(() => {
"use strict";

/* =========================
   DISCO CORE
========================= */

const $ = id => document.getElementById(id);

const API_KEY = "disco_gemini_key";
const MEMORY_KEY = "disco_memory";

let selectedImage = null;
let recognition = null;
let timer = null;


/* =========================
   BASIC HELPERS
========================= */

function toast(message) {
    const box = $("toast");

    if (!box) return;

    box.textContent = message;
    box.classList.add("show");

    setTimeout(() => {
        box.classList.remove("show");
    }, 2500);
}


/* =========================
   CLOCK
========================= */

function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString(
        "en-GB",
        {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

    const date = now.toLocaleDateString(
        "en-GB",
        {
            weekday: "long",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

    if ($("clock")) {
        $("clock").textContent = time;
    }

    if ($("date")) {
        $("date").textContent = date.toUpperCase();
    }
}

updateClock();

setInterval(updateClock, 1000);


/* =========================
   DISCO STATUS
========================= */

function setState(state) {
    if ($("coreState")) {
        $("coreState").textContent = state;
    }

    if ($("neuralStatus")) {
        $("neuralStatus").textContent = state;
    }
}


function updateStatus() {

    const online = navigator.onLine;

    if ($("network")) {
        $("network").textContent =
            online
                ? "NETWORK ONLINE"
                : "NETWORK OFFLINE";
    }

    if ($("agentStatus")) {
        $("agentStatus").textContent =
            "STANDBY";
    }

    if ($("voiceStatus")) {
        $("voiceStatus").textContent =
            "READY";
    }

    if ($("memoryStatus")) {
        $("memoryStatus").textContent =
            "LOCAL";
    }

    if ($("neuralStatus")) {
        $("neuralStatus").textContent =
            "READY";
    }
}


/* =========================
   CHAT
========================= */

function addMessage(text, user = false) {

    const chat = $("chat");

    if (!chat) return;

    const message = document.createElement("div");

    message.className =
        user
            ? "message user-message"
            : "message";

    message.innerHTML = `
        <div class="avatar">
            ${user ? "U" : "D"}
        </div>

        <div class="bubble">
            <strong>
                ${user ? "YOU" : "DISCO"}
            </strong>

            <p></p>
        </div>
    `;

    message
        .querySelector("p")
        .textContent = text;

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;
}


/* =========================
   MEMORY
========================= */

function getMemory() {

    try {
        return JSON.parse(
            localStorage.getItem(MEMORY_KEY) || "{}"
        );
    } catch {
        return {};
    }
}


function saveMemory(memory) {

    localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(memory)
    );

    if ($("memoryStatus")) {
        $("memoryStatus").textContent = "ACTIVE";
    }
}


function memoryCommand(text) {

    const lower = text.toLowerCase();

    if (
        lower.startsWith("remember ") ||
        lower.startsWith("remember that ")
    ) {

        const memory = getMemory();

        const value = text
            .replace(/^remember that\s+/i, "")
            .replace(/^remember\s+/i, "");

        memory.note = value;

        saveMemory(memory);

        return `Memory saved, Boss.

I will keep this information in DISCO's local browser memory:

${value}`;
    }


    if (
        lower.includes("show memory") ||
        lower === "memory" ||
        lower.includes("what do you remember")
    ) {

        const memory = getMemory();

        if (!memory.note) {
            return "DISCO's memory is currently empty, Boss.";
        }

        return `DISCO MEMORY

${memory.note}`;
    }

    return null;
}


/* =========================
   CALCULATOR
========================= */

function calculate(expression) {

    try {

        const clean = expression
            .replace(/^calculate\s+/i, "")
            .trim();

        if (!clean) {
            return "Tell me what you want me to calculate, Boss.";
        }

        /*
           Only allow basic mathematical
           characters for safety.
        */

        if (!/^[0-9+\-*/().%\s]+$/.test(clean)) {
            return "I can only calculate basic mathematical expressions here.";
        }

        const result = Function(
            `"use strict"; return (${clean})`
        )();

        if (
            typeof result !== "number" ||
            !Number.isFinite(result)
        ) {
            return "I could not calculate that.";
        }

        return `RESULT

${clean} = ${result}`;

    } catch {
        return "I could not understand that calculation.";
    }
}


/* =========================
   ACTIVATE AGENTS
========================= */

function activateAgents() {

    if ($("agentStatus")) {
        $("agentStatus").textContent =
            "ACTIVE";
    }

    return `AGENTS ACTIVATED

Boss, DISCO's agent system is now active.

Available systems:

• Planning Agent
• Weather Agent
• Memory Agent
• Calculation Agent
• Voice Agent
• Vision Agent
• Gemini AI Agent`;
}


/* =========================
   TIME
========================= */

function getTime() {

    const now = new Date();

    return `CURRENT TIME

${now.toLocaleTimeString(
    "en-GB",
    {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }
)}

Location: Visakhapatnam, Vizag`;
}


/* =========================
   LOCATION
========================= */

const DISCO_LOCATION =
    "Gajuwaka, Visakhapatnam, Andhra Pradesh, India";


/* =========================
   WEATHER
========================= */

async function getWeather() {

    try {

        const geoURL =
            "https://geocoding-api.open-meteo.com/v1/search" +
            "?name=Gajuwaka&count=1&language=en&format=json";

        const geoResponse =
            await fetch(geoURL);

        const geoData =
            await geoResponse.json();

        const place =
            geoData.results?.[0];

        if (!place) {
            return "I could not locate Gajuwaka, Boss.";
        }

        const latitude =
            place.latitude;

        const longitude =
            place.longitude;

        const weatherURL =
            "https://api.open-meteo.com/v1/forecast" +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
            "&timezone=Asia%2FKolkata";

        const weatherResponse =
            await fetch(weatherURL);

        const weather =
            await weatherResponse.json();

        const current =
            weather.current;

        return `VISAKHAPATNAM WEATHER

Location:
Gajuwaka, Visakhapatnam

Temperature:
${current.temperature_2m} °C

Humidity:
${current.relative_humidity_2m}%

Wind:
${current.wind_speed_10m} km/h

DISCO weather system online.`;

    } catch (error) {

        return `Weather system could not connect.

${error.message}`;
    }
}


/* =========================
   TIMER
========================= */

function startTimer(seconds) {

    clearInterval(timer);

    let remaining = seconds;

    const show = () => {

        const minutes =
            Math.floor(remaining / 60);

        const secs =
            remaining % 60;

        const time =
            `${String(minutes).padStart(2, "0")}:` +
            `${String(secs).padStart(2, "0")}`;

        toast(`DISCO TIMER: ${time}`);

        if (remaining <= 0) {

            clearInterval(timer);

            speak(
                "Boss, your timer is complete."
            );

            toast(
                "DISCO TIMER COMPLETE"
            );

            return;
        }

        remaining--;
    };

    show();

    timer =
        setInterval(show, 1000);
}


/* =========================
   LOCAL COMMANDS
========================= */

async function localCommand(text) {

    const lower =
        text.toLowerCase().trim();


    /* MEMORY */

    const memory =
        memoryCommand(text);

    if (memory) {
        return memory;
    }


    /* AGENTS */

    if (
        lower.includes("activate agents") ||
        lower === "activate agents"
    ) {
        return activateAgents();
    }


    /* TIME */

    if (
        lower === "time" ||
        lower.includes("what time") ||
        lower.includes("current time")
    ) {
        return getTime();
    }


    /* WEATHER */

    if (
        lower === "weather" ||
        lower.includes("weather in vizag") ||
        lower.includes("weather in visakhapatnam") ||
        lower.includes("weather in gajuwaka")
    ) {
        return await getWeather();
    }


    /* CALCULATOR */

    if (
        lower.startsWith("calculate ")
    ) {
        return calculate(text);
    }


    /* TIMER */

    const timerMatch =
        lower.match(
            /timer\s+(\d+)\s*(seconds?|minutes?|mins?)?/
        );

    if (timerMatch) {

        const amount =
            Number(timerMatch[1]);

        const unit =
            timerMatch[2] || "seconds";

        const seconds =
            unit.startsWith("min")
                ? amount * 60
                : amount;

        startTimer(seconds);

        return `Timer started, Boss.

Duration:
${amount} ${unit}`;
    }


    /* HELLO */

    if (
        ["hi", "hello", "hey", "hey disco"]
            .includes(lower)
    ) {

        return `Hello, Boss.

DISCO is online and ready.`;
    }


    return null;
}
   /* =========================
   VOICE OUTPUT
========================= */

function speak(text) {

    if (!("speechSynthesis" in window)) {
        toast("Voice output is not supported.");
        return;
    }

    window.speechSynthesis.cancel();

    /*
       Remove simple formatting so the voice
       sounds more natural.
    */
    const cleanText = text
        .replace(/[*#_`•]/g, "")
        .replace(/\n+/g, ". ")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleanText) return;

    const speech =
        new SpeechSynthesisUtterance(cleanText);

    speech.lang = "en-GB";
    speech.rate = 0.92;
    speech.pitch = 1;
    speech.volume = 1;

    const voices =
        window.speechSynthesis.getVoices();

    const BritishVoice =
        voices.find(voice =>
            voice.lang === "en-GB"
        );

    if (BritishVoice) {
        speech.voice = BritishVoice;
    }

    speech.onstart = () => {

        if ($("voiceStatus")) {
            $("voiceStatus").textContent =
                "SPEAKING";
        }
    };

    speech.onend = () => {

        if ($("voiceStatus")) {
            $("voiceStatus").textContent =
                "READY";
        }
    };

    speech.onerror = () => {

        if ($("voiceStatus")) {
            $("voiceStatus").textContent =
                "READY";
        }

        toast("DISCO voice output failed.");
    };

    window.speechSynthesis.speak(speech);
}


/* =========================
   LOAD VOICES
========================= */

if ("speechSynthesis" in window) {

    window.speechSynthesis
        .addEventListener(
            "voiceschanged",
            () => {
                window.speechSynthesis
                    .getVoices();
            }
        );
}


/* =========================
   GEMINI AI
========================= */

async function askAI(text, image) {

    const key =
        localStorage.getItem(API_KEY);

    if (!key) {

        return `DISCO AI is ready, Boss.

But Gemini AI is not connected yet.

Open ⚙ Settings and add your Gemini API key.

You can still use:
• Weather
• Time
• Memory
• Calculator
• Timers
• Agent system`;
    }


    const parts = [{
        text:
`You are DISCO, a futuristic personal AI assistant.

The user is called Boss.

Use clear, simple British English.

You are helpful, practical and organised.

The user's location is:
Gajuwaka, Visakhapatnam, Andhra Pradesh, India.

IMPORTANT:
If the user asks for planning, analyse the information they provide instead of giving a generic fixed plan.

If the user gives today's activities, appointments, study tasks, travel, meals or other responsibilities:

1. Understand all the information.
2. Identify urgent tasks.
3. Arrange tasks in a sensible order.
4. Tell the user what to do NOW.
5. Tell them what to do AFTER ONE HOUR when useful.
6. Organise the afternoon/evening.
7. Include breaks.
8. Include meals when relevant.
9. Suggest a reasonable bedtime based on the user's stated requirements.
10. Do not invent college, work or other commitments that the user did not provide.
11. If important information is missing, make a reasonable assumption and clearly label it.
12. Keep the plan realistic rather than filling every minute.

For a daily plan, use this structure when appropriate:

TODAY'S DISCO PLAN

NOW
...

NEXT
...

AFTER 1 HOUR
...

LATER
...

EVENING
...

NIGHT
...

SLEEP
...

PRIORITY
...

User message:
${text || "Analyse this image."}`
    }];


    /* =========================
       IMAGE INPUT
    ========================= */

    if (image) {

        const match =
            image.match(
                /^data:(image\/[^;]+);base64,(.+)$/
            );

        if (match) {

            parts.push({
                inline_data: {
                    mime_type: match[1],
                    data: match[2]
                }
            });
        }
    }


    /* =========================
       GEMINI REQUEST
    ========================= */

    const response =
        await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: parts
                    }]
                })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.error?.message ||
            "Gemini AI request failed."
        );
    }


    const answer =
        data.candidates?.[0]
            ?.content?.parts
            ?.map(part => part.text || "")
            .join("\n")
            .trim();


    return answer ||
        "DISCO received no response from Gemini.";
}


/* =========================
   SMART TODAY PLANNER
========================= */

async function planToday() {

    const message =
        `I want to plan my day today.

Please ask me for the information you need about:
- what time it is now
- college/work/classes
- important tasks
- study subjects
- assignments
- appointments
- travel
- meals
- exercise
- anything that must be completed today
- what time I want to sleep

Then analyse my information and create a realistic schedule.

Do not give me a generic plan.
Use my actual information.

Tell me:
what I should do now,
what I should do after one hour,
what I should do later,
what I should do tonight,
and when I should sleep.`;


    return await askAI(message);
}


/* =========================
   PLAN COMMAND DETECTION
========================= */

function isPlanningRequest(text) {

    const lower =
        text.toLowerCase();

    return (
        lower.includes("plan today") ||
        lower.includes("today's plan") ||
        lower.includes("todays plan") ||
        lower.includes("plan my day") ||
        lower.includes("schedule today") ||
        lower.includes("organise my day") ||
        lower.includes("organize my day")
    );
}


/* =========================
   SEND MESSAGE CORE
========================= */

async function sendMessage(text) {

    text = text.trim();

    if (!text && !selectedImage) {
        return;
    }


    const image =
        selectedImage;


    addMessage(
        text ||
        "Analyse this image.",
        true
    );


    $("msg").value = "";

    selectedImage = null;

    $("imageBox").hidden = true;

    setState("PROCESSING");


    try {

        /*
           First check normal local commands.
        */

        const local =
            await localCommand(text);


        if (local) {

            addMessage(local);

            speak(local);

            return;
        }


        /*
           Planning requests go directly
           to the intelligent planner.
        */

        if (isPlanningRequest(text)) {

            const answer =
                await planToday();

            addMessage(answer);

            speak(answer);

            return;
        }


        /*
           Everything else goes to Gemini.
        */

        const answer =
            await askAI(text, image);


        addMessage(answer);

        speak(answer);

    } catch (error) {

        const errorMessage =
`DISCO connection error.

${error.message}

Check your Gemini API key in ⚙ Settings.`;

        addMessage(errorMessage);

        speak(
            "Boss, DISCO encountered a connection error. Please check the AI key in settings."
        );

    } finally {

        setState("CORE READY");
    }
}
   /* =========================
   FORM SUBMIT
========================= */

$("commandForm").addEventListener(
    "submit",
    event => {
        event.preventDefault();

        sendMessage(
            $("msg").value
        );
    }
);


/* =========================
   QUICK COMMANDS
========================= */

document
    .querySelectorAll("[data-command]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                sendMessage(
                    button.dataset.command
                );

            }
        );

    });


/* =========================
   CLEAR CHAT
========================= */

$("clearBtn").addEventListener(
    "click",
    () => {

        $("chat").innerHTML = "";

        addMessage(
            "Chat cleared, Boss. DISCO is ready."
        );

    }
);


/* =========================
   IMAGE BUTTON
========================= */

$("imageBtn").addEventListener(
    "click",
    () => {

        $("imageInput").click();

    }
);


/* =========================
   IMAGE SELECT
========================= */

$("imageInput").addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {

            toast(
                "Please select an image."
            );

            return;
        }


        const reader =
            new FileReader();


        reader.onload = () => {

            selectedImage =
                reader.result;


            $("preview").src =
                selectedImage;


            $("imageName").textContent =
                file.name;


            $("imageBox").hidden =
                false;


            $("msg").placeholder =
                "Ask DISCO about this image...";


            toast(
                "VISION INPUT READY"
            );
        };


        reader.readAsDataURL(file);

    }
);


/* =========================
   REMOVE IMAGE
========================= */

$("removeImage").addEventListener(
    "click",
    () => {

        selectedImage = null;

        $("imageBox").hidden = true;

        $("preview")
            .removeAttribute("src");

        $("imageInput").value = "";

        $("msg").placeholder =
            "Enter command, Boss...";

    }
);


/* =========================
   MICROPHONE
========================= */

$("micBtn").addEventListener(
    "click",
    () => {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            toast(
                "Voice input is not supported by this browser."
            );

            return;
        }


        /*
           If already listening,
           stop recording.
        */

        if (recognition) {

            recognition.stop();

            return;
        }


        recognition =
            new SpeechRecognition();


        recognition.lang =
            "en-GB";


        recognition.continuous =
            false;


        recognition.interimResults =
            false;


        recognition.maxAlternatives =
            1;


        $("voiceStatus").textContent =
            "LISTENING";


        $("micBtn").classList.add(
            "active"
        );


        toast(
            "DISCO is listening..."
        );


        recognition.onresult =
            event => {

                const spokenText =
                    event.results[0][0]
                        .transcript
                        .trim();


                $("msg").value =
                    spokenText;


                /*
                   Automatically send the
                   recognised voice command.
                */

                sendMessage(
                    spokenText
                );

            };


        recognition.onerror =
            event => {

                console.log(
                    "Speech error:",
                    event.error
                );


                toast(
                    "I could not hear that clearly."
                );

            };


        recognition.onend =
            () => {

                recognition =
                    null;


                $("voiceStatus")
                    .textContent =
                    "READY";


                $("micBtn")
                    .classList
                    .remove("active");

            };


        recognition.start();

    }
);


/* =========================
   SETTINGS
========================= */

$("settingsBtn").addEventListener(
    "click",
    () => {

        $("apiKey").value =
            localStorage.getItem(
                API_KEY
            ) || "";


        $("settingsModal").hidden =
            false;

    }
);


/* =========================
   CLOSE SETTINGS
========================= */

$("closeSettings").addEventListener(
    "click",
    () => {

        $("settingsModal").hidden =
            true;

    }
);


/* =========================
   SAVE GEMINI KEY
========================= */

$("saveKey").addEventListener(
    "click",
    () => {

        const key =
            $("apiKey")
                .value
                .trim();


        if (!key) {

            toast(
                "Please enter your Gemini API key."
            );

            return;
        }


        localStorage.setItem(
            API_KEY,
            key
        );


        $("settingsModal").hidden =
            true;


        updateStatus();


        toast(
            "GEMINI AI CONNECTION SAVED"
        );

    }
);


/* =========================
   REMOVE GEMINI KEY
========================= */

$("removeKey").addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            API_KEY
        );


        $("apiKey").value =
            "";


        updateStatus();


        toast(
            "GEMINI KEY REMOVED"
        );

    }
);


/* =========================
   CLOSE MODAL BY BACKDROP
========================= */

$("settingsModal").addEventListener(
    "click",
    event => {

        if (
            event.target ===
            $("settingsModal")
        ) {

            $("settingsModal").hidden =
                true;

        }

    }
);


/* =========================
   ENTER KEY
========================= */

$("msg").addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            $("commandForm").requestSubmit();

        }

    }
);


/* =========================
   ONLINE / OFFLINE
========================= */

window.addEventListener(
    "online",
    () => {

        updateStatus();

        toast(
            "NETWORK ONLINE"
        );

    }
);


window.addEventListener(
    "offline",
    () => {

        updateStatus();

        toast(
            "NETWORK OFFLINE"
        );

    }
);


/* =========================
   PAGE VISIBILITY
========================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden &&
            "speechSynthesis" in window
        ) {
            window.speechSynthesis.cancel();
        }

    }
);


/* =========================
   STARTUP
========================= */

updateStatus();


if ($("memoryStatus")) {

    const memory =
        getMemory();

    $("memoryStatus").textContent =
        memory.note
            ? "ACTIVE"
            : "LOCAL";
}


/* =========================
   WELCOME
========================= */

console.log(
    "DISCO Future AI Core loaded."
);

})();
