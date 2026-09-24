// =====================================================
// D.I.S.C.O - MOBILE AI SYSTEM
// Complete script with local memory
// =====================================================

const API_KEY_NAME = "disco_api_key";
const MEMORY_KEY = "disco_memory";
const MODEL = "gemini-3.8-flash";

let apiKey = localStorage.getItem(API_KEY_NAME) || "";
let memory = JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");

// -----------------------------------------------------
// GET HTML ELEMENTS
// -----------------------------------------------------

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const changeKeyBtn = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");

// -----------------------------------------------------
// API KEY
// -----------------------------------------------------

function getApiKey() {
    if (!apiKey) {
        apiKey = prompt("Enter your Gemini API key:");

        if (!apiKey) {
            return false;
        }

        apiKey = apiKey.trim();

        if (!apiKey) {
            return false;
        }

        localStorage.setItem(API_KEY_NAME, apiKey);
    }

    return true;
}

// -----------------------------------------------------
// CHANGE API KEY
// -----------------------------------------------------

if (changeKeyBtn) {
    changeKeyBtn.addEventListener("click", function () {

        const newKey = prompt("Enter your new Gemini API key:");

        if (!newKey) {
            return;
        }

        apiKey = newKey.trim();

        if (apiKey) {
            localStorage.setItem(API_KEY_NAME, apiKey);
            addAIMessage("API key changed successfully, Boss.");
        }
    });
}

// -----------------------------------------------------
// MEMORY FUNCTIONS
// -----------------------------------------------------

function saveMemory() {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

function clearMemory() {
    memory = {};
    saveMemory();
}

function memoryText() {

    const items = [];

    if (memory.name) {
        items.push("User's name: " + memory.name);
    }

    if (memory.favouriteColour) {
        items.push("User's favourite colour: " + memory.favouriteColour);
    }

    if (memory.favouriteBike) {
        items.push("User's favourite bike: " + memory.favouriteBike);
    }

    if (memory.favouriteFood) {
        items.push("User's favourite food: " + memory.favouriteFood);
    }

    if (memory.favouriteAnime) {
        items.push("User's favourite anime: " + memory.favouriteAnime);
    }

    return items.join("\n");
}

// -----------------------------------------------------
// SAVE INFORMATION FROM USER MESSAGE
// -----------------------------------------------------

function rememberUserInformation(text) {

    const lower = text.toLowerCase();

    let savedSomething = false;

    // NAME
    let nameMatch = text.match(
        /(?:my name is|i am|i'm)\s+([a-zA-Z]+)(?=\s+and\s+my|\s*[,.!?]|$)/i
    );

    if (nameMatch) {
        memory.name = nameMatch[1];
        savedSomething = true;
    }

    // FAVOURITE COLOUR
    let colourMatch = text.match(
        /(?:my favourite colour is|my favorite color is|my favourite color is|my favorite colour is)\s+([a-zA-Z]+)/i
    );

    if (colourMatch) {
        memory.favouriteColour = colourMatch[1];
        savedSomething = true;
    }

    // FAVOURITE BIKE
    let bikeMatch = text.match(
        /(?:my favourite bike is|my favorite bike is)\s+([a-zA-Z0-9 -]+?)(?=\s+and\s+my|\s*[,.!?]|$)/i
    );

    if (bikeMatch) {
        memory.favouriteBike = bikeMatch[1].trim();
        savedSomething = true;
    }

    // FAVOURITE FOOD
    let foodMatch = text.match(
        /(?:my favourite food is|my favorite food is)\s+([a-zA-Z0-9 -]+?)(?=\s+and\s+my|\s*[,.!?]|$)/i
    );

    if (foodMatch) {
        memory.favouriteFood = foodMatch[1].trim();
        savedSomething = true;
    }

    // FAVOURITE ANIME
    let animeMatch = text.match(
        /(?:my favourite anime is|my favorite anime is)\s+([a-zA-Z0-9 -]+?)(?=\s+and\s+my|\s*[,.!?]|$)/i
    );

    if (animeMatch) {
        memory.favouriteAnime = animeMatch[1].trim();
        savedSomething = true;
    }

    if (savedSomething) {
        saveMemory();
    }

    return savedSomething;
}

// -----------------------------------------------------
// MEMORY QUESTIONS
// -----------------------------------------------------

function answerMemoryQuestion(text) {

    const lower = text.toLowerCase();

    const asksName =
        lower.includes("what is my name") ||
        lower.includes("what's my name") ||
        lower.includes("do you know my name");

    const asksColour =
        lower.includes("what is my favourite colour") ||
        lower.includes("what is my favorite color") ||
        lower.includes("what's my favourite colour") ||
        lower.includes("what's my favorite color") ||
        lower.includes("what is my favourite color") ||
        lower.includes("what is my favorite colour");

    const asksBike =
        lower.includes("what is my favourite bike") ||
        lower.includes("what is my favorite bike") ||
        lower.includes("what's my favourite bike") ||
        lower.includes("what's my favorite bike");

    const asksFood =
        lower.includes("what is my favourite food") ||
        lower.includes("what is my favorite food") ||
        lower.includes("what's my favourite food") ||
        lower.includes("what's my favorite food");

    const asksAnime =
        lower.includes("what is my favourite anime") ||
        lower.includes("what is my favorite anime") ||
        lower.includes("what's my favourite anime") ||
        lower.includes("what's my favorite anime");

    const answers = [];

    if (asksName) {
        if (memory.name) {
            answers.push("Your name is " + memory.name + ", Boss.");
        } else {
            answers.push("I don't know your name yet, Boss.");
        }
    }

    if (asksColour) {
        if (memory.favouriteColour) {
            answers.push(
                "Your favourite colour is " +
                memory.favouriteColour +
                ", Boss."
            );
        } else {
            answers.push("You haven't told me your favourite colour yet, Boss.");
        }
    }

    if (asksBike) {
        if (memory.favouriteBike) {
            answers.push(
                "Your favourite bike is " +
                memory.favouriteBike +
                ", Boss."
            );
        } else {
            answers.push("You haven't told me your favourite bike yet, Boss.");
        }
    }

    if (asksFood) {
        if (memory.favouriteFood) {
            answers.push(
                "Your favourite food is " +
                memory.favouriteFood +
                ", Boss."
            );
        } else {
            answers.push("You haven't told me your favourite food yet, Boss.");
        }
    }

    if (asksAnime
