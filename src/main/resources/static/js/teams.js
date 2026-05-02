/* teams.js — список команд с пагинацией, фильтрацией и счётчиками категорий */
$(function () {
    let availableGames = [];
    let currentGameFilter = 'all';
    let teams = [];
    let categories = []; // Храним категории с количеством команд
    
    // Пагинация
    let currentPage = 0;
    let totalPages = 0;
    let totalElements = 0;
    let pageSize = 9;

    function showToast(message, isError = false) {
        const $toast = $('#demoToast');
        if (!$toast.length) return;
        $toast.text(message).css({ background: isError ? '#b91c1c' : '#1f2937', opacity: '1', visibility: 'visible' });
        setTimeout(function () { $toast.css({ opacity: '0', visibility: 'hidden' }); }, 3000);
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
        });
    }

    function gameIcon(gameName) {
        return '🏆';
    }

    // Пересчет количества команд для всех категорий с учётом фильтра по статусу
    async function reloadCategoryCounts() {
        try {
            // Загружаем количество для всех команд
            const allResponse = await window.api.get(`/api/teams/feed?page=0&size=1`);
            const allCount = allResponse.totalElements || 0;
            
            // Обновляем количество для "Все"
            const allCategory = categories.find(c => c.id === 'all');
            if (allCategory) {
                allCategory.count = allCount;
            }
            
            // Загружаем количество для каждой игры параллельно
            const gameCategories = categories.filter(cat => cat.id !== 'all' && cat.gameId);
            const promises = gameCategories.map(cat => 
                window.api.get(`/api/teams/feed?page=0&size=1&gameTypeId=${cat.gameId}`)
                    .catch(error => ({ totalElements: 0 }))
            );
            
            const results = await Promise.all(promises);
            
            // Обновляем количества для игр
            gameCategories.forEach((cat, index) => {
                cat.count = results[index].totalElements || 0;
            });
            
            // Перерисовываем категории с новыми количествами
            renderGameFilters();
            
        } catch (error) {
            console.error('Error reloading category counts:', error);
        }
    }

    async function loadAllGames() {
        try {
            const gameTypes = await window.api.get('/api/gametypes');
            const activeGames = (gameTypes || []).filter(game => game.isActive === true);
            
            // Формируем категории
            categories = [{ id: 'all', label: 'Все', icon: '🌍', count: 0, gameId: null }].concat(
                activeGames.map(game => ({
                    id: String(game.id),
                    label: game.name,
                    icon: gameIcon(game.name),
                    gameId: game.id,
                    count: 0
                }))
            );
            
            // Загружаем количества команд для каждой категории
            await reloadCategoryCounts();
            
            // Заполняем селект в модалке
            const $select = $('#modalGameType');
            $select.html('<option value="">— Выберите игру —</option>');
            activeGames.forEach(function (game) {
                $select.append(`<option value="${game.id}">${gameIcon(game.name)} ${escapeHtml(game.name)}</option>`);
            });
            
        } catch (error) {
            console.error('Error loading games:', error);
            const $select = $('#modalGameType');
            $select.html('<option value="">— Ошибка загрузки игр —</option>');
        }
    }

    // Рендер кнопок фильтрации по играм (с счётчиками)
    function renderGameFilters() {
        const $container = $('#gameFiltersContainer');
        if (!$container.length) return;

        $container.empty();
        
        categories.forEach(cat => {
            const $btn = $('<button>')
                .addClass(`filter-btn ${currentGameFilter === cat.label ? 'active-filter' : ''}`)
                .html(`${cat.icon} ${cat.label}`)
                .data('game-id', cat.label)
                .on('click', function() {
                    currentGameFilter = cat.label;
                    currentPage = 0;
                    renderGameFilters();
                    loadTeams();
                });

            // Показываем количество для всех категорий
            if (cat.count !== undefined && cat.count > 0) {
                $btn.append($('<span>').addClass('filter-count').text(cat.count));
            }
            
            $container.append($btn);
        });
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

    async function loadTeams() {
        const $container = $('#teamsContainer');
        $container.html('<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Загрузка команд...</p></div>');

        try {
            let url = `/api/teams/feed?page=${currentPage}&size=${pageSize}`;
            
            // Добавляем фильтр по игре
            if (currentGameFilter !== 'all') {
                const category = categories.find(c => c.label === currentGameFilter);
                if (category && category.gameId) {
                    url += `&gameTypeId=${category.gameId}`;
                }
            }
            
            const response = await window.api.get(url);
            
            teams = response.content || [];
            totalPages = response.totalPages || 0;
            currentPage = response.page || 0;
            totalElements = response.totalElements || 0;
            
            renderTeams(teams);
            renderPagination(response);
            
        } catch (error) {
            console.error('Error loading teams:', error);
            $container.html('<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Не удалось загрузить команды</p></div>');
            showToast('❌ Не удалось загрузить команды', true);
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

        const isFirstPage = response ? response.first : (currentPage === 0);
        pagesHtml += `
            <button class="page-btn prev-btn" ${isFirstPage ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Назад
            </button>
        `;

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

        const isLastPage = response ? response.last : (currentPage >= totalPages - 1);
        pagesHtml += `
            <button class="page-btn next-btn" ${isLastPage ? 'disabled' : ''}>
                Вперёд <i class="fas fa-chevron-right"></i>
            </button>
        `;

        $pagination.html(pagesHtml);

        $('.prev-btn').off('click').on('click', () => {
            if (!isFirstPage && currentPage > 0) {
                currentPage--;
                loadTeams();
                scrollToTop();
            }
        });

        $('.next-btn').off('click').on('click', () => {
            if (!isLastPage && currentPage < totalPages - 1) {
                currentPage++;
                loadTeams();
                scrollToTop();
            }
        });

        $('.page-btn[data-page]').off('click').on('click', function() {
            const page = parseInt($(this).data('page'));
            if (!isNaN(page) && page !== currentPage) {
                currentPage = page;
                loadTeams();
                scrollToTop();
            }
        });
    }

    function scrollToTop() {
        $('html, body').animate({ scrollTop: 0 }, 300);
    }

    function renderTeams(teamsList) {
        const $container = $('#teamsContainer');
        if (!teamsList || !teamsList.length) {
            $container.html('<div class="empty-state"><i class="fas fa-users"></i><p>Нет команд в этой категории</p></div>');
            return;
        }

        const cards = teamsList.map(function (team) {
            const isMine = team.listType === 'my';
            const count = `${team.currentMembersCount || 0} / ${team.maxMembersCount || 1}`;
            return `
                <div class="team-card" data-team-id="${team.id}">
                    <div class="team-card-avatar"><i class="fas fa-users"></i></div>
                    <div class="team-card-body">
                        <div class="team-card-top">
                            <h3>${escapeHtml(team.name)}</h3>
                            ${isMine 
                                ? '<span class="team-pill mine">Моя команда</span>' 
                                : (team.currentMembersCount >= team.maxMembersCount 
                                    ? '<span class="team-pill closed">Заполнена</span>' 
                                    : '<span class="team-pill open">Открытая</span>')
                            }
                        </div>
                        <div class="team-card-meta">
                            <span><i class="fas fa-crown"></i> ${escapeHtml(team.captainUsername || '—')}</span>
                            <span>${gameIcon(team.gameTypeName)} ${escapeHtml(team.gameTypeName || 'Без категории')}</span>
                            <span><i class="fas fa-user-friends"></i> ${count}</span>
                        </div>
                    </div>
                    <div class="team-card-arrow"><i class="fas fa-chevron-right"></i></div>
                </div>
            `;
        }).join('');

        $container.html(cards);
        $('.team-card').off('click').on('click', function () { 
            window.location.href = '/teams/' + $(this).data('team-id'); 
        });
    }

    async function updateAuthButtons() {
        const $auth = $('#authButtons');
        if (!$auth.length) return;
        
        try {
            const data = await window.api.get('/api/auth/check');
            
            if (data && data.authenticated && data.user) {
                const avatarUrl = data.user.imageUrl 
                    ? (data.user.imageUrl.startsWith('/') || data.user.imageUrl.startsWith('http') 
                        ? data.user.imageUrl 
                        : '/images/' + data.user.imageUrl)
                    : null;
                $auth.html(`
                    <div class="profile-icon" id="profileIcon">
                        <img src="${escapeHtml(avatarUrl)}" class="avatar-mini" alt="Аватар">
                    </div>
                `);
                
                $('#profileIcon').off('click').on('click', () => window.location.href = '/profile');
            } else {
                $auth.html(`
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `);
                $('#registerBtn').off('click').on('click', () => window.location.href = '/register');
                $('#loginBtn').off('click').on('click', () => window.location.href = '/login');
                
                if (window.NotificationsModule) {
                    window.NotificationsModule.destroy();
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            $auth.html(`
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>
            `);
            $('#registerBtn').off('click').on('click', () => window.location.href = '/register');
            $('#loginBtn').off('click').on('click', () => window.location.href = '/login');
        }
    }

    async function openCreateTeamModal() {
        try {
            const data = await window.api.get('/api/auth/check');
            if (!data || !data.authenticated) {
                showToast('❌ Для создания команды нужно войти в аккаунт', true);
                setTimeout(function () { window.location.href = '/login'; }, 1000);
                return;
            }
            $('#modalCreateTeamForm')[0]?.reset();
            $('#createTeamModal').css('display', 'flex');
            $('body').css('overflow', 'hidden');
        } catch (error) {
            console.error('Auth check error:', error);
            showToast('❌ Ошибка проверки авторизации', true);
        }
    }

    function closeCreateTeamModal() {
        $('#createTeamModal').hide();
        $('body').css('overflow', '');
    }

    function initModal() {
        $('#createTeamFab').off('click').on('click', openCreateTeamModal);
        $('#closeModalBtn, #cancelModalBtn, #createTeamModal .modal-overlay').off('click').on('click', closeCreateTeamModal);
        $(document).off('keydown').on('keydown', function (event) { 
            if (event.key === 'Escape') closeCreateTeamModal(); 
        });

        $('#modalCreateTeamForm').off('submit').on('submit', async function (event) {
            event.preventDefault();
            const name = $.trim($('#modalTeamName').val());
            const gameTypeId = Number($('#modalGameType').val());
            if (name.length < 3) return showToast('❌ Название команды должно быть от 3 символов', true);
            if (!gameTypeId) return showToast('❌ Выберите категорию / игру', true);

            const $button = $('.btn-submit-modal');
            $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Создание...');

            try {
                const team = await window.api.post('/api/teams', { 
                    name: name, 
                    gameTypeId: gameTypeId, 
                    imageUrl: null 
                });
                showToast('✅ Команда успешно создана');
                closeCreateTeamModal();
                setTimeout(function () { window.location.href = '/teams/' + team.id; }, 800);
            } catch (error) {
                showToast('❌ ' + (error.message || 'Не удалось создать команду'), true);
            } finally {
                $button.prop('disabled', false).html('<i class="fas fa-check"></i> Создать команду');
            }
        });
    }

    // Асинхронная инициализация
    (async function init() {
        await updateAuthButtons();
        await loadAllGames();
        await loadTeams();
        initModal();
    })();
});