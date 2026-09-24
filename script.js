/* =========================================
   D.I.S.C.O AI
   GEMINI 3.5 FLASH-LITE
   GENERAL MEMORY + VOICE + RETRY
========================================= */

const MODEL = "gemini-3.5-flash-lite";
const KEY_STORAGE = "disco_api_key";
const MEMORY_STORAGE = "disco_memory";

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKey = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");

let apiKey = localStorage.getItem(KEY_STORAGE) || "";


/* =========================================
   LOAD MEMORY
========================================= */

let memory = [];

try {
    memory = JSON.parse(
        localStorage.getItem(MEMORY_STORAGE) || "[]"
    );

    if (!Array.isArray(memory)) {
        memory = [];
    }

} catch (error) {
    memory = [];
}


/* =========================================
   CHAT
========================================= */

function addUser(text) {
    const div = document.createElement("div");
    div.className = "msg user";
    div.textContent = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}


function addAI(text) {
    const div = document.createElement("div");
    div.className = "msg ai";

    div.innerHTML =
        "<b>D.I.S.C.O:</b> " +
        escapeHTML(text).replace(/\n/g, "<br>");

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}


function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


/* =========================================
   MEMORY
========================================= */

function saveMemory() {
    localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memory)
    );
}


function addMemory(text) {

    let cleanText = text
        .replace(/^remember\s+(that\s+)?/i, "")
        .trim();

    if (!cleanText) {
        return false;
    }

    cleanText = cleanText.replace(/[.!?]+$/, "");

    const exists = memory.some(
        item =>
            item.toLowerCase() ===
            cleanText.toLowerCase()
    );

    if (!exists) {
        memory.push(cleanText);
        saveMemory();
    }

    return true;
}


/* =========================================
   LOCAL MEMORY QUESTIONS
========================================= */

function answerFromMemory(question) {

    const q = question.toLowerCase();

    if (memory.length === 0) {
        return null;
    }


    /* NAME */

    if (
        q.includes("what is my name") ||
        q.includes("what's my name") ||
        q.includes("do you know my name")
    ) {

        const item = memory.find(
            x => /my\s+name\s+is/i.test(x)
        );

        if (item) {

            const match = item.match(
                /my\s+name\s+is\s+(.+)/i
            );

            if (match) {
                return (
                    "Your name is " +
                    match[1] +
                    ", Boss."
                );
            }
        }
    }


    /* FAVOURITE BIKE */

    if (
        q.includes("favourite bike") ||
        q.includes("favorite bike")
    ) {

        const item = memory.find(
            x =>
                /favou?rite\s+bike\s+is/i.test(x)
        );

        if (item) {

            const match = item.match(
                /favou?rite\s+bike\s+is\s+(.+)/i
            );

            if (match) {
                return (
                    "Your favourite bike is " +
                    match[1] +
                    ", Boss."
                );
            }
        }
    }


    /* FAVOURITE COLOUR */

    if (
        q.includes("favourite colour") ||
        q.includes("favorite color") ||
        q.includes("favourite color") ||
        q.includes("favorite colour")
    ) {

        const item = memory.find(
            x =>
                /favou?rite\s+colou?r\s+is/i.test(x)
        );

        if (item) {

            const match = item.match(
                /favou?rite\s+colou?r\s+is\s+(.+)/i
            );

            if (match) {
                return (
                    "Your favourite colour is " +
                    match[1] +
                    ", Boss."
                );
            }
        }
    }


    /* FOOD */

    if (
        q.includes("what food do i like") ||
        q.includes("what do i like to eat") ||
        q.includes("what food i like")
    ) {

        const item = memory.find(
            x =>
                /i\s+like\s+to\s+eat/i.test(x)
        );

        if (item) {

            return (
                "You told me that " +
                item +
                ", Boss."
            );
        }
    }


    /* AC */

    if (
        q.includes("what ac do i have") ||
        q.includes("which ac do i have") ||
        q.includes("my ac")
    ) {

        const item = memory.find(
            x =>
                /\b(i\s+have|i\s+own)\b.*\bac\b/i.test(x)
        );

        if (item) {

            return (
                "You told me that " +
                item +
                ", Boss."
            );
        }
    }


    return null;
}


/* =========================================
   API KEY
========================================= */

function getApiKey() {

    if (apiKey) {
        return true;
    }

    const key = prompt(
        "Enter your Gemini API key:"
    );

    if (!key || !key.trim()) {

        addAI(
            "I need your Gemini API key before I can connect to Gemini, Boss."
        );

        return false;
    }

    apiKey = key.trim();

    localStorage.setItem(
        KEY_STORAGE,
        apiKey
    );

    addAI(
        "Gemini connection key saved, Boss."
    );

    return true;
}


/* =========================================
   GEMINI PROMPT
========================================= */

function createPrompt(question) {

    let savedMemory =
        "No saved memories yet.";

    if (memory.length > 0) {

        savedMemory = memory
            .map(
                (item, index) =>
                    (index + 1) +
                    ". " +
                    item
            )
            .join("\n");
    }

    return `
You are D.I.S.C.O, a personal AI assistant.

Always call the user "Boss".

Speak in natural Indian English.

Use simple and clear English.

Be friendly, respectful and helpful.

Give direct answers.

The user has a persistent personal memory.

These are facts the user explicitly asked D.I.S.C.O to remember:

${savedMemory}

Use these memories whenever relevant.

Never invent memories.

Never claim to remember something that is not in the saved memory.

If the user asks about something in the memory, use the saved information.

User's message:
${question}
`;
}


/* =========================================
   SEND TO GEMINI
========================================= */

async function sendToGemini(question) {

    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL +
        ":generateContent",
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
                                    createPrompt(question)
                            }
                        ]
                    }
                ]
            })
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    return {
        response: response,
        data: data
    };
}


/* =========================================
   GEMINI WITH RETRY
========================================= */

async function askGemini(question) {

    if (!getApiKey()) {
        return;
    }

    addAI("Thinking, Boss...");

    const thinkingMessage =
        chat.lastElementChild;

    const retryDelays = [
        1500,
        3000,
        6000
    ];

    try {

        let result = null;

        for (
            let attempt = 0;
            attempt <= retryDelays.length;
            attempt++
        ) {

            try {

                result =
                    await sendToGemini(question);

                const status =
                    result.response.status;

                const temporaryError =
                    status === 429 ||
                    status === 503;

                if (
                    result.response.ok ||
                    !temporaryError
                ) {
                    break;
                }

                if (thinkingMessage) {

                    if (
                        attempt <
                        retryDelays.length
                    ) {

                        thinkingMessage.innerHTML =
                            "<b>D.I.S.C.O:</b> Gemini is busy. Retrying...";

                    } else {

                        thinkingMessage.innerHTML =
                            "<b>D.I.S.C.O:</b> Final attempt...";
                    }
                }

                if (
                    attempt <
                    retryDelays.length
                ) {

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                retryDelays[attempt]
                            )
                    );
                }

            } catch (error) {

                if (
                    attempt <
                    retryDelays.length
                ) {

                    if (thinkingMessage) {

                        thinkingMessage.innerHTML =
                            "<b>D.I.S.C.O:</b> Connection problem. Retrying...";
                    }

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                retryDelays[attempt]
                            )
                    );

                } else {

                    throw error;
                }
            }
        }


        if (!result) {

            if (thinkingMessage) {
                thinkingMessage.remove();
            }

            addAI(
                "Gemini could not be reached, Boss."
            );

            return;
        }


        if (thinkingMessage) {
            thinkingMessage.remove();
        }


        const data = result.data;


        if (!result.response.ok) {

            let errorMessage =
                "Gemini could not answer.";

            if (
                data &&
                data.error &&
                data.error.message
            ) {

                errorMessage =
                    data.error.message;
            }

            addAI(
                "Gemini error: " +
                errorMessage
            );

            return;
        }


        let answer = "";


        if (
            data &&
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
        ) {

            answer =
                data.candidates[0].content.parts
                    .map(
                        part =>
                            part.text || ""
                    )
                    .join("")
                    .trim();
        }


        if (!answer) {

            addAI(
                "Gemini returned an empty response, Boss."
            );

            return;
        }


        addAI(answer);

        speak(answer);


    } catch (error) {

        if (thinkingMessage) {
            thinkingMessage.remove();
        }

        console.error(
            "Gemini error:",
            error
        );

        addAI(
            "Connection error, Boss: " +
            error.message
        );
    }
}


/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage() {

    const text =
        msg.value.trim();

    if (!text) {
        return;
    }

    msg.value = "";

    addUser(text);

    const lower =
        text.toLowerCase();


    /* SAVE MEMORY */

    if (
        lower.startsWith("remember ") ||
        lower.includes("remember that ")
    ) {

        if (addMemory(text)) {

            const reply =
                "Got it, Boss. I have saved that in my memory.";

            addAI(reply);

            speak(reply);

            return;
        }
    }


    /* LOCAL MEMORY ANSWER */

    const memoryAnswer =
        answerFromMemory(text);

    if (memoryAnswer) {

        addAI(memoryAnswer);

        speak(memoryAnswer);

        return;
    }


    /* GEMINI */

    await askGemini(text);
}


/* =========================================
   SEND BUTTON
========================================= */

if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );
}


/* =========================================
   ENTER
========================================= */

if (msg) {

    msg.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


/* =========================================
   CLEAR MEMORY
========================================= */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function() {

            memory = [];

            localStorage.removeItem(
                MEMORY_STORAGE
            );

            const reply =
                "All saved memories have been cleared, Boss.";

            addAI(reply);

            speak(reply);
        }
    );
}


/* =========================================
   CHANGE API KEY
========================================= */

if (changeKey) {

    changeKey.addEventListener(
        "click",
        function() {

            const key =
                prompt(
                    "Enter your new Gemini API key:"
                );

            if (!key || !key.trim()) {
                return;
            }

            apiKey =
                key.trim();

            localStorage.setItem(
                KEY_STORAGE,
                apiKey
            );

            const reply =
                "API key changed successfully, Boss.";

            addAI(reply);

            speak(reply);
        }
    );
}


/* =========================================
   VOICE OUTPUT
========================================= */

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(
            text
        );

    utterance.lang =
        "en-IN";

    utterance.rate =
        0.92;

    utterance.pitch =
        0.85;

    const voices =
        speechSynthesis.getVoices();

    const indianVoice =
        voices.find(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("en-in")
        );

    if (indianVoice) {
        utterance.voice =
            indianVoice;
    }

    speechSynthesis.speak(
        utterance
    );
}


/* =========================================
   LOAD VOICES
========================================= */

if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        function() {

            speechSynthesis.getVoices();
        };
}


/* =========================================
   VOICE INPUT
========================================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (
    mic &&
    SpeechRecognition
) {

    const recognition =
        new SpeechRecognition();

    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    mic.addEventListener(
        "click",
        function() {

            try {

                recognition.start();

                mic.textContent =
                    "🔴";

            } catch (error) {

                console.log(error);
            }
        }
    );


    recognition.onresult =
        function(event) {

            const transcript =
                event.results[0][0]
                    .transcript;

            msg.value =
                transcript;

            sendMessage();
        };


    recognition.onend =
        function() {

            mic.textContent =
                "🎙️";
        };


    recognition.onerror =
        function(event) {

            mic.textContent =
                "🎙️";

            console.log(
                "Speech error:",
                event.error
            );

            addAI(
                "I could not hear that clearly, Boss."
            );
        };

} else if (mic) {

    mic.addEventListener(
        "click",
        function() {

            addAI(
                "Voice input is not supported by this browser, Boss."
            );
        }
    );
}


/* =========================================
   IMAGE BUTTON
========================================= */

if (
    imgBtn &&
    imgInput
) {

    imgBtn.addEventListener(
        "click",
        function() {

            imgInput.click();
        }
    );


    imgInput.addEventListener(
        "change",
        function() {

            if (
                imgInput.files &&
                imgInput.files.length
            ) {

                const file =
                    imgInput.files[0];

                addAI(
                    "Image selected: " +
                    file.name +
                    ", Boss."
                );
            }
        }
    );
}


/* =========================================
   STARTUP
========================================= */

console.log(
    "D.I.S.C.O SYSTEM ONLINE"
);

console.log(
    "Gemini model:",
    MODEL
);

console.log(
    "Saved memories:",
    memory
);
