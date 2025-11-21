document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
});

function loadTasks() {
    fetch("/todo/api/get-tasks/?status=all")
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                renderTasks(data.tasks);
                updateProgressRing(data.stats.completed, data.stats.total);
            }
        });
}

function renderTasks(tasks) {
    const container = document.getElementById("tasks-container");
    container.innerHTML = "";

    if (tasks.length === 0) {
        container.innerHTML = `<p>No tasks today 🎉</p>`;
        return;
    }

    const firstThree = tasks.slice(0, 3);

    firstThree.forEach(task => {
        const div = document.createElement("div");
        div.classList.add("task-item");

        // Checkbox — locked (không cho tick)
        const checkbox = document.createElement("div");
        checkbox.classList.add("task-checkbox", "disabled");

        if (task.is_completed) {
            checkbox.classList.add("checked");
            checkbox.innerHTML = `<i class="fas fa-check"></i>`;
        }

        // Text
        const text = document.createElement("div");
        text.classList.add("task-text");
        text.textContent = task.title;

        if (task.is_completed) {
            text.classList.add("completed");
        }

        div.appendChild(checkbox);
        div.appendChild(text);
        container.appendChild(div);
    });
}

/* ----------------------
   UPDATE PROGRESS RING
------------------------- */

function updateProgressRing(completed, total) {
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Update text
    const countEl = document.getElementById("taskProgressCount");
    if (countEl) {
        countEl.textContent = `${completed}/${total}`;
    }

    // Update % in the middle
    const textEl = document.getElementById("taskProgressText");
    if (textEl) {
        textEl.textContent = `${percent}%`;
    }

    // Cập nhật conic-gradient
    const ring = document.getElementById("taskProgressRing");
    if (ring) {
        ring.style.setProperty("--progress", `${percent}%`);
    }
}

function getCSRF() {
    const cookie = document.cookie.split("; ").find(c => c.startsWith("csrftoken="));
    return cookie ? cookie.split("=")[1] : "";
}
