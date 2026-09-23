// ==========================================
// D.I.S.C.O AI
// ==========================================

// ELEMENTS

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");

const mic =
    document.getElementById("mic-btn") ||
    document.getElementById("mic");

const clearBtn = document.getElementById("clear-btn");
const changeKey = document.getElementById("change-key");
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

    setTimeout(
        askForAPIKey,
        500
    );
}


if (changeKey) {

    changeKey.onclick = () => {

        localStorage.removeItem(
            "disco_api_key"
        );

        API_KEY = "";

        askForAPIKey();
    };
}


// ==========================================
// MODEL
// ==========================================

const MODEL = "gemini-3.6-flash";


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


// ==========================================
// ADD MEMORY
// ==========================================

function addMemory(fact) {

    MEMORY.push({
        type: "memory",
        text: fact,
        date: new Date().toISOString()
    });

    saveMemory();
}


// ==========================================
// GET MEMORY
// ==========================================

function getMemory() {

    const memories = MEMORY.filter(
        item => item.type === "memory"
    );

    if (memories.length === 0) {

        return "No saved memories.";

    }

    return memories
        .slice(-30)
        .map(item => "- " + item.text)
        .join("\n");
}


// ==========================================
// DETECT MEMORY
// ==========================================

function processMemory(text) {

    const lower = text.toLowerCase().trim();


    // --------------------------------------
    // DO NOT SAVE QUESTIONS
    // --------------------------------------

    if (
        lower.endsWith("?") ||
        lower.startsWith("what ") ||
        lower.startsWith("what's ") ||
        lower.startsWith("whats ") ||
        lower.startsWith("which ") ||
        lower.startsWith("who ") ||
        lower.startsWith("where ") ||
        lower.startsWith("when ") ||
        lower.startsWith("why ") ||
        lower.startsWith("how ")
    ) {

        return false;
    }


    // --------------------------------------
    // "REMEMBER THAT..."
    // --------------------------------------

    if (
        lower.startsWith("remember that ")
    ) {

        const fact =
            text.substring(14).trim();

        if (fact) {

            addMemory(fact);

            return true;
        }
    }


    // --------------------------------------
    // "REMEMBER..."
    // --------------------------------------

    if (
        lower.startsWith("remember ")
    ) {

        const fact =
            text.substring(9).trim();

        if (fact) {

            addMemory(fact);

            return true;
        }
    }


    // --------------------------------------
    // "MY FAVOURITE X
