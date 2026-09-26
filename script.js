/* =========================================================
   D.I.S.C.O — GOLD HUD EDITION
   ========================================================= */

const MODEL = "gemini-3.8-flash";

const API_KEY_STORAGE = "disco_api_key";

const MEMORY_STORAGE = "disco_memory";


/* =========================================================
   ELEMENTS
   ========================================================= */

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");

const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");
const clearBtn = document.getElementById("clear-btn");
const keyBtn = document.getElementById("key-btn");

const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");


/* =========================================================
   MEMORY
   ========================================================= */

let memory = JSON.parse(
    localStorage.getItem(MEMORY_STORAGE) || "[]"
);

function saveMemory() {

    localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memory)
    );

}


/* =========================================================
   CHAT MESSAGE
   ========================================================= */

function addMessage(text, type = "ai") {

    const div = document.createElement("div");

    div.className = "msg " + type;

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;

    return div;
}


/* =========================================================
   API KEY
   ========================================================= */

function getApiKey() {

    return localStorage.getItem(API_KEY_STORAGE) || "";

}


function changeApiKey() {

    const current = getApiKey();

    const newKey = prompt(
        current
            ? "Enter your new Gemini API key:"
            : "Enter your Gemini API key:"
    );

    if (!newKey) return;

    localStorage.setItem(
        API_KEY_STORAGE,
        newKey.trim()
    );

    addMessage(
        "Gemini API key updated successfully.",
        "ai"
    );

}


/* =========================================================
   VOICE
   ========================================================= */

let voices = [];


function loadVoices() {

    if (!("speechSynthesis" in window)) {
        return;
    }

    voices = speechSynthesis.getVoices();

}


loadVoices();


if ("onvoiceschanged" in speechSynthesis) {

    speechSynthesis.onvoiceschanged = loadVoices;

}


/*
   Browser voices are device-dependent.

   We first try voices whose names commonly indicate
   a male voice, then fall back to English voices.
*/

function getMaleVoice() {

    if (!voices.length) {
        loadVoices();
    }

    const maleWords = [
        "male",
        "man",
        "ravi",
        "david",
        "mark",
        "george",
        "daniel",
        "alex"
    ];

    const indian = voices.find(v => {

        const name = v.name.toLowerCase();

        return (
            (
                v.lang.toLowerCase().startsWith("en-in")
            ) &&
            maleWords.some(word =>
                name.includes(word)
            )
        );

    });

    if (indian) return indian;


    const maleEnglish = voices.find(v => {

        const name = v.name.toLowerCase();

        return (
            (
                v.lang.toLowerCase().startsWith("en")
            ) &&
            maleWords.some(word =>
                name.includes(word)
            )
        );

    });

    if (maleEnglish) return maleEnglish;


    return voices.find(v =>
        v.lang.toLowerCase().startsWith("en-in")
    ) || voices.find(v =>
        v.lang.toLowerCase().startsWith("en")
    ) || voices[0];

}


function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    speechSynthesis.cancel();

    const cleanText = text
        .replace(/D\.I\.S\.C\.O:?/gi, "")
        .trim();

    if (!cleanText) return;

    const utterance =
        new SpeechSynthesisUtterance(cleanText);

    utterance.lang = "en-IN";

    const voice = getMaleVoice();

    if (voice) {
        utterance.voice = voice;
    }

    /*
       Lower pitch gives a deeper voice on engines
       that support pitch control.
    */

    utterance.pitch = 0.78;

    utterance.rate = 0.92;

    utterance.volume = 1;

    utterance.onstart = () => {

        document.body.classList.add("speaking");

    };

    utterance.onend = () => {

        document.body.classList.remove("speaking");

    };

    utterance.onerror = () => {

        document.body.classList.remove("speaking");

    };

    speechSynthesis.speak(utterance);

}


/* =========================================================
   TIME
   ========================================================= */

function getTime() {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            timeZone: "Asia/Kolkata",

            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",

            hour12: true
        }
    ).format(new Date());

}


/* =========================================================
   DATE
   ========================================================= */

function getDate() {

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


/* =========================================================
   CALCULATOR
   ========================================================= */

function calculate(expression) {

    try {

        const safe =
            expression
                .replace(/[^0-9+\-*/().% ]/g, "");

        if (!safe.trim()) {
            return null;
        }

        const result = Function(
            `"use strict"; return (${safe})`
        )();

        if (
            typeof result === "number" &&
            Number.isFinite(result)
        ) {

            return String(result);

        }

    } catch (error) {

        return null;

    }

    return null;

}


/* =========================================================
   MEMORY QUESTIONS
   ========================================================= */

function memoryAnswer(text) {

    const lower = text.toLowerCase();


    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name")
    ) {

        const item = memory.find(m =>
            m.toLowerCase().includes("name")
        );

        return item || null;

    }


    if (
        lower.includes("favourite colour") ||
        lower.includes("favorite color")
    ) {

        const item = memory.find(m =>
            m.toLowerCase().includes("colour") ||
            m.toLowerCase().includes("color")
        );

        return item || null;

    }

    return null;

}


/* =========================================================
   SAVE MEMORY
   ========================================================= */

function checkMemory(text) {

    const match =
        text.match(
            /remember that (.+)/i
        );

    if (!match) return null;

    const fact = match[1].trim();

    memory.push(fact);

    saveMemory();

    return (
        "I will remember that, Boss."
    );

}


/* =========================================================
   BATTERY
   ========================================================= */

async function getBattery() {

    if (!navigator.getBattery) {

        return "Battery information is not available.";

    }

    const battery =
        await navigator.getBattery();

    const percentage =
        Math.round(
            battery.level * 100
        );

    return (
        `Battery is at ${percentage} percent.`
    );

}


/* =========================================================
   NETWORK
   ========================================================= */

function getNetwork() {

    return navigator.onLine
        ? "Network is online."
        : "Network is offline.";

}


/* =========================================================
   DEVICE
   ========================================================= */

function getDevice() {

    return (
        `You are using ${navigator.platform || "a mobile device"}.`
    );

}


/* =========================================================
   TIMER
   ========================================================= */

let timer = null;


function startTimer(seconds) {

    clearTimeout(timer);

    timer = setTimeout(() => {

        addMessage(
            "Boss, your timer is complete.",
            "ai"
        );

        speak(
            "Boss, your timer is complete."
        );

    }, seconds * 1000);

    return (
        `Timer started for ${seconds} seconds.`
    );

}


function stopTimer() {

    clearTimeout(timer);

    return "Timer stopped.";

}


/* =========================================================
   LOCATION
   ========================================================= */

function getLocation() {

    return new Promise(resolve => {

        if (!navigator.geolocation) {

            resolve(
                "Location is not supported by this browser."
            );

            return;

        }

        navigator.geolocation.getCurrentPosition(

            position => {

                const lat =
                    position.coords.latitude;

                const lon =
                    position.coords.longitude;

                resolve(
                    `Your approximate coordinates are ${lat.toFixed(4)}, ${lon.toFixed(4)}.`
                );

            },

            () => {

                resolve(
                    "I could not access your location. Please allow location permission."
                );

            },

            {
                enableHighAccuracy: true,
                timeout: 10000
            }

        );

    });

}


/* =========================================================
   WEATHER
   ========================================================= */

async function getWeather() {

    try {

        const location =
            await new Promise((resolve, reject) => {

                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 10000
                    }
                );

            });


        const lat =
            location.coords.latitude;

        const lon =
            location.coords.longitude;


        const response =
            await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`
            );


        const data =
            await response.json();


        const current =
            data.current;


        return (
            `It is ${current.temperature_2m} degrees Celsius with ${current.relative_humidity_2m} percent humidity.`
        );

    } catch (error) {

        return (
            "I could not get the weather. Please allow location permission."
        );

    }

}


/* =========================================================
   QUICK COMMANDS
   ========================================================= */

async function runLocalCommand(text) {

    const lower = text.toLowerCase().trim();


    /* TIME */

    if (
        lower === "time" ||
        lower.includes("what is the time") ||
        lower.includes("what's the time") ||
        lower.includes("current time")
    ) {

        return (
            `The current time is ${getTime()}.`
        );

    }


    /* DATE */

    if (
        lower === "date" ||
        lower.includes("what is today's date") ||
        lower.includes("what is the date") ||
        lower.includes("today's date")
    ) {

        return (
            `Today is ${getDate()}.`
        );

    }


    /* WEATHER */

    if (
        lower.includes("weather") ||
        lower.includes("temperature outside")
    ) {

        return await getWeather();

    }


    /* LOCATION */

    if (
        lower.includes("where am i") ||
        lower.includes("my location")
    ) {

        return await getLocation();

    }


    /* BATTERY */

    if (
        lower.includes("battery")
    ) {

        return await getBattery();

    }


    /* NETWORK */

    if (
        lower.includes("network status") ||
        lower.includes("internet status")
    ) {

        return getNetwork();

    }


    /* DEVICE */

    if (
        lower.includes("what device") ||
        lower.includes("which device")
    ) {

        return getDevice();

    }


    /* STOP TIMER */

    if (
        lower === "stop timer" ||
        lower === "cancel timer"
    ) {

        return stopTimer();

    }


    /* TIMER */

    const timerMatch =
        lower.match(
            /(?:set|start)\s+(?:a\s+)?timer\s+(?:for\s+)?(\d+)\s*(seconds?|minutes?)/i
        );


    if (timerMatch) {

        const amount =
            Number(timerMatch[1]);

        const unit =
            timerMatch[2].toLowerCase();

        const seconds =
            unit.startsWith("minute")
                ? amount * 60
                : amount;

        return startTimer(seconds);

    }


    /* CALCULATOR */

    if (
        lower.startsWith("calculate ")
    ) {

        const expression =
            text.substring(10);

        const result =
            calculate(expression);

        if (result !== null) {

            return (
                `The answer is ${result}.`
            );

        }

    }


    return null;

}


/* =========================================================
   GEMINI
   ========================================================= */

async function askGemini(text, imagePart = null) {

    const apiKey = getApiKey();


    if (!apiKey) {

        const keyMessage =
            "Boss, please add your Gemini API key using the 🔑 button.";

        addMessage(
            keyMessage,
            "ai"
        );

        speak(keyMessage);

        return;

    }


    const memoryContext =
        memory.length
            ? "\nKnown memory:\n" +
              memory.join("\n")
            : "";


    const systemInstruction = `
You are D.I.S.C.O, a futuristic personal AI assistant.

Call the user "Boss".

Use simple Indian English.

Be helpful, natural and concise.

Do not repeatedly say "How may I assist you?"

Remember the supplied memory and use it naturally.

Current time and device tools are handled by the webpage.
${memoryContext}
`;


    const parts = [
        {
            text:
                systemInstruction +
                "\n\nBoss says:\n" +
                text
        }
    ];


    if (imagePart) {

        parts.push(imagePart);

    }


    const body = {

        contents: [
            {
                role: "user",

                parts: parts
            }
        ],

        generationConfig: {

            temperature: 0.7,

            maxOutputTokens: 600

        }

    };


    let response;


    try {

        response = await fetch(

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


    } catch (error) {

        return (
            "Boss, I cannot connect to Gemini right now. Please check your internet connection."
        );

    }


    if (!response.ok) {

        let errorData = {};

        try {

            errorData =
                await response.json();

        } catch {}

        const status =
            response.status;


        if (status === 400) {

            return (
                "Boss, Gemini rejected the request. Please check the API key and model settings."
            );

        }


        if (
            status === 401 ||
            status === 403
        ) {

            return (
                "Boss, the Gemini API key is invalid or does not have permission. Use the 🔑 button to change it."
            );

        }


        if (status === 429) {

            return (
                "Boss, Gemini quota has been exceeded. A new key in the same project will not create a new project quota."
            );

        }


        if (status === 503) {

            return (
                "Boss, Gemini is temporarily overloaded. Please try again shortly."
            );

        }


        console.error(
            "Gemini error:",
            errorData
        );

        return (
            `Boss, Gemini returned error ${status}.`
        );

    }


    const data =
        await response.json();


    const answer =
        data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();


    if (!answer) {

        return (
            "Boss, Gemini returned an empty response."
        );

    }


    return answer;

}


/* =========================================================
   SEND
   ========================================================= */

async function sendMessage(text = null) {

    const userText =
        (text !== null ? text : msg.value)
            .trim();


    if (!userText) return;


    addMessage(
        "Boss: " + userText,
        "user"
    );


    msg.value = "";


    /* MEMORY */

    const memoryResult =
        checkMemory(userText);


    if (memoryResult) {

        addMessage(
            memoryResult,
            "ai"
        );

        speak(memoryResult);

        return;

    }


    /* MEMORY QUESTIONS */

    const savedAnswer =
        memoryAnswer(userText);


    if (savedAnswer) {

        const answer =
            `Boss, ${savedAnswer}.`;

        addMessage(
            answer,
            "ai"
        );

        speak(answer);

        return;

    }


    /* LOCAL COMMAND */

    const localAnswer =
        await runLocalCommand(userText);


    if (localAnswer) {

        addMessage(
            localAnswer,
            "ai"
        );

        speak(localAnswer);

        return;

    }


    /* GEMINI */

    const thinking =
        addMessage(
            "D.I.S.C.O is processing...",
            "ai"
        );


    const answer =
        await askGemini(userText);


    thinking.remove();


    addMessage(
        answer,
        "ai"
    );

    speak(answer);

}


/* =========================================================
   IMAGE
   ========================================================= */

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
            imgInput.files[0];

        if (!file) return;


        const reader =
            new FileReader();


        reader.onload =
            async event => {

                const base64 =
                    event.target.result
                        .split(",")[1];


                addMessage(
                    "Boss sent an image.",
                    "user"
                );


                const thinking =
                    addMessage(
                        "D.I.S.C.O is analysing the image...",
                        "ai"
                    );


                const answer =
                    await askGemini(

                        "Analyse this image and tell Boss what you can see.",

                        {
                            inlineData: {

                             mimeType:
                                    file.type,

                                data:
                                    base64

                            }

                        }

                    );


                thinking.remove();


                addMessage(
                    answer,
                    "ai"
                );


                speak(answer);

            };


        reader.readAsDataURL(file);

    }
);


/* =========================================================
   BUTTONS
   ========================================================= */

sendBtn.addEventListener(
    "click",
    () => sendMessage()
);


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


keyBtn.addEventListener(
    "click",
    changeApiKey
);


/* =========================================================
   CLEAR
   ========================================================= */

clearBtn.addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "Clear D.I.S.C.O memory?"
            );


        if (!confirmed) return;


        memory = [];

        saveMemory();


        chat.innerHTML = `

            <div class="intro-message">

                <strong>
                    D.I.S.C.O: Systems online.
                </strong>

                <span>
                    Your personal AI assistant.
                </span>

            </div>

        `;

    }
);


/* =========================================================
   MICROPHONE
   ========================================================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    const recognition =
        new SpeechRecognition();


    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    micBtn.addEventListener(
        "click",
        () => {

            try {

                recognition.start();

                micBtn.classList.add(
                    "listening"
                );

            } catch {}

        }
    );


    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0].transcript;

            msg.value =
                transcript;

            sendMessage();

        };


    recognition.onend =
        () => {

            micBtn.classList.remove(
                "listening"
            );

        };


    recognition.onerror =
        () => {

            micBtn.classList.remove(
                "listening"
            );

        };

} else {

    micBtn.addEventListener(
        "click",
        () => {

            addMessage(
                "Voice input is not supported by this browser.",
                "ai"
            );

        }
    );

}


/* =========================================================
   STARTUP
   ========================================================= */

console.log(
    "D.I.S.C.O Gold HUD loaded."
);
