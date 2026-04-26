$(document).ready(function() {
    let currentCategory = 'all';
    let tournaments = [];
    let categories = [{ id: 'all', label: 'Все', icon: '🌍' }];

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

    function getStatusClass(status) {
        return ({
            REGISTRATION_OPEN: 'open',
            IN_PROGRESS: 'in-progress',
            FINISHED: 'finished',
            DRAFT: 'draft',
            CANCELLED: 'cancelled'
        })[status] || '';
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
                        <div class="profile-icon" id="profileIcon">
                            ${imageUrl ? `<img src="${imageUrl}" class="avatar-mini" alt="avatar">` : '<i class="fas fa-user-circle"></i>'}
                        </div>
                    `);
                    $('#profileIcon').on('click', () => window.location.href = '/profile');
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
                if (page === 'команды') showToast('📋 Раздел команд пока не завершён');
                else if (page === 'матчи') showToast('⚡ Раздел матчей пока не завершён');
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
