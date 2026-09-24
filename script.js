const API_KEY_STORAGE = "disco_api_key";
const MEMORY_STORAGE = "disco_memory";
const MODEL = "gemini-3.8-flash";

let apiKey = localStorage.getItem(API_KEY_STORAGE) || "";
let memory = JSON.parse(localStorage.getItem(MEMORY_STORAGE) || "{}");

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKey = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");

function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "msg " + type;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function addAI(text) {
    addMessage("D.I.S.C.O: " + text, "ai");
}

function saveMemory() {
    localStorage.setItem(MEMORY_STORAGE, JSON.stringify(memory));
}

function remember(text) {
    let saved = false;

    const name = text.match(/my\s+name\s+is\s+([a-zA-Z]+)/i);
    if (name) {
        memory.name = name[1];
        saved = true;
    }

    const colour = text.match(
        /my\s+favou?rite\s+colou?r\s+is\s+([a-zA-Z]+)/i
    );

    if (colour) {
        memory.colour = colour[1];
        saved = true;
    }

    if (saved) {
        saveMemory();
    }

    return saved;
}

function memoryQuestion(text) {
    const q = text.toLowerCase();
    const answers = [];

    if (
        q.includes("what is my name") ||
        q.includes("what's my name")
    ) {
        answers.push(
            memory.name
                ? "Your name is " + memory.name + ", Boss."
                : "You have not told me your name yet, Boss."
        );
    }

    if (
        q.includes("what is my favourite colour") ||
        q.includes("what is my favorite color") ||
        q.includes("what's my favourite colour") ||
        q.includes("what's my favorite color") ||
        q.includes("what is my favourite color") ||
        q.includes("what is my favorite colour")
    ) {
        answers.push(
            memory.colour
                ? "Your favourite colour is " + memory.colour + ", Boss."
                : "You have not told me your favourite colour yet, Boss."
        );
    }

    return answers.length ? answers.join(" ") : null;
}

function speak(text) {
    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";
    speech.rate = 0.92;
    speech.pitch = 0.85;

    speechSynthesis.speak(speech);
}

function getAPIKey() {
    if (apiKey) return true;

    const key = prompt("Enter your Gemini API key:");

    if (!key || !key.trim()) {
        addAI("A Gemini API key is required, Boss.");
        return false;
    }

    apiKey = key.trim();

    localStorage.setItem(API_KEY_STORAGE, apiKey);

    return true;
}

async function askGemini(question) {

    if (!getAPIKey()) return;

    const prompt = `
You are D.I.S.C.O, a personal AI assistant.

Always call the user "Boss".

Use simple natural Indian English.

Be friendly and helpful.

Saved user memory:
${JSON.stringify(memory)}

User question:
${question}
`;

    try {

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
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log("Gemini response:", data);

        if (!response.ok) {

            let reason = "Unknown Gemini error.";

            if (
                data &&
                data.error &&
                data.error.message
            ) {
                reason = data.error.message;
            }

            addAI(
                "Gemini error: " + reason
            );

            return;
        }

        let answer = "";

        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
        ) {
            answer = data.candidates[0].content.parts
                .map(part => part.text || "")
                .join("")
                .trim();
        }

        if (!answer) {
            addAI("Gemini gave an empty response, Boss.");
            return;
        }

        addAI(answer);
        speak(answer);

    } catch (error) {

        console.error(error);

        addAI(
            "Connection error: " + error.message
        );
    }
}

async function sendMessage() {

    const text = msg.value.trim();

    if (!text) return;

    msg.value = "";

    addMessage(text, "user");

    const lower = text.toLowerCase();

    if (
        lower.includes("remember that") ||
        lower.includes("remember my")
    ) {
        if (remember(text)) {
            addAI("Got it, Boss. I have saved that in my memory.");
            return;
        }
    }

    const memoryAnswer = memoryQuestion(text);

    if (memoryAnswer) {
        addAI(memoryAnswer);
        speak(memoryAnswer);
        return;
    }

    await askGemini(text);
}

if (send) {
    send.onclick = sendMessage;
}

if (msg) {
    msg.onkeydown = function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    };
}

if (clearBtn) {
    clearBtn.onclick = function() {
        memory = {};
        localStorage.removeItem(MEMORY_STORAGE);
        addAI("Memory cleared, Boss.");
    };
}

if (changeKey) {
    changeKey.onclick = function() {

        const key = prompt(
            "Enter your new Gemini API key:"
        );

        if (!key || !key.trim()) return;

        apiKey = key.trim();

        localStorage.setItem(
            API_KEY_STORAGE,
            apiKey
        );

        addAI("API key changed, Boss.");
    };
}

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (mic && SpeechRecognition) {

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    mic.onclick = function() {

        try {
            recognition.start();
            mic.textContent = "🔴";
        } catch (error) {
            console.log(error);
        }
    };

    recognition.onresult = function(event) {

        msg.value =
            event.results[0][0].transcript;

        sendMessage();
    };

    recognition.onend = function() {
        mic.textContent = "🎙️";
    };
}

if (imgBtn && imgInput) {
    imgBtn.onclick = function() {
        imgInput.click();
    };

    imgInput.onchange = function() {
        if (imgInput.files.length) {
            addAI("Image selected, Boss.");
        }
    };
}

console.log("D.I.S.C.O loaded successfully.");
