/* teams.js — список открытых + моих команд, создание без фото */
$(function () {
    let availableGames = [];

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
        if (!imageUrl || imageUrl === 'DEFAULT_USER_IMAGE.jpg') return null;
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) return imageUrl;
        return '/images/' + imageUrl;
    }

    function gameIcon(gameName) {
        const lower = String(gameName || '').toLowerCase();
        if (lower.includes('chess')) return '♟️';
        if (lower.includes('football') || lower.includes('fifa')) return '⚽';
        if (lower.includes('tennis')) return '🎾';
        if (lower.includes('dota') || lower.includes('valorant') || lower.includes('counter') || lower.includes('cs')) return '🎮';
        return '🏆';
    }

    async function updateAuthButtons() {
        const $auth = $('#authButtons');
        if (!$auth.length) return;
        
        // Используем auth.check() через api.get
        try {
            const data = await window.api.get('/api/auth/check');
            
            if (data && data.authenticated && data.user) {
                const imageUrl = resolveImageUrl(data.user.imageUrl);
                $auth.html(`
                    <div class="profile-icon" id="profileIcon">
                        <i class="fas fa-user-circle"></i>
                    </div>
                `);
                $('#profileIcon').off('click').on('click', function () { 
                    window.location.href = '/profile'; 
                });
            } else {
                $auth.html(`
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `);
                $('#registerBtn').off('click').on('click', function () { 
                    window.location.href = '/register'; 
                });
                $('#loginBtn').off('click').on('click', function () { 
                    window.location.href = '/login'; 
                });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Показываем кнопки входа в случае ошибки
            $auth.html(`
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>
            `);
            $('#registerBtn').off('click').on('click', function () { 
                window.location.href = '/register'; 
            });
            $('#loginBtn').off('click').on('click', function () { 
                window.location.href = '/login'; 
            });
        }
    }

    function mergeTeams(openTeams, myTeams) {
        const map = new Map();
        (openTeams || []).forEach(function (team) { map.set(team.id, Object.assign({}, team, { listType: 'open' })); });
        (myTeams || []).forEach(function (team) { map.set(team.id, Object.assign({}, map.get(team.id) || team, team, { listType: 'my' })); });
        return Array.from(map.values());
    }

    async function loadTeams() {
        const $container = $('#teamsContainer');
        $container.html('<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Загрузка команд...</p></div>');

        try {
            // Используем api.get для параллельных запросов
            const [openTeams, myTeams] = await Promise.all([
                window.api.get('/api/teams/open'),
                window.api.get('/api/teams/my')
            ]);
            renderTeams(mergeTeams(openTeams, myTeams));
        } catch (error) {
            console.error('Error loading teams:', error);
            // Fallback: пробуем загрузить только открытые команды
            try {
                const openTeams = await window.api.get('/api/teams/open');
                renderTeams(openTeams);
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                $container.html('<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Не удалось загрузить команды</p></div>');
            }
        }
    }

    function renderTeams(teams) {
        const $container = $('#teamsContainer');
        if (!teams || !teams.length) {
            $container.html('<div class="empty-state"><i class="fas fa-users"></i><p>Пока нет открытых команд</p></div>');
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
                            ${isMine ? '<span class="team-pill mine">Моя команда</span>' : '<span class="team-pill open">Открытая</span>'}
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

    async function loadGamesForModal() {
        const $select = $('#modalGameType');
        try {
            // Используем api.get для активных игр
            const games = await window.api.get('/api/gametypes/active');
            availableGames = games || [];
            $select.html('<option value="">— Выберите игру —</option>');
            availableGames.forEach(function (game) {
                $select.append(`<option value="${game.id}">${gameIcon(game.name)} ${escapeHtml(game.name)}</option>`);
            });
        } catch (error) {
            console.error('Error loading games:', error);
            $select.html('<option value="">— Ошибка загрузки игр —</option>');
        }
    }

    async function openCreateTeamModal() {
        try {
            // Проверяем авторизацию через api.get
            const data = await window.api.get('/api/auth/check');
            if (!data || !data.authenticated) {
                showToast('❌ Для создания команды нужно войти в аккаунт', true);
                setTimeout(function () { window.location.href = '/login'; }, 1000);
                return;
            }
            $('#modalCreateTeamForm')[0]?.reset();
            $('#createTeamModal').css('display', 'flex');
            $('body').css('overflow', 'hidden');
            if (!availableGames.length) loadGamesForModal();
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
        loadGamesForModal();
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
                // Используем api.post для создания команды
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