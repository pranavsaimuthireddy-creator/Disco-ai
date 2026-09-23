const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");

function askDisco(question) {
    add("D.I.S.C.O: Thinking...", "ai");

    setTimeout(() => {
        let answer = "";

        if (question.toLowerCase().includes("hello")) {
            answer = "Hello Boss! D.I.S.C.O is online.";
        } 
        else if (question.toLowerCase().includes("python")) {
            answer = "Python is a programming language used to build many types of applications.";
        }
        else if (question.toLowerCase().includes("who are you")) {
            answer = "I am D.I.S.C.O, your AI assistant.";
        }
        else {
            answer = "I understand your question, Boss. Real Gemini AI will be connected next.";
        }

        chat.lastChild.innerText = "D.I.S.C.O: " + answer;
        speak(answer);
    }, 500);
}

send.onclick = () => {
    const text = input.value.trim();

    if (!text) return;

    add("YOU: " + text, "user");
    input.value = "";

    askDisco(text);
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
