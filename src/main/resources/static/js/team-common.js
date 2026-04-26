// ========== ОБЩИЕ ФУНКЦИИ ==========

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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
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
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        if (data.authenticated && data.user) {
            currentUser = data.user;
        }
        return currentUser;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}