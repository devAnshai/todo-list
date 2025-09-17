const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const deadlineInput = document.getElementById('deadline-input');
const taskList = document.getElementById('task-list');
const tasksLeft = document.getElementById('tasks-left');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed');
const totalTasks = document.getElementById('total-tasks');
const completedTasks = document.getElementById('completed-tasks');
const remainingTasks = document.getElementById('remaining-tasks');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

let tasks = [];
let filter = 'all';

// Gemini API key (keep this secure in production)
const GEMINI_API_KEY = "AIzaSyBsq5pFkut2cdFJvMALhqtjBofKhT1GrJg";

function saveTasks() {
  localStorage.setItem('mytasks', JSON.stringify(tasks));
}

function loadTasks() {
  const data = localStorage.getItem('mytasks');
  tasks = data ? JSON.parse(data) : [];
}

function renderTasks() {
  taskList.innerHTML = '';
  const visibleTasks = tasks.filter(task =>
    filter === 'all' ? true :
    filter === 'active' ? !task.completed :
    task.completed
  );
  visibleTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item neon-anim' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    if (task.editing) {
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.value = task.text;
      editInput.className = 'task-edit-input';
      const editDate = document.createElement('input');
      editDate.type = 'date';
      editDate.value = task.deadline || '';
      editDate.className = 'task-edit-date';

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.type = 'button';
      saveBtn.style.marginRight = '0.5rem';
      saveBtn.onclick = () => finishEdit(task.id, editInput.value, editDate.value);

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.type = 'button';
      cancelBtn.onclick = () => cancelEdit(task.id);

      editInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') finishEdit(task.id, editInput.value, editDate.value);
        if (e.key === 'Escape') cancelEdit(task.id);
      });
      editDate.addEventListener('keydown', e => {
        if (e.key === 'Enter') finishEdit(task.id, editInput.value, editDate.value);
        if (e.key === 'Escape') cancelEdit(task.id);
      });

      li.appendChild(editInput);
      li.appendChild(editDate);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);
      setTimeout(() => editInput.focus(), 0);
    } else {
      const span = document.createElement('span');
      span.className = 'task-text neon-text';
      span.textContent = task.text;
      span.onclick = () => toggleComplete(task.id);
      span.ondblclick = () => startEdit(task.id); // Double-click to edit

      // Double-tap to edit for touch devices
      let lastTap = 0;
      span.ontouchend = function(e) {
        const now = Date.now();
        if (now - lastTap < 400) {
          startEdit(task.id);
          e.preventDefault();
        }
        lastTap = now;
      };

      li.appendChild(span);

      if (task.deadline) {
        const deadlineSpan = document.createElement('span');
        deadlineSpan.className = 'task-deadline';
        deadlineSpan.textContent = formatDeadline(task.deadline);
        li.appendChild(deadlineSpan);
      }
    }

    li.oncontextmenu = e => {
      e.preventDefault();
      deleteTask(task.id);
    };

    li.style.opacity = 0;
    setTimeout(() => { li.style.opacity = 1; }, 50);

    taskList.appendChild(li);
  });
  updateStats();
  updateTasksLeft();
}

function formatDeadline(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date) ? '' : `Due: ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const remaining = total - completed;
  if (totalTasks) totalTasks.textContent = `Total: ${total}`;
  if (completedTasks) completedTasks.textContent = `Completed: ${completed}`;
  if (remainingTasks) remainingTasks.textContent = `Remaining: ${remaining}`;
}

function updateTasksLeft() {
  const left = tasks.filter(t => !t.completed).length;
  tasksLeft.textContent = left === 1 ? '1 task left' : `${left} tasks left`;
}

function addTask(text, deadline) {
  if (!text.trim()) return;
  tasks.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    text: text.trim(),
    completed: false,
    editing: false,
    deadline: deadline || ''
  });
  saveTasks();
  renderTasks();
}

function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

function startEdit(id) {
  tasks.forEach(t => t.editing = false);
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.editing = true;
    renderTasks();
  }
}

function finishEdit(id, newText, newDeadline) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    if (newText.trim()) {
      task.text = newText.trim();
      task.deadline = newDeadline || '';
      task.editing = false;
    } else {
      deleteTask(id);
      return;
    }
    saveTasks();
    renderTasks();
  }
}

function cancelEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.editing = false;
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}

taskForm.onsubmit = e => {
  e.preventDefault();
  addTask(taskInput.value, deadlineInput.value);
  taskInput.value = '';
  deadlineInput.value = '';
};

filterBtns.forEach(btn => {
  btn.onclick = () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filter = btn.dataset.filter;
    renderTasks();
  };
});

clearCompletedBtn.onclick = clearCompleted;

function setTheme(dark) {
  if (dark) {
    document.body.classList.add('dark');
    themeIcon.src = 'https://cdn.jsdelivr.net/gh/feathericons/feather@4.28.0/icons/sun.svg';
    themeIcon.alt = 'Switch to light mode';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    themeIcon.src = 'https://cdn.jsdelivr.net/gh/feathericons/feather@4.28.0/icons/moon.svg';
    themeIcon.alt = 'Switch to dark mode';
    localStorage.setItem('theme', 'light');
  }
}

themeToggle.onclick = () => {
  setTheme(!document.body.classList.contains('dark'));
};

window.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  renderTasks();
  setTheme(localStorage.getItem('theme') === 'dark');
  renderAITasks();
});

// Dashboard navigation
const navTodo = document.getElementById('nav-todo');
const navAI = document.getElementById('nav-ai');
const navAIAsk = document.getElementById('nav-aiask');
const todoSection = document.getElementById('todo-section');
const aiSection = document.getElementById('ai-section');
const aiAskSection = document.getElementById('aiask-section');

navTodo.onclick = () => {
  navTodo.classList.add('active');
  navAI.classList.remove('active');
  navAIAsk.classList.remove('active');
  todoSection.style.display = '';
  aiSection.style.display = 'none';
  aiAskSection.style.display = 'none';
};
navAI.onclick = () => {
  navAI.classList.add('active');
  navTodo.classList.remove('active');
  navAIAsk.classList.remove('active');
  todoSection.style.display = 'none';
  aiSection.style.display = '';
  aiAskSection.style.display = 'none';
};
navAIAsk.onclick = () => {
  navAIAsk.classList.add('active');
  navTodo.classList.remove('active');
  navAI.classList.remove('active');
  todoSection.style.display = 'none';
  aiSection.style.display = 'none';
  aiAskSection.style.display = '';
};

// AI Breakdown Feature
let aiTasks = JSON.parse(localStorage.getItem('aiTasks') || '[]');
const aiTaskForm = document.getElementById('ai-task-form');
const aiTaskInput = document.getElementById('ai-task-input');
const aiPriorityInput = document.getElementById('ai-priority-input');
const priorityLabel = document.getElementById('priority-label');
const aiTaskList = document.getElementById('ai-task-list');

function saveAITasks() {
  localStorage.setItem('aiTasks', JSON.stringify(aiTasks));
}

function renderAITasks() {
  aiTaskList.innerHTML = '';
  aiTasks.forEach((task, idx) => {
    const li = document.createElement('li');
    li.className = 'ai-task-item neon-anim';
    li.innerHTML = `
      <span class="ai-task-text neon-text">${task.text}</span>
      <span class="ai-task-priority">Priority: ${task.priority}</span>
      <button class="ai-breakdown-btn">Show Breakdown</button>
      <button class="ai-delete-btn">Delete</button>
    `;
    li.querySelector('.ai-breakdown-btn').onclick = () => handleBreakDown(task.text, task.priority, true);
    li.querySelector('.ai-delete-btn').onclick = () => {
      aiTasks.splice(idx, 1);
      saveAITasks();
      renderAITasks();
    };
    aiTaskList.appendChild(li);
  });
}

aiTaskForm.onsubmit = async e => {
  e.preventDefault();
  const text = aiTaskInput.value.trim();
  const priority = aiPriorityInput.value;
  if (!text) return;
  aiTasks.push({ text, priority });
  saveAITasks();
  renderAITasks();
  aiTaskInput.value = '';
  aiPriorityInput.value = '2';
};

aiPriorityInput.oninput = function() {
  priorityLabel.textContent = `Priority: ${aiPriorityInput.value}`;
};

function cleanSubtaskText(text) {
  // Remove markdown bold/italic and extra formatting
  return text
    .replace(/\*\*/g, '') // remove **
    .replace(/\*/g, '')   // remove *
    .replace(/^- /, '')   // remove leading dash
    .replace(/^\d+\.\s*/, '') // remove leading numbers
    .replace(/_/g, '')    // remove _
    .trim();
}

// Improved Modal logic for both sections
function showSubtasksModal(subtasks) {
  const modal = document.getElementById('subtasks-modal');
  const list = document.getElementById('subtasks-list');
  list.innerHTML = '';
  subtasks.forEach(st => {
    const li = document.createElement('li');
    li.className = 'subtask-item neon-anim';
    li.textContent = cleanSubtaskText(st);
    list.appendChild(li);
  });
  modal.style.display = 'flex';
}
document.getElementById('close-subtasks-modal').onclick = function() {
  document.getElementById('subtasks-modal').style.display = 'none';
};

// Update handleBreakDown to optionally skip adding button in todo list
async function handleBreakDown(taskText, priority, fromAI = false) {
  showSubtasksModal(['Loading...']);
  try {
    const prompt = `Break down the following task into smaller subtasks based on importance and priority (${priority}): "${taskText}". Return a numbered list.`;
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    let subtasks = [];
    let text = '';
    if (
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      if (typeof data.candidates[0].content.parts[0].text === 'string') {
        text = data.candidates[0].content.parts[0].text;
      } else if (
        data.candidates[0].content.parts[0].text &&
        typeof data.candidates[0].content.parts[0].text.value === 'string'
      ) {
        text = data.candidates[0].content.parts[0].text.value;
      }
    }
    if (text) {
      subtasks = text
        .split(/\n+/)
        .map(line => line.replace(/^\d+\.\s*|^- /, '').trim())
        .filter(line => line.length > 0);
    }
    if (!subtasks.length && text) {
      subtasks = [text];
    }
    if (!subtasks.length) {
      subtasks = ['No subtasks found.'];
    }
    showSubtasksModal(subtasks);
  } catch (e) {
    showSubtasksModal(['Error fetching subtasks.']);
  }
}

// AI Ask Feature
const aiAskForm = document.getElementById('aiask-form');
const aiAskInput = document.getElementById('aiask-input');
const aiAskChatWindow = document.getElementById('aiask-chat-window');
let aiAskHistory = [];

function renderAIAskChat() {
  aiAskChatWindow.innerHTML = '';
  aiAskHistory.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'aiask-msg ' + (msg.role === 'user' ? 'aiask-user' : 'aiask-bot');
    msgDiv.textContent = msg.text;
    aiAskChatWindow.appendChild(msgDiv);
  });
  aiAskChatWindow.scrollTop = aiAskChatWindow.scrollHeight;
}

aiAskForm.onsubmit = async e => {
  e.preventDefault();
  const userText = aiAskInput.value.trim();
  if (!userText) return;
  aiAskHistory.push({ role: 'user', text: userText });
  renderAIAskChat();
  aiAskInput.value = '';
  // Show loading
  aiAskHistory.push({ role: 'bot', text: 'Thinking...' });
  renderAIAskChat();
  // Call Gemini API
  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userText }] }]
        })
      }
    );
    const data = await response.json();
    let botText = 'Sorry, I could not answer.';
    if (
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      typeof data.candidates[0].content.parts[0].text === 'string'
    ) {
      botText = data.candidates[0].content.parts[0].text;
    }
    // Remove loading
    aiAskHistory.pop();
    aiAskHistory.push({ role: 'bot', text: botText });
    renderAIAskChat();
  } catch (e) {
    aiAskHistory.pop();
    aiAskHistory.push({ role: 'bot', text: 'Error contacting AI.' });
    renderAIAskChat();
  }
};