// ========== УВЕДОМЛЕНИЯ ==========
function showToast(message, isError = false) {
    const toast = document.getElementById('demoToast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.background = isError ? '#b91c1c' : '#1f2937';
    toast.style.opacity = '1';
    toast.style.visibility = 'visible';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.visibility = 'hidden';
    }, 3000);
}

// ========== АВТОРИЗАЦИЯ ==========
function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                const imageUrl = data.user?.imageUrl;
                
                if (imageUrl) {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <img src="${imageUrl}">
                        </div>
                    `;
                } else {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <i class="fas fa-user-circle"></i>
                        </div>
                    `;
                }
                document.getElementById('profileIcon')?.addEventListener('click', () => {
                    window.location.href = '/profile';
                });
            } else {
                authContainer.innerHTML = `
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `;
                document.getElementById('registerBtn')?.addEventListener('click', () => {
                    window.location.href = '/register';
                });
                document.getElementById('loginBtn')?.addEventListener('click', () => {
                    window.location.href = '/login';
                });
            }
        })
        .catch(() => {});
}

// ========== ПРОВЕРКА АВТОРИЗАЦИИ ==========
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        return data.authenticated;
    } catch (error) {
        return false;
    }
}

// ========== ЗАГРУЗКА КОМАНД ==========
async function loadTeams() {
    const container = document.getElementById('teamsContainer');
    
    // Сначала проверяем авторизацию
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <h3>Требуется авторизация</h3>
                <p>Войдите в аккаунт, чтобы просматривать свои команды</p>
            </div>
        `;
        return;
    }
    
    // Показываем загрузку
    container.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка команд...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/teams/my');
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки команд');
        }
        
        const teams = await response.json();
        
        if (!teams || teams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Пока нет команд</h3>
                    <p>Создайте свою первую команду, нажав на кнопку "+" в правом нижнем углу</p>
                </div>
            `;
            return;
        }
        
        renderTeams(teams);
    } catch (error) {
        console.error('Error loading teams:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки</h3>
                <p>Не удалось загрузить список команд. Попробуйте позже.</p>
                <button class="retry-btn" onclick="loadTeams()">
                    <i class="fas fa-sync-alt"></i> Повторить
                </button>
            </div>
        `;
    }
}

// ========== ОТРИСОВКА КОМАНД ==========
function renderTeams(teams) {
    const container = document.getElementById('teamsContainer');
    
    container.innerHTML = `
        <div class="teams-grid">
            ${teams.map(team => `
                <div class="team-card" onclick="window.location.href='/team/${team.id}'">
                    <div class="team-image">
                        ${team.imageUrl ? 
                            `<img src="${team.imageUrl}" alt="${escapeHtml(team.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                             <i class="fas fa-users" style="display: none;"></i>` : 
                            `<i class="fas fa-users"></i>`
                        }
                    </div>
                    <div class="team-info">
                        <div class="team-name">
                            ${escapeHtml(team.name)}
                            <span class="team-captain">
                                <i class="fas fa-crown"></i> ${escapeHtml(team.captainUsername || 'Нет капитана')}
                            </span>
                        </div>
                        <div class="team-tag">
                            <i class="fas fa-hashtag"></i> ${escapeHtml(team.name.substring(0, 3).toUpperCase())}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ========== FAB КНОПКА ==========
function initFabButton() {
    const fabBtn = document.getElementById('createTeamFab');
    if (!fabBtn) return;
    
    fabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fabBtn.style.transform = 'scale(0.96)';
        setTimeout(() => {
            fabBtn.style.transform = '';
            window.location.href = '/teams/create';
        }, 150);
    });
}

// ========== ESCAPE HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function init() {
    loadTeams();
    initFabButton();
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    init();
});