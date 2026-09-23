// ==========================================
// D.I.S.C.O AI
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const chat =
    document.getElementById("chat");

const input =
    document.getElementById("msg");

const send =
    document.getElementById("send");

const mic =
    document.getElementById("mic");

const clearBtn =
    document.getElementById("clear-btn");

const changeKey =
    document.getElementById("change-key");

const imgBtn =
    document.getElementById("img-btn");

const imgInput =
    document.getElementById("img-input");


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
        function() {

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


function saveMemory() {

    localStorage.setItem(
        "disco_memory",
        JSON.stringify(MEMORY)
    );
}


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
// MEMORY DETECTION
// ==========================================

function processMemory(text) {

    const lower =
        text.toLowerCase().trim();


    // Questions are NOT memory commands

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


    // Remember that...

    if (
        lower.startsWith(
            "remember that "
        )
    ) {

        const fact =
            text.substring(14).trim();

        if (fact) {

            MEMORY.push({

                type: "memory",

                text: fact,

                date:
                    new Date().toISOString()

            });

            saveMemory();

            return true;
        }
    }


    // Remember...

    if (
        lower.startsWith(
            "remember "
        )
    ) {

        const fact =
            text.substring(9).trim();

        if (fact) {

            MEMORY.push({

                type: "memory",

                text: fact,

                date:
                    new Date().toISOString()

            });

            saveMemory();

            return true;
        }
    }


    // My favourite X is Y

    const favourite =
        text.match(
            /^my\s+(favourite|favorite)\s+(.+?)\s+is\s+(.+)$/i
        );


    if (favourite) {

        const item =
            favourite[2].trim();

        const value =
            favourite[3].trim();


        MEMORY.push({

            type: "memory",

            text:
                `User's favourite ${item} is ${value}.`,

            date:
                new Date().toISOString()

        });


        saveMemory();

        return true;
    }


    return false;
}


// ==========================================
// SEND BUTTON
// ==========================================

if (send) {

    send.addEventListener(
        "click",
        function() {

            sendMessage();

        }
    );
}


// ==========================================
// SEND MESSAGE
// ==========================================

function sendMessage() {

    const text =
        input.value.trim();


    if (!text) {

        return;
    }


    // Show user message

    add(
        "YOU: " + text,
        "user"
    );


    // Clear input

    input.value = "";


    // Check memory

    if (
        processMemory(text)
    ) {

        const reply =
            "Got it, Boss. I'll remember that.";


        add(
            "D.I.S.C.O: " + reply,
            "ai"
        );


        speak(reply);

        return;
    }


    // Ask Gemini

    askGemini(text);
}


// ==========================================
// ENTER KEY
// ==========================================

if (input) {

    input.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                sendMessage();

            }

        }
    );
}


// ==========================================
// GEMINI AI
// ==========================================

async function askGemini(question) {

    add(
        "D.I.S.C.O: Thinking...",
        "ai"
    );


    if (!API_KEY) {

        chat.lastChild.innerText =
            "D.I.S.C.O: API key missing. Tap 🔑 KEY.";

        return;
    }


    try {

        const prompt = `

You are D.I.S.C.O, a helpful personal AI assistant.

Call the user Boss.

Answer clearly and simply.

Use saved memories when they are relevant.

SAVED USER MEMORIES:

${getMemory()}


CURRENT USER MESSAGE:

${question}


IMPORTANT:

If the user asks about something stored in memory,
use that memory to answer.

Do not say "I'll remember that"
unless the user is actually giving you
something to remember.

`;


        const response =
            await fetch(

                `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            contents: [

                                {

                                    parts: [

                                        {

                                            text:
                                                prompt

                                        }

                                    ]

                                }

                            ]

                        })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.error?.message ||
                "Gemini API error"

            );

        }


        const reply =
            data.candidates?.[0]
                ?.content?.parts?.[0]
                ?.text;


        if (!reply) {

            throw new Error(
                "No reply received."
            );

        }


        chat.lastChild.innerText =
            "D.I.S.C.O: " +
            reply;


        speak(reply);


    } catch (error) {

        chat.lastChild.innerText =
            "D.I.S.C.O: ERROR - " +
            error.message;

    }
}


// ==========================================
// MICROPHONE
// ==========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (
    SpeechRecognition &&
    mic
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

            recognition.start();

            mic.innerText =
                "😮";

        }
    );


    recognition.onresult =
        function(event) {

            const text =
                event
                    .results[0][0]
                    .transcript;


            input.value =
                text;


            mic.innerText =
                "🎙️";


            sendMessage();

        };


    recognition.onerror =
        function() {

            mic.innerText =
                "🎙️";

        };


    recognition.onend =
        function() {

            mic.innerText =
                "🎙️";

        };

}


// ==========================================
// CLEAR MEMORY
// ==========================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function() {

            MEMORY = [];

            saveMemory();

            chat.innerHTML = "";


            add(
                "D.I.S.C.O: Memory cleared, Boss.",
                "ai"
            );

        }
    );

}


// ==========================================
// IMAGE BUTTON
// ==========================================

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

            const file =
                imgInput.files[0];


            if (!file) {

                return;
            }


            add(
                "YOU: [Image selected]",
                "user"
            );


            add(
                "D.I.S.C.O: Image selected, Boss.",
                "ai"
            );

        }
    );

}


// ==========================================
// VOICE
// ==========================================

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    speechSynthesis.cancel();


    const voice =
        new SpeechSynthesisUtterance(
            text
        );


    voice.lang =
        "en-IN";


    voice.rate =
        1;


    voice.pitch =
        0.85;


    speechSynthesis.speak(
        voice
    );

}


// ==========================================
// ADD MESSAGE
// ==========================================

function add(
    text,
    type
) {

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "msg " + type;


    div.innerText =
        text;


    chat.appendChild(
        div
    );


    chat.scrollTop =
        chat.scrollHeight;

        }
