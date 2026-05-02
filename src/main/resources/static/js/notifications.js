// ========== МОДУЛЬ УВЕДОМЛЕНИЙ ==========
const NotificationsModule = (function() {
    let notifications = [];
    let notificationsPanelOpen = false;
    let refreshInterval = null;
    let currentUser = null;
    let scrollHandler = null;
    let resizeHandler = null;

    // Вспомогательные функции
    function showToast(message, isError = false) {
        const $toast = $('#demoToast');
        if (!$toast.length) return;
        $toast.text(message).css({
            background: isError ? '#b91c1c' : '#1f2937',
            opacity: '1',
            visibility: 'visible'
        });
        setTimeout(() => $toast.css({ opacity: '0', visibility: 'hidden' }), 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'только что';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} дн назад`;
        return date.toLocaleDateString('ru-RU');
    }

    // Загрузка уведомлений через api
    async function loadNotifications() {
        try {
            const data = await window.api.get('/api/notifications/my');
            const oldCount = getPendingCount();
            notifications = data || [];
            const newCount = getPendingCount();
            
            updateNotificationBell();
            
            // Анимация при появлении новых уведомлений
            if (newCount > oldCount && newCount > 0) {
                const $bell = $('.notification-bell');
                $bell.addClass('new-notification');
                setTimeout(() => $bell.removeClass('new-notification'), 800);
                
                // Если панель открыта, обновляем её
                if (notificationsPanelOpen) {
                    updatePanelPosition();
                }
            }
            return notifications;
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                console.error('Failed to load notifications:', error);
            }
            return [];
        }
    }

    function getPendingCount() {
        return notifications.filter(n => n.type === 'TEAM_INVITE' && n.status === 'PENDING').length;
    }

    function updateNotificationBell() {
        const $bell = $('.notification-bell');
        const unreadCount = getPendingCount();
        
        $bell.find('.notification-badge').remove();
        
        if (unreadCount > 0) {
            $bell.append(`<span class="notification-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>`);
        }
    }

    function updatePanelPosition() {
        const $panel = $('.notifications-panel');
        if (!$panel.length || !notificationsPanelOpen) return;
        
        const $bell = $('.notification-bell');
        if (!$bell.length) return;
        
        const rect = $bell[0].getBoundingClientRect();
        const panelHeight = $panel.outerHeight();
        const viewportHeight = window.innerHeight;
        
        let topPosition = rect.bottom + 8;
        
        if (topPosition + panelHeight > viewportHeight - 20) {
            topPosition = rect.top - panelHeight - 8;
            $panel.addClass('panel-top');
        } else {
            $panel.removeClass('panel-top');
        }
        
        $panel.css({ top: topPosition });
    }

    function bindPositionTracking() {
        if (scrollHandler) {
            $(window).off('scroll', scrollHandler);
            $(window).off('resize', scrollHandler);
        }
        
        scrollHandler = function() {
            if (notificationsPanelOpen) {
                requestAnimationFrame(updatePanelPosition);
            }
        };
        
        $(window).on('scroll', scrollHandler);
        $(window).on('resize', scrollHandler);
    }
    
    function unbindPositionTracking() {
        if (scrollHandler) {
            $(window).off('scroll', scrollHandler);
            $(window).off('resize', scrollHandler);
            scrollHandler = null;
        }
    }

    // Действия с уведомлениями через api
    async function acceptInvite(notificationId, teamId) {
        try {
            await window.api.post(`/api/teams/invite/${notificationId}/accept`);
            showToast('✅ Вы вступили в команду!');
            await loadNotifications();
            if (notificationsPanelOpen) {
                renderNotificationsPanel();
            }
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            let errorMsg = error.message || 'Не удалось принять приглашение';
            showToast(`❌ ${errorMsg}`, true);
        }
    }
    
    async function declineInvite(notificationId) {
        try {
            await window.api.post(`/api/teams/invite/${notificationId}/decline`);
            showToast('📩 Приглашение отклонено');
            await loadNotifications();
            if (notificationsPanelOpen) {
                renderNotificationsPanel();
            }
        } catch (error) {
            let errorMsg = error.message || 'Не удалось отклонить приглашение';
            showToast(`❌ ${errorMsg}`, true);
        }
    }

    // Рендер панели
    function renderNotificationsPanel() {
        $('.notifications-panel').remove();
        
        const pendingInvites = notifications.filter(n => n.type === 'TEAM_INVITE' && n.status === 'PENDING');
        
        const $panel = $(`
            <div class="notifications-panel" style="display: none;">
                <div class="notifications-header">
                    <h3><i class="fas fa-bell"></i> Приглашения в команды <span style="font-size: 12px; opacity: 0.8;">(${pendingInvites.length})</span></h3>
                </div>
                <div class="notifications-list"></div>
            </div>
        `);
        
        const $list = $panel.find('.notifications-list');
        
        if (pendingInvites.length === 0) {
            $list.html(`
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>Нет новых приглашений</p>
                    <p>Когда капитан пригласит вас в команду, уведомления появятся здесь</p>
                </div>
            `);
        } else {
            pendingInvites.forEach(notification => {
                const $item = $(`
                    <div class="notification-item" data-id="${notification.id}">
                        <div class="notification-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="notification-content">
                            <div class="notification-message">
                                Приглашение в команду <strong>${escapeHtml(notification.teamName || 'команду')}</strong>
                            </div>
                            <div class="notification-time">
                                <i class="far fa-clock"></i> ${formatDate(notification.createdAt)}
                            </div>
                        </div>
                        <div class="notification-actions">
                            <button class="btn-accept">Принять</button>
                            <button class="btn-decline">Отклонить</button>
                        </div>
                    </div>
                `);
                
                $item.find('.btn-accept').off('click').on('click', (e) => {
                    e.stopPropagation();
                    acceptInvite(notification.id, notification.teamId);
                });
                
                $item.find('.btn-decline').off('click').on('click', (e) => {
                    e.stopPropagation();
                    declineInvite(notification.id);
                });
                
                $list.append($item);
            });
        }
        
        $('body').append($panel);
        bindPositionTracking();
        updatePanelPosition();
        $panel.fadeIn(150);
        
        const closeHandler = function(e) {
            if (!$(e.target).closest('.notifications-panel').length && 
                !$(e.target).closest('.notification-bell').length) {
                $('.notifications-panel').fadeOut(150, function() {
                    $(this).remove();
                });
                $(document).off('click.notification');
                unbindPositionTracking();
                notificationsPanelOpen = false;
            }
        };
        
        setTimeout(() => {
            $(document).on('click.notification', closeHandler);
        }, 100);
    }
    
    async function toggleNotifications() {
        if (notificationsPanelOpen) {
            $('.notifications-panel').fadeOut(150, function() {
                $(this).remove();
                notificationsPanelOpen = false;
                unbindPositionTracking();
            });
        } else {
            await loadNotifications();
            renderNotificationsPanel();
            notificationsPanelOpen = true;
        }
    }

    // Инициализация
    function init() {
        $(document).off('click', '#notificationBell').on('click', '#notificationBell', function(e) {
            e.stopPropagation();
            toggleNotifications();
        });
        
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
            if (!notificationsPanelOpen) {
                loadNotifications();
            }
        }, 30000);
    }

    function destroy() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
        unbindPositionTracking();
        $(document).off('click', '#notificationBell');
        $(document).off('click.notification');
        $('.notifications-panel').remove();
        notificationsPanelOpen = false;
    }

    // Публичное API
    return {
        init: init,
        destroy: destroy,
        loadNotifications: loadNotifications,
        getPendingCount: getPendingCount,
        updatePanelPosition: updatePanelPosition
    };
})();

// Экспортируем для использования в других модулях
window.NotificationsModule = NotificationsModule;