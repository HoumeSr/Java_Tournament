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

    function updateAuthButtons() {
        $.ajax({ url: '/api/auth/check', method: 'GET', dataType: 'json' })
            .done(function (data) {
                const $auth = $('#authButtons');
                if (!$auth.length) return;
                if (data.authenticated && data.user) {
                    const imageUrl = resolveImageUrl(data.user.imageUrl);
                    $auth.html(`
                        <div class="profile-icon" id="profileIcon">
                            ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" class="avatar-mini" alt="avatar">` : '<i class="fas fa-user-circle"></i>'}
                        </div>
                    `);
                    $('#profileIcon').on('click', function () { window.location.href = '/profile'; });
                    $('#createTeamFab').show();
                } else {
                    $auth.html(`
                        <button class="btn-outline" id="registerBtn">Регистрация</button>
                        <button class="btn-primary" id="loginBtn">Вход</button>
                    `);
                    $('#registerBtn').on('click', function () { window.location.href = '/register'; });
                    $('#loginBtn').on('click', function () { window.location.href = '/login'; });
                    $('#createTeamFab').show();
                }
            });
    }

    function mergeTeams(openTeams, myTeams) {
        const map = new Map();
        (openTeams || []).forEach(function (team) { map.set(team.id, Object.assign({}, team, { listType: 'open' })); });
        (myTeams || []).forEach(function (team) { map.set(team.id, Object.assign({}, map.get(team.id) || team, team, { listType: 'my' })); });
        return Array.from(map.values());
    }

    function loadTeams() {
        const $container = $('#teamsContainer');
        $container.html('<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Загрузка команд...</p></div>');

        $.when(
            $.ajax({ url: '/api/teams/open', method: 'GET', dataType: 'json' }),
            $.ajax({ url: '/api/teams/my', method: 'GET', dataType: 'json' })
        ).done(function (openResponse, myResponse) {
            renderTeams(mergeTeams(openResponse[0], myResponse[0]));
        }).fail(function () {
            $.ajax({ url: '/api/teams/open', method: 'GET', dataType: 'json' })
                .done(renderTeams)
                .fail(function () {
                    $container.html('<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Не удалось загрузить команды</p></div>');
                });
        });
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
        $('.team-card').on('click', function () { window.location.href = '/teams/' + $(this).data('team-id'); });
    }

    function loadGamesForModal() {
        const $select = $('#modalGameType');
        $.ajax({ url: '/api/gametypes/active', method: 'GET', dataType: 'json' })
            .done(function (games) {
                availableGames = games || [];
                $select.html('<option value="">— Выберите игру —</option>');
                availableGames.forEach(function (game) {
                    $select.append(`<option value="${game.id}">${gameIcon(game.name)} ${escapeHtml(game.name)}</option>`);
                });
            })
            .fail(function () { $select.html('<option value="">— Ошибка загрузки игр —</option>'); });
    }

    function openCreateTeamModal() {
        $.ajax({ url: '/api/auth/check', method: 'GET', dataType: 'json' }).done(function (data) {
            if (!data.authenticated) {
                showToast('❌ Для создания команды нужно войти в аккаунт', true);
                setTimeout(function () { window.location.href = '/login'; }, 1000);
                return;
            }
            $('#modalCreateTeamForm')[0]?.reset();
            $('#createTeamModal').css('display', 'flex');
            $('body').css('overflow', 'hidden');
            if (!availableGames.length) loadGamesForModal();
        });
    }

    function closeCreateTeamModal() {
        $('#createTeamModal').hide();
        $('body').css('overflow', '');
    }

    function initModal() {
        loadGamesForModal();
        $('#createTeamFab').on('click', openCreateTeamModal);
        $('#closeModalBtn, #cancelModalBtn, #createTeamModal .modal-overlay').on('click', closeCreateTeamModal);
        $(document).on('keydown', function (event) { if (event.key === 'Escape') closeCreateTeamModal(); });

        $('#modalCreateTeamForm').on('submit', function (event) {
            event.preventDefault();
            const name = $.trim($('#modalTeamName').val());
            const gameTypeId = Number($('#modalGameType').val());
            if (name.length < 3) return showToast('❌ Название команды должно быть от 3 символов', true);
            if (!gameTypeId) return showToast('❌ Выберите категорию / игру', true);

            const $button = $('.btn-submit-modal');
            $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Создание...');

            $.ajax({
                url: '/api/teams',
                method: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ name: name, gameTypeId: gameTypeId, imageUrl: null })
            }).done(function (team) {
                showToast('✅ Команда успешно создана');
                closeCreateTeamModal();
                setTimeout(function () { window.location.href = '/teams/' + team.id; }, 800);
            }).fail(function (xhr) {
                showToast('❌ ' + (xhr.responseJSON?.message || 'Не удалось создать команду'), true);
            }).always(function () {
                $button.prop('disabled', false).html('<i class="fas fa-check"></i> Создать команду');
            });
        });
    }

    updateAuthButtons();
    loadTeams();
    initModal();
});
