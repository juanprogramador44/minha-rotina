/* ==========================================================================
   MINHA ROTINA - STATISTICAL & INSIGHTS ENGINE
   ========================================================================== */

// Translate reasons keys to Portuguese readable labels
const REASON_LABELS = {
    energy: 'Falta de energia / Cansaço',
    time: 'Falta de tempo',
    difficulty: 'Tarefa difícil / Complexa',
    distraction: 'Distração / Perda de foco',
    other: 'Outro motivo'
};

// Translate category keys to Portuguese readable labels
const CATEGORY_LABELS = {
    trabalho: 'Trabalho',
    estudos: 'Estudos',
    saude: 'Saúde',
    casa: 'Casa',
    lazer: 'Lazer',
    desenvolvimento: 'Dev. Pessoal'
};

/**
 * Calculates the distribution of procrastination reasons
 * @param {Array} logs - The logs of procrastination
 * @returns {Array} List of reasons with count and percentage
 */
function getProcrastinationDistribution(logs) {
    if (!logs || logs.length === 0) return [];

    const counts = { energy: 0, time: 0, difficulty: 0, distraction: 0, other: 0 };
    logs.forEach(log => {
        if (counts[log.reason] !== undefined) {
            counts[log.reason]++;
        } else {
            counts.other++;
        }
    });

    const total = logs.length;
    return Object.keys(counts).map(key => ({
        key,
        label: REASON_LABELS[key],
        count: counts[key],
        percentage: Math.round((counts[key] / total) * 100)
    })).sort((a, b) => b.count - a.count);
}

/**
 * Calculates which category has been postponed/procrastinated the most
 * @param {Array} logs - The logs of procrastination
 * @param {Array} tasks - Tasks list
 * @param {Array} routine - Routine blocks
 * @returns {Object|null} The category details
 */
function getMostProcrastinatedCategory(logs, tasks, routine) {
    if (!logs || logs.length === 0) return null;

    const categoryCounts = {};

    logs.forEach(log => {
        let category = 'desenvolvimento'; // Default fallback
        
        // Search in tasks
        const task = tasks.find(t => t.id === log.taskId);
        if (task) {
            // Task has priority but we can map categories based on some text or treat tasks as "Geral"
            category = 'trabalho'; // default tasks as trabalho if not specified, or use studies if keyword matches
            if (task.title.toLowerCase().match(/(estud|ler|curso|livro|facul)/)) {
                category = 'estudos';
            } else if (task.title.toLowerCase().match(/(treino|academia|agua|correr|medit)/)) {
                category = 'saude';
            } else if (task.title.toLowerCase().match(/(casa|limpar|mercado|compras)/)) {
                category = 'casa';
            }
        } else {
            // Search in routine
            const rot = routine.find(r => r.id === log.taskId);
            if (rot) {
                category = rot.category;
            }
        }

        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    let maxCat = null;
    let maxCount = -1;

    Object.keys(categoryCounts).forEach(cat => {
        if (categoryCounts[cat] > maxCount) {
            maxCount = categoryCounts[cat];
            maxCat = cat;
        }
    });

    if (!maxCat) return null;

    return {
        key: maxCat,
        label: CATEGORY_LABELS[maxCat] || maxCat,
        count: maxCount
    };
}

/**
 * Calculates the task/routine completion rate in the last 7 days
 * @param {Array} tasks - All tasks
 * @param {Array} routine - All routine blocks
 * @returns {Object} Rate and count details
 */
function getCompletionRateLast7Days(tasks, routine) {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Let's filter tasks that fall within last 7 days
    const recentTasks = tasks.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= sevenDaysAgo && tDate <= today;
    });

    const completedTasks = recentTasks.filter(t => t.status === 'concluido').length;
    const totalTasks = recentTasks.length;

    // For routine blocks, since they repeat daily, let's assume average daily routines
    // If they have completed status, they count. Let's calculate completion of current active routine blocks
    const completedRoutine = routine.filter(r => r.status === 'concluido').length;
    const totalRoutine = routine.length;

    const totalPlanned = totalTasks + totalRoutine;
    const totalCompleted = completedTasks + completedRoutine;

    const rate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

    return {
        rate,
        completed: totalCompleted,
        total: totalPlanned
    };
}

/**
 * Calculates the most productive time of day based on routine/task completions
 * @param {Array} routine - Routine blocks list (since they have fixed hours)
 * @returns {String} Morning, Afternoon, Evening or Night
 */
function getMostProductivePeriod(routine) {
    const completedBlocks = routine.filter(r => r.status === 'concluido');
    if (completedBlocks.length === 0) return 'Manhã (Padrão)';

    const periods = {
        manha: 0, // 05:00 - 12:00
        tarde: 0, // 12:00 - 18:00
        noite: 0  // 18:00 - 05:00
    };

    completedBlocks.forEach(b => {
        const startHour = parseInt(b.start.split(':')[0], 10);
        if (startHour >= 5 && startHour < 12) {
            periods.manha++;
        } else if (startHour >= 12 && startHour < 18) {
            periods.tarde++;
        } else {
            periods.noite++;
        }
    });

    let bestPeriod = 'manha';
    let maxCount = periods.manha;

    if (periods.tarde > maxCount) {
        bestPeriod = 'tarde';
        maxCount = periods.tarde;
    }
    if (periods.noite > maxCount) {
        bestPeriod = 'noite';
    }

    const labels = {
        manha: 'Manhã (05:00 às 12:00)',
        tarde: 'Tarde (12:00 às 18:00)',
        noite: 'Noite (18:00 às 05:00)'
    };

    return labels[bestPeriod];
}
