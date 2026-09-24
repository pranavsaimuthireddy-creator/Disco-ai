"use strict";

/* =========================
   D.I.S.C.O STABLE SCRIPT
   ========================= */

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const send = document.getElementById("send");
const mic = document.getElementById("mic");
const clearBtn = document.getElementById("clear-btn");
const keyBtn = document.getElementById("change-key");
const imgBtn = document.getElementById("img-btn");
const imgInput = document.getElementById("img-input");

let timer = null;


/* =========================
   CHAT
   ========================= */

function addMessage(text, type) {
    if (!chat) return;

    const div = document.createElement("div");
    div.className = "msg " + type;
    div.textContent = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}


/* =========================
   VOICE
   ========================= */

function speak(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(text);

    voice.lang = "en-IN";
    voice.rate = 0.95;
    voice.pitch = 0.9;
    voice.volume = 1;

    const voices = speechSynthesis.getVoices();

    const indianVoice =
        voices.find(v => v.lang === "en-IN") ||
        voices.find(v => v.lang.startsWith("en"));

    if (indianVoice) {
        voice.voice = indianVoice;
    }

    speechSynthesis.speak(voice);
}


/* =========================
   ANSWER
   ========================= */

function answer(text) {
    addMessage("D.I.S.C.O: " + text, "ai");
    speak(text);
}


/* =========================
   TIME
   ========================= */

function getTime() {
    const now = new Date();

    return now.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
    });
}


/* =========================
   DATE
   ========================= */

function getDate() {
    const now = new Date();

    return now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


/* =========================
   LOCATION
   ========================= */

function getLocation() {

    if (!navigator.geolocation) {
        return Promise.resolve(
            "Your browser does not support location, Boss."
        );
    }

    return new Promise(function(resolve) {

        navigator.geolocation.getCurrentPosition(
            async function(position) {

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                try {

                    const url =
                        "https://nominatim.openstreetmap.org/reverse" +
                        "?format=jsonv2" +
                        "&lat=" + lat +
                        "&lon=" + lon +
                        "&zoom=10" +
                        "&addressdetails=1";

                    const response = await fetch(url);
                    const data = await response.json();

                    const address = data.address || {};

                    const city =
                        address.city ||
                        address.town ||
                        address.village ||
                        address.county ||
                        "your area";

                    const state =
                        address.state || "";

                    resolve(
                        "You are currently around " +
                        city +
                        (state ? ", " + state : "") +
                        ", Boss."
                    );

                } catch (error) {

                    resolve(
                        "I found your coordinates, but I could not find the place name, Boss."
                    );
                }
            },

            function(error) {

                if (error.code === 1) {
                    resolve(
                        "Location permission was denied. Please allow location access for this website, Boss."
                    );
                } else if (error.code === 2) {
                    resolve(
                        "Your location is currently unavailable, Boss."
                    );
                } else if (error.code === 3) {
                    resolve(
                        "Location request timed out, Boss."
                    );
                } else {
                    resolve(
                        "I could not access your location, Boss."
                    );
                }
            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000
            }
        );

    });
}


/* =========================
   WEATHER
   ========================= */

async function getWeather(text) {

    let latitude;
    let longitude;
    let place = "your location";

    const cityMatch =
        text.match(/weather\s+(?:in|at|for)\s+(.+)/i);

    try {

        /* WEATHER FOR CITY */

        if (cityMatch) {

            const city =
                cityMatch[1]
                    .replace(/[?.!]+$/, "")
                    .trim();

            const geoURL =
                "https://geocoding-api.open-meteo.com/v1/search" +
                "?name=" + encodeURIComponent(city) +
                "&count=1" +
                "&language=en" +
                "&format=json";

            const geoResponse =
                await fetch(geoURL);

            if (!geoResponse.ok) {
                return "I could not connect to the weather service, Boss.";
            }

            const geoData =
                await geoResponse.json();

            if (
                !geoData.results ||
                geoData.results.length === 0
            ) {
                return "I could not find that city, Boss.";
            }

            latitude =
                geoData.results[0].latitude;

            longitude =
                geoData.results[0].longitude;

            place =
                geoData.results[0].name;

        }

        /* WEATHER AT CURRENT LOCATION */

        else {

            if (!navigator.geolocation) {
                return "Your browser does not support location, Boss.";
            }

            const position =
                await new Promise(function(resolve, reject) {

                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: false,
                            timeout: 15000,
                            maximumAge: 60000
                        }
                    );

                });

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;
        }


        /* GET WEATHER */

        const weatherURL =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + latitude +
            "&longitude=" + longitude +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code" +
            "&timezone=auto";

        const response =
            await fetch(weatherURL);

        if (!response.ok) {
            return "The weather service is unavailable right now, Boss.";
        }

        const data =
            await response.json();

        if (!data.current) {
            return "I could not get the current weather, Boss.";
        }

        const current =
            data.current;

        const description =
            weatherDescription(
                current.weather_code
            );

        return (
            "Current weather in " +
            place +
            " is " +
            current.temperature_2m +
            "°C. " +
            description +
            ". It feels like " +
            current.apparent_temperature +
            "°C. " +
            "Humidity is " +
            current.relative_humidity_2m +
            "%. " +
            "Wind speed is " +
            current.wind_speed_10m +
            " km/h, Boss."
        );

    } catch (error) {

        return (
            "I could not get the weather. " +
            "Please allow location access and try again, Boss."
        );
    }
}


/* =========================
   WEATHER DESCRIPTION
   ========================= */

function weatherDescription(code) {

    if (code === 0) {
        return "The sky is clear";
    }

    if (code === 1 || code === 2) {
        return "It is partly cloudy";
    }

    if (code === 3) {
        return "It is cloudy";
    }

    if (
        code === 45 ||
        code === 48
    ) {
        return "There is fog";
    }

    if (
        code >= 51 &&
        code <= 57
    ) {
        return "There is light drizzle";
    }

    if (
        code >= 61 &&
        code <= 67
    ) {
        return "It is raining";
    }

    if (
        code >= 71 &&
        code <= 77
    ) {
        return "There is snowfall";
    }

    if (
        code >= 80 &&
        code <= 82
    ) {
        return "There are rain showers";
    }

    if (
        code >= 95
    ) {
        return "There is a thunderstorm";
    }

    return "The weather conditions are changing";
}


/* =========================
   TIMER
   ========================= */

function startTimer(text) {

    const match =
        text.match(
            /(\d+)\s*(second|seconds|minute|minutes|hour|hours)/i
        );

    if (!match) {
        return "Tell me the timer duration, Boss.";
    }

    const number =
        Number(match[1]);

    const unit =
        match[2].toLowerCase();

    let milliseconds;

    if (unit.startsWith("second")) {
        milliseconds =
            number * 1000;
    } else if (unit.startsWith("minute")) {
        milliseconds =
            number * 60000;
    } else {
        milliseconds =
            number * 3600000;
    }

    if (timer) {
        clearTimeout(timer);
    }

    timer =
        setTimeout(function() {

            answer(
                "Boss, your timer is finished."
            );

            timer = null;

        }, milliseconds);

    return (
        "Timer set for " +
        number +
        " " +
        unit +
        ", Boss."
    );
}


/* =========================
   COMMAND PROCESSOR
   ========================= */

async function processCommand(text) {

    const lower =
        text.toLowerCase().trim();


    /* TIME */

    if (
        lower === "time" ||
        lower.includes("what time") ||
        lower.includes("current time") ||
        lower.includes("tell me the time") ||
        lower.includes("what is the time")
    ) {

        return (
            "The current time is " +
            getTime() +
            ", Boss."
        );
    }


    /* DATE */

    if (
        lower === "date" ||
        lower.includes("what is the date") ||
        lower.includes("what's the date") ||
        lower.includes("today's date") ||
        lower.includes("todays date") ||
        lower.includes("what day is it") ||
        lower.includes("what is today")
    ) {

        return (
            "Today is " +
            getDate() +
            ", Boss."
        );
    }


    /* LOCATION */

    if (
        lower.includes("where am i") ||
        lower.includes("my location") ||
        lower.includes("current location") ||
        lower.includes("where am i located")
    ) {

        return await getLocation();
    }


    /* WEATHER */

    if (
        lower === "weather" ||
        lower.includes("weather") ||
        lower.includes("temperature")
    ) {

        return await getWeather(text);
    }


    /* STOP TIMER */

    if (
        lower.includes("stop timer") ||
        lower.includes("cancel timer")
    ) {

        if (timer) {

            clearTimeout(timer);
            timer = null;

            return "Timer cancelled, Boss.";

        }

        return "There is no active timer, Boss.";
    }


    /* START TIMER */

    if (lower.includes("timer")) {

        return startTimer(text);
    }


    /* OPEN YOUTUBE */

    if (
        lower === "open youtube"
    ) {

        window.open(
            "https://www.youtube.com/",
            "_blank"
        );

        return "Opening YouTube, Boss.";
    }


    /* OPEN GOOGLE */

    if (
        lower === "open google"
    ) {

        window.open(
            "https://www.google.com/",
            "_blank"
        );

        return "Opening Google, Boss.";
    }


    /* OPEN GITHUB */

    if (
        lower === "open github"
    ) {

        window.open(
            "https://github.com/",
            "_blank"
        );

        return "Opening GitHub, Boss.";
    }


    /* GOOGLE SEARCH */

    if (
        lower.startsWith("google ")
    ) {

        const query =
            text.substring(7).trim();

        window.open(
            "https://www.google.com/search?q=" +
            encodeURIComponent(query),
            "_blank"
        );

        return (
            "Searching Google for " +
            query +
            ", Boss."
        );
    }


    /* YOUTUBE SEARCH */

    if (
        lower.startsWith("youtube ")
    ) {

        const query =
            text.substring(8).trim();

        window.open(
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query),
            "_blank"
        );

        return (
            "Searching YouTube for " +
            query +
            ", Boss."
        );
    }


    /* CALCULATOR */

    if (
        lower.startsWith("calculate ")
    ) {

        let expression =
            text.substring(10).trim();

        expression =
            expression
                .replace(/×/g, "*")
                .replace(/÷/g, "/");

        if (
            !/^[0-9+\-*/().%\s]+$/.test(expression)
        ) {
            return "I can calculate basic mathematics only, Boss.";
        }

        try {

            const result =
                Function(
                    '"use strict"; return (' +
                    expression +
                    ")"
                )();

            return (
                "The answer is " +
                result +
                ", Boss."
            );

        } catch (error) {

            return "I could not calculate that, Boss.";
        }
    }


    /* DEFAULT */

    return null;
}


/* =========================
   SEND
   ========================= */

async function sendMessage() {

    if (!msg) return;

    const text =
        msg.value.trim();

    if (!text) return;

    addMessage(
        text,
        "user"
    );

    msg.value = "";

    const result =
        await processCommand(text);

    if (result) {

        answer(result);
        return;
    }

    answer(
        "I received your message, Boss. Gemini can handle general questions when your API connection is available."
    );
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

            if (event.key === "Enter") {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


/* =========================
   CLEAR BUTTON
   ========================= */

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        function() {

            localStorage.removeItem(
                "disco_memory"
            );

            if (chat) {
                chat.innerHTML = "";
            }

            answer(
                "Memory cleared, Boss."
            );
        }
    );
}


/* =========================
   CHANGE KEY BUTTON
   ========================= */

if (keyBtn) {

    keyBtn.addEventListener(
        "click",
        function() {

            const key =
                prompt(
                    "Enter your Gemini API key:"
                );

            if (key) {

                localStorage.setItem(
                    "disco_api_key",
                    key.trim()
                );

                answer(
                    "API key updated, Boss."
                );
            }
        }
    );
}


/* =========================
   MICROPHONE
   ========================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;

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

            if (mic) {
                mic.textContent = "🔴";
            }
        };


    recognition.onresult =
        function(event) {

            const text =
                event.results[0][0]
                    .transcript;

            if (msg) {
                msg.value = text;
            }

            sendMessage();
        };


    recognition.onend =
        function() {

            if (mic) {
                mic.textContent = "🎙️";
            }
        };


    recognition.onerror =
        function() {

            if (mic) {
                mic.textContent = "🎙️";
            }
        };
}


if (mic) {

    mic.addEventListener(
        "click",
        function() {

            if (!recognition) {

                answer(
                    "Voice recognition is not supported by this browser, Boss."
                );

                return;
            }

            try {
                recognition.start();
            } catch (error) {
                /* Already running */
            }
        }
    );
}


/* =========================
   IMAGE BUTTON
   ========================= */

if (imgBtn && imgInput) {

    imgBtn.addEventListener(
        "click",
        function() {

            imgInput.click();
        }
    );


    imgInput.addEventListener(
        "change",
        function() {

            if (!imgInput.files.length) {
                return;
            }

            const file =
                imgInput.files[0];

            answer(
                "Image selected: " +
                file.name +
                ", Boss."
            );

            imgInput.value = "";
        }
    );
}


/* =========================
   STARTUP
   ========================= */

console.log(
    "D.I.S.C.O is ready."
);
