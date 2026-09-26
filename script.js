/* =====================================================
   D.I.S.C.O
   3D CORE + MEMORY + VOICE + GEMINI
   ===================================================== */

const MODEL = "gemini-3.8-flash";

const API_KEY_NAME = "disco_api_key";
const MEMORY_NAME = "disco_memory";

let voices = [];
let recognition = null;
let timerId = null;
let lastActionUrl = "";
let listening = false;


/* =====================================================
   ELEMENTS
   ===================================================== */

const chat = document.getElementById("chat");
const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const keyBtn = document.getElementById("key-btn");
const imgInput = document.getElementById("img-input");

const stateText = document.getElementById("stateText");
const activity = document.getElementById("activity");
const networkStatus = document.getElementById("networkStatus");


/* =====================================================
   VOICES
   ===================================================== */

function loadVoices() {

    voices =
        window.speechSynthesis
            ? speechSynthesis.getVoices()
            : [];
}

loadVoices();

if ("onvoiceschanged" in speechSynthesis) {
    speechSynthesis.onvoiceschanged = loadVoices;
}


function getPreferredVoice() {

    const english =
        voices.filter(v =>
            v.lang &&
            v.lang.toLowerCase().startsWith("en")
        );

    const preferredNames = [
        "male",
        "ravi",
        "david",
        "daniel",
        "alex",
        "mark",
        "george",
        "james"
    ];

    const male =
        english.find(v =>
            preferredNames.some(
                name =>
                    v.name.toLowerCase()
                        .includes(name)
            )
        );

    return (
        male ||
        english.find(v =>
            v.lang
                .toLowerCase()
                .startsWith("en-in")
        ) ||
        english[0] ||
        voices[0]
    );
}


/* =====================================================
   UI STATE
   ===================================================== */

function setState(
    mode,
    text,
    activityText
) {

    document.body.classList.remove(
        "listening",
        "reasoning",
        "speaking"
    );

    if (mode) {
        document.body.classList.add(mode);
    }

    if (stateText) {
        stateText.textContent = text;
    }

    if (activity) {
        activity.textContent = activityText;
    }
}


/* =====================================================
   SPEAK
   ===================================================== */

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    const voice =
        getPreferredVoice();

    if (voice) {
        utterance.voice = voice;
    }

    utterance.lang = "en-IN";

    utterance.rate = 0.92;

    utterance.pitch = 0.78;

    utterance.volume = 1;


    utterance.onstart = () => {

        setState(
            "speaking",
            "SPEAKING",
            "D.I.S.C.O IS SPEAKING"
        );
    };


    utterance.onend = () => {

        setState(
            "",
            "READY",
            "SYSTEM READY"
        );
    };


    utterance.onerror = () => {

        setState(
            "",
            "READY",
            "SYSTEM READY"
        );
    };


    speechSynthesis.speak(utterance);
}


/* =====================================================
   CHAT
   ===================================================== */

function addMessage(text, sender) {

    const box =
        document.createElement("div");

    box.className =
        sender === "user"
            ? "msg user-msg"
            : "msg ai-msg";


    const label =
        document.createElement("div");

    label.className =
        "msg-label";

    label.textContent =
        sender === "user"
            ? "BOSS"
            : "D.I.S.C.O";


    const content =
        document.createElement("div");

    content.className =
        "msg-text";

    content.textContent = text;


    box.appendChild(label);

    box.appendChild(content);

    chat.appendChild(box);

    chat.scrollTop =
        chat.scrollHeight;
}


/* =====================================================
   MEMORY
   ===================================================== */

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
}


/* =====================================================
   SAVE MEMORY
   ===================================================== */

function remember(text) {

    const memory =
        getMemory();

    let saved = false;


    /* NAME */

    const nameMatch =
        text.match(
            /my name is\s+([a-zA-Z][a-zA-Z ]{1,30})/i
        );

    if (nameMatch) {

        let name =
            nameMatch[1]
                .trim()
                .replace(/[.!?,]+$/, "");

        name =
            name.split(
                /\s+(?:and|my favourite|my favorite)\s+/i
            )[0]
                .trim();

        memory.name = name;

        saved = true;
    }


    /* FAVOURITE COLOUR */

    const colourMatch =
        text.match(
            /my favou?rite colou?r is\s+([a-zA-Z ]+)/i
        );

    if (colourMatch) {

        let colour =
            colourMatch[1]
                .trim()
                .replace(/[.!?,]+$/, "");

        colour =
            colour.split(
                /\s+(?:and|my name)\s+/i
            )[0]
                .trim();

        memory.favouriteColour =
            colour;

        saved = true;
    }


    /* GENERIC MEMORY */

    const generic =
        text.match(
            /remember that\s+(.+)/i
        );

    if (generic && !saved) {

        if (!memory.notes) {
            memory.notes = [];
        }

        memory.notes.push(
            generic[1].trim()
        );

        saved = true;
    }


    if (saved) {

        saveMemory(memory);

        return true;
    }

    return false;
}


/* =====================================================
   MEMORY QUESTIONS
   ===================================================== */

function memoryQuestion(text) {

    const lower =
        text.toLowerCase();

    const memory =
        getMemory();


    /* NAME */

    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
        lower.includes("tell me my name")
    ) {

        return memory.name
            ? `Your name is ${memory.name}, Boss.`
            : "Boss, I don't have your name saved yet.";
    }


    /* COLOUR */

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

        return memory.favouriteColour
            ? `Your favourite colour is ${memory.favouriteColour}, Boss.`
            : "Boss, I don't have your favourite colour saved yet.";
    }


    /* COMBINED */

    const wantsName =
        lower.includes("my name");

    const wantsColour =
        lower.includes("favourite colour") ||
        lower.includes("favorite colour") ||
        lower.includes("favourite color") ||
        lower.includes("favorite color");


    if (
        wantsName &&
        wantsColour
    ) {

        const name =
            memory.name
                ? `Your name is ${memory.name}.`
                : "I don't have your name saved.";

        const colour =
            memory.favouriteColour
                ? `Your favourite colour is ${memory.favouriteColour}.`
                : "I don't have your favourite colour saved.";

        return `${name} ${colour}`;
    }


    /* ALL MEMORY */

    if (
        lower === "what do you remember" ||
        lower === "show my memory"
    ) {

        const answers = [];

        if (memory.name) {
            answers.push(
                `Your name is ${memory.name}.`
            );
        }

        if (memory.favouriteColour) {
            answers.push(
                `Your favourite colour is ${memory.favouriteColour}.`
            );
        }

        if (
            memory.notes &&
            memory.notes.length
        ) {
            answers.push(
                ...memory.notes.map(
                    n =>
                        `You asked me to remember ${n}.`
                )
            );
        }

        return answers.length
            ? answers.join(" ")
            : "Boss, I don't have anything saved yet.";
    }


    return null;
}


/* =====================================================
   CLEAR MEMORY
   ===================================================== */

function clearMemory() {

    localStorage.removeItem(
        MEMORY_NAME
    );

    addMessage(
        "Memory cleared successfully, Boss.",
        "ai"
    );

    speak(
        "Memory cleared successfully, Boss."
    );
}


/* =====================================================
   TIME
   ===================================================== */

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


/* =====================================================
   CALCULATOR
   ===================================================== */

function calculate(text) {

    let expression =
        text
            .replace(
                /calculate/gi,
                ""
            )
            .replace(
                /what is/gi,
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
                /times/gi,
                "*"
            )
            .replace(
                /multiplied by/gi,
                "*"
            )
            .replace(
                /divided by/gi,
                "/"
            )
            .replace(
                /×/g,
                "*"
            )
            .replace(
                /÷/g,
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

        return Number.isFinite(result)
            ? result
            : null;

    } catch {

        return null;
    }
}


/* =====================================================
   BATTERY
   ===================================================== */

async function battery() {

    if (!navigator.getBattery) {

        return "Boss, battery information is not available.";
    }

    try {

        const b =
            await navigator.getBattery();

        return `Battery is ${Math.round(
            b.level * 100
        )}%. ${
            b.charging
                ? "The device is charging."
                : "The device is not charging."
        }`;

    } catch {

        return "Boss, I couldn't read the battery.";
    }
}


/* =====================================================
   WEATHER
   ===================================================== */

async function weather() {

    if (!navigator.geolocation) {

        return "Boss, location is unavailable.";
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
                        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`;


                    const response =
                        await fetch(url);

                    const data =
                        await response.json();

                    const c =
                        data.current;


                    resolve(
                        `The temperature is ${c.temperature_2m}°C, humidity is ${c.relative_humidity_2m}%, and wind speed is ${c.wind_speed_10m} kilometres per hour.`
                    );

                } catch {

                    resolve(
                        "Boss, I couldn't get the weather right now."
                    );
                }
            },

            () => {

                resolve(
                    "Boss, please allow location access to check your weather."
                );
            }
        );
    });
}


/* =====================================================
   TIMER
   ===================================================== */

function startTimer(minutes) {

    if (timerId) {
        clearTimeout(timerId);
    }

    timerId =
        setTimeout(
            () => {

                addMessage(
                    "Boss, your timer is finished.",
                    "ai"
                );

                speak(
                    "Boss, your timer is finished."
                );

                timerId = null;

            },
            minutes * 60000
        );


    return `Timer started for ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}


function stopTimer() {

    if (!timerId) {

        return "Boss, there is no active timer.";
    }

    clearTimeout(timerId);

    timerId = null;

    return "Timer stopped, Boss.";
}


/* =====================================================
   YOUTUBE
   ===================================================== */

function youtube(text) {

    let query =
        text
            .replace(
                /open youtube/gi,
                ""
            )
            .replace(
                /search youtube/gi,
                ""
            )
            .replace(
                /play/gi,
                ""
            )
            .trim();


    if (!query) {

        query =
            "music";
    }


    const url =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(query);


    lastActionUrl =
        url;


    window.open(
        url,
        "_blank"
    );


    return `Opening YouTube search for ${query}.`;
}


/* =====================================================
   LAST ACTION
   ===================================================== */

function openLast() {

    if (!lastActionUrl) {

        return "Boss, there is nothing recent to open.";
    }

    window.open(
        lastActionUrl,
        "_blank"
    );

    return "Opening it now, Boss.";
}


/* =====================================================
   API KEY
   ===================================================== */

function getApiKey() {

    return localStorage.getItem(
        API_KEY_NAME
    );
}


function changeApiKey() {

    const key =
        prompt(
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


/* =====================================================
   WAIT
   ===================================================== */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


/* =====================================================
   GEMINI
   ===================================================== */

async function askGemini(
    question,
    image = null
) {

    const apiKey =
        getApiKey();


    if (!apiKey) {

        return "Boss, Gemini is not configured. Press the 🔑 button to add your API key.";
    }


    const memory =
        getMemory();


    let memoryText =
        "No saved memory.";


    if (
        memory.name ||
        memory.favouriteColour
    ) {

        memoryText = "";

        if (memory.name) {
            memoryText +=
                `Name: ${memory.name}\n`;
        }

        if (memory.favouriteColour) {
            memoryText +=
                `Favourite colour: ${memory.favouriteColour}\n`;
        }
    }


    const system =
        `
You are D.I.S.C.O., a personal AI assistant.

Call the user Boss.

Use simple Indian English.

Be helpful, concise and natural.

Saved user memory:
${memoryText}
`;


    const parts = [
        {
            text:
                system +
                "\n\nUser question:\n" +
                question
        }
    ];


    if (image) {

        parts.push({
            inline_data: {
                mime_type:
                    image.mimeType,

                data:
                    image.base64
            }
        });
    }


    const body = {

        contents: [
            {
                role: "user",

                parts
            }
        ],

        generationConfig: {

            temperature: 0.7,

            maxOutputTokens: 700
        }
    };


    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;


    for (
        let attempt = 0;
        attempt < 4;
        attempt++
    ) {

        try {

            const response =
                await fetch(
                    url,
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


            if (response.ok) {

                const answer =
                    data
                        ?.candidates?.[0]
                        ?.content?.parts
                        ?.map(
                            p => p.text || ""
                        )
                        .join("")
                        .trim();


                return answer ||
                    "Boss, Gemini returned an empty answer.";
            }


            /* RETRY 429 */

            if (
                response.status === 429 ||
                response.status === 503
            ) {

                if (attempt < 3) {

                    const delay =
                        1000 *
                        Math.pow(
                            2,
                            attempt
                        ) +
                        Math.random() * 500;


                    await wait(delay);

                    continue;
                }


                if (
                    response.status === 429
                ) {

                    return "Boss, Gemini has reached its current quota or rate limit. Please try again later.";
                }


                return "Boss, Gemini is temporarily overloaded. Please try again shortly.";
            }


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                return "Boss, the Gemini API key is invalid or does not have permission.";
            }


            if (
                response.status === 400
            ) {

                return "Boss, Gemini rejected the request. Please check the API settings.";
            }


            return `Boss, Gemini returned error ${response.status}.`;

        } catch {

            if (attempt < 3) {

                await wait(
                    1000 *
                    Math.pow(
                        2,
                        attempt
                    )
                );

                continue;
            }


            return "Boss, I couldn't connect to Gemini. Please check your internet connection.";
        }
    }


    return "Boss, Gemini is temporarily unavailable.";
}


/* =====================================================
   COMMAND ROUTER
   ===================================================== */

async function processCommand(
    text,
    image = null
) {

    const lower =
        text.toLowerCase().trim();


    /* MEMORY SAVE */

    if (
        lower.includes("remember that") ||
        lower.includes("my name is") ||
        lower.includes("my favourite colour is") ||
        lower.includes("my favorite color is")
    ) {

        if (
            remember(text)
        ) {

            return "Done, Boss. I will remember that.";
        }
    }


    /* MEMORY QUESTION */

    const remembered =
        memoryQuestion(text);

    if (remembered) {
        return remembered;
    }


    /* CLEAR MEMORY */

    if (
        lower === "clear memory" ||
        lower === "forget everything"
    ) {

        clearMemory();

        return null;
    }


    /* TIME */

    if (
        lower === "time" ||
        lower.includes("what time") ||
        lower.includes("current time")
    ) {

        return `The current time is ${currentTime()}.`;
    }


    /* DATE */

    if (
        lower === "date" ||
        lower.includes("what is the date") ||
        lower.includes("today's date")
    ) {

        return `Today is ${currentDate()}.`;
    }


    /* BATTERY */

    if (
        lower.includes("battery")
    ) {

        return await battery();
    }


    /* NETWORK */

    if (
        lower.includes("network") ||
        lower.includes("internet") ||
        lower.includes("online")
    ) {

        return navigator.onLine
            ? "Network is online, Boss."
            : "Boss, the device appears to be offline.";
    }


    /* WEATHER */

    if (
        lower.includes("weather") ||
        lower.includes("temperature")
    ) {

        return await weather();
    }


    /* TIMER */

    const timerMatch =
        lower.match(
            /(?:set|start)\s+(?:a\s+)?timer\s+(?:for\s+)?(\d+)\s*(minute|minutes|min|second|seconds|sec|secs)?/i
        );


    if (timerMatch) {

        let amount =
            Number(timerMatch[1]);

        const unit =
            (
                timerMatch[2] ||
                "minutes"
            ).toLowerCase();


        if (
            unit.startsWith("second") ||
            unit.startsWith("sec")
        ) {

            amount =
                amount / 60;
        }


        return startTimer(
            amount
        );
    }


    if (
        lower === "stop timer" ||
        lower === "cancel timer"
    ) {

        return stopTimer();
    }


    /* YOUTUBE */

    if (
        lower.includes("open youtube") ||
        lower.includes("search youtube") ||
        lower.startsWith("play ")
    ) {

        return youtube(text);
    }


    /* OPEN LAST */

    if (
        lower === "open it" ||
        lower === "open that"
    ) {

        return openLast();
    }


    /* CALCULATOR */

    if (
        lower.startsWith("calculate ") ||
        lower.startsWith("what is ")
    ) {

        const answer =
            calculate(text);

        if (answer !== null) {

            return `The answer is ${answer}.`;
        }
    }


    /* GREETING */

    if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey"
    ) {

        return "Hello, Boss. D.I.S.C.O. is ready.";
    }


    /* FEATURES */

    if (
        lower.includes("what can you do") ||
        lower.includes("what are your features")
    ) {

        return "Boss, I can answer questions, remember information, use voice input and speech output, analyse images, calculate, check time, date, weather, battery and network, set timers, and open YouTube searches.";
    }


    /* GEMINI */

    return await askGemini(
        text,
        image
    );
}


/* =====================================================
   SEND
   ===================================================== */

async function sendMessage() {

    const text =
        msgInput.value.trim();


    if (!text) {
        return;
    }


    msgInput.value = "";


    addMessage(
        text,
        "user"
    );


    setState(
        "reasoning",
        "REASONING",
        "D.I.S.C.O IS THINKING..."
    );


    sendBtn.disabled = true;


    const answer =
        await processCommand(
            text
        );


    sendBtn.disabled = false;


    if (!answer) {

        setState(
            "",
            "READY",
            "SYSTEM READY"
        );

        return;
    }


    addMessage(
        answer,
        "ai"
    );


    speak(answer);
}


/* =====================================================
   SEND BUTTON
   ===================================================== */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =====================================================
   ENTER
   ===================================================== */

msgInput.addEventListener(
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


/* =====================================================
   CLEAR
   ===================================================== */

clearBtn.addEventListener(
    "click",
    clearMemory
);


/* =====================================================
   API KEY
   ===================================================== */

keyBtn.addEventListener(
    "click",
    changeApiKey
);


/* =====================================================
   MICROPHONE
   ===================================================== */

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


    recognition.maxAlternatives =
        1;


    recognition.onstart = () => {

        listening = true;

        setState(
            "listening",
            "LISTENING",
            "SPEAK NOW..."
        );
    };


    recognition.onresult =
        event => {

            const transcript =
                event
                    .results[0][0]
                    .transcript;


            msgInput.value =
                transcript;

            listening = false;

            sendMessage();
        };


    recognition.onerror =
        event => {

            listening = false;


            if (
                event.error ===
                "not-allowed"
            ) {

                setState(
                    "",
                    "READY",
                    "MICROPHONE PERMISSION REQUIRED"
                );

            } else {

                setState(
                    "",
                    "READY",
                    "VOICE INPUT ERROR"
                );
            }
        };


    recognition.onend =
        () => {

            listening = false;

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


    micBtn.addEventListener(
        "click",
        () => {

            if (listening) {

                recognition.stop();

                return;
            }


            try {

                recognition.start();

            } catch {

                // Already listening.
            }
        }
    );

} else {

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


/* =====================================================
   IMAGE
   ===================================================== */

imgInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files[0];


        if (!file) {
            return;
        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            addMessage(
                "Boss, please select an image.",
                "ai"
            );

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            async () => {

                const result =
                    reader.result;


                const base64 =
                    result.split(",")[1];


                addMessage(
                    `Image selected: ${file.name}`,
                    "user"
                );


                setState(
                    "reasoning",
                    "REASONING",
                    "ANALYSING IMAGE..."
                );


                const answer =
                    await askGemini(
                        "Analyse this image and describe what you can see clearly.",
                        {
                            mimeType:
                                file.type,

                            base64
                        }
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


/* =====================================================
   NETWORK STATUS
   ===================================================== */

function updateNetwork() {

    networkStatus.textContent =
        navigator.onLine
            ? "ONLINE"
            : "OFFLINE";
}


window.addEventListener(
    "online",
    updateNetwork
);

window.addEventListener(
    "offline",
    updateNetwork
);

updateNetwork();


/* =====================================================
   STARTUP
   ===================================================== */

setState(
    "",
    "READY",
    "SYSTEM READY"
);
