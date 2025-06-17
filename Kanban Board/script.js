class TaskManager {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('kanban_users') || '[]');
        this.tasks = JSON.parse(localStorage.getItem('kanban_tasks') || '[]');
        this.draggedTask = null;
        
        if (this.users.length === 0) {
            this.users = [
                { id: 1, name: "Admin", email: "admin@kanban.com", password: "123456", department: "IT", role: "admin" },
                { id: 2, name: "Ahmet Yılmaz", email: "ahmet@kanban.com", password: "123456", department: "Marketing", role: "employee" },
                { id: 3, name: "Marketing Müdürü", email: "manager@kanban.com", password: "123456", department: "Marketing", role: "admin" },
                { id: 4, name: "Muhasebe Uzmanı", email: "muhasebe@kanban.com", password: "123456", department: "Finance", role: "employee" },
                { id: 5, name: "IT Uzmanı", email: "it@kanban.com", password: "123456", department: "IT", role: "employee" }
            ];
            this.saveUsers();
        }
        
        if (this.tasks.length === 0) {
            this.tasks = [
                { id: 1, title: "Website Tasarımı", description: "Yeni kurumsal website tasarımı", department: "Marketing", assignee: "Ahmet Yılmaz", status: "inprogress", dueDate: "2024-06-01" },
                { id: 2, title: "Sosyal Medya Kampanyası", description: "Yaz kampanyası hazırlıkları", department: "Marketing", assignee: "Marketing Müdürü", status: "done", dueDate: "2024-05-25" },
                { id: 3, title: "Sistem Güncellemesi", description: "Sunucu güncellemeleri", department: "IT", assignee: "IT Uzmanı", status: "todo", dueDate: "2024-05-28" },
                { id: 4, title: "Muhasebe Raporu", description: "Aylık muhasebe raporu hazırlama", department: "Finance", assignee: "Muhasebe Uzmanı", status: "todo", dueDate: "2024-06-05" },
                { id: 5, title: "Sunucu Bakımı", description: "Haftalık sunucu bakım işlemleri", department: "IT", assignee: "Admin", status: "inprogress", dueDate: "2024-05-30" }
            ];
            this.saveTasks();
        }
        
        this.initializeEventListeners();
        this.setupDragAndDrop();
        this.checkLoggedInUser();
    }
    
    saveUsers() {
        localStorage.setItem('kanban_users', JSON.stringify(this.users));
    }
    
    saveTasks() {
        localStorage.setItem('kanban_tasks', JSON.stringify(this.tasks));
    }
    
    saveCurrentUser() {
        localStorage.setItem('kanban_current_user', JSON.stringify(this.currentUser));
    }
    
    checkLoggedInUser() {
        const savedUser = localStorage.getItem('kanban_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showLoginPage();
        }
    }
    
    initializeEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterPage();
        });
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginPage();
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());
        
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskForm(e));
        document.getElementById('closeModal').addEventListener('click', () => this.closeTaskModal());
        
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.openTaskModal(e.target.dataset.status));
        });
        
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeTaskModal();
            }
        });
    }
    
    setupDragAndDrop() {
        const columns = document.querySelectorAll('.task-list');
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => this.handleDragOver(e));
            column.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }
    
    handleDragStart(e, taskId) {
        this.draggedTask = taskId;
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    }
    
    handleDragEnd(e) {
        e.target.style.opacity = '1';
        this.draggedTask = null;
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        if (!this.draggedTask) return;
        
        const targetColumn = e.currentTarget;
        const newStatus = targetColumn.id.replace('List', '');
        
        if (newStatus && (newStatus === 'todo' || newStatus === 'inprogress' || newStatus === 'done')) {
            this.changeTaskStatus(this.draggedTask, newStatus);
        }
    }
    
    showLoginPage() {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('registerPage').classList.add('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }
    
    showRegisterPage() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('registerPage').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }
    
    showMainApp() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('registerPage').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
        this.updateUserInfo();
        this.populateTaskForm();
        this.renderTasks();
    }
    
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showNotification('Lütfen e-posta ve şifre girin!', 'error');
            return;
        }
        
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = user;
            this.saveCurrentUser();
            this.showNotification('Giriş başarılı!', 'success');
            this.showMainApp();
            document.getElementById('loginForm').reset();
        } else {
            this.showNotification('E-posta veya şifre hatalı!', 'error');
        }
    }
    
    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const department = document.getElementById('registerDepartment').value;
        const role = document.getElementById('registerRole').value;
        
        if (!name || !email || !password || !department || !role) {
            this.showNotification('Lütfen tüm alanları doldurun!', 'error');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Geçerli bir e-posta adresi girin!', 'error');
            return;
        }
        
        if (this.users.find(u => u.email === email)) {
            this.showNotification('Bu e-posta zaten kayıtlı!', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            department,
            role
        };
        
        this.users.push(newUser);
        this.saveUsers();
        this.showNotification('Registration successful! You can now log in.', 'success');
        this.showLoginPage();
        document.getElementById('registerForm').reset();
    }
    
    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('kanban_current_user');
        this.showLoginPage();
        this.showNotification('Logged out!', 'success');
    }
    
    updateUserInfo() {
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userDepartment').textContent = this.currentUser.department;
        document.getElementById('userAvatar').textContent = this.currentUser.name.charAt(0).toUpperCase();
    }
    
    getDepartmentTasks() {
        if (this.currentUser.role === 'admin') {
            return this.tasks;
        } else {
            return this.tasks.filter(task => task.department === this.currentUser.department);
        }
    }
    
    populateTaskForm() {
        const taskDepartment = document.getElementById('taskDepartment');
        
        let departments;
        if (this.currentUser.role === 'admin') {
            departments = ['IT', 'HR', 'Marketing', 'Sales', 'Finance'];
        } else {
            departments = [this.currentUser.department];
        }
        
        taskDepartment.innerHTML = '<option value="">Departman Seçin</option>';
        
        departments.forEach(dept => {
            taskDepartment.innerHTML += `<option value="${dept}">${dept}</option>`;
        });
        
        if (this.currentUser.role !== 'admin') {
            taskDepartment.value = this.currentUser.department;
            taskDepartment.disabled = true;
        }
        
        const taskAssignee = document.getElementById('taskAssignee');
        
        let eligibleUsers;
        if (this.currentUser.role === 'admin') {
            eligibleUsers = this.users;
        } else {
            eligibleUsers = this.users.filter(user => user.department === this.currentUser.department);
        }
        
        taskAssignee.innerHTML = '<option value="">Select Person</option>';
        
        eligibleUsers.forEach(user => {
            taskAssignee.innerHTML += `<option value="${user.name}">${user.name}</option>`;
        });
    }
    
    openTaskModal(status = 'todo') {
        document.getElementById('taskModal').classList.remove('hidden');
        document.getElementById('taskStatus').value = status;
        document.getElementById('modalTitle').textContent = 'Yeni Görev';
        document.getElementById('taskForm').reset();
        document.getElementById('taskStatus').value = status;
        
        if (this.currentUser.role !== 'admin') {
            document.getElementById('taskDepartment').value = this.currentUser.department;
            document.getElementById('taskDepartment').disabled = true;
        }
    }
    
    closeTaskModal() {
        document.getElementById('taskModal').classList.add('hidden');
        document.getElementById('taskForm').reset();
        
        document.getElementById('taskDepartment').disabled = false;
    }
    
    handleTaskForm(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const assignee = document.getElementById('taskAssignee').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const department = document.getElementById('taskDepartment').value;
        const status = document.getElementById('taskStatus').value;
        
        if (!title || !assignee || !department || !status) {
            this.showNotification('Please fill in the required fields!', 'error');
            return;
        }
        
        if (this.currentUser.role !== 'admin' && department !== this.currentUser.department) {
            this.showNotification('You can only add tasks to your own department!', 'error');
            return;
        }
        
        const newTask = {
            id: Date.now(),
            title,
            description,
            assignee,
            dueDate,
            department,
            status
        };
        
        this.tasks.push(newTask);
        this.saveTasks();
        this.renderTasks();
        this.closeTaskModal();
        this.showNotification('Task added successfully!', 'success');
    }
    
    deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === parseInt(taskId));
        
        if (this.currentUser.role !== 'admin' && task.department !== this.currentUser.department) {
            this.showNotification('You do not have permission to delete this task!', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== parseInt(taskId));
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task deleted!', 'success');
        }
    }
    
    changeTaskStatus(taskId, newStatus) {
        const task = this.tasks.find(t => t.id === parseInt(taskId));
        
        if (this.currentUser.role !== 'admin' && task.department !== this.currentUser.department) {
            this.showNotification('You do not have permission to change the status of this task!', 'error');
            return;
        }
        
        if (task) {
            task.status = newStatus;
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task status updated!', 'success');
        }
    }
    
    renderTasks() {
        const todoList = document.getElementById('todoList');
        const inprogressList = document.getElementById('inprogressList');
        const doneList = document.getElementById('doneList');
        
        todoList.innerHTML = '';
        inprogressList.innerHTML = '';
        doneList.innerHTML = '';
        
        const departmentTasks = this.getDepartmentTasks();
        
        const todoCounts = departmentTasks.filter(t => t.status === 'todo').length;
        const inprogressCounts = departmentTasks.filter(t => t.status === 'inprogress').length;
        const doneCounts = departmentTasks.filter(t => t.status === 'done').length;
        const totalCounts = departmentTasks.length;
        
        document.getElementById('todoCount').textContent = todoCounts;
        document.getElementById('inprogressCount').textContent = inprogressCounts;
        document.getElementById('doneCount').textContent = doneCounts;
        
        document.getElementById('totalTasks').textContent = totalCounts;
        document.getElementById('completedTasks').textContent = doneCounts;
        document.getElementById('progressTasks').textContent = inprogressCounts;
        document.getElementById('pendingTasks').textContent = todoCounts;
        
        departmentTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            switch(task.status) {
                case 'todo':
                    todoList.appendChild(taskElement);
                    break;
                case 'inprogress':
                    inprogressList.appendChild(taskElement);
                    break;
                case 'done':
                    doneList.appendChild(taskElement);
                    break;
            }
        });
        
        if (departmentTasks.length === 0) {
            this.showEmptyMessage();
        }
    }
    
    showEmptyMessage() {
        const message = document.createElement('div');
        message.className = 'empty-message';
        message.innerHTML = `
            <p>There are no tasks assigned to this department.</p>
            <p>To add a new task, use the "Add Task" button.</p>
        `;
        
        document.getElementById('todoList').appendChild(message.cloneNode(true));
    }
    
    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-card';
        taskDiv.draggable = true;
        taskDiv.setAttribute('data-task-id', task.id);
        
        taskDiv.addEventListener('dragstart', (e) => this.handleDragStart(e, task.id));
        taskDiv.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        const canEdit = this.currentUser.role === 'admin' || task.department === this.currentUser.department;
        
        taskDiv.innerHTML = `
            <div class="task-header">
                <h4 class="task-title">${task.title}</h4>
                <div class="task-actions">
                    ${canEdit ? `<button class="task-action-btn delete-btn" data-task-id="${task.id}" title="Sil">🗑️</button>` : ''}
                </div>
            </div>
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            <div class="task-footer">
                <div class="task-info">
                    <span class="task-assignee">👤 ${task.assignee}</span>
                    <span class="task-department">🏢 ${task.department}</span>
                    ${task.dueDate ? `<span class="task-due-date">📅 ${task.dueDate}</span>` : ''}
                </div>
                ${canEdit ? `
                <select class="task-status-select" data-task-id="${task.id}">
                    <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Yapılacak</option>
                    <option value="inprogress" ${task.status === 'inprogress' ? 'selected' : ''}>Devam Ediyor</option>
                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Tamamlandı</option>
                </select>
                ` : `
                <div class="task-status-display">
                    Durum: ${task.status === 'todo' ? 'Yapılacak' : task.status === 'inprogress' ? 'Devam Ediyor' : 'Tamamlandı'}
                </div>
                `}
            </div>
        `;
        
        if (canEdit) {
            const deleteBtn = taskDiv.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteTask(e.target.getAttribute('data-task-id'));
                });
            }
            
            const statusSelect = taskDiv.querySelector('.task-status-select');
            if (statusSelect) {
                statusSelect.addEventListener('change', (e) => {
                    this.changeTaskStatus(e.target.getAttribute('data-task-id'), e.target.value);
                });
            }
        }
        
        return taskDiv;
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});