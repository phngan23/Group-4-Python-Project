// Pomodoro Timer with Coin System Integration
class PomodoroTimer {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.timeLeft = 25 * 60; // 25 minutes in seconds
    this.totalTime = 25 * 60;
    this.currentMode = "pomodoro";
    this.interval = null;
    this.studiedSeconds = 0;
    this.targetMinutes = 25;

    this.currentSessionId = null;
    this.endTime = null; // Thời điểm kết thúc dự kiến (Timestamp)

    this.modes = {
      pomodoro: { time: 25 * 60, name: "Study Time" },
      shortBreak: { time: 5 * 60, name: "Short Break" },
      longBreak: { time: 15 * 60, name: "Long Break" },
    };

    this.init();
  }

  init() {
    this.setupEventListeners();

    // --- THAY ĐỔI 1: Load lại trạng thái cũ khi vào trang ---
    this.loadState();

    // Cập nhật giao diện sau khi load
    this.updateDisplay();
    this.updateSessionInfo();
    this.updateTargetTime();
    console.log("Pomodoro Timer initialized with persistence");
  }

  // Hàm lưu trạng thái hiện tại vào ổ cứng trình duyệt
  saveState() {
    // Lấy thẻ select
    const subjectSelect = document.getElementById("subjectSelect");

    // Lấy giá trị (ID môn học) hiện tại, nếu không có thì để chuỗi rỗng
    const currentSubjectId = subjectSelect ? subjectSelect.value : "";

    const state = {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentMode: this.currentMode,
      totalTime: this.totalTime,
      timeLeft: this.timeLeft, // Chỉ dùng khi pause
      studiedSeconds: this.studiedSeconds,
      targetMinutes: this.targetMinutes,
      currentSessionId: this.currentSessionId,
      endTime: this.endTime, // Quan trọng nhất: thời điểm phải kết thúc
      lastUpdated: Date.now(),
      subjectId: currentSubjectId,
    };
    localStorage.setItem("pomodoroState", JSON.stringify(state));
  }

  // Hàm khôi phục trạng thái khi tải lại trang
  loadState() {
    const savedJSON = localStorage.getItem("pomodoroState");
    if (!savedJSON) return; // Không có gì để load

    const saved = JSON.parse(savedJSON);

    // Khôi phục các biến cơ bản
    this.currentMode = saved.currentMode || "pomodoro";
    this.totalTime = saved.totalTime;
    this.targetMinutes = saved.targetMinutes;
    this.currentSessionId = saved.currentSessionId;
    this.studiedSeconds = saved.studiedSeconds || 0;
    this.isPaused = saved.isPaused;

    // --- MỚI: Khôi phục Subject đã chọn ---
    if (saved.subjectId) {
      const subjectSelect = document.getElementById("subjectSelect");
      if (subjectSelect) {
        // Cần chắc chắn rằng option đó tồn tại trong select
        // Nếu option được load ajax thì có thể cần delay, nhưng với Django template thì ok
        subjectSelect.value = saved.subjectId;
      }
    }

    // Cập nhật giao diện nút Mode
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === this.currentMode);
    });

    // LOGIC KHÔI PHỤC THỜI GIAN
    if (saved.isRunning && saved.endTime) {
      const now = Date.now();
      const distance = saved.endTime - now;

      if (distance > 0) {
        // Nếu thời gian vẫn còn -> Tiếp tục chạy
        this.isRunning = true;
        this.endTime = saved.endTime;
        this.timeLeft = Math.ceil(distance / 1000);

        // Cập nhật giao diện nút Start -> Pause
        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) {
          toggleBtn.textContent = "Pause";
          toggleBtn.classList.add("running");
        }
        const resetBtn = document.getElementById("reset-btn");
        if (resetBtn) resetBtn.disabled = false;

        // Chạy lại interval
        this.interval = setInterval(() => this.tick(), 1000);
      } else {
        // Nếu thời gian đã hết trong lúc chuyển trang -> Kết thúc luôn
        this.timeLeft = 0;
        this.complete();
        this.clearState(); // Xóa save để tránh lặp
        return;
      }
    } else {
      // Nếu trạng thái cũ là Pause hoặc Stop
      this.isRunning = false;
      this.timeLeft = saved.timeLeft;

      // Nếu đang Pause, cập nhật giao diện
      if (this.isPaused) {
        this.updateTimerMessage("Timer paused");
        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) toggleBtn.textContent = "Start";
      }
    }
  }

  // Xóa trạng thái lưu trữ (khi Reset hoặc xong)
  clearState() {
    localStorage.removeItem("pomodoroState");
  }

  // ---------------------------------------------

  setupEventListeners() {
    // --- MỚI: Lắng nghe thay đổi Subject để lưu ngay lập tức ---
    const subjectSelect = document.getElementById("subjectSelect");
    if (subjectSelect) {
      subjectSelect.addEventListener("change", () => {
        // Lưu trạng thái ngay khi chọn môn học mới
        this.saveState();
      });
    }

    // 1. Xử lý chuyển đổi chế độ (Mode buttons)
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchMode(e.target.dataset.mode);
      });
    });

    // 2. Xử lý nút thời gian có sẵn (Preset buttons)
    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const minutes = parseInt(e.target.dataset.minutes);
        this.setTime(minutes);
        this.updatePresetButtons(e.target);
      });
    });

    // 3. Xử lý nút Start/Pause (Toggle Button)
    const toggleBtn = document.getElementById("toggle-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        if (this.isRunning) {
          this.stop();
        } else {
          this.start();
        }
      });
    }

    // 4. Xử lý nút Reset
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (this.studiedSeconds > 60) {
          this.stop(); // stop() sẽ tự show confirmation modal
        } else {
          // Chưa học gì -> chỉ reset timer
          this.reset();
        }
      });
    }

    // 5. Xử lý Custom time
    const customInput = document.getElementById("custom-minutes");
    const setCustomBtn = document.getElementById("set-custom-time");

    if (setCustomBtn && customInput) {
      setCustomBtn.addEventListener("click", () => {
        // Lấy giá trị từ ô nhập liệu
        //const toggleBtn = document.getElementById("toggle-btn");
        const minutes = parseInt(customInput.value);

        // Kiểm tra hợp lệ (1 - 240 phút)
        if (!isNaN(minutes) && minutes > 0 && minutes <= 240) {
          this.setTime(minutes);
          this.updatePresetButtons(null);
          customInput.value = "";
        } else {
          alert("Please enter a valid number between 1 and 240 minutes!");
        }
      });

      // Hỗ trợ ấn Enter trong ô input
      customInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          setCustomBtn.click();
        }
      });
    }

    // 6. Confirmation modal buttons
    const continueBtn = document.getElementById("continue-studying");
    if (continueBtn) {
      continueBtn.addEventListener("click", () => this.continueStudying());
    }

    const finishBtn = document.getElementById("finish-studying");
    if (finishBtn) {
      finishBtn.addEventListener("click", () => this.finishStudying());
    }
  }

  setTime(minutes) {
    this.targetMinutes = minutes;
    this.totalTime = minutes * 60;
    this.timeLeft = minutes * 60;

    // Dừng nếu đang chạy khi đổi giờ
    if (this.isRunning) {
      this.stop();
    } else {
      // Nếu không chạy thì chỉ cần reset nút hiển thị
      const toggleBtn = document.getElementById("toggle-btn");
      if (toggleBtn) {
        toggleBtn.textContent = "Start";
        toggleBtn.classList.remove("running");
      }
    }

    // Lưu lại thiết lập mới
    this.saveState();

    this.updateDisplay();
    this.updateTargetTime();
    this.updateTimerMessage(`Timer set to ${minutes} minutes`);
  }

  switchMode(mode) {
    if (this.isRunning) {
      if (!confirm("Timer is running. Do you want to switch mode?")) {
        return;
      }
      this.stop();
    }

    this.currentMode = mode;
    this.totalTime = this.modes[mode].time;
    this.timeLeft = this.totalTime;
    this.targetMinutes = this.totalTime / 60;
    this.studiedSeconds = 0;

    // Xóa session ID cũ khi chuyển mode
    this.currentSessionId = null;

    // Update active mode button
    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    // Lưu mode mới
    this.saveState();

    this.updateDisplay();
    this.updateSessionInfo();
    this.updateTargetTime(); // Cập nhật lại dòng Target Text

    if (mode === "pomodoro") {
      this.updateTimerMessage("Ready to study! Press Start to begin.");
    } else {
      this.updateTimerMessage("Break time! Relax and recharge.");
    }
  }

  start() {
    const subjectSelect = document.getElementById("subjectSelect");

    // Yêu cầu chọn subject
    if (
      this.currentMode === "pomodoro" &&
      (!subjectSelect.value ||
        subjectSelect.value === "" ||
        subjectSelect.value === "new")
    ) {
      alert("Please select a subject before starting!");
      return;
    }

    if (this.isRunning) return; // bảo vệ tránh double-start

    this.isRunning = true;
    this.isPaused = false;

    // --- CODE MỚI: Tính thời điểm kết thúc dựa trên thời gian thực ---
    // Lấy thời gian hiện tại + số giây còn lại * 1000 (đổi ra mili giây)
    this.endTime = Date.now() + this.timeLeft * 1000;

    // Nếu ở chế độ STUDY và chưa có session → tạo mới
    if (this.currentMode === "pomodoro" && !this.currentSessionId) {
      this.startStudySessionAPI();
    }

    this.interval = setInterval(() => this.tick(), 1000);

    // Cập nhật nút Start -> Pause
    const toggleBtn = document.getElementById("toggle-btn");
    if (toggleBtn) {
      toggleBtn.textContent = "Pause";
      toggleBtn.classList.add("running");
    }

    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) resetBtn.disabled = false;

    if (this.currentMode === "pomodoro") {
      this.updateTimerMessage("Focus on your studies! 🎯");
    } else {
      this.updateTimerMessage("Enjoy your break! ☕");
    }

    // --- THAY ĐỔI 2: Lưu trạng thái khi bắt đầu ---
    this.saveState();

    console.log("Timer started");
  }

  stop() {
    if (!this.isRunning) {
      // Nếu không chạy nhưng đã học rồi -> vẫn mở confirm (trường hợp bấm Reset sau khi tạm dừng)
      //if (this.currentMode === "pomodoro" && this.studiedSeconds > 0) {
      //  this.showConfirmationModal();
      // }
      return;
    }

    this.isRunning = false;
    this.isPaused = true;
    clearInterval(this.interval);

    // Cập nhật nút Pause -> Start
    const toggleBtn = document.getElementById("toggle-btn");
    if (toggleBtn) {
      toggleBtn.textContent = "Start"; // Hoặc "Resume"
      toggleBtn.classList.remove("running");
    }
    // Nếu đang học và đã học > 1 phút → mở popup confirm
    //if (this.currentMode === "pomodoro" && this.studiedSeconds > 0) {
    //  this.showConfirmationModal();
    //} else {
    this.updateTimerMessage("Timer paused");
    // }

    // --- THAY ĐỔI 3: Lưu trạng thái khi tạm dừng ---
    this.saveState();

    console.log("Timer stopped");
  }

  reset() {
    // Nếu đang học đủ 60s → popup confirm
    if (this.currentMode === "pomodoro" && this.studiedSeconds >= 60) {
      this.showConfirmationModal();
      return; // Không reset ngay
    }

    // Reset bình thường
    this.isRunning = false;
    this.isPaused = false;
    clearInterval(this.interval);
    this.timeLeft = this.totalTime;
    this.studiedSeconds = 0;
    this.currentSessionId = null;

    // Reset nút về trạng thái Start
    const toggleBtn = document.getElementById("toggle-btn");
    if (toggleBtn) {
      toggleBtn.textContent = "Start";
      toggleBtn.classList.remove("running");
    }

    this.updateDisplay();
    this.updateTimerMessage("Timer reset");

    // Reset coin system progress for this session
    if (window.coinSystem && this.currentMode === "pomodoro") {
      window.coinSystem.currentStudySession = 0;
      window.coinSystem.updateStudyProgress();
    }

    // --- THAY ĐỔI 4: Xóa trạng thái lưu trữ khi reset hoàn toàn ---
    this.clearState();

    console.log("Timer reset");
  }

  tick() {
    // --- CODE MỚI: Tính toán lại timeLeft dựa trên thời gian thực ---
    const now = Date.now();
    const distance = this.endTime - now; // Khoảng cách còn lại (ms)

    if (distance > 100) {
      const newTimeLeft = Math.ceil(distance / 1000);

      // Tính số giây thực tế đã trôi qua trong lần tick này (để cộng coin)
      // Nếu tab bị ẩn 10s, thì delta sẽ là 10, coin sẽ được cộng bù 10
      const delta = this.timeLeft - newTimeLeft;
      this.timeLeft = newTimeLeft;

      // Track study time for coin system
      if (this.currentMode === "pomodoro") {
        this.studiedSeconds = this.totalTime - this.timeLeft;

        // Update coin system every second
        if (window.coinSystem && delta > 0) {
          window.coinSystem.addStudyTime(delta);
        }

        // Update Study Progress Bar
        const progress =
          ((this.totalTime - this.timeLeft) / this.totalTime) * 100;

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
      // Tùy chọn: Lưu mỗi giây để chắc chắn (nếu lỡ crash trình duyệt)
      // Nhưng để tối ưu hiệu năng, ta chỉ lưu mỗi 5s hoặc 10s
      if (this.timeLeft % 5 === 0) {
        this.saveState();
      }
    } else {
      this.timeLeft = 0;
      this.updateDisplay();
      this.complete();
    }
  }

  complete() {
    this.isRunning = false;
    clearInterval(this.interval);

    // Xóa state khi hoàn thành
    this.clearState();

    const toggleBtn = document.getElementById("toggle-btn");
    if (toggleBtn) {
      toggleBtn.textContent = "Start";
      toggleBtn.classList.remove("running");
    }

    if (this.currentMode === "pomodoro") {
      this.updateTimerMessage("Study session completed! 🎉");
      // Auto-complete and reward coins
      this.finishStudying();
    } else {
      this.updateTimerMessage("Break time is over!");
      // Auto switch back to study mode
      setTimeout(() => this.switchMode("pomodoro"), 2000);
    }

    console.log("Timer completed");
  }

  showConfirmationModal() {
    const modal = document.getElementById("confirmation-modal");
    const studiedTime = document.getElementById("studied-time");
    if (!modal || !studiedTime) return;

    const studiedMinutes = Math.floor(this.studiedSeconds / 60);
    studiedTime.textContent = studiedMinutes;
    modal.classList.add("active");

    // Disable background interactions
    document
      .querySelectorAll("button:not(.confirm-btn):not(.cancel-btn)")
      .forEach((btn) => {
        btn.style.pointerEvents = "none";
      });
  }

  hideConfirmationModal() {
    const modal = document.getElementById("confirmation-modal");
    if (!modal) return;

    modal.classList.remove("active");

    // Re-enable background interactions
    document.querySelectorAll("button").forEach((btn) => {
      btn.style.pointerEvents = "";
    });
  }

  continueStudying() {
    this.hideConfirmationModal();

    // Continue with remaining time
    if (window.coinSystem) {
      window.coinSystem.continueStudySession();
    }

    this.start(); // Continue studying
    this.updateTimerMessage("Welcome back! Continue studying...");

    console.log("User continued studying");
  }

  async finishStudying() {
    this.hideConfirmationModal();

    // GỌI API STOP SESSION
    const res = await fetch("/study/api/stop/", {
      method: "POST",
      headers: { "X-CSRFToken": this.getCSRF() },
    });

    const data = await res.json();
    console.log("Stopped session:", data);

    // Lưu session ID để liên kết cảm xúc
    this.currentSessionId = data.session_id;

    const duration = Number(data.duration_seconds) || 0;
    const minutes = Math.round(duration / 60);
    const points = Number(data.points_awarded) || 0;

    // Đổ dữ liệu vào popup cảm xúc
    const summaryText = document.getElementById("study-summary-text");
    summaryText.textContent = `You studied for ${minutes} minutes and earned ${points} coins!`;

    // MỞ POPUP CẢM XÚC
    const emotionModal = document.getElementById("emotionModal");
    if (emotionModal) {
      emotionModal.classList.remove("hidden");
    }

    this.updateTimerMessage("Session finished. Please record your mood.");
  }
  catch(err) {
    console.error("Error finishing study session:", err);
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const timerDisplay = document.getElementById("timer-display");

    if (timerDisplay) {
      timerDisplay.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      // Add visual feedback when running
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
    if (targetTime) {
      targetTime.textContent = `${this.targetMinutes} minutes`;
    }
  }

  updateSessionInfo() {
    const sessionType = document.getElementById("current-session-type");
    if (sessionType) {
      sessionType.textContent = this.modes[this.currentMode].name;
    }
  }

  updateTimerMessage(message) {
    const timerMessage = document.getElementById("timer-message");
    if (timerMessage) {
      timerMessage.textContent = message;
    }
  }

  updatePresetButtons(activeBtn) {
    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    if (activeBtn) {
      activeBtn.classList.add("active");
    }
  }

  /* Get current timer status
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            currentMode: this.currentMode,
            timeLeft: this.timeLeft,
            studiedSeconds: this.studiedSeconds,
            targetMinutes: this.targetMinutes
        };
    } */

  // Quick start methods
  quickStart(minutes) {
    this.setTime(minutes);
    this.start();
  }

  getCSRF() {
    const cookie = document.cookie
      .split("; ")
      .find((r) => r.startsWith("csrftoken="));
    return cookie ? cookie.split("=")[1] : "";
  }

  // Gọi API Django: BẮT ĐẦU học
  async startStudySessionAPI() {
    try {
      const subjectSelect = document.getElementById("subjectSelect");
      const subjectId = subjectSelect ? subjectSelect.value : null;

      const response = await fetch("/study/api/start/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": this.getCSRF(),
        },
        body: JSON.stringify({ subject_id: subjectId }),
      });

      const data = await response.json();
      console.log("API start:", data);

      if (data.session_id) {
        this.currentSessionId = data.session_id;
        // console.log("Saved session ID:", this.currentSessionId);
      }
    } catch (err) {
      console.error("Error starting study session:", err);
    }
  }

  // Gọi API Django: KẾT THÚC học
  async stopStudySessionAPI() {
    try {
      const response = await fetch("/study/api/stop/", {
        method: "POST",
        headers: { "X-CSRFToken": this.getCSRF() },
      });

      const data = await response.json();
      console.log("API stop:", data);

      if (data.status === "stopped") {
        alert(
          `Bạn đã học ${Math.round(data.duration_seconds / 60)} phút và nhận ${
            data.points_awarded
          } coins!`
        );
      }
    } catch (err) {
      console.error("Error stopping study session:", err);
    }
  }
}

// Initialize timer when page loads + Load character + Setup emotion
document.addEventListener("DOMContentLoaded", () => {
  // 1. Khởi tạo PomodoroTimer
  window.pomodoroTimer = new PomodoroTimer();
  console.log("Pomodoro Timer loaded");

  // 2. Load active character cho Pomodoro từ API
  fetch("/shop/api/characters/")
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success" && data.active_character) {
        const img = document.getElementById("current-pomo-character");
        if (img && data.active_character.image_path) {
          //img.src = data.active_character.image_path;
          img.src = "/" + data.active_character.image_path.replace(/^\/+/, "");
          img.alt = data.active_character.name || "My Character";
        }
      }
    })

    .catch((err) => {
      console.error("Error loading active character for pomodoro:", err);
    });

  // 3. Add keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT") return; // Ignore when typing in inputs

    switch (e.key) {
      case " ": // Space bar to start/stop
        e.preventDefault();
        const toggleBtn = document.getElementById("toggle-btn");
        if (toggleBtn) toggleBtn.click();
        break;

      case "r": // R to reset
      case "R":
        e.preventDefault();
        window.pomodoroTimer.reset();
        break;

      case "1": // Number keys for quick start
        e.preventDefault();
        window.pomodoroTimer.quickStart(30);
        break;

      case "2":
        e.preventDefault();
        window.pomodoroTimer.quickStart(60);
        break;

      case "3":
        e.preventDefault();
        window.pomodoroTimer.quickStart(90);
        break;

      case "4":
        e.preventDefault();
        window.pomodoroTimer.quickStart(120);
        break;
    }
  });
  console.log("Pomodoro Timer loaded with keyboard shortcuts");

  // 4. Subject Modal
  function setupSubjectModal() {
    const subjectSelect = document.getElementById("subjectSelect");
    const modal = document.getElementById("subjectModal");
    const modalInput = document.getElementById("modalSubjectName");
    const saveBtn = document.getElementById("saveModal");
    const cancelBtn = document.getElementById("cancelModal");

    // Nếu không có subjectSelect thì thoát (phòng ngừa trang khác)
    if (!subjectSelect || !modal) {
      console.warn("Subject select or modal not found on this page.");
      return;
    }

    // Mở modal khi chọn "Add new subject"
    subjectSelect.addEventListener("change", () => {
      if (subjectSelect.value === "new") {
        modal.classList.remove("hidden");
        modalInput.value = "";
        modalInput.focus();
      }
    });

    // Cancel modal
    cancelBtn?.addEventListener("click", () => {
      modal.classList.add("hidden");
      subjectSelect.value = "";
    });

    // Save new subject
    saveBtn?.addEventListener("click", async () => {
      const name = modalInput.value.trim();
      if (!name) return alert("Please enter a subject name!");

      const response = await fetch("/study/api/add-subject/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": window.pomodoroTimer.getCSRF(),
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        // Thêm option vào dropdown
        const newOpt = document.createElement("option");
        newOpt.value = data.id;
        newOpt.textContent = name;

        // Thêm trước "Add new subject"
        subjectSelect.insertBefore(newOpt, subjectSelect.lastElementChild);

        // Chọn subject vừa tạo
        subjectSelect.value = data.id;

        // Ẩn modal
        modal.classList.add("hidden");
      } else {
        alert("Error adding subject");
      }
    });
  }

  setupSubjectModal();

  // 5. Emotion popup logic
  let selectedEmotion = null;

  // chọn emotion
  document.querySelectorAll(".emotion-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedEmotion = btn.dataset.emotion;

      document
        .querySelectorAll(".emotion-option")
        .forEach((b) => b.classList.remove("selected"));

      btn.classList.add("selected");
      const saveBtn = document.getElementById("emotion-save-btn");
      if (saveBtn) saveBtn.disabled = false;
    });
  });

  // Lưu emotion
  const saveEmotionBtn = document.getElementById("emotion-save-btn");
  if (saveEmotionBtn) {
    saveEmotionBtn.addEventListener("click", async () => {
      const notes = document.getElementById("emotion-notes-input").value;

      await fetch("/emotion/save-mood/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": window.pomodoroTimer.getCSRF(),
        },
        body: JSON.stringify({
          session_id: window.pomodoroTimer.currentSessionId,
          emotion: selectedEmotion,
          notes: notes,
        }),
      });

      document.getElementById("emotionModal").classList.add("hidden");

      // reset timer
      window.pomodoroTimer.reset();
    });
  }

  // Skip emotion
  const skipEmotionBtn = document.getElementById("emotion-skip-btn");
  if (skipEmotionBtn) {
    skipEmotionBtn.addEventListener("click", () => {
      document.getElementById("emotionModal").classList.add("hidden");
      window.pomodoroTimer.reset();
    });
  }
});

// Export for other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = PomodoroTimer;
}
