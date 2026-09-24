// ==========================================
// D.I.S.C.O AI
// ==========================================

// ==========================================
// ELEMENTS
// ==========================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKey = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");


// ==========================================
// API KEY
// ==========================================

let API_KEY = localStorage.getItem("disco_api_key");

function askForAPIKey() {
    const key = prompt("Enter your Gemini API Key:");

    if (key && key.trim()) {
        API_KEY = key.trim();

        localStorage.setItem(
            "disco_api_key",
            API_KEY
        );

        add(
            "D.I.S.C.O: API key saved, Boss.",
            "ai"
        );
    }
}

if (!API_KEY) {
    setTimeout(askForAPIKey, 500);
}


// ==========================================
// MEMORY
// ==========================================

let MEMORY = JSON.parse(
    localStorage.getItem("disco_memory") || "[]"
);

function saveMemory() {
    localStorage.setItem(
        "disco_memory",
        JSON.stringify(MEMORY)
    );
}

function addMemory(text) {
    if (!text) return;

    MEMORY.push(text);

    saveMemory();
}

function getMemory() {
    if (MEMORY.length === 0) {
        return "No memories saved.";
    }

    return MEMORY.join("\n");
}


// ==========================================
// ADD MESSAGE
// ==========================================

function add(text, type) {

    const message = document.createElement("div");

    message.className = "msg " + type;

    message.textContent = text;

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;
}


// ==========================================
// MEMORY COMMANDS
// ==========================================

function processMemory(text) {

    const lower = text.toLowerCase().trim();

    // REMEMBER
    if (
        lower.startsWith("remember ") ||
        lower.startsWith("remember that ")
    ) {

        let memory = text
            .replace(/^remember that /i, "")
            .replace(/^remember /i, "")
            .trim();

        if (memory) {

            addMemory(memory);

            add(
                "D.I.S.C.O: I'll remember that, Boss.",
                "ai"
            );

            speak(
                "I'll remember that, Boss."
            );

            return true;
        }
    }


    // SHOW MEMORY
    if (
        lower.includes("what do you remember") ||
        lower.includes("show my memory") ||
        lower === "memory"
    ) {

        add(
            "D.I.S.C.O MEMORY:\n" + getMemory(),
            "ai"
        );

        return true;
    }


    return false;
}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    add(text, "user");

    input.value = "";

    // Memory commands
    if (processMemory(text)) {
        return;
    }

    // Check API key
    if (!API_KEY) {

        add(
            "D.I.S.C.O: Please enter your API key, Boss.",
            "ai"
        );

        askForAPIKey();

        return;
    }

    // Thinking message
    const thinking = document.createElement("div");

    thinking.className = "msg ai";

    thinking.textContent =
        "D.I.S.C.O: Processing...";

    chat.appendChild(thinking);

    chat.scrollTop = chat.scrollHeight;


    try {

        const reply = await askGemini(text);

        thinking.remove();

        add(
            reply,
            "ai"
        );

        speak(reply);

    } catch (error) {

        thinking.remove();

        console.error(error);

        add(
            "D.I.S.C.O: Error connecting to Gemini, Boss.",
            "ai"
        );
    }
}


// ==========================================
// GEMINI
// ==========================================

async function askGemini(text) {

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key="
        + API_KEY;


    const prompt =
        "You are D.I.S.C.O, a helpful AI assistant. " +
        "Answer clearly and simply. " +
        "Call the user Boss. " +
        "Do not repeat the same answer for different questions.\n\n" +
        "User: " + text;


    const response = await fetch(
        url,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
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


    if (!response.ok) {

        const errorText =
            await response.text();

        console.error(errorText);

        throw new Error(
            "Gemini API Error"
        );
    }


    const data =
        await response.json();


    const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;


    if (!reply) {

        throw new Error(
            "No Gemini response"
        );
    }


    return reply;
}


// ==========================================
// SEND BUTTON
// ==========================================

if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );
}


// ==========================================
// ENTER KEY
// ==========================================

if (input) {

    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


// ==========================================
// CHANGE API KEY
// ==========================================

if (changeKey) {

    changeKey.addEventListener(
        "click",
        function () {

            const key = prompt(
                "Enter your new Gemini API Key:"
            );

            if (key && key.trim()) {

                API_KEY = key.trim();

                localStorage.setItem(
                    "disco_api_key",
                    API_KEY
                );

                add(
                    "D.I.S.C.O: API key changed, Boss.",
                    "ai"
                );
            }
        }
    );
}


// ==========================================
// CLEAR MEMORY
// ==========================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            const confirmClear =
                confirm(
                    "Clear all D.I.S.C.O memory?"
                );

            if (!confirmClear) return;

            MEMORY = [];

            localStorage.removeItem(
                "disco_memory"
            );

            add(
                "D.I.S.C.O: Memory cleared, Boss.",
                "ai"
            );

            speak(
                "Memory cleared, Boss."
            );
        }
    );
}


// ==========================================
// MICROPHONE
// ==========================================

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = function () {

        if (mic) {
            mic.textContent = "🔴";
        }
    };


    recognition.onend = function () {

        if (mic) {
            mic.textContent = "🎙️";
        }
    };


    recognition.onerror = function (event) {

        console.error(
            "Microphone error:",
            event.error
        );

        if (mic) {
            mic.textContent = "🎙️";
        }
    };


    recognition.onresult =
        function (event) {

            const result =
                event.results[0][0].transcript;

            input.value = result;

            sendMessage();
        };


    if (mic) {

        mic.addEventListener(
            "click",
            function () {

                try {

                    recognition.start();

                } catch (error) {

                    console.error(error);
                }
            }
        );
    }

} else {

    if (mic) {

        mic.addEventListener(
            "click",
            function () {

                add(
                    "D.I.S.C.O: Speech recognition is not supported in this browser, Boss.",
                    "ai"
                );
            }
        );
    }
}


// ==========================================
// IMAGE BUTTON
// ==========================================

if (imgBtn && imgInput) {

    imgBtn.addEventListener(
        "click",
        function () {

            imgInput.click();

        }
    );


    imgInput.addEventListener(
        "change",
        function () {

            const file =
                imgInput.files[0];

            if (!file) return;


            add(
                "Image selected: " + file.name,
                "user"
            );


            add(
                "D.I.S.C.O: Image received, Boss.",
                "ai"
            );


            speak(
                "Image received, Boss."
            );
        }
    );
}


// ==========================================
// VOICE OUTPUT
// ==========================================

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    window.speechSynthesis.cancel();


    const cleanText =
        text
            .replace(/[*#_`]/g, "")
            .trim();


    if (!cleanText) return;


    const speech =
        new SpeechSynthesisUtterance(
            cleanText
        );


    speech.lang = "en-IN";

    speech.rate = 0.9;

    speech.pitch = 1;


    window.speechSynthesis.speak(
        speech
    );
}


// ==========================================
// STARTUP MESSAGE
// ==========================================

console.log(
    "D.I.S.C.O script loaded successfully."
);
