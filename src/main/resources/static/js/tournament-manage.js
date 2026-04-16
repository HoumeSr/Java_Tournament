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

// ========== СОХРАНЕНИЕ РЕЗУЛЬТАТОВ ==========
function initSaveScores() {
    const saveButtons = document.querySelectorAll('.btn-save-score');
    
    saveButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const matchId = btn.dataset.matchId;
            const score1 = document.getElementById(`score1_${matchId}`).value;
            const score2 = document.getElementById(`score2_${matchId}`).value;
            
            if (score1 === '' || score2 === '') {
                showToast('❌ Заполните оба счёта', true);
                return;
            }
            
            try {
                const response = await fetch('/api/tournament/match/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `matchId=${matchId}&score1=${score1}&score2=${score2}`
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('✅ Результат сохранён. Победитель определён!');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showToast('❌ ' + data.message, true);
                }
            } catch (error) {
                showToast('❌ Ошибка соединения с сервером', true);
            }
        });
    });
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
    initSaveScores();
    initNavBar();
});