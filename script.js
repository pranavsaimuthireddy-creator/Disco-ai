document.addEventListener("DOMContentLoaded", () => {

    // ================================
    // ELEMENTS
    // ================================

    const chat = document.getElementById("chat");
    alert("D.I.S.C.O SCRIPT LOADED");
    const input = document.getElementById("msg");
    const send = document.getElementById("send");
    const mic = document.getElementById("mic");
    const clearBtn = document.getElementById("clear-btn");
    const changeKey = document.getElementById("change-key");
    const imgBtn = document.getElementById("img-btn");
    const imgInput = document.getElementById("img-input");


    // ================================
    // API KEY
    // ================================

    let API_KEY = localStorage.getItem("disco_api_key") || "";

    function askForAPIKey() {

        const key = prompt("Enter your Gemini API Key:");

        if (key && key.trim()) {

            API_KEY = key.trim();

            localStorage.setItem(
                "disco_api_key",
                API_KEY
            );

            addMessage(
                "D.I.S.C.O: API key saved, Boss.",
                "ai"
            );
        }
    }

    if (!API_KEY) {
        setTimeout(askForAPIKey, 500);
    }


    // ================================
    // MEMORY
    // ================================

    let MEMORY = [];

    try {
        MEMORY = JSON.parse(
            localStorage.getItem("disco_memory") || "[]"
        );

        if (!Array.isArray(MEMORY)) {
            MEMORY = [];
        }

    } catch {
        MEMORY = [];
    }


    function saveMemory() {

        localStorage.setItem(
            "disco_memory",
            JSON.stringify(MEMORY)
        );
    }


    function getMemory() {

        if (MEMORY.length === 0) {
            return "No saved memories.";
        }

        return MEMORY
            .slice(-30)
            .map(item => "- " + item.text)
            .join("\n");
    }


    function addMemory(text) {

        MEMORY.push({
            type: "memory",
            text: text,
            date: new Date().toISOString()
        });

        saveMemory();
    }


    // ================================
    // ADD MESSAGE
    // ================================

    function addMessage(text, type) {

        if (!chat) return;

        const div = document.createElement("div");

        div.className = "msg " + type;

        div.innerText = text;

        chat.appendChild(div);

        chat.scrollTop = chat.scrollHeight;
    }


    // ================================
    // MEMORY DETECTION
    // ================================

    function processMemory(text) {

        const lower = text.toLowerCase().trim();


        if (lower.startsWith("remember that ")) {

            const fact = text.substring(14).trim();

            if (fact) {
                addMemory(fact);
                return true;
            }
        }


        if (lower.startsWith("remember ")) {

            const fact = text.substring(9).trim();

            if (
                fact &&
                fact !== "it" &&
                fact !== "this" &&
                fact !== "that"
            ) {
                addMemory(fact);
                return true;
            }
        }


        const favourite = text.match(
            /^my\s+(favourite|favorite)\s+(.+?)\s+is\s+(.+)$/i
        );

        if (favourite) {

            const item = favourite[2].trim();
            const value = favourite[3].trim();

            addMemory(
                `User's favourite ${item} is ${value}.`
            );

            return true;
        }


        const like = text.match(
            /^i\s+like\s+(.+)$/i
        );

        if (like) {

            addMemory(
                `User likes ${like[1].trim()}.`
            );

            return true;
        }


        const love = text.match(
            /^i\s+love\s+(.+)$/i
        );

        if (love) {

            addMemory(
                `User loves ${love[1].trim()}.`
            );

            return true;
        }


        return false;
    }


    // ================================
    // SEND MESSAGE
    // ================================

    function sendMessage() {

        const text = input.value.trim();

        if (!text) return;


        addMessage(
            "YOU: " + text,
            "user"
        );

        input.value = "";


        if (processMemory(text)) {

            const reply =
                "Got it, Boss. I'll remember that.";

            addMessage(
                "D.I.S.C.O: " + reply,
                "ai"
            );

            speak(reply);

            return;
        }


        askGemini(text);
    }


    // ================================
    // SEND BUTTON
    // ================================

    send.addEventListener(
        "click",
        sendMessage
    );


    // ================================
    // ENTER KEY
    // ================================

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                sendMessage();
            }

        }
    );


    // ================================
    //
