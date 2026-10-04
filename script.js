(() => {
    "use strict";

    // =========================================
    // DISCO CONFIG
    // =========================================

    const MODEL = "gemini-3.8-flash";

    const API_STORAGE_KEY = "disco_gemini_key";

    const MEMORY_STORAGE_KEY = "disco_memory";

    const LOCATION =
        "Gajuwaka, Visakhapatnam, Andhra Pradesh, India";


    // =========================================
    // HELPERS
    // =========================================

    const $ = (id) =>
        document.getElementById(id);


    let selectedImage = null;

    let recognition = null;

    let listening = false;

    let voices = [];


    // =========================================
    // TOAST
    // =========================================

    function toast(message) {

        const element = $("toast");

        if (!element) return;

        element.textContent = message;

        element.hidden = false;

        clearTimeout(element._timer);

        element._timer =
            setTimeout(() => {

                element.hidden = true;

            }, 2500);
    }


    // =========================================
    // SYSTEM STATE
    // =========================================

    function setState(text) {

        const state =
            $("systemState");

        if (state) {
            state.textContent = text;
        }
    }


    // =========================================
    // API KEY
    // =========================================

    function getApiKey() {

        return (
            localStorage.getItem(
                API_STORAGE_KEY
            ) || ""
        );
    }


    // =========================================
    // MEMORY
    // =========================================

    function getMemory() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    MEMORY_STORAGE_KEY
                ) || "{}"
            );

        } catch {

            return {};
        }
    }


    function saveMemory(memory) {

        localStorage.setItem(
            MEMORY_STORAGE_KEY,
            JSON.stringify(memory)
        );
    }


    // =========================================
    // CHAT
    // =========================================

    function addMessage(
        text,
        type = "ai"
    ) {

        const chat =
            $("chat");

        if (!chat) return;


        const message =
            document.createElement("div");

        message.className =
            type === "user"
                ? "message user-message"
                : "message ai-message";


        const tag =
            document.createElement("div");

        tag.className =
            "message-tag";

        tag.textContent =
            type === "user"
                ? "BOSS"
                : "DISCO";


        const content =
            document.createElement("div");

        content.className =
            "message-text";

        content.textContent =
            text;


        message.appendChild(tag);

        message.appendChild(content);

        chat.appendChild(message);


        chat.scrollTop =
            chat.scrollHeight;
    }


    // =========================================
    // STATUS
    // =========================================

    function updateStatus() {

        const key =
            Boolean(getApiKey());


        const ai =
            $("aiStatus");

        const network =
            $("networkStatus");

        const memory =
            $("memoryStatus");


        if (ai) {

            ai.textContent =
                key
                    ? "CONNECTED"
                    : "KEY REQUIRED";
        }


        if (network) {

            network.textContent =
                navigator.onLine
                    ? "ONLINE"
                    : "OFFLINE";
        }


        if (memory) {

            memory.textContent =
                "READY";
        }
    }


    // =========================================
    // MEMORY COMMAND
    // =========================================

    function showMemory() {

        const memory =
            getMemory();

        const keys =
            Object.keys(memory);


        if (!keys.length) {

            addMessage(
                "Boss, I don't have any saved memories yet."
            );

            return;
        }


        let result =
            "Boss, here is what I remember:\n\n";


        keys.forEach(key => {

            result +=
                `${key}: ${memory[key]}\n`;
        });


        addMessage(result);
    }


    // =========================================
    // VOICE
    // =========================================

    function loadVoices() {

        if (
            !("speechSynthesis" in window)
        ) {
            return;
        }


        voices =
            window.speechSynthesis
                .getVoices();
    }


    if (
        "speechSynthesis" in window
    ) {

        loadVoices();

        window.speechSynthesis
            .addEventListener(
                "voiceschanged",
                loadVoices
            );
    }


    function findMaleVoice() {

        if (!voices.length) {
            return null;
        }


        const preferred = [
            "Google UK English Male",
            "Daniel",
            "George",
            "Arthur",
            "James",
            "Oliver",
            "Ryan",
            "Thomas",
            "Alex"
        ];


        for (
            const preferredName
            of preferred
        ) {

            const voice =
                voices.find(v =>
                    v.name
                        .toLowerCase()
                        .includes(
                            preferredName
                                .toLowerCase()
                        )
                );


            if (voice) {
                return voice;
            }
        }


        const male =
            voices.find(v => {

                const name =
                    v.name.toLowerCase();

                return (
                    name.includes("male") ||
                    name.includes("man") ||
                    name.includes("boy")
                );
            });


        if (male) {
            return male;
        }


        return (
            voices.find(v =>
                v.lang &&
                v.lang
                    .toLowerCase()
                    .startsWith("en")
            ) || null
        );
    }


    function speak(text) {

        if (
            !("speechSynthesis" in window)
        ) {
            return;
        }


        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(
                text
            );


        const voice =
            findMaleVoice();


        if (voice) {

            utterance.voice =
                voice;
        }


        utterance.lang =
            "en-GB";

        utterance.rate =
            0.88;

        utterance.pitch =
            0.78;


        const voiceStatus =
            $("voiceStatus");


        if (voiceStatus) {

            voiceStatus.textContent =
                "SPEAKING";
        }


        utterance.onend =
            () => {

                if (voiceStatus) {

                    voiceStatus.textContent =
                        "READY";
                }
            };


        utterance.onerror =
            () => {

                if (voiceStatus) {

                    voiceStatus.textContent =
                        "READY";
                }
            };


        window.speechSynthesis
            .speak(utterance);
    }


    // =========================================
    // GEMINI API
    // =========================================

    async function askGemini(
        prompt,
        imageData = null
    ) {

        const key =
            getApiKey();


        if (!key) {

            openSettings();

            return null;
        }


        if (!navigator.onLine) {

            addMessage(
                "Boss, the device is offline."
            );

            return null;
        }


        setState(
            "PROCESSING"
        );


        const aiStatus =
            $("aiStatus");


        if (aiStatus) {

            aiStatus.textContent =
                "PROCESSING";
        }


        try {

            const url =
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;


            const parts = [];


            parts.push({
                text:
                    `You are DISCO, a futuristic personal AI assistant.

Call the user "Boss".

Use simple British English.

Be helpful, clear and concise.

The user's preferred location is:
${LOCATION}

User request:
${prompt}`
            });


            if (imageData) {

                const match =
                    imageData.match(
                        /^data:(.*?);base64,(.*)$/
                    );


                if (match) {

                    parts.push({

                        inline_data: {

                            mime_type:
                                match[1],

                            data:
                                match[2]
                        }
                    });
                }
            }


            const response =
                await fetch(url, {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            key
                    },

                    body: JSON.stringify({

                        contents: [

                            {
                                role: "user",

                                parts
                            }

                        ],

                        generationConfig: {

                            temperature: 0.7,

                            maxOutputTokens: 1200
                        }

                    })
                });


            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Gemini API error:",
                    data
                );


                const errorText =
                    data?.error?.message ||
                    "Gemini returned an error.";


                addMessage(
                    "Boss, Gemini returned an error:\n" +
                    errorText
                );


                setState(
                    "API ERROR"
                );


                if (aiStatus) {

                    aiStatus.textContent =
                        "ERROR";
                }


                return null;
            }


            const answer =
                data
                    ?.candidates?.[0]
                    ?.content?.parts
                    ?.map(
                        part =>
                            part.text || ""
                    )
                    .join("")
                    .trim();


            if (!answer) {

                addMessage(
                    "Boss, Gemini did not return a response."
                );

                setState(
                    "READY"
                );

                return null;
            }


            setState(
                "READY"
            );


            if (aiStatus) {

                aiStatus.textContent =
                    "CONNECTED";
            }


            return answer;


        } catch (error) {

            console.error(
                "DISCO error:",
                error
            );


            addMessage(
                "Boss, I couldn't connect to Gemini. Check your internet connection and API key."
            );


            setState(
                "CONNECTION ERROR"
            );


            return null;
        }
    }
        // =========================================
    // SETTINGS MODAL
    // =========================================

    const settingsBtn =
        $("settingsBtn");

    const settingsModal =
        $("settingsModal");

    const closeSettings =
        $("closeSettings");

    const saveKey =
        $("saveKey");

    const removeKey =
        $("removeKey");

    const apiKeyInput =
        $("apiKey");


    function openSettings() {

        if (!settingsModal) {
            return;
        }


        const saved =
            getApiKey();


        if (apiKeyInput) {

            apiKeyInput.value =
                saved;
        }


        settingsModal.hidden =
            false;


        setTimeout(() => {

            if (apiKeyInput) {

                apiKeyInput.focus();
            }

        }, 50);
    }


    function closeSettingsModal() {

        if (!settingsModal) {
            return;
        }


        settingsModal.hidden =
            true;
    }


    if (settingsBtn) {

        settingsBtn.addEventListener(
            "click",
            openSettings
        );
    }


    if (closeSettings) {

        closeSettings.addEventListener(
            "click",
            closeSettingsModal
        );
    }


    if (saveKey) {

        saveKey.addEventListener(
            "click",
            () => {

                const key =
                    apiKeyInput
                        ?.value
                        .trim();


                if (!key) {

                    toast(
                        "Enter your Gemini API key first."
                    );

                    return;
                }


                localStorage.setItem(
                    API_STORAGE_KEY,
                    key
                );


                closeSettingsModal();


                updateStatus();


                toast(
                    "API key saved. DISCO is ready."
                );
            }
        );
    }


    if (removeKey) {

        removeKey.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    API_STORAGE_KEY
                );


                if (apiKeyInput) {

                    apiKeyInput.value =
                        "";
                }


                closeSettingsModal();


                updateStatus();


                toast(
                    "API key removed."
                );
            }
        );
    }


    if (settingsModal) {

        settingsModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    settingsModal
                ) {

                    closeSettingsModal();
                }
            }
        );
    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeSettingsModal();
            }
        }
    );


    // =========================================
    // SEND MESSAGE
    // =========================================

    async function sendMessage() {

        const input =
            $("msg");


        if (!input) {
            return;
        }


        const text =
            input.value.trim();


        if (
            !text &&
            !selectedImage
        ) {
            return;
        }


        if (text) {

            addMessage(
                text,
                "user"
            );
        }


        input.value = "";


        const planMode =
            input.dataset.planMode;


        if (planMode) {

            delete input.dataset.planMode;


            input.placeholder =
                "Talk to DISCO...";


            if (
                planMode === "today"
            ) {

                await createPlan(
                    text,
                    "today"
                );

                return;
            }


            if (
                planMode === "tomorrow"
            ) {

                await createPlan(
                    text,
                    "tomorrow"
                );

                return;
            }
        }


        // LOCAL COMMANDS

        const command =
            text.toLowerCase();


        if (
            command === "memory"
        ) {

            showMemory();

            return;
        }


        if (
            command === "time"
        ) {

            const now =
                new Date();


            const time =
                now.toLocaleTimeString(
                    "en-GB",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            const reply =
                `Boss, the current time is ${time}.`;


            addMessage(reply);

            speak(reply);

            return;
        }


        if (
            command ===
            "activate agents"
        ) {

            const reply =
                "Boss, agent system activated. DISCO is ready.";


            addMessage(reply);

            speak(reply);

            return;
        }


        const image =
            selectedImage;


        selectedImage =
            null;


        const preview =
            $("imagePreview");


        if (preview) {

            preview.hidden =
                true;
        }


        const imageInput =
            $("imageInput");


        if (imageInput) {

            imageInput.value =
                "";
        }


        const answer =
            await askGemini(
                text ||
                "Analyse the attached image.",
                image
            );


        if (answer) {

            addMessage(
                answer
            );


            speak(
                answer
            );
        }
    }


    // =========================================
    // PLAN SYSTEM
    // =========================================

    function startPlanToday() {

        const input =
            $("msg");


        if (input) {

            input.dataset.planMode =
                "today";

            input.placeholder =
                "Tell me everything you need to do today...";
        }


        addMessage(
            "Boss, tell me everything you need to do today. You can type it or use the microphone."
        );


        setState(
            "PLANNING TODAY"
        );
    }


    function startPlanTomorrow() {

        const input =
            $("msg");


        if (input) {

            input.dataset.planMode =
                "tomorrow";

            input.placeholder =
                "Tell me everything you need to do tomorrow...";
        }


        addMessage(
            "Boss, tell me everything you need to do tomorrow. You can type it or use the microphone."
        );


        setState(
            "PLANNING TOMORROW"
        );
    }


    async function createPlan(
        tasks,
        day
    ) {

        const prompt =
            day === "today"

                ? `Create a practical plan for today.

Boss's tasks:
${tasks}

Organise the answer into:

NOW
NEXT
LATER
EVENING
NIGHT
PRIORITY

Keep it realistic and simple.`

                : `Create a practical plan for tomorrow.

Boss's tasks:
${tasks}

Organise the answer into:

MORNING
AFTERNOON
EVENING
NIGHT
PRIORITY

Keep it realistic and simple.`;


        const answer =
            await askGemini(
                prompt
            );


        if (answer) {

            addMessage(
                answer
            );

            speak(
                answer
            );
        }


        setState(
            "READY"
        );
    }


    // =========================================
    // CHAT FORM
    // =========================================

    const chatForm =
        $("chatForm");


    if (chatForm) {

        chatForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                sendMessage();
            }
        );
    }


    // =========================================
    // ENTER KEY
    // =========================================

    const msg =
        $("msg");


    if (msg) {

        msg.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );
    }


    // =========================================
    // QUICK COMMANDS
    // =========================================

    document
        .querySelectorAll(
            ".command-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const command =
                        button.dataset.command;


                    if (
                        command ===
                        "PLAN TODAY"
                    ) {

                        startPlanToday();

                        return;
                    }


                    if (
                        command ===
                        "PLAN TOMORROW"
                    ) {

                        startPlanTomorrow();

                        return;
                    }


                    if (
                        command ===
                        "MEMORY"
                    ) {

                        showMemory();

                        return;
                    }


                    if (
                        command ===
                        "TIME"
                    ) {

                        const now =
                            new Date();


                        const time =
                            now.toLocaleTimeString(
                                "en-GB",
                                {
                                    hour:
                                        "2-digit",
                                    minute:
                                        "2-digit"
                                }
                            );


                        const reply =
                            `Boss, the current time is ${time}.`;


                        addMessage(
                            reply
                        );

                        speak(
                            reply
                        );

                        return;
                    }


                    if (
                        command ===
                        "ACTIVATE AGENTS"
                    ) {

                        const reply =
                            "Boss, agent system activated. DISCO is ready.";


                        addMessage(
                            reply
                        );

                        speak(
                            reply
                        );
                    }
                }
            );
        });


    // =========================================
    // CLEAR CHAT
    // =========================================

    const clearBtn =
        $("clearBtn");


    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            () => {

                const chat =
                    $("chat");


                if (!chat) {
                    return;
                }


                chat.innerHTML =
                    "";


                addMessage(
                    "Systems online. How may I assist you, Boss?"
                );


                setState(
                    "SYSTEM READY"
                );
            }
        );
    }


    // =========================================
    // IMAGE UPLOAD
    // =========================================

    const imageBtn =
        $("imageBtn");

    const imageInput =
        $("imageInput");

    const imagePreview =
        $("imagePreview");

    const previewImage =
        $("previewImage");

    const removeImage =
        $("removeImage");


    if (imageBtn) {

        imageBtn.addEventListener(
            "click",
            () => {

                imageInput?.click();
            }
        );
    }


    if (imageInput) {

        imageInput.addEventListener(
            "change",
            event => {

                const file =
                    event.target.files?.[0];


                if (!file) {
                    return;
                }


                if (
                    !file.type
                        .startsWith(
                            "image/"
                        )
                ) {

                    toast(
                        "Please select an image."
                    );

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    () => {

                        selectedImage =
                            reader.result;


                        if (
                            previewImage
                        ) {

                            previewImage.src =
                                selectedImage;
                        }


                        if (
                            imagePreview
                        ) {

                            imagePreview.hidden =
                                false;
                        }


                        toast(
                            "Image ready."
                        );
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    if (removeImage) {

        removeImage.addEventListener(
            "click",
            () => {

                selectedImage =
                    null;


                if (imageInput) {

                    imageInput.value =
                        "";
                }


                if (previewImage) {

                    previewImage.src =
                        "";
                }


                if (imagePreview) {

                    imagePreview.hidden =
                        true;
                }
            }
        );
                   }
        // =========================================
    // MICROPHONE
    // =========================================

    const micBtn =
        $("micBtn");


    function setupMicrophone() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (!SpeechRecognition) {

            if (micBtn) {

                micBtn.addEventListener(
                    "click",
                    () => {

                        toast(
                            "Voice recognition is not supported in this browser."
                        );
                    }
                );
            }


            return;
        }


        recognition =
            new SpeechRecognition();


        recognition.lang =
            "en-GB";


        recognition.continuous =
            false;


        recognition.interimResults =
            false;


        recognition.maxAlternatives =
            1;


        recognition.onstart =
            () => {

                listening =
                    true;


                if (micBtn) {

                    micBtn.classList.add(
                        "listening"
                    );

                    micBtn.textContent =
                        "🔴";
                }


                const status =
                    $("voiceStatus");


                if (status) {

                    status.textContent =
                        "LISTENING";
                }


                setState(
                    "LISTENING"
                );
            };


        recognition.onresult =
            event => {

                const result =
                    event.results
                        ?. [0]
                        ?. [0];


                if (!result) {
                    return;
                }


                const transcript =
                    result.transcript
                        .trim();


                const input =
                    $("msg");


                if (input) {

                    input.value =
                        transcript;
                }
            };


        recognition.onerror =
            event => {

                console.error(
                    "Microphone error:",
                    event.error
                );


                toast(
                    "Microphone error: " +
                    event.error
                );
            };


        recognition.onend =
            () => {

                listening =
                    false;


                if (micBtn) {

                    micBtn.classList.remove(
                        "listening"
                    );

                    micBtn.textContent =
                        "🎙";
                }


                const status =
                    $("voiceStatus");


                if (status) {

                    status.textContent =
                        "READY";
                }


                setState(
                    "READY"
                );


                const input =
                    $("msg");


                if (
                    input &&
                    input.value.trim()
                ) {

                    sendMessage();
                }
            };
    }


    setupMicrophone();


    if (micBtn) {

        micBtn.addEventListener(
            "click",
            () => {

                if (!recognition) {

                    toast(
                        "Voice recognition is unavailable."
                    );

                    return;
                }


                if (listening) {

                    recognition.stop();

                    return;
                }


                try {

                    recognition.start();

                } catch (error) {

                    console.error(
                        error
                    );
                }
            }
        );
    }


    // =========================================
    // NETWORK
    // =========================================

    window.addEventListener(
        "online",
        () => {

            updateStatus();

            toast(
                "Network online."
            );
        }
    );


    window.addEventListener(
        "offline",
        () => {

            updateStatus();

            toast(
                "Network offline."
            );
        }
    );


    // =========================================
    // VOICE INITIALISATION
    // =========================================

    if (
        "speechSynthesis" in window
    ) {

        loadVoices();


        setTimeout(
            loadVoices,
            500
        );


        setTimeout(
            loadVoices,
            1500
        );
    }


    // =========================================
    // STARTUP
    // =========================================

    updateStatus();


    console.log(
        "DISCO AI loaded successfully."
    );


    // =========================================
    // END
    // =========================================

})();
