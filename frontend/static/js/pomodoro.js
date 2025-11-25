// ==========================================
// 1. API HANDLER CLASS (Giao tiếp Backend)
// ==========================================
class StudyAPI {
    // Lấy CSRF Token từ cookie để gửi request an toàn
    static getCSRF() {
        const cookie = document.cookie.split("; ").find(r => r.startsWith("csrftoken="));
        return cookie ? cookie.split("=")[1] : "";
    }

    // Hàm gửi request chung
    static async request(url, method = "POST", body = {}) {
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": this.getCSRF()
                },
                body: JSON.stringify(body)
            });

            // Xử lý trường hợp Server báo lỗi 400 (Bad Request)
            // Thường xảy ra khi Frontend tưởng đang chạy nhưng Backend đã mất session
            if (!res.ok) {
                if (res.status === 400) {
                    const errData = await res.json();
                    if (errData.message === 'no_active_session') {
                        console.warn("⚠️ Server: No active session found.");
                        return { status: 'error', code: 'no_session' };
                    }
                }
                throw new Error(`API Error: ${res.status}`);
            }
            return await res.json();
        } catch (err) {
            console.error(`Request failed: ${url}`, err);
            return null;
        }
    }

    // Các phương thức gọi API cụ thể
    static start(subjectId) { return this.request("/study/api/start/", "POST", { subject_id: subjectId }); }
    static stop() { return this.request("/study/api/stop/", "POST"); }     // Lưu và kết thúc
    static cancel(sessionId) { return this.request("/study/api/cancel/", "POST", { session_id: sessionId }); } // Xóa bỏ
    static pause() { return this.request("/study/api/pause/", "POST"); }
    static resume() { return this.request("/study/api/resume/", "POST"); }
    
    static addSubject(name) {
        return this.request("/study/api/add-subject/", "POST", { name });
    }

    static saveEmotion(sessionId, emotion, notes) {
        return fetch("/emotion/save-mood/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": this.getCSRF() },
            body: JSON.stringify({ session_id: sessionId, emotion, notes })
        });
    }
}

// ==========================================
// 2. MAIN TIMER CLASS (Logic Đồng hồ)
// ==========================================
class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.timeLeft = 25 * 60; 
        this.totalTime = 25 * 60;
        this.currentMode = "pomodoro"; // pomodoro | shortBreak | longBreak
        this.studiedSeconds = 0;       // Thời gian học hiển thị trên UI
        this.currentSessionId = null;  // ID của session trong Database
        
        this.interval = null; // Biến giữ đồng hồ đếm ngược
        this.modes = {
            pomodoro: { time: 25 * 60, name: "Study Time" },
            shortBreak: { time: 5 * 60, name: "Short Break" },
            longBreak: { time: 15 * 60, name: "Long Break" }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Khôi phục trạng thái nếu người dùng lỡ tải lại trang
        const savedState = JSON.parse(localStorage.getItem('pomodoroState'));
        if (savedState) {
            this.restoreState(savedState);
        } else {
            this.updateDisplay();
        }
        
        // Mini Clock (Chạy ngầm để hiển thị trên tab trình duyệt hoặc widget)
        this.updateGlobalMiniClock();
        setInterval(() => this.updateGlobalMiniClock(), 1000);
    }

    /* --- STATE MANAGEMENT (Lưu/Khôi phục trạng thái) --- */
    saveState() {
        const state = {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentMode: this.currentMode,
            timeLeft: this.timeLeft,
            totalTime: this.totalTime,
            studiedSeconds: this.studiedSeconds,
            currentSessionId: this.currentSessionId,
            lastSavedTime: Date.now(),
            subjectId: document.getElementById('subjectSelect')?.value || ''
        };
        localStorage.setItem('pomodoroState', JSON.stringify(state));
    }

    restoreState(state) {
        this.isRunning = state.isRunning;
        this.isPaused = state.isPaused;
        this.currentMode = state.currentMode;
        this.timeLeft = state.timeLeft;
        this.totalTime = state.totalTime;
        this.studiedSeconds = state.studiedSeconds || 0;
        this.currentSessionId = state.currentSessionId;

        // Tính toán thời gian trôi qua khi đóng tab
        if (this.isRunning && !this.isPaused) {
            const elapsed = Math.floor((Date.now() - state.lastSavedTime) / 1000);
            this.timeLeft = Math.max(0, this.timeLeft - elapsed);
            
            if (this.timeLeft > 0) {
                this.startTimerInterval();
            } else {
                this.complete(); 
            }
        }
        
        // Khôi phục UI
        const subjectSelect = document.getElementById('subjectSelect');
        if (subjectSelect && state.subjectId) subjectSelect.value = state.subjectId;
        
        this.updateDisplay();
        this.updateModeUI();
        this.updateUIStatus(this.isRunning ? (this.isPaused ? "paused" : "running") : "idle");
    }

    clearState() {
        localStorage.removeItem('pomodoroState');
        this.currentSessionId = null;
    }

    /* --- TIMER LOGIC (Logic chạy/dừng) --- */
    
    // Helper: Chỉ dừng đồng hồ UI (không gọi API)
    stopLocalTimer() {
        if (this.interval) clearInterval(this.interval);
        this.isRunning = false;
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    async start() {
        // Kiểm tra chọn môn học
        if (this.currentMode === 'pomodoro' && !this.currentSessionId) {
            const subjectId = document.getElementById("subjectSelect")?.value;
            if (!subjectId || subjectId === 'new' || subjectId === '') {
                alert('Please select a subject before starting!');
                return;
            }
            
            // Gọi API Start Session mới
            const data = await StudyAPI.start(subjectId);
            if (data && data.session_id) {
                this.currentSessionId = data.session_id;
            } else {
                return; // Lỗi không start được
            }
        } else if (this.currentMode === 'pomodoro' && this.isPaused) {
            // Nếu đang Pause -> Gọi API Resume
            const res = await StudyAPI.resume();
            if (res && res.code === 'no_session') {
                // Nếu server báo không có session -> Reset để tránh lỗi
                this.hardReset();
                return;
            }
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startTimerInterval();
        this.updateUIStatus("running");
        this.saveState();
    }

    async pause() {
        this.stopLocalTimer(); // Dừng UI ngay cho mượt
        this.isPaused = true;
        this.updateUIStatus("paused");
        
        if (this.currentMode === 'pomodoro') {
            const res = await StudyAPI.pause();
            if (res && res.code === 'no_session') {
                this.hardReset();
                return;
            }
        }
        this.saveState();
    }

    startTimerInterval() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                if (this.currentMode === 'pomodoro') this.studiedSeconds++;
                this.updateDisplay();
                this.saveState();
            } else {
                this.complete();
            }
        }, 1000);
    }

    complete() {
        this.stopLocalTimer();
        
        if (this.currentMode === 'pomodoro') {
            // Hết giờ học -> Tự động kết thúc và lưu
            this.finishSession(); 
        } else {
            alert("Break is over!");
            this.switchMode('pomodoro');
        }
    }

    /* --- RESET & STOP LOGIC (Logic quan trọng nhất) --- */
    
    // Xử lý khi bấm nút Reset
    async handleResetRequest() {
        if (this.currentMode === "pomodoro") {
            
            // TRƯỜNG HỢP 1: Đã học >= 1 phút
            // -> Tạm dừng, hiện Modal hỏi "Tiếp tục" hay "Nghỉ hẳn"
            if (this.studiedSeconds >= 60) {
                this.stopLocalTimer();
                this.isPaused = true;
                this.updateUIStatus("paused");
                
                // Hiện Modal
                document.getElementById("confirmation-modal").classList.add("active");
                document.getElementById("studied-time").textContent = Math.floor(this.studiedSeconds / 60);
            } 
            
            // TRƯỜNG HỢP 2: Học < 1 phút
            // -> XÓA (Cancel) session khỏi DB
            else {
                if (this.currentSessionId) {
                    console.log("⏳ Session < 1 min. Deleting from DB...");
                    await StudyAPI.cancel(this.currentSessionId); 
                }
                this.hardReset();
            }
        } else {
            // Nếu đang nghỉ giải lao -> Reset luôn
            this.hardReset();
        }
    }

    // Reset cứng (Xóa sạch trạng thái UI về ban đầu)
    hardReset() {
        console.log("🔄 Hard Reset.");
        this.stopLocalTimer();
        this.isPaused = false;
        this.timeLeft = this.totalTime;
        this.studiedSeconds = 0;
        this.currentSessionId = null;
        
        this.clearState();
        this.updateDisplay();
        this.updateUIStatus("idle");
        
        // Reset thanh progress bar
        const progressFill = document.getElementById("progress-fill");
        const progressText = document.getElementById("progress-text");
        if (progressFill) progressFill.style.width = "0%";
        if (progressText) progressText.textContent = "0 minutes";
    }

    // Kết thúc session (Dùng khi hết giờ hoặc user chọn "No, I'm done")
    async finishSession() {
        console.log("🏁 Finishing session...");
        
        // 1. Ẩn modal xác nhận nếu có
        const modal = document.getElementById("confirmation-modal");
        if (modal) modal.classList.remove("active");
        
        // 2. Dừng timer local
        this.stopLocalTimer(); 

        // 3. GỌI API STOP ĐỂ LƯU END_TIME
        const data = await StudyAPI.stop();
        
        if (data) {
            console.log("✅ Session saved:", data);
            
            // Lấy dữ liệu trả về để hiển thị
            const duration = data.duration_seconds || this.studiedSeconds;
            const points = data.points_awarded || 0;
            const actualMins = Math.round(duration / 60);
            
            const summaryText = document.getElementById("study-summary-text");
            if (summaryText) {
                summaryText.textContent = `You studied for ${actualMins} minutes and earned ${points} coins!`;
            }
            
            // Hiện popup cảm xúc
            const emotionModal = document.getElementById("emotionModal");
            if (emotionModal) emotionModal.classList.remove("hidden");
        } else {
            // Fallback nếu lỗi mạng: vẫn hiện popup để user không bị kẹt
            console.warn("⚠️ Could not stop properly. Showing modal anyway.");
            const emotionModal = document.getElementById("emotionModal");
            if (emotionModal) emotionModal.classList.remove("hidden");
        }
    }

    /* --- UI HELPERS --- */
    updateDisplay() {
        const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');
        const display = document.getElementById("timer-display");
        if (display) {
            display.textContent = `${m}:${s}`;
            document.title = `${m}:${s} - Pomodoro`;
        }

        // Cập nhật thanh tiến độ
        const progressFill = document.getElementById("progress-fill");
        const progressText = document.getElementById("progress-text");
        if (progressFill && this.currentMode === 'pomodoro') {
            const percent = (this.studiedSeconds / this.totalTime) * 100;
            progressFill.style.width = `${Math.min(percent, 100)}%`;
            progressText.textContent = `${Math.floor(this.studiedSeconds / 60)} minutes`;
        }
    }

    updateUIStatus(status) {
        const btn = document.getElementById("toggle-btn");
        if (!btn) return;
        const msg = document.getElementById("timer-message");

        if (status === "running") {
            btn.textContent = "Pause";
            btn.classList.add("running");
            if(msg) msg.textContent = "Focus on your studies! 🎯";
        } else if (status === "paused") {
            btn.textContent = "Resume";
            btn.classList.remove("running");
            if(msg) msg.textContent = "Timer paused";
        } else {
            btn.textContent = "Start";
            btn.classList.remove("running");
        }
    }

    switchMode(mode) {
        if (this.isRunning && !confirm("Stop current timer?")) return;
        this.hardReset();
        this.currentMode = mode;
        this.totalTime = this.modes[mode].time;
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        this.updateModeUI();
    }

    updateModeUI() {
        document.querySelectorAll(".mode-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === this.currentMode);
        });
        document.getElementById("current-session-type").textContent = this.modes[this.currentMode].name;
        document.getElementById("target-time").textContent = `${this.totalTime/60} minutes`;
    }

    setTime(minutes) {
        if (this.isRunning) this.stopLocalTimer();
        this.totalTime = minutes * 60;
        this.timeLeft = this.totalTime;
        this.updateDisplay();
        document.getElementById("target-time").textContent = `${minutes} minutes`;
        this.updateUIStatus("idle");
    }

    updateGlobalMiniClock() {
        const container = document.getElementById('mini-clock-container');
        const timeDisplay = document.getElementById('mini-clock-time');
        
        if (!container || !timeDisplay) return;

        if (this.isRunning && !this.isPaused) {
            container.style.display = 'block';
            const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
            const s = (this.timeLeft % 60).toString().padStart(2, '0');
            timeDisplay.textContent = `${m}:${s}`;
        } else {
            container.style.display = 'none';
        }
    }

    /* --- EVENT LISTENERS --- */
    setupEventListeners() {
        console.log("🔌 Setting up event listeners...");

        // 1. Nút Start/Pause
        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) toggleBtn.addEventListener("click", () => this.toggleTimer());

        // 2. Nút Reset (Gắn sự kiện onclick để tránh trùng lặp)
        const resetBtn = document.getElementById("reset-btn");
        if (resetBtn) resetBtn.onclick = () => this.handleResetRequest();

        // 3. Các nút chọn Mode (Study/Short Break...)
        document.querySelectorAll(".mode-btn").forEach(btn => {
            btn.addEventListener("click", (e) => this.switchMode(e.target.dataset.mode));
        });

        // 4. Các nút chọn thời gian nhanh
        document.querySelectorAll(".preset-btn").forEach(btn => {
            btn.addEventListener("click", (e) => this.setTime(parseInt(e.target.dataset.minutes)));
        });
        
        // 5. Nút set thời gian Custom
        const setCustomBtn = document.getElementById("set-custom-time");
        if (setCustomBtn) {
            setCustomBtn.addEventListener("click", () => {
                const val = document.getElementById("custom-minutes").value;
                if (val) this.setTime(parseInt(val));
            });
        }

        // 6. Modal Xác nhận - Nút "Yes, I'm still studying"
        const continueBtn = document.getElementById("continue-studying");
        if (continueBtn) {
            continueBtn.onclick = () => {
                document.getElementById("confirmation-modal").classList.remove("active");
                this.start(); // Tiếp tục học
            };
        }

        // 7. Modal Xác nhận - Nút "No, I'm done"
        const finishBtn = document.getElementById("finish-studying");
        if (finishBtn) {
            finishBtn.onclick = () => {
                this.finishSession(); // Kết thúc và LƯU
            };
        }

        // 8. Khởi tạo các Modal khác
        this.setupSubjectModal();
        this.setupEmotionModal();
    }

    setupSubjectModal() {
        const select = document.getElementById("subjectSelect");
        const modal = document.getElementById("subjectModal");
        if(!select) return;

        select.addEventListener("change", () => {
            if (select.value === "new") modal.classList.remove("hidden");
        });

        document.getElementById("cancelModal")?.addEventListener("click", () => {
            modal.classList.add("hidden");
            select.value = "";
        });

        document.getElementById("saveModal")?.addEventListener("click", async () => {
            const name = document.getElementById("modalSubjectName").value;
            if (!name) return;
            const res = await StudyAPI.addSubject(name);
            if (res && res.status === "ok") {
                const opt = new Option(name, res.id);
                select.add(opt, select.options[select.length - 1]);
                select.value = res.id;
                modal.classList.add("hidden");
            }
        });
    }

    setupEmotionModal() {
        let selectedEmotion = null;
        document.querySelectorAll(".emotion-option").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".emotion-option").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                selectedEmotion = btn.dataset.emotion;
                document.getElementById("emotion-save-btn").disabled = false;
            });
        });

        const closeEmotion = () => {
            document.getElementById("emotionModal").classList.add("hidden");
            this.hardReset(); // Sau khi chọn cảm xúc xong -> Reset sạch đồng hồ để bắt đầu mới
        };

        document.getElementById("emotion-save-btn")?.addEventListener("click", async () => {
            const notes = document.getElementById("emotion-notes-input").value;
            await StudyAPI.saveEmotion(this.currentSessionId, selectedEmotion, notes);
            closeEmotion();
        });

        document.getElementById("emotion-skip-btn")?.addEventListener("click", closeEmotion);
    }
}

// Khởi tạo ứng dụng khi trang load xong
document.addEventListener("DOMContentLoaded", () => {
    window.pomodoroTimer = new PomodoroTimer();
});