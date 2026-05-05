/* rating.js — страница рейтинга игроков */
$(function () {
    let currentGameId = 1; 
    let gamesList = [];
    let ratingData = [];

    function getGameIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('game');
    }

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
        return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[m]);
    }

    function getGameIcon(gameName) {
        return '🏆';
    }

    function getWinRateClass(winRate) {
        if (winRate >= 70) return 'winrate-high';
        if (winRate >= 40) return 'winrate-medium';
        return 'winrate-low';
    }

    function getCountryFlag(country) {
        const flags = {
            'Россия': '🇷🇺',
        };
        return flags[country] || '🌍';
    }

    function resolveImageUrl(imageUrl) {
        if (!imageUrl || imageUrl === 'DEFAULT_USER_IMAGE.jpg') return null;
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/') || imageUrl.startsWith('data:')) return imageUrl;
        return '/images/' + imageUrl;
    }

    
    async function loadGames() {
        try {
            const games = await window.api.get('/api/gametypes');
            gamesList = (games || []).filter(game => game.isActive === true);
            renderGameFilters();
            
            
            await loadRating();
        } catch (error) {
            console.error('Error loading games:', error);
            showToast('❌ Не удалось загрузить список игр', true);
        }
    }

    
    function renderGameFilters() {
        const $container = $('#gamesFilterContainer');
        if (!$container.length) return;

        $container.empty();

        gamesList.forEach(game => {
            const $btn = $('<button>')
                .addClass(`filter-btn ${currentGameId === game.id ? 'active-filter' : ''}`)
                .html(`${getGameIcon(game.name)} ${escapeHtml(game.name)}`)
                .on('click', async function() {
                    currentGameId = game.id;
                    renderGameFilters();
                    await loadRating();
                });

            $container.append($btn);
        });
    }

    
    async function loadRating() {
        if (!currentGameId) return;

        const $container = $('#ratingContainer');
        $container.html('<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Загрузка рейтинга...</p></div>');

        try {
            const response = await window.api.get(`/api/rating/game/${currentGameId}`);
            
            if (response && response.success && response.rating) {
                ratingData = response.rating;
                
                const top10Players = ratingData.slice(0, 10);
                renderRating(top10Players);
            } else {
                $container.html('<div class="empty-state"><i class="fas fa-chart-line"></i><p>Нет данных для отображения</p></div>');
            }
        } catch (error) {
            console.error('Error loading rating:', error);
            $container.html('<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Не удалось загрузить рейтинг</p></div>');
            showToast('❌ Не удалось загрузить рейтинг', true);
        }
    }

    
    function renderRating(players) {
        const $container = $('#ratingContainer');
        
        if (!players || players.length === 0) {
            $container.html('<div class="empty-state"><i class="fas fa-chart-line"></i><p>В этой категории пока нет рейтинга</p></div>');
            return;
        }

        
        players.sort((a, b) => a.rank - b.rank);

        const $table = $('<table>').addClass('rating-table');
        
        
        const $thead = $('<thead>').html(`
            <tr>
                <th>#</th>
                <th>Игрок</th>
                <th>Статистика</th>
                <th>Win Rate</th>
            </tr>
        `);
        $table.append($thead);

        
        const $tbody = $('<tbody>');
        
        players.forEach(player => {
            const avatarUrl = resolveImageUrl(player.imageUrl);
            const rankClass = player.rank === 1 ? 'rank-1' : (player.rank === 2 ? 'rank-2' : (player.rank === 3 ? 'rank-3' : ''));
            const winRateClass = getWinRateClass(player.winRate);
            const countryFlag = getCountryFlag(player.country);
            
            const $row = $('<tr>')
                .addClass('rating-row')
                .data('user-id', player.userId)
                .on('click', function() {
                    window.location.href = `/profile/${player.userId}`;
                });

            $row.html(`
                <td class="rank-cell" data-label="#">
                    <span class="${rankClass}">${player.rank}</span>
                </td>
                <td data-label="Игрок">
                    <div class="player-cell">
                        ${avatarUrl 
                            ? `<img src="${escapeHtml(avatarUrl)}" class="player-avatar" alt="Аватар" onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'player-avatar-placeholder\\'><i class=\\'fas fa-user\\'></i></div>';">`
                            : `<div class="player-avatar-placeholder"><i class="fas fa-user"></i></div>`
                        }
                        <div class="player-info">
                            <div class="player-username">${escapeHtml(player.username)}</div>
                            <div class="player-country">
                                <span>${countryFlag}</span>
                                <span>${escapeHtml(player.country || 'Не указана')}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td data-label="Статистика">
                    <div class="stats-cell">
                        <div class="stat-item">
                            <span class="stat-label">Матчи</span>
                            <span class="stat-value">${player.totalMatches || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Победы</span>
                            <span class="stat-value">${player.totalWins || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Поражения</span>
                            <span class="stat-value">${(player.totalMatches || 0) - (player.totalWins || 0)}</span>
                        </div>
                    </div>
                </td>
                <td data-label="Win Rate">
                    <div class="winrate-cell">
                        <span class="winrate-badge ${winRateClass}">
                            ${player.winRate || 0}%
                        </span>
                    </div>
                </td>
            `);
            
            $tbody.append($row);
        });
        
        $table.append($tbody);
        $container.empty().append($table);
        
        
        if (players.length === 10 && ratingData.length > 10) {
            const $info = $('<div>').addClass('rating-info').html(`
                <i class="fas fa-info-circle"></i> Показаны топ-10 игроков из ${ratingData.length}
            `);
            $container.append($info);
        }
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
                        ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" class="avatar-mini" alt="Аватар">` : '<i class="fas fa-user-circle"></i>'}
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
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    
    (async function init() {
        await updateAuthButtons();
        await loadGames();

        const gameIdFromUrl = getGameIdFromUrl();
        if (gameIdFromUrl) {
            currentGameId = parseInt(gameIdFromUrl);
            renderGameFilters();
            await loadRating();
        }
    })();
});