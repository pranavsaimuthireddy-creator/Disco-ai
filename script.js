const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");

// Ask for API key when website opens
let API_KEY = localStorage.getItem("disco_api_key");

if (!API_KEY) {
    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        localStorage.setItem("disco_api_key", API_KEY);
    }
}

const MODEL = "gemini-3.6-flash";

async function askGemini(question) {

    add("D.I.S.C.O: Thinking...", "ai");

    try {

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text:
                                "You are D.I.S.C.O, a helpful AI assistant. " +
                                "Answer clearly and simply. Call the user Boss.\n\n" +
                                question
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "Gemini API error"
            );
        }

        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error("No reply received.");
        }

        chat.lastChild.innerText =
            "D.I.S.C.O: " + reply;

        speak(reply);

    } catch (error) {

        chat.lastChild.innerText =
            "D.I.S.C.O: ERROR - " + error.message;
    }
}

send.onclick = () => {

    const text = input.value.trim();

    if (!text) return;

    add("YOU: " + text, "user");

    input.value = "";

    askGemini(text);
};

input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        send.click();
    }

});

function speak(text) {

    if (!("speechSynthesis" in window)) return;

    speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);

    voice.lang = "en-IN";
    voice.rate = 1;
    voice.pitch = 0.85;

    speechSynthesis.speak(voice);
}

function add(text, who) {

    const div = document.createElement("div");

    div.className = "msg " + who;

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}
