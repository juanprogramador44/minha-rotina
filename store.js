/* ==========================================================================
   MINHA ROTINA - STATE & DATABASE PERSISTENCE (STORE)
   ========================================================================== */

// Default achievements
const DEFAULT_ACHIEVEMENTS = [
    { id: 'first_block', name: 'Primeiro Bloco', desc: 'Criou o primeiro bloco de rotina.', xp: 50, icon: 'clock', unlocked: false },
    { id: 'first_task', name: 'Primeiro Passo', desc: 'Concluiu a primeira tarefa avulsa.', xp: 50, icon: 'check-square', unlocked: false },
    { id: 'streak_3', name: 'Consistência Inicial', desc: 'Manteve 3 dias seguidos de hábitos.', xp: 100, icon: 'flame', unlocked: false },
    { id: 'streak_7', name: 'Guerreiro da Disciplina', desc: 'Manteve 7 dias seguidos de hábitos.', xp: 200, icon: 'shield', unlocked: false },
    { id: 'pomodoro_complete', name: 'Foco Absoluto', desc: 'Completou um ciclo Pomodoro de 25 min.', xp: 100, icon: 'zap', unlocked: false },
    { id: 'procrastination_helper', name: 'Auto-Consciência', desc: 'Registrou um motivo de procrastinação.', xp: 50, icon: 'eye', unlocked: false },
    { id: 'tasks_10', name: 'Produtividade Alta', desc: 'Concluiu 10 tarefas avulsa no total.', xp: 150, icon: 'award', unlocked: false }
];

// Initial state data mock structure
const DEFAULT_STATE = {
    points: 0,
    settings: {
        startHour: '07:00',
        endHour: '22:00',
        showQuotes: true,
        theme: 'light'
    },
    rotina: [
        { id: 'r1', start: '07:00', end: '08:00', name: 'Exercício e Alongamento', category: 'saude', priority: 'media', status: 'concluido' },
        { id: 'r2', start: '08:30', end: '12:00', name: 'Trabalho Focado', category: 'trabalho', priority: 'alta', status: 'pendente' },
        { id: 'r3', start: '13:30', end: '15:00', name: 'Estudo de Programação', category: 'estudos', priority: 'alta', status: 'pendente' },
        { id: 'r4', start: '15:30', end: '16:00', name: 'Organização de Casa', category: 'casa', priority: 'baixa', status: 'pendente' },
        { id: 'r5', start: '17:00', end: '18:00', name: 'Leitura de Livro', category: 'desenvolvimento', priority: 'media', status: 'pendente' },
        { id: 'r6', start: '20:00', end: '22:00', name: 'Filme / Lazer', category: 'lazer', priority: 'baixa', status: 'pendente' }
    ],
    tarefas: [
        { id: 't1', title: 'Enviar relatório semanal para gerente', desc: 'Incluir métricas de conversão e relatórios de erros.', priority: 'alta', date: new Date().toISOString().split('T')[0], status: 'pendente', category: 'Demandas trabalho' },
        { id: 't2', title: 'Comprar presentes de aniversário', desc: 'Lembrar de comprar embalagem.', priority: 'media', date: new Date().toISOString().split('T')[0], status: 'pendente', category: 'Geral' },
        { id: 't3', title: 'Pagar conta de energia elétrica', desc: 'Vence esta semana.', priority: 'alta', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], status: 'pendente', category: 'Casa' },
        { id: 't4', title: 'Organizar gaveta de documentos', desc: '', priority: 'baixa', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], status: 'concluido', category: 'Casa' }
    ],
    habitos: [
        { id: 'h1', name: 'Beber 2.5L de Água', category: 'saude', streak: 3, lastDone: new Date().toISOString().split('T')[0], history: [new Date().toISOString().split('T')[0], new Date(Date.now() - 86400000).toISOString().split('T')[0], new Date(Date.now() - 172800000).toISOString().split('T')[0]] },
        { id: 'h2', name: 'Ler 10 Páginas', category: 'desenvolvimento', streak: 1, lastDone: new Date(Date.now() - 86400000).toISOString().split('T')[0], history: [new Date(Date.now() - 86400000).toISOString().split('T')[0]] },
        { id: 'h3', name: 'Meditação 10 Minutos', category: 'saude', streak: 0, lastDone: '', history: [] }
    ],
    logsProcrastinacao: [
        { id: 'l1', taskId: 't2', title: 'Comprar presentes de aniversário', date: new Date(Date.now() - 86400000).toISOString(), reason: 'distraction', comment: 'Fiquei navegando no celular por muito tempo.' },
        { id: 'l2', taskId: 'r3', title: 'Estudo de Programação', date: new Date(Date.now() - 172800000).toISOString(), reason: 'energy', comment: 'Estava muito cansado depois do trabalho.' }
    ],
    conquistas: DEFAULT_ACHIEVEMENTS
};

class Store {
    constructor() {
        this.state = this.loadState();
        this.listeners = [];
    }

    loadState() {
        const stored = localStorage.getItem('minha_rotina_state');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return {
                    ...DEFAULT_STATE,
                    ...parsed,
                    settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
                    conquistas: parsed.conquistas || DEFAULT_STATE.conquistas
                };
            } catch (e) {
                console.error("Erro ao ler localStorage. Carregando dados padrões.", e);
                return JSON.parse(JSON.stringify(DEFAULT_STATE));
            }
        }
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    saveState() {
        localStorage.setItem('minha_rotina_state', JSON.stringify(this.state));
        this.notify();
    }

    resetState() {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.saveState();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    addPoints(amount) {
        this.state.points += amount;
        this.saveState();
        this.checkAchievements();
    }

    updateSetting(key, value) {
        this.state.settings[key] = value;
        this.saveState();
    }

    addRoutineBlock(block) {
        block.id = 'r_' + Date.now();
        block.status = 'pendente';
        this.state.rotina.push(block);
        this.saveState();
        this.addPoints(10);
        this.unlockAchievement('first_block');
    }

    updateRoutineBlock(id, updatedBlock) {
        const index = this.state.rotina.findIndex(r => r.id === id);
        if (index !== -1) {
            const oldStatus = this.state.rotina[index].status;
            this.state.rotina[index] = { ...this.state.rotina[index], ...updatedBlock };
            
            if (oldStatus !== 'concluido' && updatedBlock.status === 'concluido') {
                this.addPoints(20);
            }
            this.saveState();
        }
    }

    deleteRoutineBlock(id) {
        this.state.rotina = this.state.rotina.filter(r => r.id !== id);
        this.saveState();
    }

    addTask(task) {
        task.id = 't_' + Date.now();
        task.status = 'pendente';
        this.state.tarefas.push(task);
        this.saveState();
        this.addPoints(10);
    }

    updateTask(id, updatedTask) {
        const index = this.state.tarefas.findIndex(t => t.id === id);
        if (index !== -1) {
            const oldStatus = this.state.tarefas[index].status;
            this.state.tarefas[index] = { ...this.state.tarefas[index], ...updatedTask };
            
            if (oldStatus !== 'concluido' && updatedTask.status === 'concluido') {
                this.addPoints(30);
                this.unlockAchievement('first_task');
                
                const completedCount = this.state.tarefas.filter(t => t.status === 'concluido').length;
                if (completedCount >= 10) {
                    this.unlockAchievement('tasks_10');
                }
            }
            this.saveState();
        }
    }

    deleteTask(id) {
        this.state.tarefas = this.state.tarefas.filter(t => t.id !== id);
        this.saveState();
    }

    addHabit(habit) {
        habit.id = 'h_' + Date.now();
        habit.streak = 0;
        habit.lastDone = '';
        habit.history = [];
        this.state.habitos.push(habit);
        this.saveState();
        this.addPoints(15);
    }

    toggleHabitDay(id, dateStr) {
        const habit = this.state.habitos.find(h => h.id === id);
        if (!habit) return;

        const idx = habit.history.indexOf(dateStr);
        if (idx !== -1) {
            habit.history.splice(idx, 1);
            this.recalculateHabitStreak(habit);
        } else {
            habit.history.push(dateStr);
            habit.lastDone = dateStr;
            this.addPoints(15);
            this.recalculateHabitStreak(habit);
        }
        this.saveState();
        this.checkStreakAchievements();
    }

    recalculateHabitStreak(habit) {
        if (habit.history.length === 0) {
            habit.streak = 0;
            return;
        }

        const sortedDates = [...habit.history].sort((a, b) => new Date(b) - new Date(a));
        let streak = 0;
        let today = new Date();
        today.setHours(0,0,0,0);
        
        let checkDate = new Date(sortedDates[0]);
        checkDate.setHours(0,0,0,0);

        const diffTime = today - checkDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            habit.streak = 0;
            return;
        }

        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const current = new Date(sortedDates[i - 1]);
            const prev = new Date(sortedDates[i]);
            current.setHours(0,0,0,0);
            prev.setHours(0,0,0,0);
            
            const diff = (current - prev) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                streak++;
            } else if (diff > 1) {
                break;
            }
        }
        habit.streak = streak;
    }

    deleteHabit(id) {
        this.state.habitos = this.state.habitos.filter(h => h.id !== id);
        this.saveState();
    }

    logProcrastination(taskId, title, type, reason, comment) {
        const log = {
            id: 'l_' + Date.now(),
            taskId,
            title,
            date: new Date().toISOString(),
            reason,
            comment: comment || ''
        };
        this.state.logsProcrastinacao.push(log);
        
        if (type === 'rotina') {
            this.updateRoutineBlock(taskId, { status: 'adiado' });
        } else {
            this.updateTask(taskId, { status: 'adiado' });
        }

        this.unlockAchievement('procrastination_helper');
        this.saveState();
    }

    unlockAchievement(id) {
        const ach = this.state.conquistas.find(c => c.id === id);
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            ach.unlockedAt = new Date().toISOString();
            
            setTimeout(() => {
                // Dispatch custom event to notify UI without circular dependencies
                window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: ach }));
                this.addPoints(ach.xp);
            }, 500);
        }
    }

    checkStreakAchievements() {
        const maxStreak = this.state.habitos.reduce((max, h) => h.streak > max ? h.streak : max, 0);
        if (maxStreak >= 3) {
            this.unlockAchievement('streak_3');
        }
        if (maxStreak >= 7) {
            this.unlockAchievement('streak_7');
        }
    }

    checkAchievements() {
        // checks placeholder
    }
}

const store = new Store();
