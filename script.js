// ==========================================
// D.I.S.C.O AI - MAIN SCRIPT
// ==========================================

// ---------- API KEY ----------

let API_KEY = localStorage.getItem("disco_key");

if (!API_KEY) {
    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        API_KEY = API_KEY.trim();
        localStorage.setItem("disco_key", API_KEY);
    }
}


// ---------- MODELS ----------

const MODELS = [
    "gemini-3.6-flash",
    "gemini-flash-latest"
];


// ---------- ELEMENTS ----------

const chat = document.getElementById("chat");
const input = document.getElementById("msg");

const send = document.getElementById("send");

const mic =
    document.getElementById("mic-btn") ||
    document.getElementById("mic");

const clearBtn =
    document.getElementById("clear-btn");

const camBtn =
    document.getElementById("cam-btn");

const imgInput =
    document.getElementById("img-input");


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
// GEMINI BRAIN
// ==========================================

async function callGemini(question) {

    const contents = MEMORY
        .slice(-12)
        .map(m => ({
            role: m.role,
            parts: [
                {
                    text: m.text
                }
            ]
        }));


    contents.push({
        role: "user",
        parts: [
            {
                text: question
            }
        ]
    });


    let lastError = null;


    for (const model of MODELS) {

        try {

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        contents: contents
                    })
                }
            );


            const data = await response.json();


            if (data.error) {

                lastError =
                    new Error(data.error.message);

                continue;
            }


            const reply =
                data.candidates?.[0]
                    ?.content?.parts?.[0]?.text;


            if (!reply) {

                throw new Error(
                    "No reply received."
                );

            }


            return reply;


        } catch (error) {

            lastError = error;

        }

    }


    throw lastError ||
        new Error("Gemini request failed.");
}


// ==========================================
// ASK D.I.S.C.O
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

        const reply =
            await callGemini(question);


        MEMORY.push({
            role: "user",
            text: question
        });


        MEMORY.push({
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
// SEND
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


        askGemini(text);

    };

}


// ==========================================
// ENTER KEY
// ==========================================

input.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            send.click();

        }

    }
);


// ==========================================
// MICROPHONE
// ==========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition && mic) {

    const recognition =
        new SpeechRecognition();


    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    mic.onclick = () => {

        recognition.start();

        mic.innerText =
            "🔴";

    };


    recognition.onresult = event => {

        const text =
            event.results[0][0]
                .transcript;


        input.value = text;

        mic.innerText =
            "🎙️";


        send.click();

    };


    recognition.onerror = () => {

        mic.innerText =
            "🎙️";

    };


    recognition.onend = () => {

        mic.innerText =
            "🎙️";

    };

}


// ==========================================
// IMAGE / CAMERA
// ==========================================

if (camBtn && imgInput) {

    camBtn.onclick = () => {

        imgInput.click();

    };


    imgInput.onchange = () => {

        const file =
            imgInput.files[0];


        if (!file) return;


        const reader =
            new FileReader();


        reader.onload = () => {

            const base64 =
                reader.result.split(",")[1];


            const question =
                input.value.trim() ||
                "What do you see in this image?";


            add(
                "YOU: [IMAGE] " + question,
                "user"
            );


            askVision(
                base64,
                file.type,
                question
            );

        };


        reader.readAsDataURL(file);

    };

}


// ==========================================
// VISION
// ==========================================

async function askVision(
    base64,
    mime,
    question
) {

    add(
        "D.I.S.C.O: Analyzing image...",
        "ai"
    );


    try {

        const response =
            await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${MODELS[0]}:generateContent?key=${API_KEY}`,
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

                                parts: [

                                    {
                                        text:
                                            "You are D.I.S.C.O. " +
                                            "Describe the image clearly and simply.\n\n" +
                                            question
                                    },

                                    {
                                        inline_data: {
                                            mime_type: mime,
                                            data: base64
                                        }
                                    }

                                ]

                            }
                        ]

                    })

                }
            );


        const data =
            await response.json();


        if (data.error) {

            throw new Error(
                data.error.message
            );

        }


        const reply =
            data.candidates?.[0]
                ?.content?.parts?.[0]?.text;


        if (!reply) {

            throw new Error(
                "No vision reply received."
            );

        }


        MEMORY.push({
            role: "user",
            text: question
        });


        MEMORY.push({
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
// CLEAR MEMORY
// ==========================================

if (clearBtn) {

    clearBtn.onclick = () => {

        MEMORY = [];

        saveMemory();

        chat.innerHTML = "";

        add(
            "D.I.S.C.O: Memory cleared.",
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
        new SpeechSynthesisUtterance(text);


    voice.lang = "en-IN";

    voice.rate = 1;

    voice.pitch = 0.85;


    speechSynthesis.speak(voice);

}


// ==========================================
// ADD MESSAGE
// ==========================================

function add(text, who) {

    const div =
        document.createElement("div");


    div.className =
        "msg " + who;


    div.innerText =
        text;


    chat.appendChild(div);


    chat.scrollTop =
        chat.scrollHeight;

                                }
