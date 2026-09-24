/* =========================================
   D.I.S.C.O MOBILE AI SYSTEM
   RESTORED MOBILE UI
========================================= */

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    scroll-behavior: smooth;
}

body {
    min-height: 100vh;
    background:
        radial-gradient(circle at 50% 25%, rgba(0, 220, 255, 0.12), transparent 32%),
        radial-gradient(circle at 20% 70%, rgba(0, 100, 255, 0.08), transparent 30%),
        #02070b;
    color: #00f6ff;
    font-family: "Orbitron", Arial, sans-serif;
    overflow-x: hidden;
}

/* =========================================
   BACKGROUND
========================================= */

body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
        linear-gradient(
            rgba(0, 255, 255, 0.025) 1px,
            transparent 1px
        );
    background-size: 100% 4px;
    z-index: -1;
}

.scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
        repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0, 255, 255, 0.025) 4px
        );
    z-index: 20;
}

/* =========================================
   HEADER
========================================= */

header {
    text-align: center;
    padding: 22px 15px 8px;
}

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    margin-bottom: 10px;
    color: #00eaff;
}

.menu-icon {
    font-size: 20px;
}

.system-online {
    color: #00ff9d;
    font-size: 10px;
}

.bot-icon {
    font-size: 20px;
}

header h1 {
    font-size: 36px;
    letter-spacing: 7px;
    color: #00f6ff;
    text-shadow:
        0 0 8px #00f6ff,
        0 0 25px rgba(0, 246, 255, 0.8);
}

header p {
    margin-top: 4px;
    font-size: 11px;
    letter-spacing: 5px;
    color: #1597ad;
}

/* =========================================
   CORE
========================================= */

.core-section {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 35px 0 42px;
}

.core {
    position: relative;
    width: 350px;
    height: 350px;
    max-width: 85vw;
    max-height: 85vw;
    display: flex;
    justify-content: center;
    align-items: center;
}

.core-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid #00eaff;
    box-shadow:
        0 0 10px #00eaff,
        inset 0 0 10px rgba(0, 234, 255, 0.5);
}

.ring-outer {
    width: 100%;
    height: 100%;
    border-style: dotted;
    animation: rotate 18s linear infinite;
}

.ring-middle {
    width: 86%;
    height: 86%;
    border-color: #0077ff;
    animation: rotateReverse 12s linear infinite;
}

.ring-inner {
    width: 68%;
    height: 68%;
    animation: pulse 3s ease-in-out infinite;
}

.core-lines {
    position: absolute;
    width: 54%;
    height: 54%;
    border-radius: 50%;
    border: 1px solid rgba(0, 234, 255, 0.2);
}

.core-centre {
    position: absolute;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.core-centre strong {
    font-size: 23px;
    letter-spacing: 3px;
    text-shadow: 0 0 12px #00eaff;
}

.core-centre span {
    margin-top: 12px;
    font-size: 11px;
    color: #00d991;
    letter-spacing: 1px;
}

.core-centre i {
    display: block;
    width: 12px;
    height: 12px;
    margin-top: 12px;
    border-radius: 50%;
    background: #00ff9d;
    box-shadow: 0 0 15px #00ff9d;
}

/* =========================================
   SYSTEM STATUS
========================================= */

.panel {
    width: calc(100% - 30px);
    max-width: 700px;
    margin: 0 auto;
}

.panel-title {
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(0, 234, 255, 0.3);
    font-size: 15px;
    letter-spacing: 2px;
    color: #00eaff;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-top: 18px;
}

.status-card {
    min-height: 130px;
    padding: 18px;
    border: 1px solid rgba(0, 234, 255, 0.25);
    border-radius: 13px;
    background:
        linear-gradient(
            145deg,
            rgba(0, 60, 75, 0.22),
            rgba(0, 10, 16, 0.8)
        );
    box-shadow:
        inset 0 0 20px rgba(0, 234, 255, 0.03),
        0 0 8px rgba(0, 234, 255, 0.04);
}

.status-icon {
    font-size: 23px;
    margin-bottom: 16px;
    color: #00eaff;
}

.status-card h3 {
    font-size: 13px;
    letter-spacing: 1px;
    margin-bottom: 10px;
}

.status-online {
    color: #00ff9d;
    font-size: 10px;
}

/* =========================================
   CHAT
========================================= */

.chat-panel {
    width: calc(100% - 30px);
    max-width: 700px;
    margin: 28px auto 0;
}

.chat-terminal {
    height: 270px;
    border: 1px solid rgba(0, 234, 255, 0.35);
    border-radius: 14px;
    background: rgba(0, 5, 9, 0.88);
    overflow: hidden;
    box-shadow:
        inset 0 0 30px rgba(0, 234, 255, 0.035),
        0 0 15px rgba(0, 234, 255, 0.05);
}

.terminal-dots {
    height: 40px;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 0 15px;
    border-bottom: 1px solid rgba(0, 234, 255, 0.18);
}

.terminal-dots span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #00b7cc;
    box-shadow: 0 0 8px #00b7cc;
}

.chat {
    height: calc(100% - 40px);
    padding: 14px;
    overflow-y: auto;
    font-family: Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
}

.chat::-webkit-scrollbar {
    width: 4px;
}

.chat::-webkit-scrollbar-thumb {
    background: #00d9ff;
    border-radius: 10px;
}

.msg {
    max-width: 90%;
    margin-bottom: 12px;
    padding: 10px 12px;
    border-radius: 9px;
    word-wrap: break-word;
}

.msg.ai {
    background: rgba(0, 220, 255, 0.07);
    border-left: 3px solid #00eaff;
    color: #b8fbff;
}

.msg.user {
    margin-left: auto;
    background: rgba(0, 255, 150, 0.07);
    border-right: 3px solid #00ff9d;
    color: #d7fff1;
    text-align: right;
}

/* =========================================
   INPUT AREA
========================================= */

.input-section {
    width: calc(100% - 30px);
    max-width: 700px;
    margin: 15px auto 0;
    padding-bottom: 25px;
}

.input-area {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

#msg {
    width: 100%;
    height: 48px;
    padding: 0 14px;
    border: 1px solid rgba(0, 234, 255, 0.45);
    border-radius: 10px;
    outline: none;
    background: rgba(0, 15, 22, 0.95);
    color: white;
    font-size: 14px;
    box-shadow: inset 0 0 12px rgba(0, 234, 255, 0.04);
}

#msg::placeholder {
    color: #48727a;
}

#msg:focus {
    border-color: #00eaff;
    box-shadow:
        0 0 10px rgba(0, 234, 255, 0.2),
        inset 0 0 12px rgba(0, 234, 255, 0.04);
}

#button-area {
    display: grid;
    grid-template-columns: 1.4fr 0.7fr 0.7fr 0.8fr 0.7fr;
    gap: 7px;
}

#button-area button {
    min-height: 42px;
    border: 1px solid rgba(0, 234, 255, 0.5);
    border-radius: 9px;
    background: rgba(0, 30, 40, 0.85);
    color: #00eaff;
    font-weight: bold;
    font-size: 11px;
    cursor: pointer;
    transition: 0.2s;
}

#button-area button:active {
    transform: scale(0.95);
}

#button-area button:hover {
    background: rgba(0, 234, 255, 0.12);
    box-shadow: 0 0 12px rgba(0, 234, 255, 0.25);
}

#send {
    color: #00ffae !important;
    border-color: rgba(0, 255, 174, 0.55) !important;
}

#mic {
    font-size: 17px !important;
}

#clear-btn {
    color: #ff7272 !important;
}

#change-key {
    color: #ffd75a !important;
}

#img-btn {
    font-size: 16px !important;
}

/* =========================================
   FOOTER
========================================= */

footer {
    width: calc(100% - 30px);
    max-width: 700px;
    margin: 5px auto 25px;
    padding: 15px 0;
    border-top: 1px solid rgba(0, 234, 255, 0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #277984;
    font-size: 9px;
    letter-spacing: 1px;
}

/* =========================================
   ANIMATIONS
========================================= */

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes rotateReverse {
    from {
        transform: rotate(360deg);
    }

    to {
        transform: rotate(0deg);
    }
}

@keyframes pulse {
    0%,
    100% {
        box-shadow:
            0 0 10px #00eaff,
            inset 0 0 10px rgba(0, 234, 255, 0.4);
    }

    50% {
        box-shadow:
            0 0 25px #00eaff,
            inset 0 0 25px rgba(0, 234, 255, 0.6);
    }
}

/* =========================================
   MOBILE
========================================= */

@media (max-width: 500px) {

    header {
        padding-top: 18px;
    }

    header h1 {
        font-size: 31px;
        letter-spacing: 5px;
    }

    header p {
        font-size: 9px;
        letter-spacing: 4px;
    }

    .core-section {
        padding: 28px 0 34px;
    }

    .core {
        width: 300px;
        height: 300px;
    }

    .core-centre strong {
        font-size: 20px;
    }

    .status-card {
        min-height: 120px;
        padding: 15px;
    }

    .chat-terminal {
        height: 250px;
    }

    #button-area {
        grid-template-columns: 1.3fr 0.7fr 0.7fr;
    }

    #send {
        grid-column: span 1;
    }

    footer {
        font-size: 8px;
    }
}

/* =========================================
   VERY SMALL PHONES
========================================= */

@media (max-width: 360px) {

    header h1 {
        font-size: 27px;
        letter-spacing: 4px;
    }

    .core {
        width: 270px;
        height: 270px;
    }

    .status-grid {
        gap: 9px;
    }

    .status-card {
        padding: 12px;
    }

    #button-area button {
        font-size: 9px;
    }
        }
