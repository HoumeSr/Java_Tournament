$(document).ready(function() {
    let currentCategory = 'all';
    let tournaments = [];
    let categories = [{ id: 'all', label: 'Все', icon: '🌍' }];
    let notifications = [];
    let notificationsPanelOpen = false;

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

    function getStatusText(status) {
        return ({
            REGISTRATION_OPEN: '🔥 Регистрация открыта',
            IN_PROGRESS: '⚡ Идёт турнир',
            FINISHED: '🏆 Завершён',
            DRAFT: '📝 Черновик',
            CANCELLED: '❌ Отменён'
        })[status] || status || 'Неизвестно';
    }

    function getParticipantTypeLabel(type) {
        return type === 'TEAM' ? '👥 Командный' : '👤 Одиночный';
    }

    function getGameIcon(gameName) {
        if (!gameName) return '🏆';
        const lower = gameName.toLowerCase();
        if (lower.includes('chess')) return '♟️';
        if (lower.includes('tennis')) return '🎾';
        if (lower.includes('dota') || lower.includes('counter') || lower.includes('valorant') || lower.includes('league')) return '🎮';
        if (lower.includes('football')) return '⚽';
        if (lower.includes('fight')) return '🥋';
        return '🏆';
    }

    function resolveImageUrl(imageUrl) {
        if (!imageUrl) return '';
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('data:') || imageUrl.startsWith('/')) return imageUrl;
        return '/images/' + imageUrl;
    }

    // ========== УВЕДОМЛЕНИЯ ==========
    function loadNotifications() {
        $.get('/api/notifications/my')
            .done(function(data) {
                notifications = data || [];
                updateNotificationBell();
            })
            .fail(function() {
                console.error('Failed to load notifications');
                notifications = [];
                updateNotificationBell();
            });
    }

    function updateNotificationBell() {
        const $bell = $('.notification-bell');
        const unreadCount = notifications.filter(n => n.type === 'TEAM_INVITE' && n.status === 'PENDING').length;
        
        // Удаляем старый бейдж
        $bell.find('.notification-badge').remove();
        
        // Добавляем новый, если есть уведомления
        if (unreadCount > 0) {
            $bell.append(`<span class="notification-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>`);
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'только что';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
        return date.toLocaleDateString('ru-RU');
    }

    function acceptInvite(notificationId, teamId) {
        $.post(`/api/teams/invite/${notificationId}/accept`)
            .done(function() {
                showToast('✅ Вы вступили в команду!');
                loadNotifications();
                $('.notifications-panel').remove();
                notificationsPanelOpen = false;
                // Обновляем страницу через секунду
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .fail(function(err) {
                showToast('❌ Не удалось принять приглашение', true);
                console.error(err);
            });
    }
    
    function declineInvite(notificationId) {
        $.post(`/api/teams/invite/${notificationId}/decline`)
            .done(function() {
                showToast('📩 Приглашение отклонено');
                loadNotifications();
                // Обновляем панель без перезагрузки
                $('.notifications-panel').remove();
                notificationsPanelOpen = false;
                // Если нужно сразу показать обновлённую панель
                setTimeout(() => {
                    toggleNotifications();
                }, 100);
            })
            .fail(function(err) {
                showToast('❌ Не удалось отклонить приглашение', true);
                console.error(err);
            });
    }

    function renderNotificationsPanel() {
        const $existingPanel = $('.notifications-panel');
        if ($existingPanel.length) $existingPanel.remove();
        
        // Получаем только приглашения (TEAM_INVITE) со статусом PENDING
        const pendingInvites = notifications.filter(n => n.type === 'TEAM_INVITE' && n.status === 'PENDING');
        
        const $panel = $(`
            <div class="notifications-panel">
                <div class="notifications-header">
                    <h3><i class="fas fa-bell"></i> Приглашения в команды</h3>
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
                                ${formatDate(notification.createdAt)}
                            </div>
                        </div>
                        <div class="notification-actions">
                            <button class="btn-accept">Принять</button>
                            <button class="btn-decline">Отклонить</button>
                        </div>
                    </div>
                `);
                
                $item.find('.btn-accept').on('click', (e) => {
                    e.stopPropagation();
                    acceptInvite(notification.id, notification.teamId);
                });
                
                $item.find('.btn-decline').on('click', (e) => {
                    e.stopPropagation();
                    declineInvite(notification.id);
                });
                
                $list.append($item);
            });
        }
        
        $('body').append($panel);
        
        // Позиционирование относительно колокольчика
        const $bell = $('.notification-bell');
        const offset = $bell.offset();
        $panel.css({
            top: offset.top + $bell.outerHeight() + 5,
            right: $(window).width() - (offset.left + $bell.outerWidth())
        });
        
        // Закрытие при клике вне
        setTimeout(() => {
            $(document).on('click.notification', function(e) {
                if (!$(e.target).closest('.notifications-panel').length && !$(e.target).closest('.notification-bell').length) {
                    $('.notifications-panel').remove();
                    $(document).off('click.notification');
                    notificationsPanelOpen = false;
                }
            });
        }, 100);
    }
    
    function toggleNotifications() {
        if (notificationsPanelOpen) {
            $('.notifications-panel').remove();
            notificationsPanelOpen = false;
        } else {
            renderNotificationsPanel();
            notificationsPanelOpen = true;
        }
    }

    // ========== ОСНОВНЫЕ ФУНКЦИИ ==========
    function loadCategories() {
        $.get('/api/gametypes')
            .done(function(gameTypes) {
                categories = [{ id: 'all', label: 'Все', icon: '🌍' }].concat(
                    (gameTypes || [])
                        .filter(game => game.isActive === true)
                        .map(game => ({
                            id: String(game.id),
                            label: game.name,
                            icon: getGameIcon(game.name),
                            gameId: game.id
                        }))
                );
                renderCategories();
            })
            .fail(function() {
                renderCategories();
            });
    }

    function loadTournaments() {
        $.get('/api/tournaments')
            .done(function(data) {
                tournaments = (data || []).map(t => ({
                    id: t.id,
                    title: t.title,
                    status: t.status,
                    participantType: t.participantType,
                    gameName: t.gameName,
                    organizerUsername: t.organizerUsername,
                    imageUrl: resolveImageUrl(t.imageUrl)
                }));
                renderTournaments();
                updateTournamentCount();
                renderCategories();
            })
            .fail(function() {
                tournaments = [];
                renderTournaments();
                updateTournamentCount();
                showToast('❌ Не удалось загрузить турниры', true);
            });
    }

    function renderCategories() {
        const $container = $('#categoriesContainer');
        if (!$container.length) return;
        $container.empty();
        categories.forEach(cat => {
            const count = cat.id === 'all'
                ? tournaments.length
                : tournaments.filter(t => t.gameName === cat.label).length;

            const $btn = $('<button>')
                .addClass(`cat-btn ${currentCategory === cat.id ? 'active-cat' : ''}`)
                .html(`${cat.icon} ${cat.label}`)
                .data('cat', cat.id)
                .on('click', function() {
                    currentCategory = cat.id;
                    renderCategories();
                    renderTournaments();
                });

            if (count > 0) {
                $btn.append($('<span>').addClass('category-count').text(count));
            }
            $container.append($btn);
        });
    }

    function getFilteredTournaments() {
        if (currentCategory === 'all') return [...tournaments];
        const category = categories.find(c => c.id === currentCategory);
        if (!category) return [];
        return tournaments.filter(t => t.gameName === category.label);
    }

    function updateTournamentCount() {
        const $count = $('#tournamentCount');
        if ($count.length) {
            $count.text(`${getFilteredTournaments().length} событий`);
        }
    }

    function renderTournaments() {
        const filtered = getFilteredTournaments();
        const $grid = $('#tournamentsGrid');
        if (!$grid.length) return;
        updateTournamentCount();
        if (filtered.length === 0) {
            $grid.html('<div class="no-results">😔 В этой категории пока нет турниров. Загляни позже!</div>');
            return;
        }
        $grid.empty();
        filtered.forEach(t => {
            const $card = $('<div>').addClass('tournament-card').on('click', function() {
                window.location.href = `/tournaments/${t.id}`;
            });

            const bannerStyle = t.imageUrl
                ? `linear-gradient(125deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('${t.imageUrl}')`
                : 'linear-gradient(125deg, #1e1b2e, #2d1b4e)';

            const $banner = $('<div>').addClass('card-banner')
                .css({ background: bannerStyle, backgroundSize: 'cover', backgroundPosition: 'center 30%' })
                .html(`<span class="category-badge">${getGameIcon(t.gameName)} ${escapeHtml(t.gameName || 'Турнир')}</span>`);

            const $content = $('<div>').addClass('card-content').html(`
                <div class="tourney-name">${escapeHtml(t.title)}</div>
                <div class="tourney-details">
                    <span class="detail-item">${getParticipantTypeLabel(t.participantType)}</span>
                    <span class="detail-item">Статус: ${escapeHtml(getStatusText(t.status))}</span>
                </div>
                <div class="prize">Организатор: ${escapeHtml(t.organizerUsername || '—')}</div>
            `);

            const footerHtml = t.status === 'REGISTRATION_OPEN'
                ? `<span class="register-badge">Открыта регистрация</span><span class="arrow-link">Подробнее →</span>`
                : `<span class="arrow-link" style="justify-content:flex-end;">Подробнее →</span>`;
            const $footer = $('<div>').addClass('card-footer').html(footerHtml);
            $footer.find('.register-badge').on('click', function(e) {
                e.stopPropagation();
                window.location.href = `/tournaments/${t.id}`;
            });

            $card.append($banner, $content, $footer);
            $grid.append($card);
        });
    }

    function updateAuthButtons() {
        $.get('/api/auth/check')
            .done(function(data) {
                const $auth = $('#authButtons');
                if (!$auth.length) return;
                if (data.authenticated) {
                    const imageUrl = data.user?.imageUrl ? resolveImageUrl(data.user.imageUrl) : null;
                    $auth.html(`
                        <div class="notification-wrapper">
                            <div class="notification-bell" id="notificationBell">
                                <i class="fas fa-bell"></i>
                            </div>
                        </div>
                        <div class="profile-icon" id="profileIcon">
                            ${imageUrl ? `<img src="${imageUrl}" class="avatar-mini" alt="avatar">` : '<i class="fas fa-user-circle"></i>'}
                        </div>
                    `);
                    
                    // Обработчик клика по колокольчику
                    $('#notificationBell').on('click', function(e) {
                        e.stopPropagation();
                        toggleNotifications();
                    });
                    
                    $('#profileIcon').on('click', () => window.location.href = '/profile');
                    
                    // Загружаем уведомления для авторизованного пользователя
                    loadNotifications();
                } else {
                    $auth.html(`
                        <button class="btn-outline" id="registerBtn">Регистрация</button>
                        <button class="btn-primary" id="loginBtn">Вход</button>
                    `);
                    $('#registerBtn').on('click', () => window.location.href = '/register');
                    $('#loginBtn').on('click', () => window.location.href = '/login');
                }
            })
            .fail(function() {
                $('#authButtons').html(`
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `);
                $('#registerBtn').on('click', () => window.location.href = '/register');
                $('#loginBtn').on('click', () => window.location.href = '/login');
            });
    }

    function updateCreateTournamentButton() {
        $.get('/api/auth/check')
            .done(data => $('#createTournamentBtn').css('display', data.authenticated ? 'flex' : 'none'))
            .fail(() => $('#createTournamentBtn').hide());
    }

    function initNavBar() {
        $('.nav-item').each(function() {
            const $item = $(this);
            if ($item.attr('href') && $item.attr('href') !== '#') return;
            $item.on('click', function() {
                const page = $(this).text().trim().toLowerCase();
                if (page === 'матчи') showToast('⚡ Раздел матчей пока не завершён');
                else if (page === 'рейтинг') window.location.href = '/rating';
            });
        });
    }

    loadCategories();
    loadTournaments();
    updateAuthButtons();
    updateCreateTournamentButton();
    initNavBar();
});