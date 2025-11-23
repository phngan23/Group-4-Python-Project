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

        // QUAN TRỌNG: Thời gian học THỰC TẾ (không tính pause)
        this.actualStudiedSeconds = 0;

        this.currentSessionId = null;
        this.miniClockInterval = null; // Thêm biến quản lý mini clock

        this.modes = {
            pomodoro: { time: 25 * 60, name: "Study Time" },
            shortBreak: { time: 5 * 60, name: "Short Break" },
            longBreak: { time: 15 * 60, name: "Long Break" }
        };

        this.init();
    }

    // Thêm các hàm persistence
    saveState() {
        const state = {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentMode: this.currentMode,
            totalTime: this.totalTime,
            timeLeft: this.timeLeft,
            studiedSeconds: this.studiedSeconds,
            actualStudiedSeconds: this.actualStudiedSeconds,
            targetMinutes: this.targetMinutes,
            currentSessionId: this.currentSessionId,
            startTimestamp: this.startTimestamp, // Thời điểm bắt đầu thực tế
            lastSavedTime: Date.now(), // Thời điểm lưu state
            subjectId: document.getElementById('subjectSelect')?.value || ''
        };
        localStorage.setItem('pomodoroState', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('pomodoroState');
        if (!saved) return null;
        
        try {
            return JSON.parse(saved);
        } catch (error) {
            console.error('Error parsing saved state:', error);
            return null;
        }
    }

    clearState() {
        localStorage.removeItem('pomodoroState');
    }

    // Tính toán thời gian đã trôi qua khi reload
    calculateElapsedTime(savedState) {
        if (!savedState.isRunning || savedState.isPaused) {
            return 0;
        }
        
        const now = Date.now();
        const lastSaved = savedState.lastSavedTime;
        const elapsedSeconds = Math.floor((now - lastSaved) / 1000);
        
        console.log("Elapsed time calculation:", {
            now, lastSaved, elapsedSeconds, 
            savedRunning: savedState.isRunning, 
            savedPaused: savedState.isPaused
        });

        return elapsedSeconds;
    }

    /* ========== INIT & EVENTS ========== */
    init() {
        this.setupEventListeners();

        // Load state từ localStorage
        const savedState = this.loadState();
        if (savedState) {
            this.restoreFromSavedState(savedState);
        } else {
            this.updateDisplay();
            this.updateSessionInfo();
            this.updateTargetTime();
        }
        
        // Start global timer cho mini clock
        this.startGlobalTimer();
        
        console.log("Pomodoro Timer initialized with persistence");
    }

    restoreFromSavedState(savedState) {
        console.log("🔁 Restoring from saved state:", savedState);
        
        this.isRunning = savedState.isRunning;
        this.isPaused = savedState.isPaused;
        this.currentMode = savedState.currentMode;
        this.totalTime = savedState.totalTime;
        this.studiedSeconds = savedState.studiedSeconds || 0;
        this.actualStudiedSeconds = savedState.actualStudiedSeconds || 0;
        this.targetMinutes = savedState.targetMinutes;
        this.currentSessionId = savedState.currentSessionId;
        this.startTimestamp = savedState.startTimestamp;

        // QUAN TRỌNG: Tính thời gian còn lại thực tế
        const elapsed = this.calculateElapsedTime(savedState);
        this.timeLeft = Math.max(0, savedState.timeLeft - elapsed);
        
        console.log("⏰ Time calculation:", {
            savedTimeLeft: savedState.timeLeft,
            elapsed: elapsed,
            newTimeLeft: this.timeLeft
        });

        // Nếu hết giờ thì hoàn thành session
        if (this.timeLeft <= 0) {
            console.log("⏰ Time's up during restore");
            this.timeLeft = 0;
            this.complete();
            return;
        }

        // QUAN TRỌNG: Nếu timer đang chạy, KHỞI ĐỘNG LẠI TIMER
        if (this.isRunning && !this.isPaused) {
            console.log("▶️ Restarting timer after restore");
            // Đặt lại trạng thái trước khi start
            this.isRunning = false;
            this.isPaused = false;
            
            // Clear any existing interval
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
            
            // Khởi động timer
            this.startTimer();
        }

        // KHÔI PHỤC SUBJECT SELECT
        if (savedState.subjectId) {
            const subjectSelect = document.getElementById('subjectSelect');
            if (subjectSelect) {
                setTimeout(() => {
                    subjectSelect.value = savedState.subjectId;
                    console.log("📚 Restored subject:", savedState.subjectId);
                }, 100);
            }
        }

        // Update UI
        this.updateDisplay();
        this.updateSessionInfo();
        this.updateTargetTime();
        
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });
        
        console.log("✅ Restore completed - running:", this.isRunning, "paused:", this.isPaused);
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
        this.actualStudiedSeconds = 0;

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

        if (this.currentMode === 'pomodoro') {
            const savedState = this.loadState();
            const hasExistingSession = savedState && savedState.currentSessionId;
            
            // CHỈ kiểm tra subject cho session mới, không kiểm tra khi restore
            if (!hasExistingSession && (!subjectSelect || !subjectSelect.value || subjectSelect.value === 'new')) {
                alert('Please select a subject before starting!');
                return;
            }
        }

        console.log("▶️ Starting timer - current running state:", this.isRunning);
        
        // QUAN TRỌNG: Clear interval cũ trước khi tạo mới
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startTimestamp = Date.now();

        // Nếu là session học mới (pomodoro) và chưa có sessionId → gọi API start
        if (this.currentMode === "pomodoro" && !this.currentSessionId) {
            console.log("🆕 Starting new study session");
            this.startStudySessionAPI();
        } else {
            console.log("🔁 Continuing existing session:", this.currentSessionId);
        }

        this.interval = setInterval(() => this.tick(), 1000);

        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) {
            toggleBtn.textContent = "Pause";
            toggleBtn.classList.add("running");
        }

        // Lưu state
        this.saveState();
        
        // Update global mini clock
        this.updateGlobalMiniClock();

        this.updateTimerMessage(
            this.currentMode === "pomodoro"
                ? "Focus on your studies! 🎯"
                : "Enjoy your break! ☕"
        );
        
        console.log("✅ Timer started successfully - running:", this.isRunning, "paused:", this.isPaused);
    }

    // Thêm method này vào class PomodoroTimer
    forceRestartTimer() {
        console.log("🔄 Force restarting timer");
        
        // Clear mọi interval
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        if (this.miniClockInterval) {
            clearInterval(this.miniClockInterval);
            this.miniClockInterval = null;
        }
        
        // Reset state
        this.isRunning = false;
        this.isPaused = false;
        
        // Load state mới nhất
        const savedState = this.loadState();
        if (savedState) {
            this.restoreFromSavedState(savedState);
        }
    }

    pauseTimer() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.interval);

        // Clear mini clock interval
        if (this.miniClockInterval) {
            clearInterval(this.miniClockInterval);
            this.miniClockInterval = null;
        }

        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) {
            toggleBtn.textContent = "Start";
            toggleBtn.classList.remove("running");
        }

        this.saveState();
        this.updateGlobalMiniClock();

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

        // Clear mini clock interval
        if (this.miniClockInterval) {
            clearInterval(this.miniClockInterval);
            this.miniClockInterval = null;
        }

        this.timeLeft = this.totalTime;
        this.studiedSeconds = 0;
        this.actualStudiedSeconds = 0; // RESET THỜI GIAN THỰC TẾ
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

        this.clearState(); // Clear saved state
        this.updateDisplay();
        this.updateGlobalMiniClock();
        this.updateTimerMessage("Timer reset");
    }

    // Public reset cho những chỗ muốn reset ngay (emotion save/skip)
    reset() {
        this._hardReset();
    }

    complete() {
        this.isRunning = false;
        clearInterval(this.interval);

        // Clear mini clock interval
        if (this.miniClockInterval) {
            clearInterval(this.miniClockInterval);
            this.miniClockInterval = null;
        }

        const toggleBtn = document.getElementById('toggle-btn');
        if (toggleBtn) {
            toggleBtn.textContent = 'Start';
            toggleBtn.classList.remove('running');
        }

        if (this.currentMode === 'pomodoro') {
            this.updateTimerMessage('Study session completed! 🎉');
            // Auto-complete and reward coins
            this.finishStudying();
        } else {
            this.updateTimerMessage('Break time is over!');
            // Auto switch back to study mode
            setTimeout(() => this.switchMode('pomodoro'), 2000);
        }

        console.log('Timer completed');
    }

    /* ========== TICK & HOÀN THÀNH ========== */

    tick() {
        console.log("Tick - timeLeft:", this.timeLeft, "running:", this.isRunning, "paused:", this.isPaused);

        if (this.timeLeft > 0) {
            this.timeLeft--;

            if (this.currentMode === "pomodoro") {
                this.studiedSeconds++;
                this.actualStudiedSeconds++; // CHỈ TĂNG KHI TIMER ĐANG CHẠY (không pause)

                if (window.coinSystem) {
                    window.coinSystem.addStudyTime(1);
                }

                // Update progress bar
                //const progress = (this.studiedSeconds / this.totalTime) * 100;
                const progress = (this.actualStudiedSeconds / this.totalTime) * 100;
                const progressFill = document.getElementById("progress-fill");
                const progressText = document.getElementById("progress-text");

                if (progressFill) {
                    progressFill.style.width = progress + "%";
                }
                if (progressText) {
                    progressText.textContent = Math.floor(this.studiedSeconds / 60) + " minutes";
                }
            }

            this.updateDisplay();

            this.saveState();
            
            // Update global mini clock
            this.updateGlobalMiniClock();

        } else {
            console.log("Time's up! Completing session...");
            this.onTimeUp();
        }
    }

    onTimeUp() {
        this.isRunning = false;
        clearInterval(this.interval);

        // Clear mini clock interval
        if (this.miniClockInterval) {
            clearInterval(this.miniClockInterval);
            this.miniClockInterval = null;
        }

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
                headers: { 
                    "Content-Type": "application/json",
                    "X-CSRFToken": this.getCSRF() 
                },
                body: JSON.stringify({
                    actual_study_seconds: this.actualStudiedSeconds // GỬI THỜI GIAN THỰC TẾ
                })
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log("Stopped session:", data);

            this.currentSessionId = data.session_id;
            const actualMinutes = Math.round(data.actual_study_seconds / 60);
            const points = Number(data.points_awarded) || 0;

            const summaryText = document.getElementById("study-summary-text");
            if (summaryText) {
                summaryText.textContent = `You studied for ${actualMinutes} minutes and earned ${points} coins!`;
            }

            const emotionModal = document.getElementById("emotionModal");
            if (emotionModal) {
                emotionModal.classList.remove("hidden");
            }

            this.updateTimerMessage("Session finished. Please record your mood.");
        } catch (err) {
            console.error("Error finishing study session:", err);
            alert("Error finishing study session. Please try again.");
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
                this.saveState(); // Lưu state với sessionId mới
            }
        } catch (err) {
            console.error("Error starting study session:", err);
        }
    }

    // Mini Clock functions
    startGlobalTimer() {
        // Clear existing interval
        if (this.miniClockInterval) {
            clearInterval(this.miniClockInterval);
        }
        
        // Kiểm tra xem có timer đang chạy không
        const savedState = this.loadState();
        if (savedState && savedState.isRunning && !savedState.isPaused) {
            this.updateGlobalMiniClock();
            this.miniClockInterval = setInterval(() => this.updateGlobalMiniClock(), 1000);
        } else {
            this.updateGlobalMiniClock(); // Cập nhật để ẩn mini clock
        }
    }

    updateGlobalMiniClock() {
        const container = document.getElementById('mini-clock-container');
        const timeDisplay = document.getElementById('mini-clock-time');
        const modeDisplay = document.getElementById('mini-clock-mode');
        
        if (!container || !timeDisplay) return;
        
        const savedState = this.loadState();
        
        if (savedState && savedState.isRunning && !savedState.isPaused) {
            // Hiển thị mini clock
            container.style.display = 'block';
            
            // Tính thời gian còn lại thực tế
            let currentTimeLeft = savedState.timeLeft;
            if (savedState.isRunning && !savedState.isPaused) {
                const elapsed = this.calculateElapsedTime(savedState);
                currentTimeLeft = Math.max(0, savedState.timeLeft - elapsed);
            }
            
            // Format time
            const minutes = Math.floor(currentTimeLeft / 60);
            const seconds = currentTimeLeft % 60;
            timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Hiển thị mode
            if (modeDisplay) {
                const modeNames = {
                    'pomodoro': 'Study',
                    'shortBreak': 'Break', 
                    'longBreak': 'Break'
                };
                modeDisplay.textContent = modeNames[savedState.currentMode] || 'Timer';
            }
        } else {
            // Ẩn mini clock khi không có timer chạy
            container.style.display = 'none';
        }
    }

    // Cleanup method
    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        if (this.miniClockInterval) {
            clearInterval(this.miniClockInterval);
        }
    }
}

/* ========== INIT + EMOTION HANDLERS ========== */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Khởi tạo PomodoroTimer
    window.pomodoroTimer = new PomodoroTimer();
    console.log("Pomodoro Timer loaded");

    // THÊM: Tự động fix lỗi timer sau 1 giây
    setTimeout(() => {
        const savedState = window.pomodoroTimer.loadState();
        if (savedState && savedState.isRunning && !savedState.isPaused) {
            console.log("🛠️ Auto-fixing timer state...");
            window.pomodoroTimer.forceRestartTimer();
        }
    }, 1000);

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

    // 4. Subject modal
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