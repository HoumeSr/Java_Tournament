

function showToast(message, isError = false) {
    let $toast = $('#demoToast');
    
    if (!$toast.length) {
        $toast = $('<div id="demoToast" class="demo-toast"></div>').appendTo('body');
    }

    
    
    if ($toast.parent().get(0) !== document.body) {
        $('body').append($toast);
    }

    $toast.text(message).css({
        background: isError ? '#b91c1c' : '#1f2937',
        zIndex: '30000',
        opacity: '1',
        visibility: 'visible'
    });

    setTimeout(() => {
        $toast.css({ opacity: '0', visibility: 'hidden' });
    }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
}

function getStatusBadge(status) {
    const badges = {
        'PENDING': '<span style="color: #60a5fa;">⏳ Ожидает</span>',
        'ACCEPTED': '<span style="color: #34d399;">✓ Принято</span>',
        'DECLINED': '<span style="color: #f87171;">✗ Отклонено</span>'
    };
    return badges[status] || status;
}

let currentUser = null;

async function getCurrentUser() {
    try {
        
        const data = await window.api.get('/api/auth/check');
        
        if (data.authenticated && data.user) {
            currentUser = data.user;
        }
        return currentUser;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}


async function updateAuthButtons() {
    const $auth = $('#authButtons');
    if (!$auth.length) return;
    
    try {
        const data = await window.api.get('/api/auth/check');
        
        if (data.authenticated && data.user) {
            currentUser = data.user;
            const imageUrl = data.user.imageUrl;
            
            if (imageUrl) {
                $auth.html(`
                    <div class="profile-icon" id="profileIcon">
                        <img src="${escapeHtml(imageUrl)}" alt="avatar">
                    </div>
                `);
            } else {
                $auth.html(`
                    <div class="profile-icon" id="profileIcon">
                        <i class="fas fa-user-circle"></i>
                    </div>
                `);
            }
            
            $('#profileIcon').off('click').on('click', () => {
                window.location.href = '/profile';
            });
        } else {
            $auth.html(`
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>
            `);
            
            $('#registerBtn').off('click').on('click', () => {
                window.location.href = '/register';
            });
            
            $('#loginBtn').off('click').on('click', () => {
                window.location.href = '/login';
            });
        }
    } catch (error) {
        console.error('Auth check error:', error);
        $auth.html(`
            <button class="btn-outline" id="registerBtn">Регистрация</button>
            <button class="btn-primary" id="loginBtn">Вход</button>
        `);
        
        $('#registerBtn').off('click').on('click', () => {
            window.location.href = '/register';
        });
        
        $('#loginBtn').off('click').on('click', () => {
            window.location.href = '/login';
        });
    }
}


async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = '/login';
        return null;
    }
    return user;
}


async function logout() {
    try {
        await window.api.post('/api/auth/logout', {});
    } finally {
        window.location.href = '/login';
    }
}


window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.getStatusBadge = getStatusBadge;
window.getCurrentUser = getCurrentUser;
window.updateAuthButtons = updateAuthButtons;
window.requireAuth = requireAuth;
window.logout = logout;