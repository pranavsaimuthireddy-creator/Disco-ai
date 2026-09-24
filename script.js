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

let API_KEY =
    localStorage.getItem("disco_api_key");


function askForAPIKey() {

    const key =
        prompt("Enter your Gemini API Key:");

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


// ==========================================
// CHANGE API KEY
// ==========================================

if (changeKey) {

    changeKey.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "disco_api_key"
            );

            API_KEY = "";

            askForAPIKey();

        }
    );
}


// ==========================================
// MEMORY
// ==========================================

let MEMORY =
    JSON.parse(
        localStorage.getItem(
            "disco_memory"
        ) || "[]"
    );


// Stores the user's previous message
let LAST_USER_MESSAGE = "";


// ==========================================
// SAVE MEMORY
// ==========================================

function saveMemory() {

    localStorage.setItem(
        "disco_memory",
        JSON.stringify(MEMORY)
    );
}


// ==========================================
// GET MEMORY
// ==========================================

function getMemory() {

    const memories =
        MEMORY.filter(
            item =>
                item.type === "memory"
        );


    if (memories.length === 0) {

        return "No saved memories.";

    }


    return memories
        .slice(-30)
        .map(
            item =>
                "- " + item.text
        )
        .join("\n");
}


// ==========================================
// ADD MEMORY
// ==========================================

function addMemory(text) {

    MEMORY.push({

        type: "memory",

        text: text,

        date:
            new Date().toISOString()

    });

    saveMemory();
}


// ==========================================
// MEMORY DETECTION
// ==========================================

function processMemory(text) {

    const lower =
        text.toLowerCase().trim();


    // --------------------------------------
    // QUESTIONS ARE NOT MEMORY COMMANDS
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
    // "REMEMBER IT"
    // --------------------------------------

    if (
        lower === "remember it" ||
        lower === "remember that" ||
        lower === "remember this"
    ) {

        if (LAST_USER_MESSAGE) {

            addMemory(
                LAST_USER_MESSAGE
            );

            return true;

        }

        return false;
    }


    // --------------------------------------
    // "REMEMBER THAT ..."
    // --------------------------------------

    if (
        lower.startsWith(
            "remember that "
        )
    ) {

        const fact =
            text
                .substring(14)
                .trim();

        if (fact) {

            addMemory(fact);

            return true;
        }
    }


    // --------------------------------------
    // "REMEMBER ..."
    // --------------------------------------

    if (
        lower.startsWith(
            "remember "
        )
    ) {

        const fact =
            text
                .substring(9)
                .trim();

        if (fact) {

            addMemory(fact);

            return true;
        }
    }


    // --------------------------------------
    // "MY NAME IS ..."
    // --------------------------------------

    const nameMatch =
        text.match(
            /^my\s+name\s+is\s+(.+)$/i
        );


    if (nameMatch) {

        const name =
            nameMatch[1].trim();

        addMemory(
            `User's name is ${name}.`
        );

        return true;
    }


    // --------------------------------------
    // "I LIKE ..."
    // --------------------------------------

    const likeMatch =
        text.match(
            /^i\s+like\s+(.+)$/i
        );


    if (likeMatch) {

        const thing =
            likeMatch[1].trim();

        addMemory(
            `User likes ${thing}.`
        );

        return true;
    }


    // --------------------------------------
    // "MY FAVOURITE X IS Y"
    // --------------------------------------

    const favourite =
        text.match(
            /^my\s+(favourite|favorite)\s+(.+?)\s+is\s+(.+)$/i
        );


    if (favourite) {

        const item =
            favourite[2].trim();

        const value =
            favourite[3].trim();

        addMemory(
            `User's favourite ${item} is ${value}.`
        );

        return true;
    }


    return false;
}


// ==========================================
// SEND BUTTON
//
