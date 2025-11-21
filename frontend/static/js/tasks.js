// Tasks Management Functionality
function initializeTasks() {
    const tasksContainer = document.getElementById('tasks-container');
    const fullTasksContainer = document.getElementById('full-tasks-container');
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    let currentFilter = 'all';
    
    // Load tasks
    renderTasks();
    renderFullTasks();
    
    // Add task event
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Filter events
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            currentFilter = this.getAttribute('data-filter');
            
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            renderFullTasks();
        });
    });
    
    function addTask() {
        const taskText = newTaskInput.value.trim();
        if (taskText === '') return;
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        
        appData.tasks.push(newTask);
        newTaskInput.value = '';
        
        renderTasks();
        renderFullTasks();
        updateStats();
    }
    
    function toggleTask(taskId) {
        const task = appData.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            renderTasks();
            renderFullTasks();
            updateStats();
        }
    }
    
    function deleteTask(taskId) {
        appData.tasks = appData.tasks.filter(t => t.id !== taskId);
        renderTasks();
        renderFullTasks();
        updateStats();
    }
    
    function renderTasks() {
        // Show only first 3 tasks for home page
        const tasksToShow = appData.tasks.slice(0, 3);
        
        tasksContainer.innerHTML = tasksToShow.map(task => `
            <div class="task-item">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="window.toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-text ${task.completed ? 'completed' : ''}">
                    ${task.text}
                </div>
            </div>
        `).join('');
        
        // Show "view all" message if there are more tasks
        if (appData.tasks.length > 3) {
            tasksContainer.innerHTML += `
                <div class="task-item">
                    <div style="text-align: center; width: 100%; color: var(--primary);">
                        <i class="fas fa-ellipsis-h"></i> ${appData.tasks.length - 3} more tasks
                    </div>
                </div>
            `;
        }
    }
    
    function renderFullTasks() {
        let tasksToShow = appData.tasks;
        
        // Apply filter
        if (currentFilter === 'pending') {
            tasksToShow = appData.tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            tasksToShow = appData.tasks.filter(task => task.completed);
        }
        
        fullTasksContainer.innerHTML = tasksToShow.map(task => `
            <div class="task-item">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="window.toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-text ${task.completed ? 'completed' : ''}">
                    ${task.text}
                </div>
                <div class="task-actions">
                    <button class="task-delete" onclick="window.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        if (tasksToShow.length === 0) {
            fullTasksContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-tasks" style="font-size: 48px; margin-bottom: 15px;"></i>
                    <p>No tasks found</p>
                </div>
            `;
        }
    }
    
    function updateStats() {
        const completedTasks = appData.tasks.filter(task => task.completed).length;
        const totalTasks = appData.tasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Update progress ring
        const progressRing = document.querySelector('.progress-ring');
        if (progressRing) {
            progressRing.style.background = `conic-gradient(var(--primary) ${completionRate}%, #e0e0e0 0)`;
            progressRing.querySelector('.progress-ring-inner').textContent = `${completionRate}%`;
        }
        
        // Update task count
        const taskCountElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
        if (taskCountElement) {
            taskCountElement.textContent = `${completedTasks}/${totalTasks}`;
        }
    }
    
    // Expose functions to global scope for onclick handlers
    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;
}


           