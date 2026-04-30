// home.js - адаптирован под базовый api.js
$(document).ready(function() {
    let currentCategory = 'all';
    let tournaments = [];
    let categories = [{ id: 'all', label: 'Все', icon: '🌍' }];

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

    // Загрузка данных - используем прямые GET запросы через api
    async function loadCategories() {
        try {
            // Используем api.get для /api/gametypes
            const gameTypes = await window.api.get('/api/gametypes');
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
        } catch (error) {
            console.error('Error loading categories:', error);
            renderCategories();
        }
    }

    async function loadTournaments() {
        try {
            // Используем api.get для /api/tournaments
            const data = await window.api.get('/api/tournaments');
            tournaments = (data || []).map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                participantType: t.participantType,
                gameName: t.gameName,
                organizerUsername: t.organizerUsername,
            }));
            renderTournaments();
            updateTournamentCount();
            renderCategories();
        } catch (error) {
            console.error('Error loading tournaments:', error);
            tournaments = [];
            renderTournaments();
            updateTournamentCount();
            showToast('❌ Не удалось загрузить турниры', true);
        }
    }

    // Рендер UI
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
            const filtered = getFilteredTournaments();
            $count.text(`${filtered.length} ${getNoun(filtered.length, 'событие', 'события', 'событий')}`);
        }
    }

    function getNoun(number, one, two, five) {
        let n = Math.abs(number);
        n %= 100;
        if (n >= 5 && n <= 20) return five;
        n %= 10;
        if (n === 1) return one;
        if (n >= 2 && n <= 4) return two;
        return five;
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

            const bannerStyle = 'linear-gradient(125deg, #1e1b2e, #2d1b4e)';

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

    // Авторизация - используем api.get напрямую
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

    async function updateCreateTournamentButton() {
        try {
            const data = await window.api.get('/api/auth/check');
            const isAuthenticated = data && data.authenticated;
            $('#createTournamentBtn').css('display', isAuthenticated ? 'flex' : 'none');
        } catch (error) {
            $('#createTournamentBtn').hide();
        }
    }

    function initNavBar() {
        $('.nav-item').each(function() {
            const $item = $(this);
            if ($item.attr('href') && $item.attr('href') !== '#') return;
            $item.off('click').on('click', function() {
                const page = $(this).text().trim().toLowerCase();
                if (page === 'матчи') showToast('⚡ Раздел матчей пока не завершён');
                else if (page === 'рейтинг') window.location.href = '/rating';
            });
        });
    }

    // Старт - асинхронная инициализация
    (async function init() {
        await loadCategories();
        await loadTournaments();
        await updateAuthButtons();
        await updateCreateTournamentButton();
        initNavBar();
    })();

    // Очистка при выгрузке
    $(window).on('beforeunload', function() {
        if (window.NotificationsModule) {
            window.NotificationsModule.destroy();
        }
    });
});