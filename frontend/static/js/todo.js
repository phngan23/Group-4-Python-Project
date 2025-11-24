// Todo App với Smart Task Predictor
let currentTasks = [];
let currentFilter = "all";

// ADD TODO FUNCTIONALITY
function initializeAddTodo() {
  const saveBtn = document.getElementById("save-task-btn");
  const trainBtn = document.getElementById("train-ai-btn");

  if (!saveBtn) return;

  saveBtn.addEventListener("click", createNewTask);

  if (trainBtn) {
    trainBtn.addEventListener("click", trainAIModel);
  }

  // Real-time prediction
  const inputs = [
    document.getElementById("task-title"),
    document.getElementById("task-description"),
    document.getElementById("task-category"),
    document.getElementById("task-priority"),
  ];

  inputs.forEach((input) => {
    if (input) {
      input.addEventListener("input", debounce(predictTaskDuration, 800));
      input.addEventListener("change", debounce(predictTaskDuration, 500));
    }
  });

  // Set minimum datetime
  const dueDateInput = document.getElementById("task-due-date");
  if (dueDateInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dueDateInput.min = now.toISOString().slice(0, 16);
  }

  // Initial prediction
  setTimeout(predictTaskDuration, 1000);
}

function createNewTask() {
  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-description").value.trim();
  const category = document.getElementById("task-category").value;
  const priority = document.getElementById("task-priority").value;
  const dueDate = document.getElementById("task-due-date").value;

  if (!title) {
    showNotification("Please enter a task title!", "error");
    return;
  }

  const taskData = {
    title: title,
    description: description,
    category: category,
    priority: priority,
  };

  if (dueDate) {
    taskData.due_date = new Date(dueDate).toISOString();
  }

  fetch("/todo/api/create-task/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify(taskData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        showNotification(
          `Task created! You'll earn ${data.reward_coins} coins. Estimated: ${data.predicted_duration}`,
          "success"
        );
        setTimeout(() => {
          window.location.href = "/todo/list/";
        }, 1500);
      } else {
        showNotification("Error: " + data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error creating task:", error);
      showNotification("Error creating task. Please try again.", "error");
    });
}

// AI PREDICTION FUNCTIONALITY
function predictTaskDuration() {
  const title = document.getElementById("task-title")?.value.trim();
  const description = document.getElementById("task-description")?.value.trim();
  const category = document.getElementById("task-category")?.value;
  const priority = document.getElementById("task-priority")?.value;

  if (!title) {
    hidePredictionResult();
    return;
  }

  const taskData = {
    title: title,
    description: description,
    category: category,
    priority: priority,
  };

  fetch("/todo/api/predict-duration/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify(taskData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        showPredictionResult(data);
      }
    })
    .catch((error) => {
      console.error("Prediction error:", error);
    });
}

function showPredictionResult(data) {
  let predictionElement = document.getElementById("prediction-result");

  if (!predictionElement) {
    predictionElement = document.createElement("div");
    predictionElement.id = "prediction-result";
    predictionElement.className = "prediction-card";

    const formActions = document.querySelector(".form-actions");
    formActions.parentNode.insertBefore(predictionElement, formActions);
  }

  predictionElement.style.display = "block";

  // Update confidence badge
  const confidenceBadge =
    document.getElementById("confidence-badge") ||
    predictionElement.querySelector(".confidence-badge");
  if (confidenceBadge) {
    confidenceBadge.textContent = data.confidence;
    confidenceBadge.className = `confidence-badge ${data.confidence}`;
  }

  // Update duration text
  const durationText =
    document.getElementById("duration-text") ||
    predictionElement.querySelector("#duration-text");
  if (durationText) {
    durationText.textContent = data.duration_text;
  }

  // Update prediction tip
  const predictionTip =
    document.getElementById("prediction-tip") ||
    predictionElement.querySelector("#prediction-tip");
  if (predictionTip) {
    predictionTip.textContent = getPredictionTip(data.predicted_minutes);
  }
}

function hidePredictionResult() {
  const predictionElement = document.getElementById("prediction-result");
  if (predictionElement) {
    predictionElement.style.display = "none";
  }
}

function getPredictionTip(minutes) {
  if (minutes <= 30) {
    return "Quick task! Perfect for a short break or between study sessions.";
  } else if (minutes <= 60) {
    return "Medium task. Consider using the Pomodoro technique (25min work + 5min break).";
  } else if (minutes <= 120) {
    return "Longer task. Break it into smaller chunks and take regular breaks.";
  } else {
    return "Complex task. Consider splitting into multiple sessions over different days.";
  }
}

function trainAIModel() {
  const trainBtn = document.getElementById("train-ai-btn");
  const originalText = trainBtn.innerHTML;

  trainBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training AI...';
  trainBtn.disabled = true;

  fetch("/todo/api/train-model/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        showNotification(data.message, data.trained ? "success" : "info");

        // Update prediction if we're on add task page
        if (document.getElementById("task-title")?.value.trim()) {
          setTimeout(predictTaskDuration, 500);
        }
      } else {
        showNotification("Training failed: " + data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Training error:", error);
      showNotification("Error training AI model", "error");
    })
    .finally(() => {
      trainBtn.innerHTML = originalText;
      trainBtn.disabled = false;
    });
}

// TODO LIST FUNCTIONALITY
function initializeTodoList() {
  loadTasks();
  setupEventListeners();

  // Setup AI training button
  const trainBtn = document.getElementById("train-model-btn");
  if (trainBtn) {
    trainBtn.addEventListener("click", trainAIModelFromList);
  }
}

function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll(".filter-todo-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter");
      setActiveFilter(filter);
    });
  });
}

function setActiveFilter(filter) {
  currentFilter = filter;

  // Update UI
  document.querySelectorAll(".filter-todo-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active");

  // Reload tasks with new filter
  loadTasks(filter);
}

function loadTasks(statusFilter = "all") {
  fetch(`/todo/api/get-tasks/?status=${statusFilter}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        currentTasks = data.tasks;
        renderTasks(currentTasks);
        renderTaskStats(data.stats);
      }
    })
    .catch((error) => {
      console.error("Error loading tasks:", error);
      showNotification("Error loading tasks", "error");
    });
}

function renderTasks(tasks) {
  const container = document.getElementById("tasks-container");
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No tasks found</h3>
                <p>${getEmptyStateMessage(currentFilter)}</p>
            </div>
        `;
    return;
  }

  container.innerHTML = tasks
    .map((task) => {
      const isCompleted = task.is_completed;
      const isOverdue = task.is_overdue;
      const priorityClass = `task-priority ${task.priority}`;
      const categoryIcon = getCategoryIcon(task.category);

      return `
            <div class="task-item" data-task-id="${task.id}">
                <div class="task-checkbox ${isCompleted ? "completed" : ""}" 
                     onclick="toggleTaskStatus(${task.id})">
                    ${isCompleted ? "✓" : ""}
                </div>
                <div class="task-content">
                    <div class="task-title ${isCompleted ? "completed" : ""}">
                        ${task.title}
                        ${
                          isCompleted
                            ? `<span class="reward-badge">+${task.reward_coins} coins earned</span>`
                            : `<span class="reward-badge upcoming">+${task.reward_coins} coins</span>`
                        }
                    </div>
                    ${
                      task.description
                        ? `<div class="task-description">${task.description}</div>`
                        : ""
                    }
                    <div class="task-meta">
                        <span class="task-category">${categoryIcon} ${getCategoryDisplay(
        task.category
      )}</span>
                        <span class="${priorityClass}">${getPriorityIcon(
        task.priority
      )} ${task.priority.toUpperCase()}</span>
                        ${
                          task.predicted_duration && !isCompleted
                            ? `<span class="task-duration">⏱️ ${task.predicted_duration}</span>`
                            : ""
                        }
                        ${
                          task.due_date
                            ? `
                            <span class="${isOverdue ? "task-overdue" : ""}">
                                📅 ${formatDate(task.due_date)} 
                                ${
                                  !isCompleted
                                    ? `<small>(${task.time_left})</small>`
                                    : ""
                                }
                            </span>
                        `
                            : ""
                        }
                    </div>
                </div>
                <div class="task-actions">
                    ${
                      !isCompleted
                        ? `
                        <button class="task-action-btn" onclick="completeTask(${task.id})" title="Mark Complete">
                            <i class="fas fa-check"></i>
                        </button>
                    `
                        : ""
                    }
                    <button class="task-action-btn" onclick="deleteTask(${
                      task.id
                    })" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    })
    .join("");
}

function renderTaskStats(stats) {
  const statsContainer = document.getElementById("task-stats");
  if (!statsContainer) return;

  statsContainer.innerHTML = `
        <div class="stat-todo-card">
            <div class="stat-number">${stats.total}</div>
            <div class="stat-todo-label">Total Tasks</div>
        </div>
        <div class="stat-todo-card">
            <div class="stat-number">${stats.pending}</div>
            <div class="stat-todo-label">Pending</div>
        </div>
        <div class="stat-todo-card">
            <div class="stat-number">${stats.completed}</div>
            <div class="stat-todo-label">Completed</div>
        </div>
        <div class="stat-todo-card">
            <div class="stat-number">${stats.overdue}</div>
            <div class="stat-todo-label">Overdue</div>
        </div>
    `;
}

function toggleTaskStatus(taskId) {
  const task = currentTasks.find((t) => t.id === taskId);
  if (task) {
    const newStatus = task.is_completed ? "pending" : "completed";
    updateTaskStatus(taskId, newStatus);
  }
}

function completeTask(taskId) {
  updateTaskStatus(taskId, "completed");
}

function updateTaskStatus(taskId, status) {
  fetch(`/todo/api/update-task-status/${taskId}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify({ status: status }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        if (data.new_status === "completed") {
          showNotification(
            "Task completed! Coins have been added to your account.",
            "success"
          );
        }
        loadTasks(currentFilter);
      } else {
        showNotification("Error: " + data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error updating task:", error);
      showNotification("Error updating task", "error");
    });
}

function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) {
    return;
  }

  fetch(`/todo/api/delete-task/${taskId}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        showNotification("Task deleted successfully", "success");
        loadTasks(currentFilter);
      } else {
        showNotification("Error: " + data.message, "error");
      }
    })
    .catch((error) => {
      console.error("Error deleting task:", error);
      showNotification("Error deleting task", "error");
    });
}

function trainAIModelFromList() {
  const trainBtn = document.getElementById("train-model-btn");
  const resultDiv = document.getElementById("training-result");

  const originalText = trainBtn.innerHTML;
  trainBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training...';
  trainBtn.disabled = true;

  if (resultDiv) {
    resultDiv.innerHTML =
      '<i class="fas fa-sync fa-spin"></i> AI is learning from your completed tasks...';
  }

  fetch("/todo/api/train-model/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (resultDiv) {
        if (data.status === "success") {
          resultDiv.innerHTML = `
                    <div style="color: #4CAF50;">
                        <i class="fas fa-check-circle"></i> ${data.message}
                    </div>
                    <small>Used ${data.training_samples} completed tasks for training</small>
                `;
        } else {
          resultDiv.innerHTML = `
                    <div style="color: #F44336;">
                        <i class="fas fa-exclamation-circle"></i> ${data.message}
                    </div>
                `;
        }
      }
    })
    .catch((error) => {
      console.error("Training error:", error);
      if (resultDiv) {
        resultDiv.innerHTML = `
                <div style="color: #F44336;">
                    <i class="fas fa-exclamation-circle"></i> Training failed
                </div>
            `;
      }
    })
    .finally(() => {
      trainBtn.innerHTML = originalText;
      trainBtn.disabled = false;
    });
}

// HELPER FUNCTIONS
function getEmptyStateMessage(filter) {
  const messages = {
    all: "Create your first task to get started!",
    pending: "No pending tasks. Great job! 🎉",
    completed: "No completed tasks yet. Complete some tasks to see them here!",
    overdue: "No overdue tasks. Excellent time management! ⭐",
  };
  return messages[filter] || "No tasks found.";
}

function getCategoryIcon(category) {
  const icons = {
    study: "📚",
    homework: "📝",
    project: "💼",
    review: "📖",
    other: "📌",
  };
  return icons[category] || "📌";
}

function getCategoryDisplay(category) {
  const displays = {
    study: "Study",
    homework: "Homework",
    project: "Project",
    review: "Review",
    other: "Other",
  };
  return displays[category] || "Other";
}

function getPriorityIcon(priority) {
  const icons = {
    high: "🔴",
    medium: "🟡",
    low: "🔵",
  };
  return icons[priority] || "⚪";
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

  // Add styles if not exists
  if (!document.querySelector("#notification-styles")) {
    const styles = document.createElement("style");
    styles.id = "notification-styles";
    styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 10px;
                padding: 15px 20px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid #6C63FF;
                max-width: 400px;
            }
            .notification.success { border-left-color: #4CAF50; }
            .notification.error { border-left-color: #F44336; }
            .notification.info { border-left-color: #2196F3; }
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
    document.head.appendChild(styles);
  }

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Keyboard shortcuts
document.addEventListener("keydown", function (event) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case "n":
        event.preventDefault();
        if (window.location.pathname.includes("/todo/add/")) return;
        window.location.href = "/todo/add/";
        break;
      case "l":
        event.preventDefault();
        if (window.location.pathname.includes("/todo/list/")) return;
        window.location.href = "/todo/list/";
        break;
    }
  }
});
