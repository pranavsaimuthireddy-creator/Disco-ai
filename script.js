(() => {
    "use strict";

    // =========================================
    // DISCO CONFIGURATION
    // =========================================

    const MODEL = "gemini-3.8-flash";

    const API_STORAGE_KEY = "disco_gemini_key";
    const MEMORY_STORAGE_KEY = "disco_memory";

    const DISCO_LOCATION =
        "Gajuwaka, Visakhapatnam, Andhra Pradesh, India";


    // =========================================
    // ELEMENT HELPER
    // =========================================

    const $ = (id) => document.getElementById(id);


    // =========================================
    // GLOBAL VARIABLES
    // =========================================

    let selectedImage = null;
    let recognition = null;
    let voices = [];
    let listening = false;


    // =========================================
    // TOAST
    // =========================================

    function toast(message) {

        const box = $("toast");

        if (!box) return;

        box.textContent = message;
        box.hidden = false;

        clearTimeout(box._timer);

        box._timer = setTimeout(() => {
            box.hidden = true;
        }, 2500);
    }


    // =========================================
    // CLOCK
    // =========================================

    function updateClock() {

        const now = new Date();

        const time = now.toLocaleTimeString(
            "en-GB",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

        const clock = $("clock");

        if (clock) {
            clock.textContent = time;
        }
    }

    setInterval(updateClock, 1000);

    updateClock();


    // =========================================
    // API KEY
    // =========================================

    function getApiKey() {

        return localStorage.getItem(API_STORAGE_KEY) || "";
    }


    // =========================================
    // MEMORY
    // =========================================

    function getMemory() {

        try {

            return JSON.parse(
                localStorage.getItem(MEMORY_STORAGE_KEY) || "{}"
            );

        } catch (error) {

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
    // STATUS
    // =========================================

    function setState(state) {

        const systemState = $("systemState");

        if (systemState) {
            systemState.textContent = state;
        }
    }


    function updateStatus() {

        const keyExists = Boolean(getApiKey());

        const aiStatus = $("aiStatus");
        const networkStatus = $("networkStatus");
        const memoryStatus = $("memoryStatus");

        if (aiStatus) {
            aiStatus.textContent =
                keyExists ? "CONNECTED" : "KEY REQUIRED";
        }

        if (networkStatus) {

            networkStatus.textContent =
                navigator.onLine ? "ONLINE" : "OFFLINE";
        }

        if (memoryStatus) {

            memoryStatus.textContent = "READY";
        }
    }


    // =========================================
    // CHAT MESSAGE
    // =========================================

    function addMessage(
        text,
        type = "ai"
    ) {

        const chat = $("chat");

        if (!chat) return;

        const wrapper =
            document.createElement("div");

        wrapper.className =
            `message ${type}-message`;


        const label =
            document.createElement("div");

        label.className =
            "message-label";

        label.textContent =
            type === "user"
                ? "BOSS"
                : "DISCO";


        const content =
            document.createElement("div");

        content.className =
            "message-content";

        content.textContent = text;


        wrapper.appendChild(label);
        wrapper.appendChild(content);

        chat.appendChild(wrapper);

        chat.scrollTop =
            chat.scrollHeight;
    }


    // =========================================
    // MEMORY FUNCTIONS
    // =========================================

    function remember(key, value) {

        const memory = getMemory();

        memory[key] = value;

        saveMemory(memory);

        toast("Memory saved.");
    }


    function showMemory() {

        const memory = getMemory();

        const keys =
            Object.keys(memory);

        if (keys.length === 0) {

            addMessage(
                "Boss, I currently have no saved memories."
            );

            return;
        }


        let output =
            "Boss, my saved memories:\n\n";


        keys.forEach((key) => {

            output +=
                `${key}: ${memory[key]}\n`;
        });


        addMessage(output);
    }


    // =========================================
    // VOICE SYSTEM
    // =========================================

    function loadVoices() {

        if (!("speechSynthesis" in window)) {
            return;
        }

        voices =
            window.speechSynthesis.getVoices();
    }


    if ("speechSynthesis" in window) {

        loadVoices();

        window.speechSynthesis
            .addEventListener(
                "voiceschanged",
                loadVoices
            );
    }


    function findMaleEnglishVoice() {

        if (!voices.length) {
            return null;
        }


        const preferredNames = [

            "Daniel",
            "George",
            "Arthur",
            "James",
            "Oliver",
            "Ryan",
            "Alex",
            "Thomas",
            "Google UK English Male"

        ];


        for (const name of preferredNames) {

            const voice =
                voices.find(v =>
                    v.name
                        .toLowerCase()
                        .includes(
                            name.toLowerCase()
                        )
                );

            if (voice) {
                return voice;
            }
        }


        const maleVoice =
            voices.find(v => {

                const name =
                    v.name.toLowerCase();

                return (
                    name.includes("male") ||
                    name.includes("man") ||
                    name.includes("boy")
                );
            });


        if (maleVoice) {
            return maleVoice;
        }


        return voices.find(v =>
            v.lang &&
            v.lang.toLowerCase()
                .startsWith("en")
        ) || null;
    }


    function speak(text) {

        if (
            !("speechSynthesis" in window)
        ) {
            return;
        }


        window.speechSynthesis.cancel();


        const utterance =
            new SpeechSynthesisUtterance(text);


        const voice =
            findMaleEnglishVoice();


        if (voice) {
            utterance.voice = voice;
        }


        utterance.lang = "en-GB";

        utterance.rate = 0.88;

        utterance.pitch = 0.82;


        const voiceStatus =
            $("voiceStatus");

        if (voiceStatus) {
            voiceStatus.textContent =
                "SPEAKING";
        }


        utterance.onend = () => {

            if (voiceStatus) {
                voiceStatus.textContent =
                    "READY";
            }
        };


        utterance.onerror = () => {

            if (voiceStatus) {
                voiceStatus.textContent =
                    "READY";
            }
        };


        window.speechSynthesis
            .speak(utterance);
    }
        // =========================================
    // GEMINI AI
    // =========================================

    async function askGemini(prompt) {

        const key = getApiKey();


        if (!key) {

            addMessage(
                "Boss, your Gemini API key is not saved. Open ⚙ AI KEY and save it first."
            );

            return null;
        }


        if (!navigator.onLine) {

            addMessage(
                "Boss, you are currently offline."
            );

            return null;
        }


        setState("PROCESSING");


        const aiStatus =
            $("aiStatus");

        if (aiStatus) {
            aiStatus.textContent =
                "PROCESSING";
        }


        try {

            const endpoint =
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;


            const response =
                await fetch(
                    endpoint,
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

                                    parts: [
                                        {
                                            text:
                                                `You are DISCO, a futuristic personal AI assistant.

Call the user "Boss".

Answer clearly and simply.

Use British English.

The user's preferred location is:
${DISCO_LOCATION}

Current task:

${prompt}`
                                        }
                                    ]
                                }

                            ],

                            generationConfig: {

                                temperature: 0.7,

                                maxOutputTokens: 1200
                            }

                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Gemini error:",
                    data
                );


                let message =
                    "DISCO connection error.";


                if (
                    data &&
                    data.error &&
                    data.error.message
                ) {

                    message =
                        data.error.message;
                }


                addMessage(
                    message
                );


                setState("ERROR");

                return null;
            }


            const text =
                data?.candidates?.[0]
                    ?.content?.parts
                    ?.map(part => part.text || "")
                    .join("")
                    .trim();


            if (!text) {

                addMessage(
                    "Boss, Gemini returned an empty response."
                );

                setState("READY");

                return null;
            }


            setState("READY");


            if (aiStatus) {
                aiStatus.textContent =
                    "CONNECTED";
            }


            return text;


        } catch (error) {

            console.error(
                "DISCO error:",
                error
            );


            addMessage(
                "Boss, I could not connect to Gemini. Please check your internet connection and API key."
            );


            setState("ERROR");

            return null;
        }
    }


    // =========================================
    // PLAN TODAY
    // =========================================

    function startPlanToday() {

        const msg =
            $("msg");

        if (msg) {

            msg.dataset.planMode =
                "today";

            msg.placeholder =
                "Tell me everything you need to do today...";
        }


        addMessage(
            "Boss, what are the works you need to do today? Tell me everything. You can type them or use the microphone."
        );


        setState("PLANNING");
    }


    async function createTodayPlan(tasks) {

        const prompt = `Create a practical plan for today.

These are Boss's tasks:

${tasks}

Organise them into:

1. NOW
2. NEXT
3. LATER
4. EVENING
5. NIGHT
6. PRIORITY

Keep the plan realistic.

Use simple British English.

Do not invent unnecessary tasks.

Make it easy to follow.`;


        const answer =
            await askGemini(prompt);


        if (answer) {

            addMessage(answer);

            speak(answer);
        }
    }


    // =========================================
    // PLAN TOMORROW
    // =========================================

    async function planTomorrow(tasks) {

        const prompt = `Create a practical plan for tomorrow.

Boss's tasks:

${tasks}

Organise them into:

1. MORNING
2. AFTERNOON
3. EVENING
4. NIGHT
5. PRIORITY

Keep it realistic and simple.

Use British English.

Do not invent unnecessary tasks.`;


        const answer =
            await askGemini(prompt);


        if (answer) {

            addMessage(answer);

            speak(answer);
        }
    }


    // =========================================
    // PROCESS PLAN INPUT
    // =========================================

    async function processPlanInput(text) {

        const msg =
            $("msg");

        const mode =
            msg?.dataset?.planMode;


        if (!mode) {
            return false;
        }


        if (msg) {

            delete msg.dataset.planMode;

            msg.placeholder =
                "Talk to DISCO...";
        }


        if (mode === "today") {

            await createTodayPlan(text);

            return true;
        }


        if (mode === "tomorrow") {

            await planTomorrow(text);

            return true;
        }


        return false;
    }


    // =========================================
    // LOCAL COMMANDS
    // =========================================

    async function localCommand(text) {

        const command =
            text.trim().toLowerCase();


        // MEMORY

        if (command === "memory") {

            showMemory();

            return true;
        }


        // TIME

        if (command === "time") {

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


            addMessage(
                `Boss, the current time is ${time}.`
            );


            return true;
        }


        // PLAN TODAY

        if (
            command === "plan today"
        ) {

            startPlanToday();

            return true;
        }


        // PLAN TOMORROW

        if (
            command === "plan tomorrow"
        ) {

            const msg =
                $("msg");


            if (msg) {

                msg.dataset.planMode =
                    "tomorrow";

                msg.placeholder =
                    "Tell me everything you need to do tomorrow...";
            }


            addMessage(
                "Boss, what do you need to do tomorrow? Tell me everything."
            );


            setState("PLANNING");

            return true;
        }


        // ACTIVATE AGENTS

        if (
            command === "activate agents"
        ) {

            addMessage(
                "Boss, agent system activated. DISCO is ready for your commands."
            );


            speak(
                "Boss, agent system activated."
            );


            return true;
        }


        return false;
    }


    // =========================================
    // SEND MESSAGE
    // =========================================

    async function sendMessage() {

        const msg =
            $("msg");


        if (!msg) {
            return;
        }


        const text =
            msg.value.trim();


        if (!text && !selectedImage) {
            return;
        }


        if (text) {

            addMessage(
                text,
                "user"
            );
        }


        msg.value = "";


        // PLAN MODE

        if (text) {

            const handledPlan =
                await processPlanInput(text);


            if (handledPlan) {

                return;
            }
        }


        // LOCAL COMMAND

        if (text) {

            const handled =
                await localCommand(text);


            if (handled) {

                return;
            }
        }


        // NORMAL AI REQUEST

        let prompt = text;


        if (selectedImage) {

            prompt +=
                "\n\nThe user has also attached an image. Analyse the image if possible.";

        }


        const answer =
            await askGemini(prompt);


        if (answer) {

            addMessage(answer);

            speak(answer);
        }
    }


    // =========================================
    // IMAGE TO BASE64
    // =========================================

    function fileToBase64(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload = () => {

                    resolve(
                        reader.result
                    );
                };


                reader.onerror =
                    reject;


                reader.readAsDataURL(file);
            }
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
            async (event) => {

                event.preventDefault();

                await sendMessage();
            }
        );
    }


    // =========================================
    // QUICK COMMANDS
    // =========================================

    const commandButtons =
        document.querySelectorAll(
            ".command-button"
        );


    commandButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const command =
                        button.dataset.command;


                    if (!command) {
                        return;
                    }


                    if (command === "PLAN TODAY") {

                        startPlanToday();

                        return;
                    }


                    if (
                        command ===
                        "PLAN TOMORROW"
                    ) {

                        const msg =
                            $("msg");


                        if (msg) {

                            msg.dataset.planMode =
                                "tomorrow";

                            msg.placeholder =
                                "Tell me everything you need to do tomorrow...";
                        }


                        addMessage(
                            "Boss, what do you need to do tomorrow? Tell me everything."
                        );


                        setState(
                            "PLANNING"
                        );

                        return;
                    }


                    if (
                        command === "MEMORY"
                    ) {

                        showMemory();

                        return;
                    }


                    if (
                        command === "TIME"
                    ) {

                        await localCommand(
                            "time"
                        );

                        return;
                    }


                    if (
                        command ===
                        "ACTIVATE AGENTS"
                    ) {

                        await localCommand(
                            "activate agents"
                        );

                        return;
                    }
                }
            );
        }
    );


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


                chat.innerHTML = "";


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


    if (imageBtn && imageInput) {

        imageBtn.addEventListener(
            "click",
            () => {

                imageInput.click();
            }
        );
    }


    if (imageInput) {

        imageInput.addEventListener(
            "change",
            async () => {

                const file =
                    imageInput.files?.[0];


                if (!file) {
                    return;
                }


                selectedImage =
                    await fileToBase64(file);


                if (
                    previewImage &&
                    imagePreview
                ) {

                    previewImage.src =
                        selectedImage;

                    imagePreview.hidden =
                        false;
                }


                toast(
                    "Image selected."
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
                    imageInput.value = "";
                }


                if (imagePreview) {
                    imagePreview.hidden =
                        true;
                }


                if (previewImage) {
                    previewImage.src = "";
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
                            "Voice recognition is not supported by this browser."
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

                listening = true;


                if (micBtn) {

                    micBtn.classList.add(
                        "listening"
                    );

                    micBtn.textContent =
                        "🔴";
                }


                const voiceStatus =
                    $("voiceStatus");


                if (voiceStatus) {

                    voiceStatus.textContent =
                        "LISTENING";
                }


                setState(
                    "LISTENING"
                );
            };


        recognition.onresult =
            (event) => {

                const result =
                    event.results?.[0]?.[0];


                if (!result) {
                    return;
                }


                const transcript =
                    result.transcript.trim();


                const msg =
                    $("msg");


                if (msg) {

                    msg.value =
                        transcript;
                }
            };


        recognition.onerror =
            (event) => {

                console.error(
                    "Speech recognition error:",
                    event.error
                );


                toast(
                    "Microphone error: " +
                    event.error
                );
            };


        recognition.onend =
            async () => {

                listening = false;


                if (micBtn) {

                    micBtn.classList.remove(
                        "listening"
                    );

                    micBtn.textContent =
                        "🎙";
                }


                const voiceStatus =
                    $("voiceStatus");


                if (voiceStatus) {

                    voiceStatus.textContent =
                        "READY";
                }


                setState(
                    "READY"
                );


                const msg =
                    $("msg");


                if (
                    msg &&
                    msg.value.trim()
                ) {

                    await sendMessage();
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
    // SETTINGS / API KEY
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


    // OPEN SETTINGS

    function openSettings() {

        if (!settingsModal) {
            return;
        }


        const savedKey =
            localStorage.getItem(
                API_STORAGE_KEY
            );


        if (apiKeyInput) {

            apiKeyInput.value =
                savedKey || "";
        }


        settingsModal.hidden =
            false;
    }


    // CLOSE SETTINGS

    function closeSettingsModal() {

        if (!settingsModal) {
            return;
        }


        settingsModal.hidden =
            true;
    }


    // SETTINGS BUTTON

    if (settingsBtn) {

        settingsBtn.addEventListener(
            "click",
            openSettings
        );
    }


    // X BUTTON

    if (closeSettings) {

        closeSettings.addEventListener(
            "click",
            closeSettingsModal
        );
    }


    // SAVE API KEY

    if (saveKey) {

        saveKey.addEventListener(
            "click",
            () => {

                const key =
                    apiKeyInput?.value.trim();


                if (!key) {

                    toast(
                        "Please enter your Gemini API key."
                    );

                    return;
                }


                localStorage.setItem(
                    API_STORAGE_KEY,
                    key
                );


                toast(
                    "Gemini API key saved."
                );


                closeSettingsModal();

                updateStatus();
            }
        );
    }


    // REMOVE API KEY

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


                toast(
                    "Gemini API key removed."
                );


                closeSettingsModal();

                updateStatus();
            }
        );
    }


    // CLOSE WHEN CLICKING OUTSIDE

    if (settingsModal) {

        settingsModal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    settingsModal
                ) {

                    closeSettingsModal();
                }
            }
        );
    }


    // ESCAPE KEY CLOSE

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Escape"
            ) {

                closeSettingsModal();
            }
        }
    );


    // =========================================
    // ENTER KEY
    // =========================================

    const messageInput =
        $("msg");


    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();


                    if (chatForm) {

                        chatForm.requestSubmit();
                    }
                }
            }
        );
    }


    // =========================================
    // NETWORK STATUS
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
    // STARTUP
    // =========================================

    updateStatus();

    loadVoices();


    console.log(
        "DISCO AI initialised successfully."
    );


    // =========================================
    // END OF DISCO
    // =========================================

})();
