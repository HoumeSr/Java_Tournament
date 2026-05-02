/* teams.js — список открытых + моих команд, с фильтрацией по играм */
$(function () {
    let availableGames = [];
    let currentGameFilter = 'all'; // Фильтр по игре
    let allTeams = []; // Храним все команды для фильтрации

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

    function resolveImageUrl(imageUrl) {
        if (!imageUrl) return null;
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) return imageUrl;
        return '/images/' + imageUrl;
    }

    function gameIcon(gameName) {
        return '🏆';
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
                        <img src="${escapeHtml(avatarUrl)}" class="avatar-mini" alt="avatar">
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
    
    function mergeTeams(openTeams, myTeams) {
        const map = new Map();
        (openTeams || []).forEach(function (team) { map.set(team.id, Object.assign({}, team, { listType: 'open' })); });
        (myTeams || []).forEach(function (team) { map.set(team.id, Object.assign({}, map.get(team.id) || team, team, { listType: 'my' })); });
        return Array.from(map.values());
    }

    async function loadAllGames() {
        try {
            const games = await window.api.get('/api/gametypes');
            // Добавляем фильтрацию только активных игр
            availableGames = (games || []).filter(game => game.isActive === true);
            renderGameFilters();
            
            // Также заполняем селект в модалке
            const $select = $('#modalGameType');
            $select.html('<option value="">— Выберите игру —</option>');
            availableGames.forEach(function (game) {
                $select.append(`<option value="${game.id}">${gameIcon(game.name)} ${escapeHtml(game.name)}</option>`);
            });
        } catch (error) {
            console.error('Error loading games:', error);
            const $select = $('#modalGameType');
            $select.html('<option value="">— Ошибка загрузки игр —</option>');
        }
    }

    // Рендер кнопок фильтрации по играм (показываем ВСЕ игры)
    function renderGameFilters() {
        const $container = $('#gameFiltersContainer');
        if (!$container.length) return;

        // Создаем кнопку "Все"
        const allButton = $('<button>')
            .addClass(`filter-btn ${currentGameFilter === 'all' ? 'active-filter' : ''}`)
            .html('🏆 Все')
            .data('game-id', 'all')
            .on('click', function() {
                currentGameFilter = 'all';
                renderGameFilters();
                filterAndRenderTeams();
            });

        $container.empty().append(allButton);

        // Добавляем кнопки для ВСЕХ игр (даже если нет команд)
        availableGames.forEach(game => {
            const teamsCount = allTeams.filter(team => team.gameTypeName === game.name).length;
            
            const $btn = $('<button>')
                .addClass(`filter-btn ${currentGameFilter === game.name ? 'active-filter' : ''}`)
                .html(`${gameIcon(game.name)} ${escapeHtml(game.name)}`)
                .data('game-id', game.name)
                .on('click', function() {
                    currentGameFilter = game.name;
                    renderGameFilters();
                    filterAndRenderTeams();
                });

            // Добавляем счетчик команд, если они есть
            if (teamsCount > 0) {
                $btn.append($('<span>').addClass('filter-count').text(teamsCount));
            }

            $container.append($btn);
        });
    }

    // Фильтрация команд по выбранной игре
    function getFilteredTeams() {
        if (currentGameFilter === 'all') {
            return [...allTeams];
        }
        return allTeams.filter(team => team.gameTypeName === currentGameFilter);
    }

    // Фильтрация и отображение команд
    function filterAndRenderTeams() {
        const filteredTeams = getFilteredTeams();
        renderTeams(filteredTeams);
        updateTeamsCount(filteredTeams.length);
    }

    // Обновление счетчика команд
    function updateTeamsCount(count) {
        const $count = $('#teamsCount');
        if ($count.length) {
            $count.text(`${count} ${getNoun(count, 'команда', 'команды', 'команд')}`);
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

    async function loadTeams() {
        const $container = $('#teamsContainer');
        $container.html('<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Загрузка команд...</p></div>');

        try {
            const [openTeams, myTeams] = await Promise.all([
                window.api.get('/api/teams/open'),
                window.api.get('/api/teams/my')
            ]);
            allTeams = mergeTeams(openTeams, myTeams);
            
            // Загружаем игры для фильтров
            await loadAllGames();
            
            // Отображаем команды с текущим фильтром
            filterAndRenderTeams();
        } catch (error) {
            console.error('Error loading teams:', error);
            try {
                const openTeams = await window.api.get('/api/teams/open');
                allTeams = openTeams;
                await loadAllGames();
                filterAndRenderTeams();
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                $container.html('<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Не удалось загрузить команды</p></div>');
            }
        }
    }

    function renderTeams(teams) {
        const $container = $('#teamsContainer');
        if (!teams || !teams.length) {
            $container.html('<div class="empty-state"><i class="fas fa-users"></i><p>Нет команд в этой категории</p></div>');
            return;
        }

        const cards = teams.map(function (team) {
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
            if (!availableGames.length) loadAllGames();
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
        loadAllGames();
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
        await loadTeams();
        initModal();
    })();
});