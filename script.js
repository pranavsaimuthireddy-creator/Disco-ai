// ==========================================
// D.I.S.C.O AI
// MEMORY + GEMINI + VOICE + VISION
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
    localStorage.getItem("disco_memory") || "{}"
);


function saveMemory() {

    localStorage.setItem(
        "disco_memory",
        JSON.stringify(MEMORY)
    );
}


// ==========================================
// UNDERSTAND MEMORY
// ==========================================

function rememberInformation(text) {

    let changed = false;

    // NAME
    const nameMatch =
        text.match(
            /(?:my name is|name is)\s+([A-Za-z ]+)/i
        );

    if (nameMatch) {

        let name =
            nameMatch[1]
                .replace(
                    /\s+(and|in|is|my|favourite|favorite).*$/i,
                    ""
                )
                .trim();

        if (name) {

            MEMORY.name = name;

            changed = true;
        }
    }


    // FAVOURITE COLOUR
    const colourMatch =
        text.match(
            /(?:my )?(?:favourite|favorite) colou?r is\s+([A-Za-z]+)/i
        );

    if (colourMatch) {

        MEMORY.favouriteColour =
            colourMatch[1].trim();

        changed = true;
    }


    // LIKES
    const likesMatch =
        text.match(
            /(?:i like|i love)\s+(.+)/i
        );

    if (likesMatch) {

        let thing =
            likesMatch[1]
                .replace(
                    /\s+(and|also).*$/i,
                    ""
                )
                .trim();

        if (thing) {

            if (!MEMORY.likes) {
                MEMORY.likes = [];
            }

            MEMORY.likes.push(thing);

            changed = true;
        }
    }


    // GENERAL MEMORY
    if (
        !nameMatch &&
        !colourMatch &&
        !likesMatch
    ) {

        if (!MEMORY.notes) {
            MEMORY.notes = [];
        }

        MEMORY.notes.push(text);

        changed = true;
    }


    if (changed) {
        saveMemory();
    }

    return changed;
}


// ==========================================
// MEMORY COMMAND
// ==========================================

function processMemory(text) {

    const lower =
        text.toLowerCase().trim();


    // REMEMBER
    if (
        lower.startsWith("remember ") ||
        lower.startsWith("remember that ")
    ) {

        const memoryText =
            text
                .replace(/^remember that\s+/i, "")
                .replace(/^remember\s+/i, "")
                .trim();


        if (memoryText) {

            rememberInformation(memoryText);


            let reply =
                "Got it, Boss. I'll remember that.";

            if (MEMORY.name) {

                reply +=
                    " Your name is " +
                    MEMORY.name + ".";
            }

            if (MEMORY.favouriteColour) {

                reply +=
                    " Your favourite colour is " +
                    MEMORY.favouriteColour + ".";
            }


            addMessage(
                reply,
                "ai"
            );

            speak(reply);

            return true;
        }
    }


    // SHOW MEMORY
    if (
        lower === "memory" ||
        lower.includes("show my memory") ||
        lower.includes("what do you remember")
    ) {

        let memoryText =
            formatMemory();

        addMessage(
            memoryText,
            "ai"
        );

        return true;
    }


    // FORGET EVERYTHING
    if (
        lower === "forget everything" ||
        lower === "clear memory"
    ) {

        MEMORY = {};

        saveMemory();

        addMessage(
            "D.I.S.C.O: All memory cleared, Boss.",
            "ai"
        );

        speak(
            "All memory cleared, Boss."
        );

        return true;
    }


    return false;
}


// ==========================================
// FORMAT MEMORY
// ==========================================

function formatMemory() {

    let result =
        "D.I.S.C.O MEMORY:\n";


    if (MEMORY.name) {

        result +=
            "Name: " +
            MEMORY.name +
            "\n";
    }


    if (MEMORY.favouriteColour) {

        result +=
            "Favourite colour: " +
            MEMORY.favouriteColour +
            "\n";
    }


    if (
        MEMORY.likes &&
        MEMORY.likes.length > 0
    ) {

        result +=
            "Likes: " +
            MEMORY.likes.join(", ") +
            "\n";
    }


    if (
        MEMORY.notes &&
        MEMORY.notes.length > 0
    ) {

        result +=
            "Other memories:\n";

        MEMORY.notes.forEach(
            function(note) {

                result +=
                    "- " +
                    note +
                    "\n";
            }
        );
    }


    if (
        !MEMORY.name &&
        !MEMORY.favouriteColour &&
        (!MEMORY.likes ||
            MEMORY.likes.length === 0) &&
        (!MEMORY.notes ||
            MEMORY.notes.length === 0)
    ) {

        result +=
            "No memories saved.";
    }


    return result;
}


// ==========================================
// ANSWER PERSONAL QUESTIONS FROM MEMORY
// ==========================================

function answerFromMemory(text) {

    const lower =
        text.toLowerCase();


    // NAME
    if (
        lower.includes("
