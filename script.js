(() => {

"use strict";

const $ = id => document.getElementById(id);

const API_KEY = "disco_gemini_key";
const MEMORY_KEY = "disco_memory";

let selectedImage = null;
let recognition = null;
let timer = null;


/* =========================
   CLOCK
========================= */

function updateClock() {

    const now = new Date();

    $("clock").textContent =
        now.toLocaleTimeString("en-GB");

    $("date").textContent =
        now.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).toUpperCase();
}

updateClock();

setInterval(updateClock, 1000);


/* =========================
   TOAST
========================= */

let toastTimer;

function toast(message) {

    const box = $("toast");

    box.textContent = message;
    box.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        box.classList.remove("show");
    }, 2500);
}


/* =========================
   STATUS
========================= */

function setState(text) {

    $("coreState").textContent = text;
}


function updateStatus() {

    $("network").textContent =
        navigator.onLine
            ? "NETWORK READY"
            : "OFFLINE MODE";

    $("neuralStatus").textContent =
        localStorage.getItem(API_KEY)
            ? "CONNECTED"
            : "LOCAL";

    $("memoryStatus").textContent =
        localStorage.getItem(MEMORY_KEY)
            ? "ACTIVE"
            : "LOCAL";
}

updateStatus();


/* =========================
   CHAT
========================= */

function addMessage(text, user = false) {

    const message =
        document.createElement("div");

    message.className =
        user ? "message user" : "message";

    const avatar =
        document.createElement("div");

    avatar.className = "avatar";
    avatar.textContent =
        user ? "B" : "D";

    const bubble =
        document.createElement("div");

    bubble.className = "bubble";

    const name =
        document.createElement("strong");

    name.textContent =
        user ? "BOSS" : "DISCO";

    const paragraph =
        document.createElement("p");

    paragraph.textContent = text;

    bubble.appendChild(name);
    bubble.appendChild(paragraph);

    message.appendChild(avatar);
    message.appendChild(bubble);

    $("chat").appendChild(message);

    $("chat").scrollTop =
        $("chat").scrollHeight;
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

    updateStatus();
}


function memoryCommand(text) {

    const lower =
        text.toLowerCase();

    const memory =
        getMemory();


    if (lower.startsWith("remember ")) {

        const information =
            text.substring(9).trim();

        memory.notes =
            memory.notes || [];

        memory.notes.push(
            information
        );

        saveMemory(memory);

        return `Saved to memory, Boss:
${information}`;
    }


    if (
        lower.includes("show memory") ||
        lower.includes("what do you remember")
    ) {

        if (!memory.notes?.length) {

            return "My local memory is empty, Boss.";
        }

        return "LOCAL MEMORY\n\n" +
            memory.notes
                .map((x, i) =>
                    `${i + 1}. ${x}`
                )
                .join("\n");
    }


    if (
        lower.includes("clear memory") ||
        lower.includes("forget memory")
    ) {

        localStorage.removeItem(
            MEMORY_KEY
        );

        updateStatus();

        return "Local memory cleared, Boss.";
    }

    return null;
}


/* =========================
   CALCULATOR
========================= */

function calculator(text) {

    let expression =
        text
            .replace(/^calculate/i, "")
            .replace(/^calc/i, "")
            .trim();

    if (!expression) {
        return null;
    }

    if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
        return null;
    }

    try {

        const result =
            Function(
                `"use strict"; return (${expression})`
            )();

        if (!Number.isFinite(result)) {
            return "Invalid calculation.";
        }

        return `${expression} = ${result}`;

    } catch {

        return "I could not calculate that.";
    }
}


/* =========================
   TOMORROW PLAN
========================= */

function tomorrowPlan() {

    return `TOMORROW'S DISCO PLAN

07:00 — Wake up and get ready
08:00 — Breakfast
08:30 — Main study session
10:00 — Short break
10:15 — Practise questions
12:00 — College work
13:00 — Lunch
14:00 — Rest
15:00 — Revision
16:30 — Exercise / walk
17:15 — Free time
18:30 — Study session
20:00 — Dinner
20:30 — Light revision
21:30 — Prepare for tomorrow
22:00 — Sleep

Focus on your three most important tasks, Boss.`;
}


/* =========================
   WEATHER
========================= */

async function weather(city = "Hyderabad") {

    try {

        const search =
            await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
            );

        const locations =
            await search.json();

        const location =
            locations.results?.[0];

        if (!location) {

            return "I could not find that location.";
        }

        const response =
            await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`
            );

        const data =
            await response.json();

        const current =
            data.current;

        return `WEATHER — ${location.name}

Temperature: ${current.temperature_2m}°C
Humidity: ${current.relative_humidity_2m}%
Wind: ${current.wind_speed_10m} km/h`;

    } catch {

        return "Weather service is currently unavailable.";
    }
}


/* =========================
   TIMER
========================= */

function startTimer(text) {

    const match =
        text.match(
            /(\d+)\s*(second|seconds|minute|minutes|hour|hours)/i
        );

    if (!match) {

        return "Example: set timer for 5 minutes.";
    }

    const amount =
        Number(match[1]);

    const unit =
        match[2].toLowerCase();

    let seconds = amount;

    if (unit.startsWith("minute")) {
        seconds *= 60;
    }

    if (unit.startsWith("hour")) {
        seconds *= 3600;
    }

    clearTimeout(timer);

    timer =
        setTimeout(() => {

            toast("TIMER COMPLETE");

            addMessage(
                "Timer complete, Boss."
            );

            if (navigator.vibrate) {
                navigator.vibrate([
                    200, 100, 200
                ]);
            }

        }, seconds * 1000);

    return `Timer started for ${amount} ${unit}.`;
}


/* =========================
   LOCAL COMMANDS
========================= */

async function localCommand(text) {

    const q =
        text.toLowerCase().trim();


    if (
        q === "hi" ||
        q === "hello" ||
        q === "hey"
    ) {

        return "Hello, Boss. DISCO is online.";
    }


    if (
        q.includes("activate agents") ||
        q === "activate agent"
    ) {

        $("agentStatus").textContent =
            "ACTIVE";

        return `AGENT NETWORK ACTIVATED

ORACLE — READY
CHRONOS — READY
MNEMOS — READY
VISION — READY
ATMOS — READY`;
    }


    if (
        q.includes("plan tomorrow") ||
        q.includes("plan for tomorrow")
    ) {

        return tomorrowPlan();
    }


    if (
        q.includes("what time") ||
        q === "time" ||
        q.includes("current time")
    ) {

        return `CURRENT TIME

${new Date().toLocaleTimeString("en-GB")}

${new Date().toLocaleDateString("en-GB")}`;
    }


    if (
        q === "weather" ||
        q.includes("weather in")
    ) {

        const match =
            text.match(
                /weather\s+(?:in|at|for)\s+(.+)/i
            );

        return weather(
            match
                ? match[1].trim()
                : "Hyderabad"
        );
    }


    if (
        q.startsWith("set timer") ||
        q.startsWith("start timer") ||
        q.includes("timer for")
    ) {

        return startTimer(text);
    }


    const memory =
        memoryCommand(text);

    if (memory) {
        return memory;
    }


    if (
        q.startsWith("calculate") ||
        q.startsWith("calc")
    ) {

        const result =
            calculator(text);

        if (result) {
            return result;
        }
    }


    if (/^[0-9+\-*/().%\s]+$/.test(text)) {

        const result =
            calculator(text);

        if (result) {
            return result;
        }
    }


    return null;
}
  /* =========================
   GEMINI AI
========================= */
async function askAI(text, image) {
    const key = localStorage.getItem(API_KEY);

    if (!key) {
        return `I can handle local commands, Boss.

For full AI conversation, open ⚙ and add your Gemini API key.

Try:
• activate agents
• plan tomorrow
• weather
• calculate 25*4
• remember my favourite colour is black`;
    }

    const parts = [{
        text:
            `You are DISCO, a futuristic AI assistant.

Call the user Boss.

Use simple, clear English.

User message:
${text || "Analyse this image."}`
    }];

    if (image) {
        const match = image.match(
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

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts
                }]
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error?.message || "AI request failed."
        );
    }

    return (
        data.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("\n")
            .trim()
    ) || "DISCO received no response.";
}


/* =========================
   SEND
========================= */
async function sendMessage(text) {
    text = text.trim();

    if (!text && !selectedImage) return;

    const image = selectedImage;

    addMessage(
        text || "Analyse this image.",
        true
    );

    $("msg").value = "";

    selectedImage = null;
    $("imageBox").hidden = true;

    setState("PROCESSING");

    try {
        const local = await localCommand(text);

        if (local) {
            addMessage(local);
        } else {
            const answer = await askAI(text, image);
            addMessage(answer);
        }

    } catch (error) {

        addMessage(
            `DISCO connection error.

${error.message}

Check your AI key in ⚙ settings.`
        );

    } finally {
        setState("CORE READY");
    }
}


/* =========================
   FORM
========================= */
$("commandForm").addEventListener(
    "submit",
    event => {
        event.preventDefault();
        sendMessage($("msg").value);
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
   IMAGE
========================= */
$("imageBtn").addEventListener(
    "click",
    () => {
        $("imageInput").click();
    }
);


$("imageInput").addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast("Please select an image.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            selectedImage = reader.result;

            $("preview").src =
                selectedImage;

            $("imageName").textContent =
                file.name;

            $("imageBox").hidden = false;

            $("msg").placeholder =
                "Ask DISCO about this image...";
        };

        reader.readAsDataURL(file);
    }
);


$("removeImage").addEventListener(
    "click",
    () => {

        selectedImage = null;

        $("imageBox").hidden = true;

        $("preview")
            .removeAttribute("src");

        $("msg").placeholder =
            "Enter command, Boss...";
    }
);


/* =========================
   VOICE
========================= */
$("micBtn").addEventListener(
    "click",
    () => {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast(
                "Voice input is not supported here."
            );
            return;
        }

        if (recognition) {
            recognition.stop();
            return;
        }

        recognition =
            new SpeechRecognition();

        recognition.lang = "en-GB";
        recognition.interimResults = false;

        $("voiceStatus").textContent =
            "LISTENING";

        recognition.onresult =
            event => {

                $("msg").value =
                    event.results[0][0]
                        .transcript;
            };

        recognition.onerror =
            () => {

                toast(
                    "Voice input error."
                );
            };

        recognition.onend =
            () => {

                recognition = null;

                $("voiceStatus").textContent =
                    "READY";
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
            localStorage.getItem(API_KEY) || "";

        $("settingsModal").hidden = false;
    }
);


$("closeSettings").addEventListener(
    "click",
    () => {

        $("settingsModal").hidden = true;
    }
);


$("saveKey").addEventListener(
    "click",
    () => {

        const key =
            $("apiKey").value.trim();

        if (!key) {
            toast("Enter an API key.");
            return;
        }

        localStorage.setItem(
            API_KEY,
            key
        );

        $("settingsModal").hidden = true;

        updateStatus();

        toast(
            "AI CONNECTION SAVED"
        );
    }
);


$("removeKey").addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            API_KEY
        );

        $("apiKey").value = "";

        updateStatus();

        toast(
            "AI KEY REMOVED"
        );
    }
);


/* =========================
   ONLINE STATUS
========================= */
window.addEventListener(
    "online",
    updateStatus
);

window.addEventListener(
    "offline",
    updateStatus
);


/* =========================
   STARTUP
========================= */
updateStatus();

console.log(
    "DISCO Future AI Core loaded."
);

})();
