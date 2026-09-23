const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");


// ==============================
// DEMO AI
// ==============================

function askDisco(question) {

    add("D.I.S.C.O: Thinking...", "ai");

    setTimeout(() => {

        let answer;

        if (question.toLowerCase().includes("hello") ||
            question.toLowerCase().includes("hi")) {

            answer = "Hello Boss. D.I.S.C.O is online.";

        } else if (question.toLowerCase().includes("who are you")) {

            answer = "I am D.I.S.C.O, your personal AI assistant.";

        } else if (question.toLowerCase().includes("python")) {

            answer = "Python is a beginner-friendly programming language.";

        } else {

            answer = "I received your question, Boss. The AI brain will be connected next.";

        }

        chat.lastChild.innerText =
            "D.I.S.C.O: " + answer;

        speak(answer);

    }, 700);
}


// ==============================
// SEND BUTTON
// ==============================

send.onclick = () => {

    const text = input.value.trim();

    if (!text) return;

    add("YOU: " + text, "user");

    input.value = "";

    askDisco(text);
};


// ==============================
// ENTER KEY
// ==============================

input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        send.click();
    }

});


// ==============================
// VOICE INPUT
// ==============================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    const recognition = new SpeechRecognition();

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

        alert("Voice input is not supported in this browser.");

    };

}


// ==============================
// VOICE REPLY
// ==============================

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
    voice.volume = 1;

    speechSynthesis.speak(voice);
}


// ==============================
// ADD MESSAGE
// ==============================

function add(text, who) {

    const div = document.createElement("div");

    div.className = "msg " + who;

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}
