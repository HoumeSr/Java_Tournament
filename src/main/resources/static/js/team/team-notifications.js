

let notifications = [];
let notificationsDropdown = null;
let updateInterval = null;

async function loadNotifications() {
    try {
        
        const data = await window.api.get('/api/notifications/my');
        notifications = data || [];
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('Error loading notifications:', error);
        if (error.message !== 'Unauthorized') {
            console.error('Failed to load notifications:', error);
        }
    }
}

function updateNotificationBadge() {
    const pendingCount = notifications.filter(n => n.status === 'PENDING').length;
    const $badge = $('.notification-badge .badge-count');
    
    if ($badge.length) {
        if (pendingCount > 0) {
            $badge.text(pendingCount > 99 ? '99+' : pendingCount).css('display', 'flex');
        } else {
            $badge.css('display', 'none');
        }
    }
}

function getStatusBadge(status) {
    switch(status) {
        case 'PENDING':
            return '<span class="status-badge pending">⏳ Ожидает</span>';
        case 'ACCEPTED':
            return '<span class="status-badge accepted">✅ Принято</span>';
        case 'DECLINED':
            return '<span class="status-badge declined">❌ Отклонено</span>';
        default:
            return `<span class="status-badge">${escapeHtml(status)}</span>`;
    }
}

function formatDate(dateString) {
    if (!dateString) return '—';
    
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

function renderNotifications() {
    if (!notificationsDropdown) return;
    
    const $dropdown = $(notificationsDropdown);
    
    if (notifications.length === 0) {
        $dropdown.html(`
            <div class="notifications-header">
                <i class="fas fa-bell"></i> Уведомления
            </div>
            <div class="empty-notifications">
                <i class="fas fa-inbox"></i>
                <p>Нет уведомлений</p>
            </div>
        `);
        return;
    }
    
    const pendingCount = notifications.filter(n => n.status === 'PENDING').length;
    const notificationsHtml = `
        <div class="notifications-header">
            <i class="fas fa-bell"></i> Уведомления (${pendingCount} новых)
        </div>
        <div class="notifications-list">
            ${notifications.map(notification => `
                <div class="notification-item ${notification.status.toLowerCase()}" data-id="${notification.id}">
                    <div class="notification-message">
                        ${escapeHtml(notification.message)}
                    </div>
                    <div class="notification-meta">
                        <span>
                            <i class="fas fa-clock"></i> 
                            ${formatDate(notification.createdAt)}
                        </span>
                        <span class="notification-status">
                            ${getStatusBadge(notification.status)}
                        </span>
                    </div>
                    ${notification.status === 'PENDING' && notification.type === 'TEAM_INVITE' ? `
                        <div class="notification-actions">
                            <button class="btn-accept" data-id="${notification.id}" data-action="ACCEPTED">
                                <i class="fas fa-check"></i> Принять
                            </button>
                            <button class="btn-decline" data-id="${notification.id}" data-action="DECLINED">
                                <i class="fas fa-times"></i> Отклонить
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    $dropdown.html(notificationsHtml);
    
    
    $dropdown.find('.btn-accept, .btn-decline').off('click').on('click', async function(e) {
        e.stopPropagation();
        const $btn = $(this);
        const notificationId = $btn.data('id');
        const action = $btn.data('action');
        await handleNotificationAction(notificationId, action);
    });
}

async function handleNotificationAction(notificationId, action) {
    try {
        
        await window.api.put(`/api/notifications/${notificationId}`, { status: action });
        
        if (action === 'ACCEPTED') {
            const notification = notifications.find(n => n.id === notificationId);
            if (notification && notification.teamId) {
                await addUserToTeam(notification.teamId);
                showToast('✅ Вы присоединились к команде!');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showToast('✅ Приглашение принято!');
            }
        } else {
            showToast('❌ Приглашение отклонено');
        }
        
        await loadNotifications();
    } catch (error) {
        console.error('Error handling notification:', error);
        showToast(`❌ ${error.message}`, true);
    }
}

async function addUserToTeam(teamId) {
    try {
        
        if (!window.auth || !window.auth.currentUser) {
            await window.auth?.check();
        }
        
        const currentUser = window.auth?.currentUser;
        
        if (!currentUser || !currentUser.id) {
            throw new Error('User not authenticated');
        }
        
        
        const result = await window.api.post(`/api/teams/${teamId}/members`, { 
            userId: currentUser.id 
        });
        
        return result;
    } catch (error) {
        console.error('Error adding to team:', error);
        throw error;
    }
}

async function createNotificationIcon() {
    const $authContainer = $('#authButtons');
    if (!$authContainer.length) return;
    
    if ($('.notification-badge').length) return;
    
    const $profileIcon = $('.profile-icon');
    if ($profileIcon.length) {
        const $notificationIcon = $(`
            <div class="notification-badge">
                <i class="fas fa-bell"></i>
                <span class="badge-count" style="display: none;">0</span>
            </div>
        `);
        
        $authContainer.prepend($notificationIcon);
        
        notificationsDropdown = $(`
            <div class="notifications-dropdown"></div>
        `).appendTo($notificationIcon)[0];
        
        $notificationIcon.on('click', (e) => {
            e.stopPropagation();
            const $dropdown = $(notificationsDropdown);
            $dropdown.toggleClass('show');
            if ($dropdown.hasClass('show')) {
                loadNotifications();
            }
        });
        
        $(document).on('click', (e) => {
            if (!$notificationIcon.is(e.target) && !$notificationIcon.has(e.target).length) {
                $(notificationsDropdown).removeClass('show');
            }
        });
        
        await loadNotifications();
        
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(loadNotifications, 30000);
    }
}


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


$(document).ready(() => {
    
    const checkAuthInterval = setInterval(() => {
        if ($('.profile-icon').length) {
            clearInterval(checkAuthInterval);
            createNotificationIcon();
        }
    }, 100);
});