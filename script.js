// =====================================================
// D.I.S.C.O
// AI + MEMORY + VOICE
// =====================================================

const API_KEY_STORAGE = "disco_api_key";
const MEMORY_STORAGE = "disco_memory";

const MODEL = "gemini-3.8-flash";

let apiKey = localStorage.getItem(API_KEY_STORAGE) || "";

let memory = JSON.parse(
    localStorage.getItem(MEMORY_STORAGE) || "{}"
);


// =====================================================
// ELEMENTS
// =====================================================

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKey = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");


// =====================================================
// CHAT DISPLAY
// =====================================================

function addMessage(text, type) {

    const div = document.createElement("div");

    div.className = "msg " + type;

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


function addAI(text) {

    addMessage(
        "D.I.S.C.O: " + text,
        "ai"
    );

}


// =====================================================
// VOICE
// =====================================================

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";

    speech.rate = 0.92;

    speech.pitch = 0.85;

    const voices =
        window.speechSynthesis.getVoices();

    const maleVoice =
        voices.find(function (voice) {

            const name =
                voice.name.toLowerCase();

            return (
                voice.lang.toLowerCase().startsWith("en-in") &&
                (
                    name.includes("male") ||
                    name.includes("man") ||
                    name.includes("ravi")
                )
            );

        });

    if (maleVoice) {
        speech.voice = maleVoice;
    }

    window.speechSynthesis.speak(speech);
}


// =====================================================
// API KEY
// =====================================================

function getAPIKey() {

    if (apiKey) {
        return true;
    }

    const key =
        prompt("Enter your Gemini API key:");

    if (!key || !key.trim()) {

        addAI(
            "I need a Gemini API key before I can answer, Boss."
        );

        return false;
    }

    apiKey = key.trim();

    localStorage.setItem(
        API_KEY_STORAGE,
        apiKey
    );

    return true;
}


// =====================================================
// MEMORY
// =====================================================

function saveMemory() {

    localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memory)
    );

}


function remember(text) {

    let saved = false;

    // NAME

    const nameMatch =
        text.match(
            /my\s+name\s+is\s+([a-zA-Z]+)/i
        );

    if (nameMatch) {

        memory.name =
            nameMatch[1];

        saved = true;
    }


    // FAVOURITE COLOUR

    const colourMatch =
        text.match(
            /my\s+favou?rite\s+colou?r\s+is\s+([a-zA-Z]+)/i
        );

    if (colourMatch) {

        memory.colour =
            colourMatch[1];

        saved = true;
    }


    // FAVOURITE BIKE

    const bikeMatch =
        text.match(
            /my\s+favou?rite\s+bike\s+is\s+(.+?)(?:\s+and\s+my|\s*$)/i
        );

    if (bikeMatch) {

        memory.bike =
            bikeMatch[1].trim();

        saved = true;
    }


    if (saved) {
        saveMemory();
    }

    return saved;
}


// =====================================================
// MEMORY QUESTIONS
// =====================================================

function memoryQuestion(text) {

    const q =
        text.toLowerCase();

    const answers = [];


    // NAME

    if (
        q.includes("what is my name") ||
        q.includes("what's my name") ||
        q.includes("do you know my name")
    ) {

        if (memory.name) {

            answers.push(
                "Your name is " +
                memory.name +
                ", Boss."
            );

        } else {

            answers.push(
                "You have not told me your name yet, Boss."
            );

        }
    }


    // COLOUR

    if (
        q.includes("what is my favourite colour") ||
        q.includes("what is my favorite color") ||
        q.includes("what's my favourite colour") ||
        q.includes("what's my favorite color") ||
        q.includes("what is my favourite color") ||
        q.includes("what is my favorite colour")
    ) {

        if (memory.colour) {

            answers.push(
                "Your favourite colour is " +
                memory.colour +
                ", Boss."
            );

        } else {

            answers.push(
                "You have not told me your favourite colour yet, Boss."
            );

        }
    }


    // BIKE

    if (
        q.includes("what is my favourite bike") ||
        q.includes("what is my favorite bike") ||
        q.includes("what's my favourite bike") ||
        q.includes("what's my favorite bike")
    ) {

        if (memory.bike) {

            answers.push(
                "Your favourite bike is " +
                memory.bike +
                ", Boss."
            );

        } else {

            answers.push(
                "You have not told me your favourite bike yet, Boss."
            );

        }
    }


    if (answers.length > 0) {

        return answers.join(" ");

    }

    return null;
}


// =====================================================
// GEMINI
// =====================================================

async function askGemini(question) {

    if (!getAPIKey()) {
        return;
    }


    const memoryData =
        JSON.stringify(memory);


    const prompt = `
You are D.I.S.C.O, a personal AI assistant.

Always call the user "Boss".

Use simple natural Indian English.

Be friendly and helpful.

Do not invent information about the user.

The user's saved local memory is:

${memoryData}

Use this memory when relevant.

User's question:

${question}
`;


    try {

        const response =
            await fetch(
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


        const data =
            await response.json();


        if (!response.ok) {

            console.error(
                "Gemini error:",
                data
            );


            if (
                response.status === 401 ||
                response.status === 403
            ) {

                addAI(
                    "Your Gemini API key is invalid or does not have access, Boss."
                );

            } else if (
                response.status === 429
            ) {

                addAI(
                    "Gemini's request limit has been reached, Boss."
                );

            } else {

                addAI(
                    "Gemini returned an error, Boss."
                );
            }

            return;
        }


        let answer = "";


        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
        ) {

            answer =
                data.candidates[0].content.parts
                    .map(function (part) {
                        return part.text || "";
                    })
                    .join("")
                    .trim();

        }


        if (!answer) {

            answer =
                "I could not generate a response, Boss.";

        }


        addAI(answer);

        speak(answer);

    }

    catch (error) {

        console.error(
            "Connection error:",
            error
        );

        addAI(
            "I could not connect to Gemini right now, Boss."
        );
    }

}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    const text =
        msg.value.trim();


    if (!text) {
        return;
    }


    msg.value = "";


    addMessage(
        text,
        "user"
    );


    // MEMORY STATEMENT

    const lower =
        text.toLowerCase();


    if (
        lower.includes("remember that") ||
        lower.includes("remember my")
    ) {

        if (remember(text)) {

            addAI(
                "Got it, Boss. I have saved that in my memory."
            );

            return;
        }
    }


    // MEMORY QUESTION

    const savedAnswer =
        memoryQuestion(text);


    if (savedAnswer) {

        addAI(savedAnswer);

        speak(savedAnswer);

        return;
    }


    // NORMAL GEMINI QUESTION

    const thinking =
        document.createElement("div");

    thinking.className =
        "msg ai";

    thinking.textContent =
        "D.I.S.C.O: Thinking...";

    chat.appendChild(thinking);

    chat.scrollTop =
        chat.scrollHeight;


    await askGemini(text);


    if (thinking.parentNode) {
        thinking.remove();
    }

}


// =====================================================
// SEND BUTTON
// =====================================================

if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );

}


// =====================================================
// ENTER
// =====================================================

if (msg) {

    msg.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// =====================================================
// CLEAR MEMORY
// =====================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function () {

            memory = {};

            localStorage.removeItem(
                MEMORY_STORAGE
            );

            addAI(
                "Memory cleared, Boss."
            );

        }
    );

}


// =====================================================
// CHANGE API KEY
// =====================================================

if (changeKey) {

    changeKey.addEventListener(
        "click",
        function () {

            const newKey =
                prompt(
                    "Enter your new Gemini API key:"
                );


            if (!newKey || !newKey.trim()) {
                return;
            }


            apiKey =
                newKey.trim();


            localStorage.setItem(
                API_KEY_STORAGE,
                apiKey
            );


            addAI(
                "API key changed successfully, Boss."
            );

        }
    );

}


// =====================================================
// VOICE INPUT
// =====================================================

const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (mic && Recognition) {

    const recognition =
        new Recognition();


    recognition.lang =
        "en-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    mic.addEventListener(
        "click",
        function () {

            try {

                recognition.start();

                mic.textContent =
                    "🔴";

            }

            catch (error) {

                console.log(error);

            }

        }
    );


    recognition.onresult =
        function (event) {

            const text =
                event.results[0][0].transcript;


            msg.value =
                text;


            sendMessage();

        };


    recognition.onend =
        function () {

            mic.textContent =
                "🎙️";

        };

}


// =====================================================
// IMAGE BUTTON
// =====================================================

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

            if (
                imgInput.files &&
                imgInput.files.length > 0
            ) {

                addAI(
                    "Image selected, Boss."
                );

            }

        }
    );

}


// =====================================================
// START
// =====================================================

console.log(
    "D.I.S.C.O loaded successfully."
);

console.log(
    "Memory:",
    memory
);
