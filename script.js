/* =========================================
   D.I.S.C.O AI
   GEMINI + MEMORY + VOICE
========================================= */


/* =========================
   SETTINGS
========================= */

const MODEL = "gemini-3.8-flash";

const KEY_STORAGE = "disco_api_key";

const MEMORY_STORAGE = "disco_memory";


/* =========================
   ELEMENTS
========================= */

const chat =
    document.getElementById("chat");

const msg =
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


/* =========================
   DATA
========================= */

let apiKey =
    localStorage.getItem(KEY_STORAGE) || "";

let memory =
    JSON.parse(
        localStorage.getItem(MEMORY_STORAGE) || "{}"
    );


/* =========================
   CHAT DISPLAY
========================= */

function addUser(text) {

    const div =
        document.createElement("div");

    div.className = "msg user";

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop =
        chat.scrollHeight;
}


function addAI(text) {

    const div =
        document.createElement("div");

    div.className = "msg ai";

    div.innerHTML =
        "<b>D.I.S.C.O:</b> " +
        escapeHTML(text)
        .replace(/\n/g, "<br>");

    chat.appendChild(div);

    chat.scrollTop =
        chat.scrollHeight;
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =========================
   MEMORY
========================= */

function saveMemory() {

    localStorage.setItem(
        MEMORY_STORAGE,
        JSON.stringify(memory)
    );
}


function rememberUser(text) {

    let saved = false;


    /* NAME */

    const nameMatch =
        text.match(
            /my\s+name\s+is\s+([a-zA-Z][a-zA-Z\s]{0,30})/i
        );

    if (nameMatch) {

        memory.name =
            nameMatch[1]
                .trim()
                .split(/\s+/)[0];

        saved = true;
    }


    /* FAVOURITE COLOUR */

    const colourMatch =
        text.match(
            /my\s+favou?rite\s+colou?r\s+is\s+([a-zA-Z]+)/i
        );

    if (colourMatch) {

        memory.colour =
            colourMatch[1].trim();

        saved = true;
    }


    if (saved) {

        saveMemory();

        return true;
    }


    return false;
}


function answerMemoryQuestion(text) {

    const q =
        text.toLowerCase();

    const answers = [];


    /* NAME */

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


    /* COLOUR */

    if (
        q.includes("what is my favourite colour") ||
        q.includes("what is my favorite color") ||
        q.includes("what is my favourite color") ||
        q.includes("what is my favorite colour") ||
        q.includes("what's my favourite colour") ||
        q.includes("what's my favorite color")
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


    if (answers.length === 0) {

        return null;
    }


    return answers.join(" ");
}


/* =========================
   API KEY
========================= */

function getApiKey() {

    if (apiKey) {

        return true;
    }


    const key =
        prompt(
            "Enter your Gemini API key:"
        );


    if (!key || !key.trim()) {

        addAI(
            "I need your Gemini API key before I can connect to Gemini, Boss."
        );

        return false;
    }


    apiKey =
        key.trim();


    localStorage.setItem(
        KEY_STORAGE,
        apiKey
    );


    addAI(
        "Gemini connection key saved, Boss."
    );


    return true;
}


/* =========================
   INDIAN ENGLISH PROMPT
========================= */

function createPrompt(question) {

    return `
You are D.I.S.C.O, a personal AI assistant.

Always call the user "Boss".

Speak in natural Indian English.

Use simple and clear English commonly understood in India.

Do not use exaggerated American or British expressions.

Be friendly, respectful and helpful.

Give direct answers.

Do not unnecessarily repeat the user's question.

You have a small local memory.

Saved memory:
${JSON.stringify(memory)}

Use saved memory when relevant.

Never invent memories.

User's message:
${question}
`;
}


/* =========================
   GEMINI
========================= */

async function askGemini(question) {

    if (!getApiKey()) {

        return;
    }


    addAI("Thinking, Boss...");


    const thinkingMessage =
        chat.lastElementChild;


    try {

        const response =
            await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                MODEL +
                ":generateContent",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            apiKey
                    },

                    body:
                        JSON.stringify({

                            contents: [

                                {

                                    parts: [

                                        {

                                            text:
                                                createPrompt(
                                                    question
                                                )
                                        }

                                    ]

                                }

                            ]

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            "Gemini response:",
            data
        );


        /* REMOVE THINKING MESSAGE */

        if (
            thinkingMessage &&
            thinkingMessage.classList.contains("ai")
        ) {

            thinkingMessage.remove();
        }


        /* API ERROR */

        if (!response.ok) {

            let errorMessage =
                "Gemini could not answer.";

            if (
                data &&
                data.error &&
                data.error.message
            ) {

                errorMessage =
                    data.error.message;
            }


            addAI(
                "Gemini error: " +
                errorMessage
            );

            return;
        }


        /* GET RESPONSE */

        let answer = "";


        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
        ) {

            answer =
                data.candidates[0].content.parts
                    .map(
                        part =>
                            part.text || ""
                    )
                    .join("")
                    .trim();
        }


        if (!answer) {

            addAI(
                "Gemini returned an empty response, Boss."
            );

            return;
        }


        addAI(answer);

        speak(answer);

    } catch (error) {

        if (
            thinkingMessage &&
            thinkingMessage.classList.contains("ai")
        ) {

            thinkingMessage.remove();
        }


        console.error(error);


        addAI(
            "Connection error, Boss: " +
            error.message
        );
    }
}


/* =========================
   SEND
========================= */

async function sendMessage() {

    const text =
        msg.value.trim();


    if (!text) {

        return;
    }


    msg.value = "";


    addUser(text);


    /* MEMORY COMMAND */

    const lower =
        text.toLowerCase();


    if (
        lower.includes("remember that") ||
        lower.includes("remember my") ||
        lower.startsWith("remember ")
    ) {

        if (
            rememberUser(text)
        ) {

            const reply =
                "Got it, Boss. I have saved that in my memory.";

            addAI(reply);

            speak(reply);

            return;
        }
    }


    /* MEMORY QUESTION */

    const memoryAnswer =
        answerMemoryQuestion(text);


    if (memoryAnswer) {

        addAI(memoryAnswer);

        speak(memoryAnswer);

        return;
    }


    /* GEMINI */

    await askGemini(text);
}


/* =========================
   SEND BUTTON
========================= */

if (send) {

    send.addEventListener(
        "click",
        sendMessage
    );
}


/* =========================
   ENTER KEY
========================= */

if (msg) {

    msg.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMessage();
            }

        }
    );
}


/* =========================
   CLEAR MEMORY
========================= */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function() {

            memory = {};

            localStorage.removeItem(
                MEMORY_STORAGE
            );

            const reply =
                "Memory cleared, Boss.";

            addAI(reply);

            speak(reply);
        }
    );
}


/* =========================
   CHANGE API KEY
========================= */

if (changeKey) {

    changeKey.addEventListener(
        "click",
        function() {

            const key =
                prompt(
                    "Enter your new Gemini API key:"
                );


            if (
                !key ||
                !key.trim()
            ) {

                return;
            }


            apiKey =
                key.trim();


            localStorage.setItem(
                KEY_STORAGE,
                apiKey
            );


            const reply =
                "API key changed successfully, Boss.";

            addAI(reply);

            speak(reply);
        }
    );
}


/* =========================
   VOICE OUTPUT
========================= */

function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.lang =
        "en-IN";

    utterance.rate =
        0.92;

    utterance.pitch =
        0.85;


    const voices =
        speechSynthesis.getVoices();


    /* Prefer Indian English voice */

    const indianVoice =
        voices.find(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("en-in")
        );


    if (indianVoice) {

        utterance.voice =
            indianVoice;
    }


    speechSynthesis.speak(
        utterance
    );
}


/* =========================
   LOAD VOICES
========================= */

if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        function() {

            speechSynthesis
                .getVoices();
        };
}


/* =========================
   SPEECH RECOGNITION
========================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (
    mic &&
    SpeechRecognition
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

            try {

                recognition.start();

                mic.textContent =
                    "🔴";

            } catch (error) {

                console.log(error);
            }

        }
    );


    recognition.onresult =
        function(event) {

            const transcript =
                event.results[0][0]
                    .transcript;


            msg.value =
                transcript;


            sendMessage();
        };


    recognition.onend =
        function() {

            mic.textContent =
                "🎙️";
        };


    recognition.onerror =
        function() {

            mic.textContent =
                "🎙️";

            addAI(
                "I could not hear that clearly, Boss."
            );
        };

} else if (mic) {

    mic.addEventListener(
        "click",
        function() {

            addAI(
                "Voice input is not supported by this browser, Boss."
            );
        }
    );
}


/* =========================
   IMAGE BUTTON
========================= */

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

            if (
                imgInput.files &&
                imgInput.files.length
            ) {

                const file =
                    imgInput.files[0];


                addAI(
                    "Image selected: " +
                    file.name +
                    ", Boss."
                );
            }

        }
    );
}


/* =========================
   STARTUP
========================= */

console.log(
    "D.I.S.C.O SYSTEM ONLINE"
);

console.log(
    "Gemini model:",
    MODEL
);
