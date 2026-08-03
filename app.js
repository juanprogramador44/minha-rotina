/* ==========================================================================
   MINHA ROTINA - SPA ROUTING & APP ENTRY POINT
   ========================================================================== */


// SPA Routing Handler
function handleRouting() {
    const hash = window.location.hash || '#dashboard';
    const viewName = hash.replace('#', '');
    
    // Highlight links in Sidebar and Bottom Nav
    document.querySelectorAll('.nav-link, .bottom-link, .sheet-item').forEach(link => {
        if (link.getAttribute('data-view') === viewName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Close bottom sheet if open
    const sheet = document.getElementById('bottom-sheet');
    if (sheet) sheet.classList.remove('active');

    // Update Header Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        const titles = {
            dashboard: 'Dashboard',
            rotina: 'Rotina Diária',
            tarefas: 'Minhas Tarefas',
            semana: 'Visão Semanal',
            foco: 'Modo Foco',
            habitos: 'Gerenciador de Hábitos',
            insights: 'Estatísticas & Insights',
            configuracoes: 'Ajustes do Sistema'
        };
        titleEl.textContent = titles[viewName] || 'Minha Rotina';
    }
    
    // Render the view
    renderView(viewName);
}

// Global Achievement Celebration Modal display
window.addEventListener('achievement-unlocked', (e) => {
    const achievement = e.detail;
    const modal = document.getElementById('achievement-modal');
    const nameEl = document.getElementById('achievement-name');
    const descEl = document.getElementById('achievement-desc');
    const xpEl = modal.querySelector('.xp-reward');
    const iconEl = modal.querySelector('.unlocked-badge-icon');
    
    if (nameEl) nameEl.textContent = achievement.name;
    if (descEl) descEl.textContent = achievement.desc;
    if (xpEl) xpEl.textContent = `+${achievement.xp} XP`;
    
    if (iconEl && window.lucide) {
        iconEl.setAttribute('data-lucide', achievement.icon);
        lucide.createIcons();
    }
    
    modal.classList.add('active');
});

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
    // Set Header date
    const dateEl = document.getElementById('header-date');
    if (dateEl) {
        dateEl.textContent = formatDate(new Date());
    }

    // Set Theme
    const initTheme = () => {
        const savedTheme = store.state.settings.theme;
        if (savedTheme === 'dark') {
            document.body.className = 'dark-theme';
            const toggle = document.getElementById('theme-toggle');
            if (toggle) {
                toggle.querySelector('.dark-icon').style.display = 'none';
                toggle.querySelector('.light-icon').style.display = 'block';
            }
        } else {
            document.body.className = 'light-theme';
        }
    };
    initTheme();

    // Setup Theme Toggle Listener
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            document.body.classList.toggle('light-theme', !isDark);
            
            const darkIcon = themeBtn.querySelector('.dark-icon');
            const lightIcon = themeBtn.querySelector('.light-icon');
            
            if (isDark) {
                darkIcon.style.display = 'none';
                lightIcon.style.display = 'block';
                store.updateSetting('theme', 'dark');
            } else {
                darkIcon.style.display = 'block';
                lightIcon.style.display = 'none';
                store.updateSetting('theme', 'light');
            }
        });
    }

    // Setup Score Displays
    const updateScoreDisplays = (state) => {
        const points = state.points;
        const desktopScore = document.getElementById('user-points');
        const mobileScore = document.getElementById('mobile-points');
        if (desktopScore) desktopScore.textContent = `${points} XP`;
        if (mobileScore) mobileScore.textContent = `${points} XP`;
    };
    updateScoreDisplays(store.state);
    store.subscribe(updateScoreDisplays);

    // Mobile "Mais" bottom sheet handling
    const bottomMoreBtn = document.getElementById('bottom-more-btn');
    const bottomSheet = document.getElementById('bottom-sheet');
    const bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');

    if (bottomMoreBtn && bottomSheet && bottomSheetOverlay) {
        bottomMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            bottomSheet.classList.add('active');
        });

        bottomSheetOverlay.addEventListener('click', () => {
            bottomSheet.classList.remove('active');
        });
    }

    // Modal Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = btn.getAttribute('data-close');
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('active');
        });
    });

    // Procrastination form submit
    const procrastinationForm = document.getElementById('procrastination-form');
    if (procrastinationForm) {
        procrastinationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const taskId = document.getElementById('procrastinating-task-id').value;
            const taskType = document.getElementById('procrastinating-task-type').value;
            const reason = procrastinationForm.querySelector('input[name="procrastination-reason"]:checked').value;
            const comment = document.getElementById('procrastination-comment').value;

            store.logProcrastination(taskId, "", taskType, reason, comment);
            
            // Reset and Close
            procrastinationForm.reset();
            document.getElementById('procrastination-modal').classList.remove('active');
            
            // Reload the active view to reflect changes (e.g. routine or tasks)
            handleRouting();
        });
    }

    // Setup Routing
    window.addEventListener('hashchange', handleRouting);
    handleRouting(); // First load trigger
});
