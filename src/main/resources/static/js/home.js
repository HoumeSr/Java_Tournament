// home.js - адаптирован под базовый api.js с пагинацией
$(document).ready(function() {
    let currentCategory = 'all';
    let tournaments = [];
    let categories = [{ id: 'all', label: 'Все', icon: '🌍' }];
    
    // Пагинация
    let currentPage = 0;
    let totalPages = 0;
    let pageSize = 6;
    let totalElements = 0;
    let currentStatusFilter = 'all';

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
            DRAFT: '📝 Регистрация еще не открыта',
            CANCELLED: '❌ Отменён'
        })[status] || status || 'Неизвестно';
    }

    function getParticipantTypeLabel(type) {
        return type === 'TEAM' ? '👥 Командный' : '👤 Одиночный';
    }

    function getGameIcon(gameName) {
        return '🏆';
    }

    // Пересчет количества турниров для всех категорий с учётом фильтра по статусу
    async function reloadCategoryCounts() {
        try {
            // Формируем базовый URL с фильтром по статусу
            let statusParam = '';
            if (currentStatusFilter !== 'all') {
                statusParam = `&status=${currentStatusFilter}`;
            }
            
            // Собираем все запросы в массив для параллельного выполнения
            const gameCategories = categories.filter(cat => cat.id !== 'all' && cat.gameId);
            
            // Создаём массив промисов для всех запросов
            const promises = [
                // Запрос для "Все"
                window.api.get(`/api/tournaments/page?page=0&size=1${statusParam}`),
                // Запросы для каждой игры
                ...gameCategories.map(cat => 
                    window.api.get(`/api/tournaments/page?page=0&size=1&gameTypeId=${cat.gameId}${statusParam}`)
                        .catch(error => ({ totalElements: 0 })) // Обрабатываем ошибки
                )
            ];
            
            // Выполняем все запросы параллельно
            const results = await Promise.all(promises);
            
            // Обновляем количество для "Все" (первый результат)
            const allCategory = categories.find(c => c.id === 'all');
            if (allCategory) {
                allCategory.count = results[0].totalElements || 0;
            }
            
            // Обновляем количества для игр (остальные результаты)
            gameCategories.forEach((cat, index) => {
                cat.count = results[index + 1].totalElements || 0;
            });
            
            // Перерисовываем категории с новыми количествами
            renderCategories();
            
        } catch (error) {
            console.error('Error reloading category counts:', error);
        }
    }

    function renderStatusFilter() {
        const $container = $('#statusFilterContainer');
        if (!$container.length) return;
        
        $container.empty();
        
        const $btn = $('<button>')
            .addClass(`status-filter-btn ${currentStatusFilter === 'REGISTRATION_OPEN' ? 'active' : ''}`)
            .html('<i class="fas fa-fire"></i> Только открытые')
            .on('click', async function() {  // Добавили async
                if (currentStatusFilter === 'REGISTRATION_OPEN') {
                    currentStatusFilter = 'all';
                } else {
                    currentStatusFilter = 'REGISTRATION_OPEN';
                }
                currentPage = 0;
                renderStatusFilter();
                
                // Пересчитываем количество для всех категорий с новым фильтром
                await reloadCategoryCounts();
                
                await loadTournaments();
            });
        
        $container.append($btn);
    }
    // Добавьте эту функцию ПЕРЕД loadTournaments()

    async function loadCategories() {
        try {
            const gameTypes = await window.api.get('/api/gametypes');
            
            // Формируем базовые категории без количеств
            categories = [{ id: 'all', label: 'Все', icon: '🌍', count: 0, gameId: null }].concat(
                (gameTypes || [])
                    .filter(game => game.isActive === true)
                    .map(game => ({
                        id: String(game.id),
                        label: game.name,
                        icon: getGameIcon(game.name),
                        gameId: game.id,
                        count: 0
                    }))
            );
            
            // Загружаем количества с учётом текущего фильтра
            await reloadCategoryCounts();
            
            renderCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            renderCategories();
        }
    }

    async function loadTournaments() {
        try {
            // Строим URL с пагинацией
            let url = `/api/tournaments/page?page=${currentPage}&size=${pageSize}`;
            
            // Добавляем фильтр по игре, если выбран не "Все"
            if (currentCategory !== 'all') {
                const category = categories.find(c => c.id === currentCategory);
                if (category && category.gameId) {
                    url += `&gameTypeId=${category.gameId}`;
                }
            }
            
            // ✅ ДОБАВЬТЕ ЭТОТ БЛОК - фильтр по статусу
            if (currentStatusFilter !== 'all') {
                url += `&status=${currentStatusFilter}`;
            }
            
            // Используем api.get для /api/tournaments/page
            const response = await window.api.get(url);
            
            // Обновляем данные из ответа
            tournaments = (response.content || []).map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                participantType: t.participantType,
                gameName: t.gameName,
                organizerUsername: t.organizerUsername,
                imageUrl: t.imageUrl
            }));
            
            // Обновляем пагинацию
            currentPage = response.page || 0;
            totalPages = response.totalPages || 0;
            totalElements = response.totalElements || 0;
            
            renderTournaments();
            updateTournamentCount();
            renderPagination(response);
            renderCategories();
        } catch (error) {
            console.error('Error loading tournaments:', error);
            tournaments = [];
            renderTournaments();
            updateTournamentCount();
            showToast('❌ Не удалось загрузить турниры', true);
        }
    }

    // Рендер пагинации
    function renderPagination(response) {
        const $pagination = $('#pagination');
        if (!$pagination.length) return;

        if (totalPages <= 1) {
            $pagination.empty();
            return;
        }

        let pagesHtml = '';

        // Кнопка "Назад"
        const isFirstPage = response ? response.first : (currentPage === 0);
        pagesHtml += `
            <button class="page-btn prev-btn" ${isFirstPage ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Назад
            </button>
        `;

        // Номера страниц
        const startPage = Math.max(0, currentPage - 2);
        const endPage = Math.min(totalPages - 1, currentPage + 2);

        if (startPage > 0) {
            pagesHtml += `<button class="page-btn" data-page="0">1</button>`;
            if (startPage > 1) pagesHtml += `<span class="page-dots">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            pagesHtml += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i + 1}
                </button>
            `;
        }

        if (endPage < totalPages - 1) {
            if (endPage < totalPages - 2) pagesHtml += `<span class="page-dots">...</span>`;
            pagesHtml += `<button class="page-btn" data-page="${totalPages - 1}">${totalPages}</button>`;
        }

        // Кнопка "Вперёд"
        const isLastPage = response ? response.last : (currentPage >= totalPages - 1);
        pagesHtml += `
            <button class="page-btn next-btn" ${isLastPage ? 'disabled' : ''}>
                Вперёд <i class="fas fa-chevron-right"></i>
            </button>
        `;

        $pagination.html(pagesHtml);

        // Обработчики
        $('.prev-btn').off('click').on('click', () => {
            if (!isFirstPage && currentPage > 0) {
                currentPage--;
                loadTournaments();
                scrollToTop();
            }
        });

        $('.next-btn').off('click').on('click', () => {
            if (!isLastPage && currentPage < totalPages - 1) {
                currentPage++;
                loadTournaments();
                scrollToTop();
            }
        });

        $('.page-btn[data-page]').off('click').on('click', function() {
            const page = parseInt($(this).data('page'));
            if (!isNaN(page) && page !== currentPage) {
                currentPage = page;
                loadTournaments();
                scrollToTop();
            }
        });
    }

    function scrollToTop() {
        $('html, body').animate({ scrollTop: 0 }, 300);
    }

    function renderCategories() {
        const $container = $('#categoriesContainer');
        if (!$container.length) return;
        $container.empty();
        
        categories.forEach(cat => {
            const $btn = $('<button>')
                .addClass(`cat-btn ${currentCategory === cat.id ? 'active-cat' : ''}`)
                .html(`${cat.icon} ${cat.label}`)
                .data('cat', cat.id)
                .on('click', function() {
                    currentCategory = cat.id;
                    currentPage = 0;
                    renderCategories();
                    loadTournaments();
                });

            // Показываем количество для всех категорий
            if (cat.count !== undefined && cat.count > 0) {
                $btn.append($('<span>').addClass('category-count').text(cat.count));
            }
            $container.append($btn);
        });
    }

    function getFilteredTournaments() {
        // Больше не нужно фильтровать на клиенте, так как фильтрация на бэке
        return [...tournaments];
    }

    function updateTournamentCount() {
        const $count = $('#tournamentCount');
        if ($count.length) {
            $count.text(`${totalElements} ${getNoun(totalElements, 'событие', 'события', 'событий')}`);
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
        
        if (filtered.length === 0) {
            $grid.html('<div class="no-results">😔 В этой категории пока нет турниров. Загляни позже!</div>');
            return;
        }
        
        $grid.empty();
        filtered.forEach(t => {
            const $card = $('<div>').addClass('tournament-card').on('click', function() {
                window.location.href = `/tournaments/${t.id}`;
            });

            const imageUrl = t.imageUrl;
            const gameIcon = getGameIcon(t.gameName);
            const statusClass = getStatusClass(t.status);
            const statusText = getStatusText(t.status);
            
            let $banner;
            
            // Если есть картинка - используем её
            if (imageUrl && imageUrl !== 'null') {
                $banner = $('<div>').addClass('card-banner').css({
                    'background-image': `url("${escapeHtml(imageUrl)}")`,
                    'background-size': 'contain',
                    'background-position': 'center'
                });
                $banner.html(`
                    <div class="banner-overlay"></div>
                    <div class="game-icon-banner">${gameIcon}</div>
                    <span class="status-badge-banner ${statusClass}">${statusText}</span>
                `);
            } else {
                // Если картинки нет - используем градиент
                const gradients = [
                    'linear-gradient(135deg, #1e1b2e 0%, #2d1b4e 100%)',
                    'linear-gradient(135deg, #1a1a2e 0%, #1b2d45 100%)',
                    'linear-gradient(135deg, #1e1b2e 0%, #2d1b2e 100%)',
                    'linear-gradient(135deg, #16213e 0%, #1e3a5f 100%)'
                ];
                const gradient = gradients[t.id % gradients.length];
                $banner = $('<div>').addClass('card-banner').css('background', gradient);
                $banner.html(`
                    <div class="game-icon-banner">${gameIcon}</div>
                    <span class="status-badge-banner ${statusClass}">${statusText}</span>
                `);
            }

            const $content = $('<div>').addClass('card-content').html(`
                <div class="tourney-name">${escapeHtml(t.title)}</div>
                <div class="tourney-meta">
                    <span class="meta-badge"><i class="fas fa-users"></i> ${getParticipantTypeLabel(t.participantType)}</span>
                    <span class="meta-badge"><i class="fas fa-gamepad"></i> ${escapeHtml(t.gameName || '—')}</span>
                </div>
                <div class="organizer">
                    <i class="fas fa-user-circle"></i> ${escapeHtml(t.organizerUsername || '—')}
                </div>
            `);

            const footerHtml = t.status === 'REGISTRATION_OPEN'
                ? `<span class="register-badge">✍️ Регистрация открыта</span><span class="arrow-link">Подробнее →</span>`
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

    // Добавьте эту функцию, если её нет
    function getStatusClass(status) {
        switch(status) {
            case 'REGISTRATION_OPEN': return 'open';
            case 'IN_PROGRESS': return 'in-progress';
            case 'FINISHED': return 'finished';
            case 'DRAFT': return 'draft';
            case 'CANCELLED': return 'cancelled';
            default: return '';
        }
    }
    
    // Авторизация - используем api.get
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
                        <img src="${escapeHtml(avatarUrl)}" class="avatar-mini" alt="avatar">
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
        renderStatusFilter();
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