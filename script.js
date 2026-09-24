const API_MODEL = "gemini-3.6-flash";

const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    API_MODEL +
    ":generateContent";

const KEY_NAME = "disco_api_key";
const MEMORY_NAME = "disco_memory";


/* =========================
   HTML ELEMENTS
========================= */

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKey = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");


/* =========================
   API KEY
========================= */

function getApiKey() {
    return localStorage.getItem(KEY_NAME);
}


function askForApiKey() {

    let key = prompt(
        "D.I.S.C.O needs your Gemini API key.\n\n" +
        "Enter your API key below."
    );

    if (!key) {
        return null;
    }

    key = key.trim();

    if (!key) {
        return null;
    }

    localStorage.setItem(KEY_NAME, key);

    return key;
}


/* =========================
   MEMORY
========================= */

function getMemory() {

    try {

        const saved =
            localStorage.getItem(MEMORY_NAME);

        if (!saved) {
            return {};
        }

        return JSON.parse(saved);

    } catch (error) {

        console.log("Memory read error:", error);

        return {};
    }
}


function saveMemory(memory) {

    localStorage.setItem(
        MEMORY_NAME,
        JSON.stringify(memory)
    );
}


/* =========================
   EXTRACT MEMORY
========================= */

function extractMemory(text) {

    const memory = getMemory();

    let changed = false;


    /*
    NAME

    Correctly handles:

    my name is Pranav
    my name is Pranav and my favourite colour is blue
    I am Pranav
    I'm Pranav
    */

    const nameMatch = text.match(
        /(?:my\s+name\s+is|i\s+am|i'm)\s+([a-zA-Z]+)(?=\s+and\s+my\s+favo[u]?rite|\s*[,.!?]|$)/i
    );


    if (nameMatch) {

        const name =
            nameMatch[1].trim();

        if (name) {

            memory.name = name;

            changed = true;
        }
    }


    /*
    FAVOURITE COLOUR

    Handles:

    my favourite colour is blue
    my favorite color is blue
    */

    const colourMatch = text.match(
        /my\s+favo[u]?rite\s+colou?r\s+is\s+([a-zA-Z]+)/i
    );


    if (colourMatch) {

        const colour =
            colourMatch[1].trim();

        if (colour) {

            memory.favouriteColour =
                colour;

            changed = true;
        }
    }


    if (changed) {

        saveMemory(memory);

        console.log(
            "MEMORY SAVED:",
            memory
        );
    }


    return changed;
}


/* =========================
   MEMORY ANSWERS
========================= */

function answerFromMemory(text) {

    const memory =
        getMemory();

    const lower =
        text.toLowerCase().trim();


    /*
    BOTH NAME + COLOUR
    */

    const asksName =
        lower.includes("my name");

    const asksColour =
        lower.includes("favourite colour") ||
        lower.includes("favorite color") ||
        lower.includes("favourite color") ||
        lower.includes("favorite colour");


    if (
        asksName &&
        asksColour
    ) {

        let answer = "";


        if (memory.name) {

            answer +=
                "Your name is " +
                memory.name +
                ", Boss.";
        } else {

            answer +=
                "I don't know your name yet, Boss.";
        }


        answer += "\n";


        if (memory.favouriteColour) {

            answer +=
                "Your favourite colour is " +
                memory.favouriteColour +
                ", Boss.";
        } else {

            answer +=
                "I don't know your favourite colour yet, Boss.";
        }


        return answer;
    }


    /*
    NAME ONLY
    */

    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
        lower.includes("tell me my name") ||
        lower.includes("do you know my name")
    ) {

        if (memory.name) {

            return (
                "Your name is " +
                memory.name +
                ", Boss."
            );
        }


        return (
            "I don't know your name yet, Boss."
        );
    }


    /*
    COLOUR ONLY
    */

    if (
        lower.includes("what is my favourite colour") ||
        lower.includes("what's my favourite colour") ||
        lower.includes("tell me my favourite colour") ||
        lower.includes("what is my favorite color") ||
        lower.includes("what's my favorite color") ||
        lower.includes("tell me my favorite color")
    ) {

        if (memory.favouriteColour) {

            return (
                "Your favourite colour is " +
                memory.favouriteColour +
                ", Boss."
            );
        }


        return (
            "I don't know your favourite colour yet, Boss."
        );
    }


    /*
    SHOW ALL MEMORY
    */

    if (
        lower.includes("what do you remember") ||
        lower.includes("show my memory") ||
        lower.includes("what do you remember about me")
    ) {

        const keys =
            Object.keys(memory);


        if (keys.length === 0) {

            return (
                "My memory is currently empty, Boss."
            );
        }


        let answer =
            "Here is what I remember about you, Boss:\n";


        if (memory.name) {

            answer +=
                "\nName: " +
                memory.name;
        }


        if (memory.favouriteColour) {

            answer +=
                "\nFavourite colour: " +
                memory.favouriteColour;
        }


        return answer;
    }


    return null;
}


/* =========================
   DISPLAY MESSAGE
========================= */

function addMessage(type, text) {

    const message =
        document.createElement("div");

    message.className =
        "msg " + type;

    message.textContent =
        text;

    chat.appendChild(message);


    const terminal =
        document.querySelector(".chat-terminal");


    if (terminal) {

        terminal.scrollTop =
            terminal.scrollHeight;
    }
}


/* =========================
   GEMINI
========================= */

async function askGemini(userText, imageData = null) {

    let apiKey =
        getApiKey();


    if (!apiKey) {

        apiKey =
            askForApiKey();


        if (!apiKey) {

            throw new Error(
                "No API key entered."
            );
        }
    }


    const memory =
        getMemory();


    const memoryText =
        JSON.stringify(memory);


    const systemInstruction = `
You are D.I.S.C.O, a helpful personal AI assistant.

Always call the user "Boss".

Use natural Indian English.

Use simple, clear English commonly understood in India.

Use Indian English spelling and phrasing where appropriate.

Never invent information about the user.

The website has saved memory.

Saved memory:
${memoryText}

Use this memory when the user asks about themselves.

If something is not in the saved memory, say that you do not know it.
`;


    const parts = [

        {
            text:
                systemInstruction +
                "\n\nUser message:\n" +
                userText
        }

    ];


    if (imageData) {

        parts.push({

            inline_data: {

                mime_type:
                    imageData.mimeType,

                data:
                    imageData.base64
            }
        });


        parts.push({

            text:
                "Analyse this image and answer the user's request."
        });
    }


    const response =
        await fetch(

            API_URL +
            "?key=" +
            encodeURIComponent(apiKey),

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    contents: [

                        {

                            role: "user",

                            parts: parts
                        }

                    ]

                })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        console.log(
            "Gemini error:",
            data
        );


        throw new Error(
            data?.error?.message ||
            "Gemini request failed."
        );
    }


    const answer =
        data
            ?.candidates?.[0]
            ?.content?.parts
            ?.map(
                part => part.text || ""
            )
            ?.join("")
            ?.trim();


    if (!answer) {

        throw new Error(
            "Gemini returned an empty response."
        );
    }


    return answer;
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

    const text =
        input.value.trim();


    if (!text) {
        return;
    }


    addMessage(
        "user",
        text
    );


    input.value = "";


    /*
    STEP 1:
    SAVE MEMORY FIRST
    */

    const remembered =
        extractMemory(text);


    /*
    STEP 2:
    CHECK LOCAL MEMORY FIRST

    Gemini is NOT called if
    this is a memory question.
    */

    const memoryAnswer =
        answerFromMemory(text);


    if (memory
