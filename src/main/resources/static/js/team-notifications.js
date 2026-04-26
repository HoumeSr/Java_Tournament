// ========== УПРАВЛЕНИЕ УВЕДОМЛЕНИЯМИ ==========

let notifications = [];
let notificationsDropdown = null;
let updateInterval = null;

async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications/my', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) return;
            throw new Error('Failed to load notifications');
        }
        
        notifications = await response.json();
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge() {
    const pendingCount = notifications.filter(n => n.status === 'PENDING').length;
    const badge = document.querySelector('.notification-badge .badge-count');
    
    if (badge) {
        if (pendingCount > 0) {
            badge.textContent = pendingCount > 99 ? '99+' : pendingCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderNotifications() {
    if (!notificationsDropdown) return;
    
    if (notifications.length === 0) {
        notificationsDropdown.innerHTML = `
            <div class="notifications-header">
                <i class="fas fa-bell"></i> Уведомления
            </div>
            <div class="empty-notifications">
                <i class="fas fa-inbox"></i>
                <p>Нет уведомлений</p>
            </div>
        `;
        return;
    }
    
    const notificationsHtml = `
        <div class="notifications-header">
            <i class="fas fa-bell"></i> Уведомления (${notifications.filter(n => n.status === 'PENDING').length} новых)
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
                            <button class="btn-accept" onclick="handleNotificationAction(${notification.id}, 'ACCEPTED')">
                                <i class="fas fa-check"></i> Принять
                            </button>
                            <button class="btn-decline" onclick="handleNotificationAction(${notification.id}, 'DECLINED')">
                                <i class="fas fa-times"></i> Отклонить
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    notificationsDropdown.innerHTML = notificationsHtml;
}

async function handleNotificationAction(notificationId, action) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ status: action })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Action failed');
        }
        
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
        if (!currentUser) {
            await getCurrentUser();
        }
        
        if (!currentUser || !currentUser.id) {
            throw new Error('User not authenticated');
        }
        
        const response = await fetch(`/api/teams/${teamId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ userId: currentUser.id })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add to team');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error adding to team:', error);
        throw error;
    }
}

async function createNotificationIcon() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    if (document.querySelector('.notification-badge')) return;
    
    const profileIcon = document.querySelector('.profile-icon');
    if (profileIcon) {
        const notificationIcon = document.createElement('div');
        notificationIcon.className = 'notification-badge';
        notificationIcon.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="badge-count" style="display: none;">0</span>
        `;
        
        authContainer.insertBefore(notificationIcon, profileIcon);
        
        notificationsDropdown = document.createElement('div');
        notificationsDropdown.className = 'notifications-dropdown';
        notificationIcon.appendChild(notificationsDropdown);
        
        notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('show');
            if (notificationsDropdown.classList.contains('show')) {
                loadNotifications();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!notificationIcon.contains(e.target)) {
                notificationsDropdown.classList.remove('show');
            }
        });
        
        await loadNotifications();
        
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(loadNotifications, 30000);
    }
}