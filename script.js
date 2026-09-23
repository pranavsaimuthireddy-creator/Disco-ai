const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");

// Ask for API key every time the website opens
let API_KEY = prompt(
    "D.I.S.C.O requires your Gemini API Key:"
);

if (API_KEY) {
    API_KEY = API_KEY.trim();
} else {
    alert(
        "No API key entered. D.I.S.C.O cannot connect to Gemini."
    );
}

// Gemini model
const MODEL = "gemini-3.6-flash";


// ===============================
// GEMINI AI
// ===============================

async function askGemini(question) {

    add("D.I.S.C.O: Thinking...", "ai");

    if (!API_KEY) {
        chat.lastChild.innerText =
            "D.I.S.C.O: Please enter your Gemini API key.";
        return;
    }

    try {

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    contents: [
                        {
                            parts: [
                                {
                                    text:
                                        "You are D.I.S.C.O, a helpful AI assistant. " +
                                        "Answer clearly and simply. " +
                                        "Call the user Boss.\n\n" +
                                        question
                                }
                            ]
                        }
                    ]

                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error?.message ||
                "Gemini API error"
            );

        }

        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {

            throw new Error(
                "No reply received from Gemini."
            );

        }

        chat.lastChild.innerText =
            "D.I.S.C.O: " + reply;

        speak(reply);

    } catch (error) {

        chat.lastChild.innerText =
            "D.I.S.C.O: ERROR - " +
            error.message;

    }
}


// ===============================
// SEND BUTTON
// ===============================

send.onclick = () => {

    const text = input.value.trim();

    if (!text) return;

    add(
        "YOU: " + text,
        "user"
    );

    input.value = "";

    askGemini(text);
};


// ===============================
// ENTER KEY
// ===============================

input.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            send.click();
        }

    }
);


// ===============================
// VOICE INPUT
// ===============================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    const recognition =
        new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    mic.onclick = () => {

        recognition.start();

        mic.innerText = "🔴";

    };


    recognition.onresult = (event) => {

        const text =
            event.results[0][0].transcript;

        input.value = text;

        mic.innerText = "🎙️";

        send.click();

    };


    recognition.onerror = () => {

        mic.innerText = "🎙️";

    };


    recognition.onend = () => {

        mic.innerText = "🎙️";

    };

} else {

    mic.onclick = () => {

        alert(
            "Voice input is not supported in this browser."
        );

    };

}


// ===============================
// AI VOICE REPLY
// ===============================

function speak(text) {

    if (!("speechSynthesis" in window)) {
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


// ===============================
// ADD MESSAGE
// ===============================

function add(text, who) {

    const div =
        document.createElement("div");

    div.className =
        "msg " + who;

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop =
        chat.scrollHeight;

}
