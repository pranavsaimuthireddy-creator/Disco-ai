"use strict";

/* =========================================================
   D.I.S.C.O — MOBILE AI SYSTEM
   15 TOOLS + MEMORY + VOICE + IMAGE + GEMINI
   ========================================================= */

/* =========================
   SETTINGS
   ========================= */

const MODEL = "gemini-3.6-flash";
const API_KEY_STORAGE = "disco_api_key";
const MEMORY_STORAGE = "disco_memory";

/* =========================
   DOM ELEMENTS
   ========================= */

const msgInput = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKeyBtn = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");
const chat = document.getElementById("chat");

/* =========================
   MEMORY
   ========================= */

let memory = [];

try {
    memory = JSON.parse(localStorage.getItem(MEMORY_STORAGE) || "[]");

    if (!Array.isArray(memory)) {
        memory = [];
    }
} catch (error) {
    memory = [];
}

function saveMemory() {
    localStorage.setItem(MEMORY_STORAGE, JSON.stringify(memory));
}

function addMemory(text) {
    if (!text) return;

    memory.push({
        text: text,
        time: new Date().toISOString()
    });

    saveMemory();
}

function clearMemory() {
    memory = [];
    saveMemory();
}

function findMemory(pattern) {
    const found = memory.filter(function (item) {
        return pattern.test(item.text.toLowerCase());
    });

    if (found.length === 0) {
        return null;
    }

    return found[found.length - 1].text;
}

/* =========================
   MEMORY LEARNING
   ========================= */

function learnMemory(text) {
    const lower = text.toLowerCase();

    if (
        lower.includes("remember that") ||
        lower.includes("remember this") ||
        lower.startsWith("remember ")
    ) {
        let savedText = text
            .replace(/^remember that\s*/i, "")
            .replace(/^remember this\s*/i, "")
            .replace(/^remember\s*/i, "")
            .trim();

        if (savedText) {
            addMemory(savedText);
            return "I will remember that, Boss.";
        }
    }

    return null;
}

/* =========================
   MEMORY ANSWERS
   ========================= */

function memoryAnswer(text) {
    const t = text.toLowerCase();

    /* NAME */

    if (
        t.includes("what is my name") ||
        t.includes("whats my name") ||
        t.includes("who am i")
    ) {
        const result = findMemory(/\bmy name is\b|\bname is\b/);

        if (result) {
            const match = result.match(/(?:my\s+)?name\s+is\s+(.+)/i);

            if (match) {
                return "Your name is " + match[1].trim() + ", Boss.";
            }

            return result;
        }

        return "I don't have your name in my memory yet, Boss.";
    }

    /* FAVOURITE COLOUR */

    if (
        t.includes("favourite colour") ||
        t.includes("favorite colour") ||
        t.includes("favourite color") ||
        t.includes("favorite color")
    ) {
        const result = findMemory(
            /\bfavourite colour is\b|\bfavorite colour is\b|\bfavourite color is\b|\bfavorite color is\b/
        );

        if (result) {
            const match = result.match(
                /(?:favourite|favorite)\s+colou?r\s+is\s+(.+)/i
            );

            if (match) {
                return "Your favourite colour is " + match[1].trim() + ", Boss.";
            }
        }

        return "I don't have your favourite colour in my memory yet, Boss.";
    }

    /* FAVOURITE BIKE */

    if (
        t.includes("favourite bike") ||
        t.includes("favorite bike")
    ) {
        const result = findMemory(
            /\bfavourite bike is\b|\bfavorite bike is\b/
        );

        if (result) {
            const match = result.match(
                /(?:favourite|favorite)\s+bike\s+is\s+(.+)/i
            );

            if (match) {
                return "Your favourite bike is " + match[1].trim() + ", Boss.";
            }
        }

        return "I don't have your favourite bike in my memory yet, Boss.";
    }

    /* FAVOURITE FOOD */

    if (
        t.includes("favourite food") ||
        t.includes("favorite food")
    ) {
        const result = findMemory(
            /\bfavourite food is\b|\bfavorite food is\b/
        );

        if (result) {
            const match = result.match(
                /(?:favourite|favorite)\s+food\s+is\s+(.+)/i
            );

            if (match) {
                return "Your favourite food is " + match[1].trim() + ", Boss.";
            }
        }

        return "I don't have your favourite food in my memory yet, Boss.";
    }

    /* GENERAL MEMORY SEARCH */

    if (
        t.includes("what do you remember") ||
        t.includes("show my memory") ||
        t.includes("what is in my memory")
    ) {
        if (memory.length === 0) {
            return "My memory is currently empty, Boss.";
        }

        return (
            "Here is what I remember, Boss:\n" +
            memory.map(function (item, index) {
                return index + 1 + ". " + item.text;
            }).join("\n")
        );
    }

    return null;
}

/* =========================
   CHAT DISPLAY
   ========================= */

function addMessage(text, type) {
    if (!chat) return;

    const div = document.createElement("div");

    div.className = "msg " + type;

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}

function aiMessage(text) {
    addMessage("D.I.S.C.O: " + text, "ai");
}

/* =========================
   SPEECH
   ========================= */

function speak(text) {
    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const cleanText = String(text)
        .replace(/[*#_`]/g, "")
        .replace(/\n+/g, ". ");

    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();

    let selectedVoice =
        voices.find(function (voice) {
            return voice.lang === "en-IN";
        }) ||
        voices.find(function (voice) {
            return voice.lang.startsWith("en-IN");
        }) ||
        voices.find(function (voice) {
            return voice.lang.startsWith("en");
        });

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
}

/* =========================
   API KEY
   ========================= */

function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE);
}

function askForApiKey() {
    const key = prompt("Enter your Gemini API key:");

    if (key && key.trim()) {
        localStorage.setItem(API_KEY_STORAGE, key.trim());
        return key.trim();
    }

    return null;
}

/* =========================
   GEMINI PROMPT
   ========================= */

function createPrompt(question) {
    let memoryText = "No stored memory.";

    if (memory.length > 0) {
        memoryText = memory
            .map(function (item) {
                return item.text;
            })
            .join("\n");
    }

    return `
You are D.I.S.C.O, a helpful personal AI assistant.

Rules:
- Call the user "Boss".
- Use clear and simple English.
- Use Indian English style.
- Be friendly and natural.
- Answer the actual question.
- Do not give the same answer to every question.
- Use the supplied memory when relevant.
- Do not claim you remember something unless it is in the memory.

USER MEMORY:
${memoryText}

USER QUESTION:
${question}
`;
}

/* =========================
   GEMINI TEXT
   ========================= */

async function askGemini(question) {
    let apiKey = getApiKey();

    if (!apiKey) {
        apiKey = askForApiKey();
    }

    if (!apiKey) {
        return "Please enter your Gemini API key, Boss.";
    }

    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        MODEL +
        ":generateContent";

    const body = {
        contents: [
            {
                parts: [
                    {
                        text: createPrompt(question)
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                return "The Gemini API key was rejected, Boss. Use the KEY button to change it.";
            }

            if (response.status === 429) {
                return "Gemini's request limit has been reached. Please wait a little and try again, Boss.";
            }

            if (response.status === 503) {
                return "Gemini is temporarily busy. Please try again in a
