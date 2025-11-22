// Pomodoro Timer with Coin System Integration
class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = 25 * 60; // seconds
        this.totalTime = 25 * 60;
        this.currentMode = "pomodoro";
        this.interval = null;
        this.studiedSeconds = 0;
        this.targetMinutes = 25;

        this.currentSessionId = null;

        this.modes = {
            pomodoro: { time: 25 * 60, name: "Study Time" },
            shortBreak: { time: 5 * 60, name: "Short Break" },
            longBreak: { time: 15 * 60, name: "Long Break" }
        };

        this.init();
    }

    /* ========== INIT & EVENTS ========== */
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateSessionInfo();
        this.updateTargetTime();
        console.log("Pomodoro Timer initialized");
    }

    setupEventListeners() {
        // Mode buttons
        document.querySelectorAll(".mode-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                this.switchMode(e.currentTarget.dataset.mode);
            });
        });

        // Preset buttons
        document.querySelectorAll(".preset-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const minutes = parseInt(e.currentTarget.dataset.minutes);
                this.setTime(minutes);
                this.updatePresetButtons(e.currentTarget);
            });
        });

        // Start / Pause toggle
        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => this.toggleTimer());
        }

        // Reset button → xử lý confirm tùy theo thời gian đã học
        const resetBtn = document.getElementById("reset-btn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => this.handleResetClick());
        }

        // Custom time
        const customInput = document.getElementById("custom-minutes");
        const setCustomBtn = document.getElementById("set-custom-time");
        if (setCustomBtn && customInput) {
            setCustomBtn.addEventListener("click", () => {
                const minutes = parseInt(customInput.value);
                if (!isNaN(minutes) && minutes > 0 && minutes <= 240) {
                    this.setTime(minutes);
                    this.updatePresetButtons(null);
                    customInput.value = "";
                } else {
                    alert("Please enter a valid number between 1 and 240 minutes!");
                }
            });

            customInput.addEventListener("keypress", e => {
                if (e.key === "Enter") setCustomBtn.click();
            });
        }

        // Confirmation modal buttons
        const continueBtn = document.getElementById("continue-studying");
        if (continueBtn) {
            continueBtn.addEventListener("click", () => this.continueStudying());
        }

        const finishBtn = document.getElementById("finish-studying");
        if (finishBtn) {
            finishBtn.addEventListener("click", () => this.finishStudying());
        }
    }

    /* ========== BASIC HELPERS ========== */

    hasSignificantStudy() {
        // ≥ 1 phút và đang ở chế độ học
        return this.currentMode === "pomodoro" && this.studiedSeconds >= 60;
    }

    setTime(minutes) {
        this.targetMinutes = minutes;
        this.totalTime = minutes * 60;
        this.timeLeft = minutes * 60;

        if (this.isRunning) {
            this.pauseTimer(); // đổi thời gian thì tạm dừng
        } else {
            const toggleBtn = document.getElementById("toggle-btn");
            if (toggleBtn) {
                toggleBtn.textContent = "Start";
                toggleBtn.classList.remove("running");
            }
        }

        this.updateDisplay();
        this.updateTargetTime();
        this.updateTimerMessage(`Timer set to ${minutes} minutes`);
    }

    switchMode(mode) {
        if (this.isRunning && !confirm("Timer is running. Do you want to switch mode?")) {
            return;
        }

        this.pauseTimer(); // đảm bảo dừng trước khi chuyển
        this.currentMode = mode;
        this.totalTime = this.modes[mode].time;
        this.timeLeft = this.totalTime;
        this.targetMinutes = this.totalTime / 60;
        this.studiedSeconds = 0;

        document.querySelectorAll(".mode-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === mode);
        });

        this.updateDisplay();
        this.updateSessionInfo();
        this.updateTargetTime();

        if (mode === "pomodoro") {
            this.updateTimerMessage("Ready to study! Press Start to begin.");
        } else {
            this.updateTimerMessage("Break time! Relax and recharge.");
        }
    }

    /* ========== START / PAUSE / RESET FLOW ========== */

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        const subjectSelect = document.getElementById("subjectSelect");

        if (
            this.currentMode === "pomodoro" &&
            (!subjectSelect || !subjectSelect.value || subjectSelect.value === "new")
        ) {
            alert("Please select a subject before starting!");
            return;
        }

        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        // Nếu là session học mới (pomodoro) và chưa có sessionId → gọi API start
        if (this.currentMode === "pomodoro" && !this.currentSessionId) {
            this.startStudySessionAPI();
        }

        this.interval = setInterval(() => this.tick(), 1000);

        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) {
            toggleBtn.textContent = "Pause";
            toggleBtn.classList.add("running");
        }

        this.updateTimerMessage(
            this.currentMode === "pomodoro"
                ? "Focus on your studies! 🎯"
                : "Enjoy your break! ☕"
        );
    }

    pauseTimer() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.interval);

        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) {
            toggleBtn.textContent = "Start";
            toggleBtn.classList.remove("running");
        }

        this.updateTimerMessage("Timer paused");
    }

    // CLICK nút Reset (hoặc phím R)
    handleResetClick() {
        if (this.hasSignificantStudy()) {
            // đang ở study và đã học ≥ 1 phút → tạm dừng + confirm
            this.pauseTimer();
            this.showConfirmationModal();
        } else {
            // chưa học đủ 1 phút → reset ngay, không emotion
            this._hardReset();
        }
    }

    // Reset sạch timer, không hỏi gì (dùng sau khi đã lưu emotion)
    _hardReset() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.interval);

        this.timeLeft = this.totalTime;
        this.studiedSeconds = 0;
        this.currentSessionId = null;

        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) {
            toggleBtn.textContent = "Start";
            toggleBtn.classList.remove("running");
        }

        // Reset progress bar
        const progressFill = document.getElementById("progress-fill");
        const progressText = document.getElementById("progress-text");
        if (progressFill) progressFill.style.width = "0%";
        if (progressText) progressText.textContent = "0 minutes";

        if (window.coinSystem && this.currentMode === "pomodoro") {
            window.coinSystem.currentStudySession = 0;
            window.coinSystem.updateStudyProgress();
        }

        this.updateDisplay();
        this.updateTimerMessage("Timer reset");
    }

    // Public reset cho những chỗ muốn reset ngay (emotion save/skip)
    reset() {
        this._hardReset();
    }

    /* ========== TICK & HOÀN THÀNH ========== */

    tick() {
        if (this.timeLeft > 0) {
            this.timeLeft--;

            if (this.currentMode === "pomodoro") {
                this.studiedSeconds++;

                if (window.coinSystem) {
                    window.coinSystem.addStudyTime(1);
                }

                const progress = (this.studiedSeconds / this.totalTime) * 100;
                const progressFill = document.getElementById("progress-fill");
                const progressText = document.getElementById("progress-text");

                if (progressFill) {
                    progressFill.style.width = progress + "%";
                }
                if (progressText) {
                    progressText.textContent =
                        Math.floor(this.studiedSeconds / 60) + " minutes";
                }
            }

            this.updateDisplay();
        } else {
            this.onTimeUp();
        }
    }

    onTimeUp() {
        this.isRunning = false;
        clearInterval(this.interval);

        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) {
            toggleBtn.textContent = "Start";
            toggleBtn.classList.remove("running");
        }

        if (this.currentMode === "pomodoro") {
            // Hết giờ học → kết thúc session, KHÔNG confirm, mở emotion
            this.finishStudying();
        } else {
            this.updateTimerMessage("Break time is over!");
            setTimeout(() => this.switchMode("pomodoro"), 2000);
        }
    }

    /* ========== CONFIRMATION MODAL ========== */

    showConfirmationModal() {
        const modal = document.getElementById("confirmation-modal");
        const studiedTime = document.getElementById("studied-time");
        if (!modal || !studiedTime) return;

        const studiedMinutes = Math.floor(this.studiedSeconds / 60);
        studiedTime.textContent = studiedMinutes;
        modal.classList.add("active");
    }

    hideConfirmationModal() {
        const modal = document.getElementById("confirmation-modal");
        if (modal) modal.classList.remove("active");
    }

    continueStudying() {
        this.hideConfirmationModal();
        this.startTimer(); // tiếp tục đếm
        this.updateTimerMessage("Welcome back! Continue studying...");
    }

    async finishStudying() {
        // Có thể được gọi từ:
        // - Hết giờ (onTimeUp)
        // - Nhấn Reset > Confirm > "No, I'm done"
        this.hideConfirmationModal();
        this.pauseTimer(); // đảm bảo dừng timer

        try {
            const res = await fetch("/study/api/stop/", {
                method: "POST",
                headers: { "X-CSRFToken": this.getCSRF() }
            });
            const data = await res.json();
            console.log("Stopped session:", data);

            this.currentSessionId = data.session_id;

            const duration = Number(data.duration_seconds) || 0;
            const minutes = Math.round(duration / 60);
            const points = Number(data.points_awarded) || 0;

            const summaryText = document.getElementById("study-summary-text");
            if (summaryText) {
                summaryText.textContent = `You studied for ${minutes} minutes and earned ${points} coins!`;
            }

            const emotionModal = document.getElementById("emotionModal");
            if (emotionModal) {
                emotionModal.classList.remove("hidden");
            }

            this.updateTimerMessage("Session finished. Please record your mood.");
        } catch (err) {
            console.error("Error finishing study session:", err);
        }
    }

    /* ========== UI UPDATE HELPERS ========== */

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timerDisplay = document.getElementById("timer-display");

        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}`;

            if (this.isRunning) {
                timerDisplay.style.color = "var(--primary)";
                timerDisplay.style.transform = "scale(1.05)";
            } else {
                timerDisplay.style.color = "var(--dark)";
                timerDisplay.style.transform = "scale(1)";
            }
        }
    }

    updateTargetTime() {
        const targetTime = document.getElementById("target-time");
        if (targetTime) targetTime.textContent = `${this.targetMinutes} minutes`;
    }

    updateSessionInfo() {
        const sessionType = document.getElementById("current-session-type");
        if (sessionType) sessionType.textContent = this.modes[this.currentMode].name;
    }

    updateTimerMessage(message) {
        const timerMessage = document.getElementById("timer-message");
        if (timerMessage) timerMessage.textContent = message;
    }

    updatePresetButtons(activeBtn) {
        document.querySelectorAll(".preset-btn").forEach(btn => {
            btn.classList.remove("active");
        });
        if (activeBtn) activeBtn.classList.add("active");
    }

    getCSRF() {
        const cookie = document.cookie.split("; ").find(r => r.startsWith("csrftoken="));
        return cookie ? cookie.split("=")[1] : "";
    }

    async startStudySessionAPI() {
        try {
            const subjectSelect = document.getElementById("subjectSelect");
            const subjectId = subjectSelect ? subjectSelect.value : null;

            const response = await fetch("/study/api/start/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": this.getCSRF()
                },
                body: JSON.stringify({ subject_id: subjectId })
            });

            const data = await response.json();
            console.log("API start:", data);

            if (data.session_id) {
                this.currentSessionId = data.session_id;
            }
        } catch (err) {
            console.error("Error starting study session:", err);
        }
    }
}

/* ========== INIT + EMOTION HANDLERS ========== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Khởi tạo PomodoroTimer
    window.pomodoroTimer = new PomodoroTimer();
    console.log("Pomodoro Timer loaded");

    // 2. Load active character cho Pomodoro
    fetch("/shop/api/characters/")
        .then(res => res.json())
        .then(data => {
            if (data.status === "success" && data.active_character) {
                const img = document.getElementById("current-pomo-character");
                if (img && data.active_character.image_path) {
                    img.src = "/" + data.active_character.image_path.replace(/^\/+/, "");
                    img.alt = data.active_character.name || "My Character";
                }
            }
        })
        .catch(err => {
            console.error("Error loading active character for pomodoro:", err);
        });

    // 3. Keyboard shortcuts
    document.addEventListener("keydown", e => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

        switch (e.key) {
            case " ":
                e.preventDefault();
                const toggleBtn = document.getElementById("toggle-btn");
                if (toggleBtn) toggleBtn.click();
                break;
            case "r":
            case "R":
                e.preventDefault();
                window.pomodoroTimer.handleResetClick();
                break;
        }
    });

    // 4. Subject modal như cũ
    function setupSubjectModal() {
        const subjectSelect = document.getElementById("subjectSelect");
        const modal = document.getElementById("subjectModal");
        const modalInput = document.getElementById("modalSubjectName");
        const saveBtn = document.getElementById("saveModal");
        const cancelBtn = document.getElementById("cancelModal");

        if (!subjectSelect || !modal) return;

        subjectSelect.addEventListener("change", () => {
            if (subjectSelect.value === "new") {
                modal.classList.remove("hidden");
                modalInput.value = "";
                modalInput.focus();
            }
        });

        cancelBtn?.addEventListener("click", () => {
            modal.classList.add("hidden");
            subjectSelect.value = "";
        });

        saveBtn?.addEventListener("click", async () => {
            const name = modalInput.value.trim();
            if (!name) return alert("Please enter a subject name!");

            const response = await fetch("/study/api/add-subject/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": window.pomodoroTimer.getCSRF()
                },
                body: JSON.stringify({ name })
            });

            const data = await response.json();

            if (data.status === "ok") {
                const newOpt = document.createElement("option");
                newOpt.value = data.id;
                newOpt.textContent = name;
                subjectSelect.insertBefore(newOpt, subjectSelect.lastElementChild);
                subjectSelect.value = data.id;
                modal.classList.add("hidden");
            } else {
                alert("Error adding subject");
            }
        });
    }
    setupSubjectModal();

    // 5. Emotion popup logic
    let selectedEmotion = null;

    document.querySelectorAll(".emotion-option").forEach(btn => {
        btn.addEventListener("click", () => {
            selectedEmotion = btn.dataset.emotion;
            document
                .querySelectorAll(".emotion-option")
                .forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            const saveBtn = document.getElementById("emotion-save-btn");
            if (saveBtn) saveBtn.disabled = false;
        });
    });

    const saveEmotionBtn = document.getElementById("emotion-save-btn");
    if (saveEmotionBtn) {
        saveEmotionBtn.addEventListener("click", async () => {
            const notes = document.getElementById("emotion-notes-input").value;

            await fetch("/emotion/save-mood/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": window.pomodoroTimer.getCSRF()
                },
                body: JSON.stringify({
                    session_id: window.pomodoroTimer.currentSessionId,
                    emotion: selectedEmotion,
                    notes: notes
                })
            });

            document.getElementById("emotionModal").classList.add("hidden");
            window.pomodoroTimer.reset(); // reset sạch, KHÔNG confirm
        });
    }

    const skipEmotionBtn = document.getElementById("emotion-skip-btn");
    if (skipEmotionBtn) {
        skipEmotionBtn.addEventListener("click", () => {
            document.getElementById("emotionModal").classList.add("hidden");
            window.pomodoroTimer.reset(); // reset sạch, KHÔNG confirm
        });
    }
});

// Export for tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = PomodoroTimer;
}
