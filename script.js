// ==========================================
// D.I.S.C.O AI - COMPLETE SCRIPT
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");

const mic =
    document.getElementById("mic-btn") ||
    document.getElementById("mic");

const clearBtn =
    document.getElementById("clear-btn");

const imgInput =
    document.getElementById("img-input");


// ==========================================
// API KEY
// ==========================================

let API_KEY =
    localStorage.getItem("disco_api_key");

if (!API_KEY) {

    API_KEY = prompt(
        "Enter your Gemini API Key:"
    );

    if (API_KEY && API_KEY.trim()) {

        API_KEY = API_KEY.trim();

        localStorage.setItem(
            "disco_api_key",
            API_KEY
        );
    }
}


// ==========================================
// GEMINI MODEL
// ==========================================

const MODEL =
    "gemini-3.6-flash";


// ==========================================
// MEMORY
// ==========================================

let MEMORY = JSON.parse(
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


function remember(text) {

    MEMORY.push({
        type: "memory",
        text: text
    });

    saveMemory();

}


function getMemory() {

    const memories =
        MEMORY.filter(
            item =>
                item.type === "memory"
        );

    if (memories.length === 0) {

        return "No saved memories yet.";

    }

    return memories
        .slice(-20)
        .map(
            item =>
                "- " + item.text
        )
        .join("\n");
}


// ==========================================
// ASK GEMINI
// ==========================================

async function askGemini(question) {

    add(
        "D.I.S.C.O: Thinking...",
        "ai"
    );


    if (!API_KEY) {

        chat.lastChild.innerText =
            "D.I.S.C.O: API key is missing.";

        return;
    }


    try {

        const memoryText =
            getMemory();


        const prompt = `
You are D.I.S.C.O, a helpful personal AI assistant.

Call the user Boss.

Answer clearly and simply.

IMPORTANT:
Use the user's saved memories when answering questions.

SAVED USER MEMORIES:
${memoryText}

CURRENT USER MESSAGE:
${question}
`;


        const response =
            await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
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


        MEMORY.push({
            type: "chat",
            role: "user",
            text: question
        });


        MEMORY.push({
            type: "chat",
            role: "model",
            text: reply
        });


        saveMemory();


        chat.lastChild.innerText =
            "D.I.S.C.O: " + reply;


        speak(reply);


    } catch (error) {

        chat.lastChild.innerText =
            "D.I.S.C.O: ERROR - " +
            error.message;

    }
}


// ==========================================
// SEND BUTTON
// ==========================================

if (send) {

    send.onclick = () => {

        const text =
            input.value.trim();


        if (!text) return;


        add(
            "YOU: " + text,
            "user"
        );


        input.value = "";


        const lower =
            text.toLowerCase();


        // Explicit memory commands

        if (
            lower.startsWith(
                "remember that "
            ) ||

            lower.startsWith(
                "remember "
            ) ||

            lower.includes(
                "my favourite "
            ) ||

            lower.includes(
                "my favorite "
            )
        ) {

            remember(text);


            add(
                "D.I.S.C.O: Got it, Boss. I'll remember that.",
                "ai"
            );


            speak(
                "Got it, Boss. I'll remember that."
            );


            return;
        }


        askGemini(text);

    };

}


// ==========================================
// ENTER KEY
// ==========================================

if (input) {

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                send.click();

            }

        }
    );

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


    mic.onclick = () => {

        recognition.start();

        mic.innerText =
            "🔴";

    };


    recognition.onresult =
        event => {

            const text =
                event.results[0][0]
                    .transcript;


            input.value =
                text;


            mic.innerText =
                "🎙️";


            send.click();

        };


    recognition.onerror =
        () => {

            mic.innerText =
                "🎙️";

        };


    recognition.onend =
        () => {

            mic.innerText =
                "🎙️";

        };

}


// ==========================================
// CLEAR MEMORY
// ==========================================

if (clearBtn) {

    clearBtn.onclick = () => {

        MEMORY = [];

        saveMemory();

        chat.innerHTML = "";


        add(
            "D.I.S.C.O: Memory cleared, Boss.",
            "ai"
        );

    };

}


// ==========================================
// IMAGE INPUT
// ==========================================

if (imgInput) {

    imgInput.onchange = () => {

        const file =
            imgInput.files[0];


        if (!file) return;


        add(
            "YOU: [Image selected]",
            "user"
        );


        add(
            "D.I.S.C.O: Image selected.",
            "ai"
        );

    };

}


// ==========================================
// AI VOICE
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
    who
) {

    const div =
        document.createElement(
            "div"
        );


    div.className =
        "msg " + who;


    div.innerText =
        text;


    chat.appendChild(
        div
    );


    chat.scrollTop =
        chat.scrollHeight;

}
