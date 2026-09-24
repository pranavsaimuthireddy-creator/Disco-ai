const API_MODEL = "gemini-3.6-flash";
const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    API_MODEL +
    ":generateContent";

const KEY_NAME = "disco_api_key";
const MEMORY_NAME = "disco_memory";

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
        "Enter your key here.\n\n" +
        "Do not share your key with anyone."
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

        console.log("Memory error:", error);

        return {};
    }
}


function saveMemory(memory) {

    localStorage.setItem(
        MEMORY_NAME,
        JSON.stringify(memory)
    );
}


function clearMemory() {

    localStorage.removeItem(MEMORY_NAME);

    addMessage(
        "ai",
        "D.I.S.C.O: Memory cleared, Boss."
    );
}


function extractMemory(text) {

    const memory = getMemory();

    let changed = false;

    /*
       NAME
    */

    let nameMatch = text.match(
        /(?:my name is|i am|i'm)\s+([a-zA-Z][a-zA-Z ]{1,30})/i
    );

    if (nameMatch) {

        let name = nameMatch[1]
            .trim()
            .replace(/[.!?,]+$/, "");

        if (name) {

            memory.name = name;
            changed = true;
        }
    }


    /*
       FAVOURITE COLOUR
    */

    let colourMatch = text.match(
        /(?:my favourite colour is|my favorite color is)\s+([a-zA-Z]+)/i
    );

    if (colourMatch) {

        memory.favouriteColour =
            colourMatch[1].trim();

        changed = true;
    }


    /*
       FAVOURITE COLOR
    */

    let favouriteMatch = text.match(
        /(?:my favourite color is|my favorite colour is)\s+([a-zA-Z]+)/i
    );

    if (favouriteMatch) {

        memory.favouriteColour =
            favouriteMatch[1].trim();

        changed = true;
    }


    /*
       SAVE
    */

    if (changed) {

        saveMemory(memory);

        return true;
    }

    return false;
}


/* =========================
   MEMORY QUESTIONS
========================= */

function answerFromMemory(text) {

    const memory = getMemory();

    const lower = text.toLowerCase();


    /*
       NAME
    */

    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
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
       FAVOURITE COLOUR
    */

    if (
        lower.includes("what is my favourite colour") ||
        lower.includes("what is my favorite color") ||
        lower.includes("what's my favourite colour") ||
        lower.includes("what's my favorite color")
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
       SHOW MEMORY
    */

    if (
        lower.includes("what do you remember about me") ||
        lower.includes("show my memory") ||
        lower.includes("what do you remember")
    ) {

        const keys = Object.keys(memory);

        if (keys.length === 0) {

            return (
                "My memory is currently empty, Boss."
            );
        }

        let result =
            "Here is what I remember, Boss:\n\n";

        if (memory.name) {
            result +=
                "Name: " +
                memory.name +
                "\n";
        }

        if (memory.favouriteColour) {
            result +=
                "Favourite colour: " +
                memory.favouriteColour +
                "\n";
        }

        return result;
    }


    return null;
}


/* =========================
   CHAT DISPLAY
========================= */

function addMessage(type, text) {

    const message =
        document.createElement("div");

    message.className =
        "msg " + type;

    message.textContent = text;

    chat.appendChild(message);

    const terminal =
        document.querySelector(".chat-terminal");

    terminal.scrollTop =
        terminal.scrollHeight;
}


/* =========================
   GEMINI
========================= */

async function askGemini(userText, imageData = null) {

    let apiKey = getApiKey();

    if (!apiKey) {

        apiKey = askForApiKey();

        if (!apiKey) {

            throw new Error(
                "No API key entered."
            );
        }
    }


    const memory = getMemory();


    const memoryText =
        Object.keys(memory).length > 0
            ? JSON.stringify(memory)
            : "No saved memory.";


    const systemInstruction = `
You are D.I.S.C.O, a helpful personal AI assistant.

Always call the user "Boss".

Answer clearly and simply.

You have a small local memory supplied by the website.

Saved memory:
${memoryText}

Use the saved memory when answering questions about the user.

If the user tells you something to remember, acknowledge it naturally.

Do not invent memories that are not supplied.

Do not claim to remember something that is not in the saved memory.
`;


    const parts = [];


    parts.push({
        text:
            systemInstruction +
            "\n\nUser message:\n" +
            userText
    });


    if (imageData) {

        parts.push({
            inline_data: {
                mime_type: imageData.mimeType,
                data: imageData.base64
            }
        });

        parts.push({
            text:
                "\nAnalyse the uploaded image and answer the user's request."
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

        let errorMessage =
            data?.error?.message ||
            "Gemini request failed.";

        throw new Error(errorMessage);
    }


    const answer =
        data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();


    if (!answer) {

        throw new Error(
            "Gemini returned an empty response."
        );
    }


    return answer;
}


/* =========================
   SEND
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
       SAVE MEMORY
    */

    const remembered =
        extractMemory(text);


    /*
       DIRECT MEMORY ANSWER
    */

    const memoryAnswer =
        answerFromMemory(text);


    if (memoryAnswer) {

        addMessage(
            "ai",
            "D.I.S.C.O: " +
            memoryAnswer
        );

        speak(
            memoryAnswer
        );

        return;
    }


    /*
       REMEMBER CONFIRMATION
    */

    if (remembered) {

        const memory =
            getMemory();

        let savedItems = [];

        if (memory.name) {
            savedItems.push(
                "name = " +
                memory.name
            );
        }

        if (memory.favouriteColour) {
            savedItems.push(
                "favourite colour = " +
                memory.favouriteColour
            );
        }

        const confirmation =
            "I'll remember that, Boss.\n" +
            savedItems.join("\n");

        addMessage(
            "ai",
            "D.I.S.C.O: " +
            confirmation
        );

        speak(
            confirmation
        );

        return;
    }


    /*
       THINKING
    */

    const thinking =
        document.createElement("div");

    thinking.className =
        "msg ai";

    thinking.id =
        "thinking";

    thinking.textContent =
        "D.I.S.C.O: Processing...";

    chat.appendChild(thinking);


    try {

        const answer =
            await askGemini(text);

        thinking.remove();

        addMessage(
            "ai",
            "D.I.S.C.O: " +
            answer
        );

        speak(answer);

    } catch (error) {

        thinking.remove();

        addMessage(
            "ai",
            "D.I.S.C.O: " +
            error.message
        );

        console.log(error);
    }
}


/* =========================
   ENTER KEY
========================= */

input.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();
        }

    }
);


/* =========================
   SEND BUTTON
========================= */

send.addEventListener(
    "click",
    sendMessage
);


/* =========================
   CLEAR MEMORY
========================= */

clearBtn.addEventListener(
    "click",
    function() {

        const answer =
            confirm(
                "Clear D.I.S.C.O memory?"
            );

        if (answer) {

            clearMemory();
        }
    }
);


/* =========================
   CHANGE KEY
========================= */

changeKey.addEventListener(
    "click",
    function() {

        const answer =
            confirm(
                "Change your Gemini API key?"
            );

        if (!answer) {
            return;
        }

        localStorage.removeItem(
            KEY_NAME
        );

        const newKey =
            askForApiKey();

        if (newKey) {

            addMessage(
                "ai",
                "D.I.S.C.O: API key changed, Boss."
            );
        }
    }
);


/* =========================
   VOICE INPUT
========================= */

let recognition = null;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    recognition.onstart =
        function() {

            mic.textContent =
                "🔴";
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
        };


    recognition.onresult =
        function(event) {

            const spoken =
                event.results[0][0].transcript;

            input.value =
                spoken;

            sendMessage();
        };


    mic.addEventListener(
        "click",
        function() {

            try {

                recognition.start();

            } catch (error) {

                console.log(error);
            }
        }
    );

} else {

    mic.addEventListener(
        "click",
        function() {

            alert(
                "Voice input is not supported by this browser."
            );
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

    const cleanText =
        text
            .replace(
                /[*_#`]/g,
                ""
            )
            .trim();

    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );

    utterance.lang =
        "en-GB";

    utterance.rate =
        0.95;

    utterance.pitch =
        1;

    speechSynthesis.speak(
        utterance
    );
}


/* =========================
   IMAGE / VISION
========================= */

imgBtn.addEventListener(
    "click",
    function() {

        imgInput.click();
    }
);


imgInput.addEventListener(
    "change",
    async function() {

        const file =
            imgInput.files[0];

        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            alert(
                "Please select an image."
            );

            return;
        }


        addMessage(
            "user",
            "🖼️ Image uploaded"
        );


        const reader =
            new FileReader();


        reader.onload =
            async function(event) {

                const result =
                    event.target.result;

                const base64 =
                    result.split(",")[1];


                const thinking =
                    document.createElement("div");

                thinking.className =
                    "msg ai";

                thinking.textContent =
                    "D.I.S.C.O: Analysing image...";

                chat.appendChild(
                    thinking
                );


                try {

                    const answer =
                        await askGemini(
                            "Analyse this image and describe what you see.",
                            {
                                mimeType:
                                    file.type,
                                base64:
                                    base64
                            }
                        );

                    thinking.remove();

                    addMessage(
                        "ai",
                        "D.I.S.C.O: " +
                        answer
                    );

                    speak(answer);

                } catch (error) {

                    thinking.remove();

                    addMessage(
                        "ai",
                        "D.I.S.C.O: " +
                        error.message
                    );

                    console.log(error);
                }
            };


        reader.readAsDataURL(file);

        imgInput.value = "";
    }
);


/* =========================
   STARTUP
========================= */

console.log(
    "D.I.S.C.O JavaScript loaded successfully."
);

console.log(
    "Memory:",
    getMemory()
);
