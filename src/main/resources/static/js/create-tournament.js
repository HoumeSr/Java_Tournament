$(function () {
    const POWERS_OF_TWO = [2, 4, 8, 16, 32, 64, 128, 256];
    let gameTypes = [];

    function showToast(message, isError = false) {
        const $toast = $('#demoToast');
        if (!$toast.length) return;
        $toast.text(message).css({
            background: isError ? '#b91c1c' : '#1f2937',
            opacity: '1',
            visibility: 'visible'
        });
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
                } else {
                    $auth.html(`
                        <button class="btn-outline" id="registerBtn">Регистрация</button>
                        <button class="btn-primary" id="loginBtn">Вход</button>
                    `);
                    $('#registerBtn').on('click', function () { window.location.href = '/register'; });
                    $('#loginBtn').on('click', function () { window.location.href = '/login'; });
                }
            });
    }

    function loadGameTypes() {
        const $select = $('#category');
        if (!$select.length) return;
        $.ajax({ url: '/api/gametypes/active', method: 'GET', dataType: 'json' })
            .done(function (data) {
                gameTypes = data || [];
                $select.html('<option value="">— Выберите игру —</option>');
                gameTypes.forEach(function (game) {
                    $select.append(`<option value="${game.id}">${escapeHtml(game.name)}</option>`);
                });
            })
            .fail(function () {
                $select.html('<option value="">— Ошибка загрузки игр —</option>');
                showToast('❌ Не удалось загрузить категории', true);
            });
    }

    function normalizePower(value) {
        const numericValue = Number(value);
        if (POWERS_OF_TWO.includes(numericValue)) return numericValue;
        return POWERS_OF_TWO.reduce(function (closest, current) {
            return Math.abs(current - numericValue) < Math.abs(closest - numericValue) ? current : closest;
        }, 16);
    }

    function setMaxPlayers(value) {
        $('#maxPlayers').val(normalizePower(value));
    }

    function initMaxPlayersControl() {
        const $input = $('#maxPlayers');
        if (!$input.length) return;
        $input.attr({ min: 2, max: 256, step: 2, inputmode: 'numeric' });
        setMaxPlayers($input.val() || 16);

        $('.number-up').on('click', function () {
            const current = normalizePower($input.val());
            const index = POWERS_OF_TWO.indexOf(current);
            setMaxPlayers(POWERS_OF_TWO[Math.min(index + 1, POWERS_OF_TWO.length - 1)]);
        });
        $('.number-down').on('click', function () {
            const current = normalizePower($input.val());
            const index = POWERS_OF_TWO.indexOf(current);
            setMaxPlayers(POWERS_OF_TWO[Math.max(index - 1, 0)]);
        });
        $input.on('input change blur', function () { setMaxPlayers(this.value); });
        $input.on('keydown', function (event) {
            if (event.key === 'ArrowUp') { event.preventDefault(); $('.number-up').trigger('click'); }
            if (event.key === 'ArrowDown') { event.preventDefault(); $('.number-down').trigger('click'); }
        });
    }

    function initPrizeToggle() {
        $('#hasPrize').on('change', function () { $('#prizeFields').toggle(this.checked); });
    }

    function initFormSubmit() {
        $('#createTournamentForm').on('submit', function (event) {
            event.preventDefault();

            const title = $.trim($('#tournamentName').val());
            const gameTypeId = Number($('#category').val());
            const maxParticipants = normalizePower($('#maxPlayers').val());
            const minParticipants = Math.min(2, maxParticipants);

            if (!title) return showToast('❌ Введите название турнира', true);
            if (!gameTypeId) return showToast('❌ Выберите категорию', true);

            const dto = {
                title: title,
                description: $.trim($('#description').val()) || 'Описание пока не добавлено',
                participantType: $('#participantType').val() || 'SOLO',
                access: $('#access').val() || 'OPEN',
                gameTypeId: gameTypeId,
                status: 'DRAFT',
                startDate: new Date().toISOString().slice(0, 19),
                registrationDeadline: null,
                maxParticipants: maxParticipants,
                minParticipants: minParticipants,
                imageUrl: null
            };

            const $submit = $('.btn-submit');
            $submit.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Создание...');

            $.ajax({
                url: '/api/tournaments',
                method: 'POST',
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify(dto)
            }).done(function (result) {
                showToast('✅ Турнир успешно создан');
                const tournamentId = result.tournament?.id;
                setTimeout(function () { window.location.href = tournamentId ? `/tournaments/${tournamentId}` : '/'; }, 1000);
            }).fail(function (xhr) {
                showToast('❌ ' + (xhr.responseJSON?.message || 'Не удалось создать турнир'), true);
            }).always(function () {
                $submit.prop('disabled', false).html('<i class="fas fa-check"></i> Создать турнир');
            });
        });
    }

    function initCancel() {
        $('#cancelBtn').on('click', function () {
            if (confirm('Все введённые данные будут потеряны. Продолжить?')) window.location.href = '/';
        });
    }

    function initNavBar() {
        $('.nav-item').each(function () {
            const href = $(this).attr('href');
            if (href && href !== '#') return;
            $(this).on('click', function () { showToast('📋 Этот раздел пока в разработке'); });
        });
    }

    updateAuthButtons();
    loadGameTypes();
    initMaxPlayersControl();
    initPrizeToggle();
    initFormSubmit();
    initCancel();
    initNavBar();
});
