(() => {

"use strict";

const MODEL = "gemini-3.8-flash";
const API_STORAGE_KEY = "disco_gemini_key";
const MEMORY_STORAGE_KEY = "disco_memory";

const DISCO_LOCATION =
    "Gajuwaka, Visakhapatnam, Andhra Pradesh, India";

const $ = id => document.getElementById(id);

let selectedImage = null;
let recognition = null;
let voices = [];
let listening = false;


/* =========================
   TOAST
========================= */

function toast(message) {
    const box = $("toast");
    if (!box) return;

    box.textContent = message;
    box.classList.add("show");

    clearTimeout(box._timer);

    box._timer = setTimeout(() => {
        box.classList.remove("show");
    }, 2500);
}


/* =========================
   CLOCK
========================= */

function updateClock() {

    const now = new Date();

    const time = now.toLocaleTimeString("en-GB", {
        hour12: false
    });

    const date = now.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    if ($("clock")) {
        $("clock").textContent = time;
    }

    if ($("date")) {
        $("date").textContent =
            `${date} // VIZAG`;
    }
}

setInterval(updateClock, 1000);
updateClock();


/* =========================
   SYSTEM STATUS
========================= */

function getApiKey() {
    return localStorage.getItem(API_STORAGE_KEY);
}


function getMemory() {

    try {
        return JSON.parse(
            localStorage.getItem(MEMORY_STORAGE_KEY) || "[]"
        );
    } catch {
        return [];
    }
}


function saveMemory(memory) {

    localStorage.setItem(
        MEMORY_STORAGE_KEY,
        JSON.stringify(memory)
    );

    updateStatus();
}


function updateStatus() {

    const key = getApiKey();

    if ($("neuralStatus")) {
        $("neuralStatus").textContent =
            key ? "CONNECTED" : "NO KEY";
    }

    if ($("network")) {
        $("network").textContent =
            key ? "AI CONNECTED" : "API KEY REQUIRED";
    }

    if ($("memoryStatus")) {

        const memory = getMemory();

        $("memoryStatus").textContent =
            memory.length ? "ACTIVE" : "LOCAL";
    }
}


function setState(text) {

    if ($("coreState")) {
        $("coreState").textContent = text;
    }
}


/* =========================
   CHAT
========================= */

function addMessage(sender, text) {

    const chat = $("chat");

    if (!chat) return;

    const message =
        document.createElement("div");

    message.className =
        "message" +
        (sender === "user" ? " user" : "");

    const avatar =
        document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent =
        sender === "user" ? "B" : "D";

    const bubble =
        document.createElement("div");

    bubble.className = "bubble";

    const name =
        document.createElement("strong");

    name.textContent =
        sender === "user" ? "BOSS" : "DISCO";

    const paragraph =
        document.createElement("p");

    paragraph.textContent = text;

    bubble.appendChild(name);
    bubble.appendChild(paragraph);

    message.appendChild(avatar);
    message.appendChild(bubble);

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;
}


/* =========================
   MEMORY
========================= */

function remember(text) {

    const memory = getMemory();

    memory.push({
        text,
        time: new Date().toISOString()
    });

    while (memory.length > 30) {
        memory.shift();
    }

    saveMemory(memory);
}


function memoryCommand() {

    const memory = getMemory();

    if (!memory.length) {
        return "Boss, I don't have any saved memory yet.";
    }

    return (
        "Boss, my saved local memory contains:\n\n" +
        memory
            .slice(-10)
            .map((item, index) =>
                `${index + 1}. ${item.text}`
            )
            .join("\n")
    );
}


/* =========================
   VOICE SELECTION
========================= */

function loadVoices() {

    voices =
        window.speechSynthesis
            ? window.speechSynthesis.getVoices()
            : [];
}

loadVoices();

if ("speechSynthesis" in window) {
    speechSynthesis.onvoiceschanged = loadVoices;
}


function findMaleEnglishVoice() {

    const english =
        voices.filter(voice =>
            /^en(-|_)/i.test(voice.lang)
        );

    if (!english.length) {
        return null;
    }

    const preferredNames = [
        "Daniel",
        "George",
        "Arthur",
        "James",
        "Oliver",
        "Ryan",
        "Alex",
        "Thomas",
        "Google UK English Male"
    ];

    for (const name of preferredNames) {

        const found =
            english.find(voice =>
                voice.name
                    .toLowerCase()
                    .includes(name.toLowerCase())
            );

        if (found) {
            return found;
        }
    }

    const male =
        english.find(voice =>
            /male|man|boy/i.test(voice.name)
        );

    return male || english[0];
}


/* =========================
   SPEAK
========================= */

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    const voice =
        findMaleEnglishVoice();

    if (voice) {
        utterance.voice = voice;
    }

    utterance.lang = "en-GB";
    utterance.rate = 0.88;
    utterance.pitch = 0.82;
    utterance.volume = 1;

    utterance.onstart = () => {

        if ($("voiceStatus")) {
            $("voiceStatus").textContent =
                "SPEAKING";
        }
    };

    utterance.onend = () => {

        if ($("voiceStatus")) {
            $("voiceStatus").textContent =
                "READY";
        }
    };

    speechSynthesis.speak(utterance);
}
   /* =========================
   GEMINI AI
========================= */

async function askGemini(prompt, image = null) {

    const key = getApiKey();

    if (!key) {
        throw new Error(
            "No Gemini API key. Open ⚙ AI KEY and add your key."
        );
    }

    const parts = [
        {
            text:
`You are DISCO, a futuristic personal AI assistant.

Address the user as "Boss".

Use clear, simple British English.

The user's location is:
${DISCO_LOCATION}

Be useful and practical.

Do not invent information about the user's schedule.

If the user asks for a plan, use only the tasks and times the user gives you.

If information is missing, ask for it.

Current date and time:
${new Date().toLocaleString("en-GB")}

User request:
${prompt}`
        }
    ];


    if (image) {

        parts.push({
            inline_data: {
                mime_type: image.mimeType,
                data: image.data
            }
        });
    }


    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;


    const response =
        await fetch(url, {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                contents: [
                    {
                        role: "user",
                        parts
                    }
                ],

                generationConfig: {
                    thinkingConfig: {
                        thinkingLevel: "low"
                    }
                }

            })
        });


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data?.error?.message ||
            "Gemini connection failed."
        );
    }


    const answer =
        data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();


    if (!answer) {

        throw new Error(
            "Gemini returned an empty response."
        );
    }

    return answer;
}


/* =========================
   PLAN TODAY
========================= */

async function startPlanToday() {

    const existing =
        $("msg")?.value.trim();

    if (existing) {

        $("msg").value = "";

        await createTodayPlan(existing);

        return;
    }


    addMessage(
        "assistant",
        "Boss, what are the works you need to do today? Tell me everything — college, study, assignments, exercise, travel, personal work, or anything else. I will organise it into a realistic plan."
    );

    speak(
        "Boss, what are the works you need to do today?"
    );

    setState("WAITING FOR YOUR TASKS");

    if ($("msg")) {

        $("msg").placeholder =
            "Tell DISCO everything you need to do today...";

        $("msg").focus();
    }

    $("msg").dataset.planMode = "today";
}


/* =========================
   CREATE TODAY PLAN
========================= */

async function createTodayPlan(tasks) {

    addMessage("user", tasks);

    setState("BUILDING TODAY'S PLAN");

    if ($("neuralStatus")) {
        $("neuralStatus").textContent =
            "THINKING";
    }


    try {

        const answer =
            await askGemini(
`Create my plan for TODAY.

These are the works I need to do:

${tasks}

Important:
- Do not add fake tasks.
- Use the times I give you.
- If I did not give a time, choose a sensible time.
- Keep enough breaks.
- Do not overload the schedule.
- Put urgent and important work first.
- Give me a clear timeline.
- Use simple English.
- Call me Boss.

Format:

NOW
NEXT
LATER
EVENING
NIGHT
PRIORITY`
            );


        addMessage(
            "assistant",
            answer
        );

        speak(answer);

        remember(
            `Today's plan: ${tasks}`
        );

    } catch (error) {

        addMessage(
            "assistant",
            "DISCO connection error.\n\n" +
            error.message
        );

    } finally {

        setState("CORE READY");

        updateStatus();
    }
}


/* =========================
   PLAN TOMORROW
========================= */

async function planTomorrow() {

    addMessage(
        "assistant",
        "Boss, what works do you need to do tomorrow?"
    );

    speak(
        "Boss, what works do you need to do tomorrow?"
    );

    setState("WAITING FOR TOMORROW TASKS");

    if ($("msg")) {

        $("msg").placeholder =
            "Tell me your work for tomorrow...";

        $("msg").focus();

        $("msg").dataset.planMode =
            "tomorrow";
    }
}


/* =========================
   PLAN INPUT
========================= */

async function processPlanInput(text) {

    const input = $("msg");

    const mode =
        input?.dataset.planMode;


    if (mode === "today") {

        delete input.dataset.planMode;

        await createTodayPlan(text);

        return true;
    }


    if (mode === "tomorrow") {

        delete input.dataset.planMode;

        addMessage("user", text);

        setState("BUILDING TOMORROW");

        try {

            const answer =
                await askGemini(
`Create a realistic plan for TOMORROW.

My tasks are:

${text}

Use my actual tasks.

If I give a time, respect it.

If I don't give a time, choose a sensible time.

Include breaks.

Prioritise important work.

Use:

MORNING
AFTERNOON
EVENING
NIGHT
PRIORITY`
                );


            addMessage(
                "assistant",
                answer
            );

            speak(answer);

        } catch (error) {

            addMessage(
                "assistant",
                "DISCO connection error.\n\n" +
                error.message
            );

        } finally {

            setState("CORE READY");

            updateStatus();
        }

        return true;
    }


    return false;
}


/* =========================
   LOCAL COMMANDS
========================= */

function localCommand(text) {

    const lower =
        text.toLowerCase().trim();


    if (
        lower === "plan today" ||
        lower === "today's plan" ||
        lower === "plan my day"
    ) {

        return {
            type: "plan-today"
        };
    }


    if (
        lower === "plan tomorrow" ||
        lower === "tomorrow's plan"
    ) {

        return {
            type: "plan-tomorrow"
        };
    }


    if (
        lower === "show memory" ||
        lower === "memory"
    ) {

        return {
            type: "answer",
            text: memoryCommand()
        };
    }


    if (
        lower === "activate agents"
    ) {

        return {
            type: "answer",
            text:
                "Agents activated, Boss. DISCO is ready."
        };
    }


    if (
        lower === "what time is it" ||
        lower === "time"
    ) {

        return {
            type: "answer",
            text:
                `Boss, the current time is ${new Date().toLocaleTimeString("en-GB")}.`
        };
    }


    if (
        lower === "hello" ||
        lower === "hi" ||
        lower === "hey"
    ) {

        return {
            type: "answer",
            text:
                "Hello, Boss. DISCO is online and ready."
        };
    }


    return null;
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage(text) {

    text = text.trim();

    if (!text) return;


    if (
        await processPlanInput(text)
    ) {
        return;
    }


    const command =
        localCommand(text);


    if (
        command?.type === "plan-today"
    ) {

        await startPlanToday();

        return;
    }


    if (
        command?.type === "plan-tomorrow"
    ) {

        await planTomorrow();

        return;
    }


    addMessage("user", text);

    setState("PROCESSING");

    if ($("neuralStatus")) {
        $("neuralStatus").textContent =
            "THINKING";
    }


    try {

        if (command?.type === "answer") {

            addMessage(
                "assistant",
                command.text
            );

            speak(command.text);

            return;
        }


        const answer =
            await askGemini(
                text,
                selectedImage
            );


        addMessage(
            "assistant",
            answer
        );

        speak(answer);

    } catch (error) {

        addMessage(
            "assistant",
            "DISCO connection error.\n\n" +
            error.message
        );

    } finally {

        setState("CORE READY");

        updateStatus();
    }
       }
   /* =========================
   COMMAND FORM
========================= */

$("commandForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const input = $("msg");

        const text =
            input.value.trim();

        if (!text) return;

        input.value = "";

        await sendMessage(text);
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
            async () => {

                const command =
                    button.dataset.command;

                if (
                    command === "plan today"
                ) {

                    await startPlanToday();

                    return;
                }

                if (
                    command === "plan tomorrow"
                ) {

                    await planTomorrow();

                    return;
                }

                await sendMessage(command);
            }
        );
    });


/* =========================
   CLEAR CHAT
========================= */

$("clearBtn")?.addEventListener(
    "click",
    () => {

        $("chat").innerHTML = "";

        addMessage(
            "assistant",
            "Chat cleared, Boss. DISCO is ready."
        );

        setState("CORE READY");
    }
);


/* =========================
   IMAGE UPLOAD
========================= */

$("imageBtn")?.addEventListener(
    "click",
    () => {

        $("imageInput")?.click();
    }
);


$("imageInput")?.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) return;


        const reader =
            new FileReader();


        reader.onload = () => {

            const result =
                reader.result;

            const base64 =
                result.split(",")[1];


            selectedImage = {
                data: base64,
                mimeType: file.type
            };


            if ($("preview")) {
                $("preview").src = result;
            }

            if ($("imageName")) {
                $("imageName").textContent =
                    file.name;
            }

            if ($("imageBox")) {
                $("imageBox").hidden = false;
            }

            toast("Image ready.");
        };


        reader.readAsDataURL(file);
    }
);


$("removeImage")?.addEventListener(
    "click",
    () => {

        selectedImage = null;

        $("imageInput").value = "";

        $("imageBox").hidden = true;
    }
);


/* =========================
   MICROPHONE
========================= */

function setupMicrophone() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        $("micBtn")?.addEventListener(
            "click",
            () => {

                toast(
                    "Voice recognition is not supported by this browser."
                );
            }
        );

        return;
    }


    recognition =
        new SpeechRecognition();


    recognition.lang = "en-GB";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;


    recognition.onstart = () => {

        listening = true;

        $("micBtn")?.classList.add(
            "listening"
        );

        $("micBtn").textContent =
            "🔴";

        $("voiceStatus").textContent =
            "LISTENING";

        setState("LISTENING");

        toast(
            "DISCO is listening..."
        );
    };


    recognition.onresult = event => {

        const transcript =
            event.results[0][0].transcript;

        $("msg").value =
            transcript;
    };


    recognition.onerror = event => {

        console.log(
            "Speech recognition:",
            event.error
        );

        toast(
            "Microphone error: " +
            event.error
        );
    };


    recognition.onend = async () => {

        listening = false;

        $("micBtn")?.classList.remove(
            "listening"
        );

        $("micBtn").textContent =
            "🎙";

        $("voiceStatus").textContent =
            "READY";

        setState("CORE READY");


        const text =
            $("msg").value.trim();


        if (text) {

            $("msg").value = "";

            await sendMessage(text);
        }
    };


    $("micBtn")?.addEventListener(
        "click",
        () => {

            if (listening) {

                recognition.stop();

                return;
            }


            try {

                recognition.start();

            } catch (error) {

                console.log(error);
            }
        }
    );
}


setupMicrophone();


/* =========================
   SETTINGS / API KEY
========================= */

$("settingsBtn")?.addEventListener(
    "click",
    () => {

        const modal =
            $("settingsModal");

        const input =
            $("apiKey");

        if (!modal) return;

        modal.hidden = false;

        if (input) {

            input.value =
                getApiKey() || "";

            setTimeout(
                () => input.focus(),
                100
            );
        }
    }
);


$("closeSettings")?.addEventListener(
    "click",
    () => {

        $("settingsModal").hidden =
            true;
    }
);


$("saveKey")?.addEventListener(
    "click",
    () => {

        const key =
            $("apiKey").value.trim();


        if (!key) {

            toast(
                "Please enter your Gemini API key."
            );

            return;
        }


        localStorage.setItem(
            API_STORAGE_KEY,
            key
        );


        $("settingsModal").hidden =
            true;


        updateStatus();

        toast(
            "Gemini API key connected."
        );
    }
);


$("removeKey")?.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            API_STORAGE_KEY
        );

        $("apiKey").value = "";

        updateStatus();

        toast(
            "Gemini API key removed."
        );
    }
);


$("settingsModal")?.addEventListener(
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

$("msg")?.addEventListener(
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
   NETWORK
========================= */

window.addEventListener(
    "online",
    () => {

        $("network").textContent =
            "NETWORK READY";

        toast("Network online.");
    }
);


window.addEventListener(
    "offline",
    () => {

        $("network").textContent =
            "NETWORK OFFLINE";

        toast("Network offline.");
    }
);


/* =========================
   STARTUP
========================= */

updateStatus();


console.log(
    "DISCO online // Model:",
    MODEL
);


})();
