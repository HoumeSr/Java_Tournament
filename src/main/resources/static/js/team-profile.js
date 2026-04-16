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

// ========== АВТОРИЗАЦИЯ В ШАПКЕ ==========
function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                const savedAvatar = localStorage.getItem('userAvatar');
                
                if (savedAvatar) {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <img src="${savedAvatar}">
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
        });
}

// ========== ДЕЙСТВИЯ С КОМАНДОЙ ==========
function initTeamActions() {
    const joinBtn = document.getElementById('joinTeamBtn');
    const leaveBtn = document.getElementById('leaveTeamBtn');
    const editBtn = document.getElementById('editTeamBtn');
    
    if (joinBtn) {
        joinBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/teams/join', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `teamId=${window.teamId}`
                });
                const data = await response.json();
                if (data.success) {
                    showToast('✅ Вы вступили в команду');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showToast('❌ ' + data.message, true);
                }
            } catch (error) {
                showToast('❌ Ошибка соединения', true);
            }
        });
    }
    
    if (leaveBtn) {
        leaveBtn.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите покинуть команду?')) {
                try {
                    const response = await fetch('/api/teams/leave', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: `teamId=${window.teamId}`
                    });
                    const data = await response.json();
                    if (data.success) {
                        showToast('👋 Вы покинули команду');
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        showToast('❌ ' + data.message, true);
                    }
                } catch (error) {
                    showToast('❌ Ошибка соединения', true);
                }
            }
        });
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            window.location.href = `/team/edit/${window.teamId}`;
        });
    }
}

// ========== НАВИГАЦИЯ ==========
function initNavBar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('href') && item.getAttribute('href') !== '#') return;
        item.addEventListener('click', () => {
            showToast('📋 Этот раздел в разработке');
        });
    });
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    initTeamActions();
    initNavBar();
});