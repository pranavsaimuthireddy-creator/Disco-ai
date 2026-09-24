// ==========================================
// D.I.S.C.O AI
// FULL SCRIPT
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

        addMessage(
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

function addMessage(text, type) {

    const message =
        document.createElement("div");

    message.className =
        "msg " + type;

    message.textContent = text;

    chat.appendChild(message);

    chat.scrollTop =
        chat.scrollHeight;
}


// ==========================================
// MEMORY PROCESSING
// ==========================================

function processMemory(text) {

    const lower =
        text.toLowerCase().trim();


    // REMEMBER
    if (
        lower.startsWith("remember ") ||
        lower.startsWith("remember that ")
    ) {

        let memory =
            text
                .replace(/^remember that /i, "")
                .replace(/^remember /i, "")
                .trim();


        if (memory) {

            addMemory(memory);

            addMessage(
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

        addMessage(
            "D.I.S.C.O MEMORY:\n" +
            getMemory(),
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

    const text =
        input.value.trim();


    if (!text) {

        return;
    }


    addMessage(
        text,
        "user"
    );


    input.value = "";


    // MEMORY COMMAND
    if (processMemory(text)) {

        return;
    }


    // API CHECK
    if (!API_KEY) {

        addMessage(
            "D.I.S.C.O: API key required, Boss.",
            "ai"
        );

        askForAPIKey();

        return;
    }


    // PROCESSING MESSAGE
    const thinking =
        document.createElement("div");

    thinking.className =
        "msg ai";

    thinking.textContent =
        "D.I.S.C.O: Processing...";

    chat.appendChild(thinking);

    chat.scrollTop =
        chat.scrollHeight;


    try {

        const reply =
            await askGemini(text);


        thinking.remove();


        addMessage(
            reply,
            "ai"
        );


        speak(reply);


    } catch (error) {

        thinking.remove();

        console.error(error);

        addMessage(
            "D.I.S.C.O: Gemini connection error, Boss.",
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


    const memoryText =
        getMemory();


    const prompt =
        "You are D.I.S.C.O, a helpful AI assistant. " +
        "Call the user Boss. " +
        "Answer clearly and simply. " +
        "Give different answers depending on the user's question.\n\n" +

        "USER MEMORY:\n" +
        memoryText +
        "\n\nUSER MESSAGE:\n" +
        text;


    const response =
        await fetch(
            url,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
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

        const error =
            await response.text();

        console.error(error);

        throw new Error(
            "Gemini API Error"
        );
    }


    const data =
        await response.json();


    const reply =
        data
        ?.candidates
        ?.[
