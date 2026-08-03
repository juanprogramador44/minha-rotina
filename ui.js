/* ==========================================================================
   MINHA ROTINA - USER INTERFACE RENDERING & INTERACTION CONTROLLER
   ========================================================================== */

// Timer state (persists in memory between view swaps)
let timerInterval = null;
let timerSecondsLeft = 25 * 60;
let timerTotalSeconds = 25 * 60;
let timerIsRunning = false;
let timerMode = 'foco'; // 'foco' or 'pausa'
let timerSelectedTaskId = '';
let timerSelectedTaskType = 'tarefa'; // 'tarefa' or 'rotina'

// Weekly navigation state
let currentWeekOffset = 0; // 0 is current week, -1 is last week, 1 is next week

function renderView(viewName) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Clear previous contents
    mainContent.innerHTML = '';

    // Render corresponding view template
    switch (viewName) {
        case 'dashboard':
            renderDashboard(mainContent);
            break;
        case 'rotina':
            renderRoutine(mainContent);
            break;
        case 'tarefas':
            renderTasks(mainContent);
            break;
        case 'semana':
            renderWeekly(mainContent);
            break;
        case 'foco':
            renderFocus(mainContent);
            break;
        case 'habitos':
            renderHabits(mainContent);
            break;
        case 'insights':
            renderInsights(mainContent);
            break;
        case 'configuracoes':
            renderSettings(mainContent);
            break;
        default:
            renderDashboard(mainContent);
    }

    // Initialize Lucide icons on updated DOM
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

/* ==========================================================================
   VIEW: DASHBOARD
   ========================================================================== */
function renderDashboard(container) {
    const state = store.state;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Calculate today's routine progress
    const todayRoutines = state.rotina;
    const completedRoutines = todayRoutines.filter(r => r.status === 'concluido').length;
    const totalRoutines = todayRoutines.length;

    // Calculate today's tasks progress
    const todayTasks = state.tarefas.filter(t => t.date === todayStr);
    const completedTasks = todayTasks.filter(t => t.status === 'concluido').length;
    const totalTasks = todayTasks.length;

    const totalPlanned = totalRoutines + totalTasks;
    const totalCompleted = completedRoutines + completedTasks;
    const progressPercent = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

    // Next Task Finder
    const nextTask = getNextScheduledTask(state);

    // SVG dashoffset calculation (circle perimeter is 2 * PI * r = 2 * 3.14 * 40 = 251.2)
    const strokeDashoffset = 251.2 - (251.2 * progressPercent) / 100;

    // Motivational quote selection
    const quoteHTML = state.settings.showQuotes 
        ? `<div class="motivation-banner">
                <div class="motivation-icon"><i data-lucide="sparkles"></i></div>
                <div class="motivation-content">
                    <h3>Incentivo do Dia</h3>
                    <p>"${getRandomQuote()}"</p>
                </div>
           </div>`
        : '';

    container.innerHTML = `
        ${quoteHTML}

        <div class="grid-2 margin-bottom-m">
            <!-- Resumo Progresso -->
            <div class="card">
                <h3 class="card-title">Resumo do Dia <span class="badge badge-low">${formatDate(new Date())}</span></h3>
                
                <div class="progress-widget">
                    <div class="progress-circle-container">
                        <svg class="progress-circle-svg">
                            <circle class="progress-circle-bg" cx="50" cy="50" r="40"></circle>
                            <circle class="progress-circle-val" cx="50" cy="50" r="40" 
                                    stroke-dasharray="251.2" 
                                    stroke-dashoffset="${strokeDashoffset}"></circle>
                        </svg>
                    </div>
                    <div>
                        <div class="progress-percent-label">${progressPercent}%</div>
                        <p class="current-date">Progresso Concluído</p>
                    </div>
                </div>

                <div class="grid-3 margin-top-m">
                    <div class="stat-item">
                        <span class="stat-label">Planejado</span>
                        <span class="stat-number">${totalPlanned}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Concluído</span>
                        <span class="stat-number" style="color: var(--success);">${totalCompleted}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Pendente</span>
                        <span class="stat-number" style="color: var(--warning);">${totalPlanned - totalCompleted}</span>
                    </div>
                </div>
            </div>

            <!-- Próxima Atividade -->
            <div class="card next-task-widget">
                <h3 class="card-title">Próximo na Agenda <i data-lucide="compass" class="gold-icon"></i></h3>
                
                ${nextTask ? `
                    <p class="current-date">A seguir no seu cronograma:</p>
                    <div class="next-task-card-active">
                        <div>
                            <div class="timeline-name">
                                <span class="badge cat-${nextTask.category || 'trabalho'}">${nextTask.category || 'Tarefa'}</span>
                                ${nextTask.name || nextTask.title}
                            </div>
                            <div class="task-meta margin-top-m" style="margin-top: 6px;">
                                ${nextTask.start ? `
                                    <span class="task-meta-item"><i data-lucide="clock" style="width: 14px; height: 14px;"></i> ${nextTask.start} - ${nextTask.end}</span>
                                ` : `
                                    <span class="task-meta-item"><i data-lucide="calendar" style="width: 14px; height: 14px;"></i> Hoje (Avulsa)</span>
                                `}
                                <span class="badge badge-${nextTask.priority || 'media'}">${nextTask.priority || 'média'}</span>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm btn-icon start-focus-direct-btn" data-id="${nextTask.id}" data-type="${nextTask.start ? 'rotina' : 'tarefa'}" title="Focar nesta tarefa">
                            <i data-lucide="play"></i>
                        </button>
                    </div>
                ` : `
                    <div class="empty-state">
                        <i data-lucide="check-circle-2"></i>
                        <p>Nenhuma tarefa agendada pendente para hoje!</p>
                        <a href="#tarefas" class="btn btn-primary btn-sm">Criar Nova Tarefa</a>
                    </div>
                `}
            </div>
        </div>

        <!-- Visão Rápida de Hábitos do Dia -->
        <div class="card">
            <h3 class="card-title">Consistência de Hábitos <i data-lucide="flame" class="gold-icon"></i></h3>
            <div class="grid-3" id="dash-habits-grid">
                <!-- Loaded Dynamically -->
            </div>
        </div>
    `;

    // Render mini habits view inside dashboard
    renderDashHabits(document.getElementById('dash-habits-grid'));

    // Hook button to focus direct
    container.querySelectorAll('.start-focus-direct-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            timerSelectedTaskId = btn.getAttribute('data-id');
            timerSelectedTaskType = btn.getAttribute('data-type');
            window.location.hash = '#foco';
        });
    });
}

function getNextScheduledTask(state) {
    const now = new Date();
    const currentHourStr = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"

    // 1. Check active/next routine blocks
    const pendingRoutines = state.rotina
        .filter(r => r.status === 'pendente')
        .sort((a, b) => a.start.localeCompare(b.start));

    // Find the first routine block that ends after now
    const nextRoutine = pendingRoutines.find(r => r.end.localeCompare(currentHourStr) > 0);
    if (nextRoutine) return nextRoutine;

    // 2. Check pending tasks for today
    const todayStr = now.toISOString().split('T')[0];
    const todayPendingTasks = state.tarefas.filter(t => t.date === todayStr && t.status === 'pendente');
    if (todayPendingTasks.length > 0) return todayPendingTasks[0];

    return null;
}

function renderDashHabits(container) {
    if (!container) return;
    const habits = store.state.habitos;
    const todayStr = new Date().toISOString().split('T')[0];

    if (habits.length === 0) {
        container.innerHTML = `
            <div style="grid-column: span 3; text-align: center; color: var(--text-secondary); padding: 12px 0;">
                Nenhum hábito cadastrado. <a href="#habitos" style="color: var(--primary); font-weight: 600;">Adicionar Hábito</a>
            </div>
        `;
        return;
    }

    container.innerHTML = habits.map(h => {
        const doneToday = h.history.includes(todayStr);
        return `
            <div class="stat-item flex-between" style="flex-direction: row; align-items: center; background-color: var(--bg-tertiary);">
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">${h.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                        <i data-lucide="flame" style="width: 12px; height: 12px; color: var(--warning);"></i> ${h.streak} dias seguidos
                    </div>
                </div>
                <button class="habit-quick-check-btn btn-sm btn-icon btn ${doneToday ? 'btn-primary' : 'btn-outline'}" data-id="${h.id}" style="border-radius: 50%;">
                    <i data-lucide="${doneToday ? 'check' : 'circle'}"></i>
                </button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.habit-quick-check-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            store.toggleHabitDay(id, todayStr);
            renderView('dashboard');
        });
    });
}

/* ==========================================================================
   VIEW: DAILY ROUTINE (ROTINA DIÁRIA)
   ========================================================================== */
function renderRoutine(container) {
    const routine = store.state.rotina.sort((a, b) => a.start.localeCompare(b.start));

    container.innerHTML = `
        <div class="flex-between margin-bottom-m">
            <h2 style="font-size: 1.25rem; font-weight: 700;">Cronograma de Blocos</h2>
            <button class="btn btn-primary" id="open-routine-modal-btn">
                <i data-lucide="plus"></i> Adicionar Bloco
            </button>
        </div>

        ${routine.length === 0 ? `
            <div class="card">
                <div class="empty-state">
                    <i data-lucide="clock"></i>
                    <p>Sua rotina diária ainda está vazia.</p>
                    <p style="font-size: 0.85rem; max-width: 320px;">Crie blocos de horários para organizar seu dia em períodos produtivos, exercícios e lazer.</p>
                </div>
            </div>
        ` : `
            <div class="timeline-container">
                ${routine.map(block => {
                    const isInProgress = isTimeInRange(block.start, block.end);
                    const classList = `timeline-block ${block.status === 'concluido' ? 'completed' : ''} ${isInProgress && block.status === 'pendente' ? 'in-progress' : ''}`;
                    
                    return `
                        <div class="${classList}">
                            <div class="timeline-bullet"></div>
                            <div class="timeline-card">
                                <div class="timeline-time">${block.start} - ${block.end}</div>
                                
                                <div class="timeline-info">
                                    <div class="timeline-name">
                                        <span class="badge cat-${block.category}">${block.category}</span>
                                        ${block.name}
                                        ${isInProgress && block.status === 'pendente' ? `<span class="badge badge-andamento" style="font-size: 0.65rem; padding: 2px 6px;">Agora</span>` : ''}
                                    </div>
                                    <div class="task-meta" style="margin-top: 4px;">
                                        <span class="badge badge-${block.priority}">${block.priority}</span>
                                        <span class="badge badge-${block.status}">${block.status}</span>
                                    </div>
                                </div>

                                <div class="timeline-actions">
                                    ${block.status !== 'concluido' ? `
                                        <button class="btn btn-outline btn-sm check-routine-btn" data-id="${block.id}" title="Concluir">
                                            <i data-lucide="check" style="color: var(--success);"></i>
                                        </button>
                                        <button class="btn btn-outline btn-sm procrastinate-routine-btn" data-id="${block.id}" data-name="${block.name}" title="Adiar bloco">
                                            <i data-lucide="corner-down-right" style="color: var(--danger);"></i>
                                        </button>
                                    ` : `
                                        <button class="btn btn-outline btn-sm uncheck-routine-btn" data-id="${block.id}" title="Desmarcar">
                                            <i data-lucide="undo" style="color: var(--text-muted);"></i>
                                        </button>
                                    `}
                                    <button class="btn btn-outline btn-sm edit-routine-btn" data-id="${block.id}" title="Editar">
                                        <i data-lucide="edit-3"></i>
                                    </button>
                                    <button class="btn btn-outline btn-sm delete-routine-btn" data-id="${block.id}" title="Excluir">
                                        <i data-lucide="trash-2" style="color: var(--danger);"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `}
    `;

    // Handle button actions
    const modal = document.getElementById('routine-modal');
    const form = document.getElementById('routine-form');

    document.getElementById('open-routine-modal-btn')?.addEventListener('click', () => {
        document.getElementById('routine-modal-title').textContent = "Novo Bloco de Horário";
        form.reset();
        document.getElementById('routine-id').value = '';
        modal.classList.add('active');
    });

    container.querySelectorAll('.check-routine-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            store.updateRoutineBlock(id, { status: 'concluido' });
            playChime('success');
            renderRoutine(container);
        });
    });

    container.querySelectorAll('.uncheck-routine-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            store.updateRoutineBlock(id, { status: 'pendente' });
            renderRoutine(container);
        });
    });

    container.querySelectorAll('.procrastinate-routine-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            showProcrastinationModal(id, name, 'rotina');
        });
    });

    container.querySelectorAll('.edit-routine-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const block = store.state.rotina.find(r => r.id === id);
            if (block) {
                document.getElementById('routine-modal-title').textContent = "Editar Bloco de Horário";
                document.getElementById('routine-id').value = block.id;
                document.getElementById('routine-name').value = block.name;
                document.getElementById('routine-start').value = block.start;
                document.getElementById('routine-end').value = block.end;
                document.getElementById('routine-category').value = block.category;
                document.getElementById('routine-priority').value = block.priority;
                modal.classList.add('active');
            }
        });
    });

    container.querySelectorAll('.delete-routine-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (confirm("Deseja realmente excluir este bloco de rotina?")) {
                store.deleteRoutineBlock(id);
                renderRoutine(container);
            }
        });
    });

    // Form submit inside modal
    form.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('routine-id').value;
        const blockData = {
            name: document.getElementById('routine-name').value,
            start: document.getElementById('routine-start').value,
            end: document.getElementById('routine-end').value,
            category: document.getElementById('routine-category').value,
            priority: document.getElementById('routine-priority').value
        };

        if (id) {
            store.updateRoutineBlock(id, blockData);
        } else {
            store.addRoutineBlock(blockData);
        }

        modal.classList.remove('active');
        renderRoutine(container);
    };
}

function isTimeInRange(startStr, endStr) {
    const now = new Date();
    const current = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"
    return current >= startStr && current <= endStr;
}

function showProcrastinationModal(id, title, type) {
    document.getElementById('procrastinating-task-id').value = id;
    document.getElementById('procrastinating-task-type').value = type;
    
    const introEl = document.querySelector('.modal-intro-text strong');
    if (introEl) introEl.textContent = `"${title}"`;

    document.getElementById('procrastination-modal').classList.add('active');
}

/* ==========================================================================
   VIEW: TASKS LIST (LISTA DE TAREFAS)
   ========================================================================== */
function renderTasks(container) {
    let currentFilter = 'todas';

    // Renders the list of tasks grouped by category
    const renderList = () => {
        const state = store.state;
        let tasks = state.tarefas;

        // Apply tab filter
        if (currentFilter === 'todas') {
            tasks = tasks.filter(t => t.status !== 'concluido');
        } else if (currentFilter === 'pendentes') {
            tasks = tasks.filter(t => t.status !== 'concluido');
        } else if (currentFilter === 'concluidas') {
            tasks = tasks.filter(t => t.status === 'concluido');
        }

        // Apply search and filter inputs
        const searchInput = container.querySelector('#task-search-input');
        const priorityFilter = container.querySelector('#task-priority-filter');
        const dateFilter = container.querySelector('#task-date-filter');
        const categoryFilter = container.querySelector('#task-category-filter');

        const searchText = (searchInput ? searchInput.value : '').toLowerCase();
        const prioVal = priorityFilter ? priorityFilter.value : '';
        const dateVal = dateFilter ? dateFilter.value : '';
        const catVal = categoryFilter ? categoryFilter.value : '';

        // Filter tasks
        tasks = tasks.filter(t => {
            // Text search
            if (searchText) {
                const matchTitle = t.title.toLowerCase().includes(searchText);
                const matchDesc = (t.desc || '').toLowerCase().includes(searchText);
                if (!matchTitle && !matchDesc) return false;
            }
            // Priority
            if (prioVal && t.priority !== prioVal) return false;
            // Category/Section
            const itemCat = t.category || 'Geral';
            if (catVal && itemCat !== catVal) return false;
            // Date
            if (dateVal) {
                const todayStr = new Date().toISOString().split('T')[0];
                const tDate = t.date;
                if (dateVal === 'hoje') {
                    if (tDate !== todayStr) return false;
                } else if (dateVal === 'semana') {
                    const today = new Date();
                    const endOfWeek = new Date();
                    endOfWeek.setDate(today.getDate() + 7);
                    const taskDate = new Date(tDate);
                    const isWithin = taskDate >= new Date(today.setHours(0,0,0,0)) && taskDate <= endOfWeek;
                    if (!isWithin) return false;
                } else if (dateVal === 'atrasadas') {
                    if (tDate >= todayStr || t.status === 'concluido') return false;
                }
            }
            return true;
        });

        // Dynamic categories for the filter dropdown
        if (categoryFilter) {
            const currentSelected = categoryFilter.value;
            const uniqueCategories = [...new Set(state.tarefas.map(t => t.category || 'Geral'))].sort();
            
            // Re-populate only if number of items changed or first load
            let currentOpts = Array.from(categoryFilter.options).map(o => o.value);
            let targetOpts = ['', ...uniqueCategories];
            if (JSON.stringify(currentOpts) !== JSON.stringify(targetOpts)) {
                categoryFilter.innerHTML = '<option value="">Todas</option>' + uniqueCategories.map(c => `
                    <option value="${c}" ${currentSelected === c ? 'selected' : ''}>${c}</option>
                `).join('');
            }
        }

        // Sort: Alta -> Média -> Baixa, then date
        const priorityOrder = { alta: 0, media: 1, baixa: 2 };
        tasks.sort((a, b) => {
            const pA = priorityOrder[a.priority] || 1;
            const pB = priorityOrder[b.priority] || 1;
            if (pA !== pB) return pA - pB;
            return a.date.localeCompare(b.date);
        });

        const listContainer = container.querySelector('#tasks-sections-container');
        if (!listContainer) return;

        if (tasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state" style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius-m);">
                    <i data-lucide="check-square"></i>
                    <p>Nenhuma tarefa correspondente encontrada.</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        // Group tasks by category
        const groups = {};
        tasks.forEach(t => {
            const cat = t.category || 'Geral';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(t);
        });

        // Render sections (like Excel)
        listContainer.innerHTML = Object.keys(groups).sort().map(sectionName => {
            const sectionTasks = groups[sectionName];
            return `
                <div class="task-section" style="margin-bottom: 28px;">
                    <div style="font-weight: 700; font-size: 1.1rem; color: var(--primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">
                        <i data-lucide="folder" style="width: 18px; height: 18px;"></i>
                        <span>${sectionName}</span>
                        <span class="badge badge-low" style="font-size: 0.7rem; font-weight: 600; padding: 2px 8px; margin-left: auto;">${sectionTasks.length} ${sectionTasks.length === 1 ? 'tarefa' : 'tarefas'}</span>
                    </div>
                    <div class="task-list" style="display: flex; flex-direction: column; gap: 12px;">
                        ${sectionTasks.map(task => {
                            const isCompleted = task.status === 'concluido';
                            return `
                                <div class="task-item ${isCompleted ? 'completed' : ''}">
                                    <div class="task-checkbox-wrapper">
                                        <div class="task-checkbox toggle-task-checkbox" data-id="${task.id}">
                                            <i data-lucide="check"></i>
                                        </div>
                                    </div>
                                    <div class="task-details">
                                        <div class="task-title-text">${task.title}</div>
                                        ${task.desc ? `<div class="task-desc-text">${task.desc}</div>` : ''}
                                        
                                        <div class="task-meta">
                                            <span class="badge badge-${task.priority}">Prioridade: ${task.priority}</span>
                                            <span class="task-meta-item"><i data-lucide="calendar" style="width: 12px; height: 12px;"></i> ${task.date}</span>
                                            <span class="badge badge-${task.status}">${task.status}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="task-actions">
                                        ${!isCompleted ? `
                                            <button class="btn btn-outline btn-sm btn-icon procrastinate-task-btn" data-id="${task.id}" data-title="${task.title}" title="Adiar tarefa">
                                                <i data-lucide="corner-down-right" style="color: var(--danger);"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn btn-outline btn-sm btn-icon edit-task-btn" data-id="${task.id}">
                                            <i data-lucide="edit-3"></i>
                                        </button>
                                        <button class="btn btn-outline btn-sm btn-icon delete-task-btn" data-id="${task.id}">
                                            <i data-lucide="trash-2" style="color: var(--danger);"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Reconnect events inside list
        listContainer.querySelectorAll('.toggle-task-checkbox').forEach(box => {
            box.addEventListener('click', () => {
                const id = box.getAttribute('data-id');
                const t = store.state.tarefas.find(tk => tk.id === id);
                if (t) {
                    const newStatus = t.status === 'concluido' ? 'pendente' : 'concluido';
                    store.updateTask(id, { status: newStatus });
                    if (newStatus === 'concluido') playChime('success');
                    renderList();
                }
            });
        });

        listContainer.querySelectorAll('.procrastinate-task-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const title = btn.getAttribute('data-title');
                showProcrastinationModal(id, title, 'tarefa');
            });
        });

        listContainer.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const task = store.state.tarefas.find(t => t.id === id);
                if (task) {
                    document.getElementById('task-modal-title').textContent = "Editar Tarefa Avulsa";
                    document.getElementById('task-id').value = task.id;
                    document.getElementById('task-title').value = task.title;
                    document.getElementById('task-desc').value = task.desc;
                    document.getElementById('task-date').value = task.date;
                    document.getElementById('task-priority').value = task.priority;
                    document.getElementById('task-category').value = task.category || 'Geral';
                    taskModal.classList.add('active');
                }
            });
        });

        listContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
                    store.deleteTask(id);
                    renderList();
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    };

    container.innerHTML = `
        <div class="flex-between margin-bottom-m">
            <div class="tasks-filter-tabs">
                <div class="filter-tab active" data-filter="todas">Todas</div>
                <div class="filter-tab" data-filter="pendentes">Pendentes</div>
                <div class="filter-tab" data-filter="concluidas">Concluídas</div>
            </div>
            
            <button class="btn btn-primary" id="open-task-modal-btn">
                <i data-lucide="plus"></i> Nova Tarefa
            </button>
        </div>

        <!-- FILTROS DE TAREFAS -->
        <div class="card" style="padding: 16px; margin-bottom: 24px;">
            <div class="form-row" style="flex-wrap: wrap; gap: 16px; margin-bottom: 0; align-items: flex-end;">
                <div class="form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
                    <label class="form-label" style="margin-bottom: 6px;">Pesquisar</label>
                    <div style="position: relative;">
                        <input type="text" id="task-search-input" class="form-control" placeholder="Buscar por título ou descrição..." style="padding-left: 36px;">
                        <i data-lucide="search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-secondary);"></i>
                    </div>
                </div>
                <div class="form-group" style="width: 140px; margin-bottom: 0;">
                    <label class="form-label" style="margin-bottom: 6px;">Prioridade</label>
                    <select id="task-priority-filter" class="form-control">
                        <option value="">Todas</option>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                    </select>
                </div>
                <div class="form-group" style="width: 140px; margin-bottom: 0;">
                    <label class="form-label" style="margin-bottom: 6px;">Data</label>
                    <select id="task-date-filter" class="form-control">
                        <option value="">Todas</option>
                        <option value="hoje">Hoje</option>
                        <option value="semana">Esta Semana</option>
                        <option value="atrasadas">Atrasadas</option>
                    </select>
                </div>
                <div class="form-group" style="width: 160px; margin-bottom: 0;">
                    <label class="form-label" style="margin-bottom: 6px;">Seção / Categoria</label>
                    <select id="task-category-filter" class="form-control">
                        <option value="">Todas</option>
                    </select>
                </div>
            </div>
        </div>

        <div id="tasks-sections-container"></div>
    `;

    // Hook filters event listeners
    const searchInput = container.querySelector('#task-search-input');
    const priorityFilter = container.querySelector('#task-priority-filter');
    const dateFilter = container.querySelector('#task-date-filter');
    const categoryFilter = container.querySelector('#task-category-filter');

    if (searchInput) searchInput.addEventListener('input', renderList);
    if (priorityFilter) priorityFilter.addEventListener('change', renderList);
    if (dateFilter) dateFilter.addEventListener('change', renderList);
    if (categoryFilter) categoryFilter.addEventListener('change', renderList);

    // Hook tab switches
    container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.getAttribute('data-filter');
            renderList();
        });
    });

    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');

    document.getElementById('open-task-modal-btn')?.addEventListener('click', () => {
        document.getElementById('task-modal-title').textContent = "Nova Tarefa Avulsa";
        taskForm.reset();
        document.getElementById('task-id').value = '';
        document.getElementById('task-date').value = new Date().toISOString().split('T')[0];
        taskModal.classList.add('active');
    });

    // Form onSubmit
    taskForm.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const taskData = {
            title: document.getElementById('task-title').value,
            desc: document.getElementById('task-desc').value,
            date: document.getElementById('task-date').value,
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value || 'Geral'
        };

        if (id) {
            store.updateTask(id, taskData);
        } else {
            store.addTask(taskData);
        }

        taskModal.classList.remove('active');
        renderList();
    };

    // Initial render
    renderList();
}

/* ==========================================================================
   VIEW: MODO FOCO (POMODORO)
   ========================================================================== */
function renderFocus(container) {
    const state = store.state;
    // Get list of pending tasks and routine blocks to display in select dropdown
    const pendingTasks = state.tarefas.filter(t => t.status !== 'concluido');
    const pendingRoutines = state.rotina.filter(r => r.status !== 'concluido');

    let selectOptionsHTML = '<option value="">-- Selecione uma atividade para focar --</option>';
    
    if (pendingRoutines.length > 0) {
        selectOptionsHTML += '<optgroup label="Blocos da Rotina">';
        selectOptionsHTML += pendingRoutines.map(r => `
            <option value="rotina_${r.id}" ${timerSelectedTaskId === r.id && timerSelectedTaskType === 'rotina' ? 'selected' : ''}>[Rotina] ${r.start} - ${r.name}</option>
        `).join('');
        selectOptionsHTML += '</optgroup>';
    }

    if (pendingTasks.length > 0) {
        selectOptionsHTML += '<optgroup label="Tarefas Avulsas">';
        selectOptionsHTML += pendingTasks.map(t => `
            <option value="tarefa_${t.id}" ${timerSelectedTaskId === t.id && timerSelectedTaskType === 'tarefa' ? 'selected' : ''}>[Tarefa] ${t.title}</option>
        `).join('');
        selectOptionsHTML += '</optgroup>';
    }

    container.innerHTML = `
        <div class="card focus-panel">
            <h2>Área de Foco & Pomodoro</h2>
            <p class="current-date margin-bottom-m">Elimine distrações, escolha uma tarefa e inicie o timer.</p>

            <div class="focus-selector-box">
                <label for="focus-task-select" class="form-label">Tarefa em Foco</label>
                <select id="focus-task-select" class="form-control">
                    ${selectOptionsHTML}
                </select>
            </div>

            <!-- Pomodoro Círculo Timer -->
            <div class="pomodoro-container">
                <svg class="pomodoro-svg">
                    <circle class="pomodoro-track" cx="130" cy="130" r="120"></circle>
                    <circle class="pomodoro-progress" id="timer-progress-bar" cx="130" cy="130" r="120" stroke-dasharray="753.6" stroke-dashoffset="0"></circle>
                </svg>
                <div>
                    <div class="pomodoro-timer" id="pomodoro-time-display">25:00</div>
                    <div class="pomodoro-state" id="pomodoro-state-label">Foco</div>
                </div>
            </div>

            <div class="pomodoro-controls">
                <button class="btn btn-primary" id="timer-start-btn">
                    <i data-lucide="play"></i> Iniciar
                </button>
                <button class="btn btn-outline" id="timer-pause-btn" style="display: none;">
                    <i data-lucide="pause"></i> Pausar
                </button>
                <button class="btn btn-outline" id="timer-reset-btn">
                    <i data-lucide="rotate-ccw"></i> Reiniciar
                </button>
            </div>
            
            <div class="insight-text-card margin-top-l" id="pomodoro-motivational-tip">
                <i data-lucide="zap"></i>
                <p>25 minutos de atenção plena valem mais que 2 horas de procrastinação alternada. Você consegue!</p>
            </div>
        </div>
    `;

    const selectEl = document.getElementById('focus-task-select');
    const startBtn = document.getElementById('timer-start-btn');
    const pauseBtn = document.getElementById('timer-pause-btn');
    const resetBtn = document.getElementById('timer-reset-btn');
    const timeDisplay = document.getElementById('pomodoro-time-display');
    const stateLabel = document.getElementById('pomodoro-state-label');
    const progressBar = document.getElementById('timer-progress-bar');
    const tipContainer = document.getElementById('pomodoro-motivational-tip').querySelector('p');

    // Restore timer representation
    const updateTimerUI = () => {
        const mins = Math.floor(timerSecondsLeft / 60);
        const secs = timerSecondsLeft % 60;
        timeDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        stateLabel.textContent = timerMode === 'foco' ? 'Foco' : 'Pausa';
        
        // Progress bar offset (perimeter = 753.6)
        const progressPercent = (timerSecondsLeft / timerTotalSeconds);
        const offset = 753.6 - (753.6 * progressPercent);
        progressBar.style.strokeDashoffset = offset;
        
        if (timerMode === 'foco') {
            progressBar.style.stroke = 'var(--primary)';
        } else {
            progressBar.style.stroke = 'var(--success)';
        }

        if (timerIsRunning) {
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
        } else {
            startBtn.style.display = 'inline-flex';
            pauseBtn.style.display = 'none';
        }
    };

    updateTimerUI();

    selectEl.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
            const [type, id] = val.split('_');
            timerSelectedTaskId = id;
            timerSelectedTaskType = type;
        } else {
            timerSelectedTaskId = '';
            timerSelectedTaskType = 'tarefa';
        }
    });

    startBtn.addEventListener('click', () => {
        if (!timerSelectedTaskId) {
            alert("Por favor, selecione uma atividade para focar antes de iniciar.");
            return;
        }
        timerIsRunning = true;
        startTimerInterval();
        updateTimerUI();
    });

    pauseBtn.addEventListener('click', () => {
        timerIsRunning = false;
        clearInterval(timerInterval);
        updateTimerUI();
    });

    resetBtn.addEventListener('click', () => {
        timerIsRunning = false;
        clearInterval(timerInterval);
        timerSecondsLeft = timerMode === 'foco' ? 25 * 60 : 5 * 60;
        timerTotalSeconds = timerSecondsLeft;
        updateTimerUI();
    });

    function startTimerInterval() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (timerSecondsLeft > 0) {
                timerSecondsLeft--;
                updateTimerUI();
            } else {
                // Timer finished!
                clearInterval(timerInterval);
                timerIsRunning = false;
                
                if (timerMode === 'foco') {
                    // Pomodoro Foco complete
                    playChime('success');
                    alert("Excelente! Ciclo de Foco de 25 minutos concluído. Hora de uma pequena pausa.");
                    
                    // Mark selected task/routine as completed if it exists
                    if (timerSelectedTaskType === 'rotina') {
                        store.updateRoutineBlock(timerSelectedTaskId, { status: 'concluido' });
                    } else {
                        store.updateTask(timerSelectedTaskId, { status: 'concluido' });
                    }

                    // Unlock Achievement Focus Complete
                    store.unlockAchievement('pomodoro_complete');
                    store.addPoints(50);
                    
                    // Switch to break
                    timerMode = 'pausa';
                    timerSecondsLeft = 5 * 60; // 5 mins break
                    timerTotalSeconds = 5 * 60;
                    tipContainer.textContent = "Tempo de descansar! Alongue-se, tome uma água e relaxe o cérebro.";
                } else {
                    // Break ended
                    playChime('info');
                    alert("A pausa acabou. Pronto para focar novamente?");
                    
                    timerMode = 'foco';
                    timerSecondsLeft = 25 * 60;
                    timerTotalSeconds = 25 * 60;
                    tipContainer.textContent = "Foque em uma coisa por vez. Você está construindo sua consistência!";
                }
                
                updateTimerUI();
            }
        }, 1000);
    }
}

/* ==========================================================================
   VIEW: HABITS (HÁBITOS)
   ========================================================================== */
function renderHabits(container) {
    const habits = store.state.habitos;
    
    // Get array of last 7 dates for the weekly grid headers (Sunday to Saturday or Mon to Sun)
    // Let's create a Monday-Sunday week view of the current week
    const currentWeekDays = getCurrentWeekDays();

    container.innerHTML = `
        <div class="flex-between margin-bottom-m">
            <h2 style="font-size: 1.25rem; font-weight: 700;">Painel de Hábitos</h2>
            <button class="btn btn-primary" id="open-habit-modal-btn">
                <i data-lucide="plus"></i> Novo Hábito
            </button>
        </div>

        ${habits.length === 0 ? `
            <div class="card">
                <div class="empty-state">
                    <i data-lucide="flame"></i>
                    <p>Nenhum hábito cadastrado ainda.</p>
                    <p style="font-size: 0.85rem; max-width: 320px;">Crie hábitos diários saudáveis como beber água, se exercitar ou ler e acompanhe sua sequência.</p>
                </div>
            </div>
        ` : habits.map(h => {
            return `
                <div class="habit-item">
                    <div class="habit-header">
                        <div class="habit-title-box">
                            <span class="badge cat-${h.category}">${h.category}</span>
                            <span class="habit-name">${h.name}</span>
                        </div>
                        <div class="flex-align-center">
                            <span class="habit-streak">
                                <i data-lucide="flame"></i> ${h.streak} Streak
                            </span>
                            <button class="btn btn-outline btn-sm btn-icon delete-habit-btn" data-id="${h.id}">
                                <i data-lucide="trash-2" style="color: var(--danger);"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="habit-weekly-grid">
                        ${currentWeekDays.map(day => {
                            const dateStr = day.date.toISOString().split('T')[0];
                            const isDone = h.history.includes(dateStr);
                            const isFuture = day.date > new Date();
                            const btnClass = `habit-day-btn ${isDone ? 'active' : ''} ${isFuture ? 'disabled' : ''}`;
                            
                            return `
                                <div class="habit-day-col">
                                    <span class="habit-day-label">${day.label}</span>
                                    <button class="tgl-habit-day-btn ${btnClass}" 
                                            data-id="${h.id}" 
                                            data-date="${dateStr}" 
                                            ${isFuture ? 'disabled' : ''}
                                            title="${dateStr}">
                                        ${isDone ? '<i data-lucide="check" style="width: 16px; height: 16px;"></i>' : day.date.getDate()}
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('')}

        <!-- Add Habit Modal -->
        <div class="modal" id="habit-modal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Novo Hábito Recorrente</h3>
                    <button class="close-modal-btn" data-close="habit-modal"><i data-lucide="x"></i></button>
                </div>
                <form id="habit-form">
                    <div class="form-group">
                        <label for="habit-name" class="form-label">Nome do Hábito</label>
                        <input type="text" id="habit-name" class="form-control" placeholder="Ex: Ler 10 págs, Beber 2L água, Dormir cedo..." required>
                    </div>
                    <div class="form-group">
                        <label for="habit-category" class="form-label">Categoria</label>
                        <select id="habit-category" class="form-control" required>
                            <option value="saude">Saúde / Bem Estar</option>
                            <option value="desenvolvimento">Desenvolvimento Pessoal</option>
                            <option value="estudos">Estudos</option>
                            <option value="trabalho">Trabalho</option>
                            <option value="casa">Casa</option>
                            <option value="lazer">Lazer</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" data-close="habit-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Hábito</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Hook events
    const habitModal = document.getElementById('habit-modal');
    const habitForm = document.getElementById('habit-form');

    document.getElementById('open-habit-modal-btn')?.addEventListener('click', () => {
        habitForm.reset();
        habitModal.classList.add('active');
        
        // Modal inside backdrop events need manual clean/close setup
        habitModal.querySelector('[data-close]').onclick = () => habitModal.classList.remove('active');
        habitModal.querySelector('.modal-overlay').onclick = () => habitModal.classList.remove('active');
    });

    container.querySelectorAll('.tgl-habit-day-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const date = btn.getAttribute('data-date');
            store.toggleHabitDay(id, date);
            renderHabits(container);
        });
    });

    container.querySelectorAll('.delete-habit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (confirm("Deseja realmente remover este hábito?")) {
                store.deleteHabit(id);
                renderHabits(container);
            }
        });
    });

    habitForm.onsubmit = (e) => {
        e.preventDefault();
        const newHabit = {
            name: document.getElementById('habit-name').value,
            category: document.getElementById('habit-category').value
        };
        store.addHabit(newHabit);
        habitModal.classList.remove('active');
        renderHabits(container);
    };
}

function getCurrentWeekDays() {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday, 1 is Monday
    
    // Find Monday of the current week
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    
    const days = [];
    const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push({
            label: weekdays[i],
            date: d
        });
    }
    return days;
}

/* ==========================================================================
   VIEW: WEEKLY VIEW (VISÃO SEMANAL)
   ========================================================================== */
function renderWeekly(container) {
    // Get start of the targeted week
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (currentWeekOffset * 7));
    
    const day = targetDate.getDay();
    const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(targetDate.setDate(diff));

    // Construct week days mapping
    const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const daysData = [];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        daysData.push({
            name: weekdays[i],
            dateStr: d.toISOString().split('T')[0],
            dayNum: d.getDate(),
            isToday: d.toDateString() === new Date().toDateString()
        });
    }

    // Header dates range
    const formatRangeStr = () => {
        const start = monday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const end = sunday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
        return `${start} - ${end}`;
    };

    container.innerHTML = `
        <div class="week-navigator">
            <button class="btn btn-outline" id="prev-week-btn"><i data-lucide="chevron-left"></i> Voltar</button>
            <span class="week-label" id="week-range-label">${formatRangeStr()}</span>
            <button class="btn btn-outline" id="next-week-btn">Avançar <i data-lucide="chevron-right"></i></button>
        </div>

        <p class="current-date margin-bottom-m text-center">
            Organize sua semana! <strong>Arraste as tarefas</strong> entre os dias para replanejar seu cronograma.
        </p>

        <div class="weekly-scroll-container">
            ${daysData.map(day => {
                // Filter tasks for this day
                const dayTasks = store.state.tarefas.filter(t => t.date === day.dateStr);
                const dayRoutines = store.state.rotina.filter(() => {
                    // Routines apply daily, so we render them in every day columns for schedule reference
                    return true; 
                });

                return `
                    <div class="weekly-day-card ${day.isToday ? 'today' : ''}" data-date="${day.dateStr}">
                        <div class="weekly-day-header">
                            <div class="weekly-day-name">${day.name}</div>
                            <div class="weekly-day-num">${day.dayNum}</div>
                        </div>
                        
                        <div class="weekly-items-list" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                            ${dayTasks.map(t => `
                                <div class="weekly-task-item ${t.status === 'concluido' ? 'completed' : ''}" 
                                     draggable="true" 
                                     data-task-id="${t.id}"
                                     title="${t.title}">
                                    <span>${t.title.substring(0, 15)}${t.title.length > 15 ? '...' : ''}</span>
                                    <i data-lucide="grip-vertical" style="width: 12px; height: 12px; opacity: 0.5;"></i>
                                </div>
                            `).join('')}

                            ${dayTasks.length === 0 ? `
                                <div style="font-size: 0.7rem; color: var(--text-muted); text-align: center; margin: auto 0; font-style: italic;">
                                    Arraste aqui
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Hook navigator clicks
    document.getElementById('prev-week-btn').onclick = () => {
        currentWeekOffset--;
        renderWeekly(container);
    };
    document.getElementById('next-week-btn').onclick = () => {
        currentWeekOffset++;
        renderWeekly(container);
    };

    // Attach Drag and Drop handlers
    setupDragAndDrop(container);
}

function setupDragAndDrop(container) {
    const taskItems = container.querySelectorAll('.weekly-task-item');
    const dayCards = container.querySelectorAll('.weekly-day-card');

    taskItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.getAttribute('data-task-id'));
            item.style.opacity = '0.4';
        });

        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
        });
    });

    dayCards.forEach(card => {
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            card.style.borderColor = 'var(--primary)';
            card.style.backgroundColor = 'var(--bg-tertiary)';
        });

        card.addEventListener('dragleave', () => {
            card.style.borderColor = '';
            card.style.backgroundColor = '';
        });

        card.addEventListener('drop', (e) => {
            e.preventDefault();
            card.style.borderColor = '';
            card.style.backgroundColor = '';
            
            const taskId = e.dataTransfer.getData('text/plain');
            const newDateStr = card.getAttribute('data-date');
            
            if (taskId && newDateStr) {
                // Update task date in store
                store.updateTask(taskId, { date: newDateStr });
                playChime('info');
                renderWeekly(container);
            }
        });
    });
}

/* ==========================================================================
   VIEW: STATS / INSIGHTS
   ========================================================================== */
function renderInsights(container) {
    const state = store.state;
    
    // Process statistical calculations
    const procStats = getProcrastinationDistribution(state.logsProcrastinacao);
    const mostProcCat = getMostProcrastinatedCategory(state.logsProcrastinacao, state.tarefas, state.rotina);
    const completionRate = getCompletionRateLast7Days(state.tarefas, state.rotina);
    const productivePeriod = getMostProductivePeriod(state.rotina);

    // Build charts
    let chartHTML = '';
    if (procStats.length > 0) {
        chartHTML = `
            <div class="chart-container">
                ${procStats.map(stat => {
                    const heightValue = stat.percentage > 5 ? stat.percentage : 8; // min height
                    return `
                        <div class="chart-bar-wrapper">
                            <div class="chart-bar" style="height: ${heightValue}%;">
                                <span class="chart-bar-val">${stat.percentage}%</span>
                            </div>
                            <span class="chart-bar-label">${stat.label.split(' / ')[0]}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        chartHTML = `
            <div class="empty-state">
                <i data-lucide="smile"></i>
                <p>Muito bom! Nenhum registro de procrastinação registrado.</p>
                <p style="font-size: 0.85rem;">Isso significa que você tem seguido seus planos com maestria.</p>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="grid-2 margin-bottom-m">
            <!-- Gráficos de Procrastinação -->
            <div class="card">
                <h3 class="card-title">Fatores de Procrastinação <i data-lucide="bar-chart-2"></i></h3>
                <p class="current-date">Padrão baseado em ${state.logsProcrastinacao.length} adiamentos analisados:</p>
                ${chartHTML}
            </div>

            <!-- Resumo das Conquistas (Gamificação) -->
            <div class="card">
                <h3 class="card-title">Suas Conquistas <i data-lucide="award" class="gold-icon"></i></h3>
                <div class="procrastination-list" style="max-height: 240px; overflow-y: auto;">
                    ${state.conquistas.map(ach => `
                        <div class="procrastination-list-item" style="opacity: ${ach.unlocked ? 1 : 0.4};">
                            <div class="procrastination-list-label">
                                <i data-lucide="${ach.icon}" class="${ach.unlocked ? 'gold-icon' : ''}"></i>
                                <div>
                                    <div style="font-weight: 600;">${ach.name}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${ach.desc}</div>
                                </div>
                            </div>
                            <span class="badge ${ach.unlocked ? 'badge-concluido' : 'badge-pendente'}">
                                ${ach.unlocked ? `+${ach.xp} XP` : 'Bloqueado'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="grid-3">
            <!-- Insight 1: Categoria Adiada -->
            <div class="card text-center" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div class="badge-icon-container" style="background-color: var(--danger-light); color: var(--danger); margin-top: 0;">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <h4 style="font-weight: 600; margin-top: 12px;">Área mais Adiada</h4>
                <p class="current-date margin-top-m" style="margin-top: 6px;">
                    ${mostProcCat 
                        ? `Você costuma adiar mais tarefas de <strong>${mostProcCat.label}</strong>.` 
                        : 'Nenhuma área crítica identificada.'}
                </p>
            </div>

            <!-- Insight 2: Período Produtivo -->
            <div class="card text-center" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div class="badge-icon-container" style="background-color: var(--primary-light); color: var(--primary); margin-top: 0;">
                    <i data-lucide="zap"></i>
                </div>
                <h4 style="font-weight: 600; margin-top: 12px;">Pico Produtivo</h4>
                <p class="current-date margin-top-m" style="margin-top: 6px;">
                    Seu horário mais produtivo parece ser no período da <strong>${productivePeriod}</strong>.
                </p>
            </div>

            <!-- Insight 3: Taxa Conclusão -->
            <div class="card text-center" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div class="badge-icon-container" style="background-color: var(--success-light); color: var(--success); margin-top: 0;">
                    <i data-lucide="trending-up"></i>
                </div>
                <h4 style="font-weight: 600; margin-top: 12px;">Consistência Semanal</h4>
                <p class="current-date margin-top-m" style="margin-top: 6px;">
                    Você concluiu <strong>${completionRate.rate}%</strong> das tarefas programadas nos últimos 7 dias.
                </p>
            </div>
        </div>
    `;
}

/* ==========================================================================
   VIEW: SETTINGS (CONFIGURAÇÕES)
   ========================================================================== */
function renderSettings(container) {
    const settings = store.state.settings;

    container.innerHTML = `
        <div class="card">
            <h3 class="card-title">Ajustes Pessoais</h3>
            
            <div class="settings-list">
                <!-- Horários -->
                <div class="settings-item">
                    <div class="settings-info">
                        <div class="settings-title">Início padrão do dia</div>
                        <div class="settings-desc">Horário em que suas atividades diárias costumam começar.</div>
                    </div>
                    <div>
                        <input type="time" class="form-control change-setting-input" data-key="startHour" value="${settings.startHour}">
                    </div>
                </div>

                <div class="settings-item">
                    <div class="settings-info">
                        <div class="settings-title">Fim padrão do dia</div>
                        <div class="settings-desc">Horário planejado para encerramento da rotina ativa.</div>
                    </div>
                    <div>
                        <input type="time" class="form-control change-setting-input" data-key="endHour" value="${settings.endHour}">
                    </div>
                </div>

                <!-- Frases Motivacionais -->
                <div class="settings-item">
                    <div class="settings-info">
                        <div class="settings-title">Frases Motivacionais</div>
                        <div class="settings-desc">Exibir frases inspiradoras no cabeçalho do Dashboard.</div>
                    </div>
                    <div>
                        <label class="switch">
                            <input type="checkbox" id="quote-toggle" ${settings.showQuotes ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Limpeza de dados -->
                <div class="settings-item" style="border-bottom: none; align-items: flex-start;">
                    <div class="settings-info">
                        <div class="settings-title" style="color: var(--danger);">Resetar Dados do Sistema</div>
                        <div class="settings-desc">Apaga permanentemente todos os registros, hábitos, tarefas e pontos XP salvos neste navegador.</div>
                    </div>
                    <button class="btn btn-danger btn-sm" id="reset-system-data-btn">
                        Limpar Banco Local
                    </button>
                </div>
            </div>
        </div>
    `;

    // Hook settings update listeners
    container.querySelectorAll('.change-setting-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const key = input.getAttribute('data-key');
            store.updateSetting(key, e.target.value);
        });
    });

    const quoteToggle = document.getElementById('quote-toggle');
    if (quoteToggle) {
        quoteToggle.addEventListener('change', (e) => {
            store.updateSetting('showQuotes', e.target.checked);
        });
    }

    const resetBtn = document.getElementById('reset-system-data-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("ATENÇÃO: Isso irá apagar permanentemente todas as suas tarefas, rotinas e hábitos salvos localmente. Deseja continuar?")) {
                store.resetState();
                alert("Dados restaurados para o padrão de fábrica!");
                window.location.hash = '#dashboard';
            }
        });
    }
}
