// ========== УВЕДОМЛЕНИЯ ==========
function showToast(message, isError = false) {
    const $toast = $('#demoToast');
    if (!$toast.length) return;
    
    $toast.text(message).css({
        background: isError ? '#b91c1c' : '#1f2937',
        opacity: '1',
        visibility: 'visible'
    });
    
    setTimeout(() => {
        $toast.css({ opacity: '0', visibility: 'hidden' });
    }, 3000);
}

// ========== АВТОРИЗАЦИЯ В ШАПКЕ ==========
async function updateAuthButtons() {
    const $auth = $('#authButtons');
    if (!$auth.length) return;
    
    try {
        // Используем api.get для проверки авторизации
        const data = await window.api.get('/api/auth/check');
        
        if (data && data.authenticated && data.user) {
            const avatarUrl = data.user.imageUrl 
                ? (data.user.imageUrl.startsWith('/') || data.user.imageUrl.startsWith('http') 
                    ? data.user.imageUrl 
                    : '/images/' + data.user.imageUrl)
                : null;
            $auth.html(`
                <div class="notification-wrapper">
                    <div class="notification-bell" id="notificationBell">
                        <i class="fas fa-bell"></i>
                    </div>
                </div>
                <div class="profile-icon" id="profileIcon">
                    ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" class="avatar-mini" alt="Аватар">` : '<i class="fas fa-user-circle"></i>'}
                </div>
            `);
            
            $('#profileIcon').off('click').on('click', () => window.location.href = '/profile');
            
            // Инициализируем модуль уведомлений
            if (window.NotificationsModule) {
                window.NotificationsModule.init();
                window.NotificationsModule.loadNotifications();
            }
        } else {
            $auth.html(`
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>
            `);
            $('#registerBtn').off('click').on('click', () => window.location.href = '/register');
            $('#loginBtn').off('click').on('click', () => window.location.href = '/login');
            
            // Очищаем уведомления для неавторизованных
            if (window.NotificationsModule) {
                window.NotificationsModule.destroy();
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // Показываем кнопки входа в случае ошибки
        $auth.html(`
            <button class="btn-outline" id="registerBtn">Регистрация</button>
            <button class="btn-primary" id="loginBtn">Вход</button>
        `);
        $('#registerBtn').off('click').on('click', () => window.location.href = '/register');
        $('#loginBtn').off('click').on('click', () => window.location.href = '/login');
    }
}

// ========== ДЕЙСТВИЯ С КОМАНДОЙ ==========
function initTeamActions() {
    const $joinBtn = $('#joinTeamBtn');
    const $leaveBtn = $('#leaveTeamBtn');
    const $editBtn = $('#editTeamBtn');
    
    if ($joinBtn.length) {
        $joinBtn.off('click').on('click', async () => {
            try {
                const data = await window.api.post('/api/teams/join', null, {
                    params: { teamId: window.teamId }
                });
                
                if (data.success) {
                    showToast('✅ Вы вступили в команду');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showToast('❌ ' + (data.message || 'Не удалось вступить'), true);
                }
            } catch (error) {
                showToast('❌ ' + (error.message || 'Ошибка соединения'), true);
            }
        });
    }
    
    if ($leaveBtn.length) {
        $leaveBtn.off('click').on('click', async () => {
            if (confirm('Вы уверены, что хотите покинуть команду?')) {
                try {
                    const data = await window.api.post('/api/teams/leave', null, {
                        params: { teamId: window.teamId }
                    });
                    
                    if (data.success) {
                        showToast('👋 Вы покинули команду');
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        showToast('❌ ' + (data.message || 'Не удалось покинуть'), true);
                    }
                } catch (error) {
                    showToast('❌ ' + (error.message || 'Ошибка соединения'), true);
                }
            }
        });
    }
    
    if ($editBtn.length) {
        $editBtn.off('click').on('click', () => {
            window.location.href = `/team/edit/${window.teamId}`;
        });
    }
}

// ========== НАВИГАЦИЯ ==========
function initNavBar() {
    $('.nav-item').each(function() {
        const $item = $(this);
        const href = $item.attr('href');
        
        if (href && href !== '#') return;
        
        $item.off('click').on('click', () => {
            showToast('📋 Этот раздел в разработке');
        });
    });
}

// ========== ESCAPE HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        if (m === "'") return '&#039;';
        return m;
    });
}

// ========== ЗАПУСК ==========
$(document).ready(() => {
    updateAuthButtons();
    initTeamActions();
    initNavBar();
});