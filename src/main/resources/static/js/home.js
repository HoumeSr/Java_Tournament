$(document).ready(function() {
    // ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
    let currentCategory = 'all';
    let tournaments = [];
    let categories = [];

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function showToast(message, isError = false) {
        const $toast = $('#demoToast');
        $toast.text(message);
        $toast.css({
            'background': isError ? '#b91c1c' : '#1f2937',
            'opacity': '1',
            'visibility': 'visible'
        });
        
        setTimeout(() => {
            $toast.css({
                'opacity': '0',
                'visibility': 'hidden'
            });
        }, 3000);
    }

    function getStatusText(status) {
        const statusMap = {
            'REGISTRATION_OPEN': '🔥 Регистрация открыта',
            'IN_PROGRESS': '⚡ Идёт турнир',
            'FINISHED': '🏆 Завершён',
            'DRAFT': '📝 В разработке',
            'CANCELLED': '❌ Отменён'
        };
        return statusMap[status] || status;
    }

    function getStatusClass(status) {
        const classMap = {
            'REGISTRATION_OPEN': 'open',
            'IN_PROGRESS': 'in-progress',
            'FINISHED': 'finished',
            'DRAFT': 'draft',
            'CANCELLED': 'cancelled'
        };
        return classMap[status] || '';
    }

    function getParticipantTypeIcon(type) {
        return type === 'TEAM' ? '👥 Командный' : '👤 Одиночный';
    }

    function getGameIcon(gameName) {
        const icons = {
            'chess': '♟️',
            'tennis': '🎾',
            'cs': '🎮',
            'valorant': '🎮',
            'dota': '🎮',
            'lol': '🎮',
            'football': '⚽',
            'fighting': '🥋'
        };
        
        if (!gameName) return '🏆';
        const lowerName = gameName.toLowerCase();
        for (const [key, icon] of Object.entries(icons)) {
            if (lowerName.includes(key)) return icon;
        }
        return '🏆';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    // ========== ЗАГРУЗКА КАТЕГОРИЙ ==========
    function loadCategories() {
        $.ajax({
            url: '/api/gametypes',
            method: 'GET',
            success: function(gameTypes) {
                console.log('📥 Загружены игры из GameTypes:', gameTypes);
                
                categories = [
                    { id: "all", label: "Все", icon: "🌍" },
                    ...gameTypes
                        .filter(game => game.isActive === true)
                        .map(game => ({
                            id: game.code || game.name.toLowerCase(),
                            label: game.name,
                            icon: getGameIcon(game.name),
                            gameId: game.id
                        }))
                ];
                
                renderCategories();
            },
            error: function(xhr) {
                console.error('❌ Ошибка загрузки категорий:', xhr);
                categories = [{ id: "all", label: "Все", icon: "🌍" }];
                renderCategories();
            }
        });
    }

    // ========== ЗАГРУЗКА ТУРНИРОВ ==========
    function loadTournaments() {
        $.ajax({
            url: '/api/tournaments',
            method: 'GET',
            success: function(data) {
                console.log('📥 Загружены турниры (TournamentShortDFH):', data);
                
                tournaments = data.map(tournament => ({
                    id: tournament.id,
                    title: tournament.title,
                    status: tournament.status,
                    participantType: tournament.participantType,
                    gameName: tournament.gameName,
                    organizerUsername: tournament.organizerUsername,
                    imageUrl: tournament.imageUrl,
                    categoryId: tournament.gameName
                }));
                
                const stats = {};
                tournaments.forEach(t => {
                    stats[t.gameName] = (stats[t.gameName] || 0) + 1;
                });
                console.log('📊 Турниров по играм:', stats);
                
                renderTournaments();
                updateTournamentCount();
                
                // Перерисовываем категории для обновления счётчиков
                if (categories.length > 0) {
                    renderCategories();
                }
            },
            error: function(xhr) {
                console.error('❌ Ошибка загрузки турниров:', xhr);
                showToast('❌ Не удалось загрузить турниры', true);
                tournaments = [];
                renderTournaments();
                updateTournamentCount();
            }
        });
    }

    // ========== РЕНДЕР КАТЕГОРИЙ ==========
    function renderCategories() {
        const $container = $('#categoriesContainer');
        $container.empty();
        
        categories.forEach(cat => {
            let count = 0;
            if (cat.id === 'all') {
                count = tournaments.length;
            } else {
                count = tournaments.filter(t => t.gameName === cat.label).length;
            }
            
            const $btn = $('<button>')
                .addClass(`cat-btn ${currentCategory === cat.id ? 'active-cat' : ''}`)
                .html(`${cat.icon} ${cat.label}`)
                .data('cat', cat.id);
            
            if (count > 0) {
                $btn.append($('<span>').addClass('category-count').text(count));
            }
            
            $btn.on('click', function() {
                currentCategory = cat.id;
                renderCategories();
                renderTournaments();
            });
            
            $container.append($btn);
        });
    }

    // ========== ФИЛЬТРАЦИЯ ==========
    function getFilteredTournaments() {
        if (currentCategory === 'all') {
            return [...tournaments];
        }
        
        const category = categories.find(c => c.id === currentCategory);
        if (!category) return [];
        
        return tournaments.filter(t => t.gameName === category.label);
    }

    function updateTournamentCount() {
        const filtered = getFilteredTournaments();
        $('#tournamentCount').text(`${filtered.length} событий`);
    }

    // ========== РЕНДЕР КАРТОЧЕК ==========
    function renderTournaments() {
        const filtered = getFilteredTournaments();
        const $grid = $('#tournamentsGrid');
        
        if (filtered.length === 0) {
            const categoryName = currentCategory === 'all' ? 'этой категории' : `"${currentCategory}"`;
            $grid.html(`<div class="no-results">😔 В ${categoryName} пока нет турниров. Загляни позже!</div>`);
            return;
        }
        
        $grid.empty();
        
        filtered.forEach(t => {
            const $card = $('<div>').addClass('tournament-card');
            
            $card.on('click', function(e) {
                if ($(e.target).closest('.register-badge').length || $(e.target).closest('.arrow-link').length) {
                    return;
                }
                window.location.href = `/tournaments/${t.id}`;
            });
            
            const imageUrl = t.imageUrl || '';
            const bgStyle = imageUrl 
                ? `linear-gradient(125deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('${imageUrl}')`
                : `linear-gradient(125deg, #1e1b2e, #2d1b4e)`;
            
            const $banner = $('<div>')
                .addClass('card-banner')
                .css('background', bgStyle)
                .css('backgroundSize', 'cover')
                .css('backgroundPosition', 'center 30%')
                .html(`<span class="status-badge ${getStatusClass(t.status)}">${getStatusText(t.status)}</span>`);
            
            const $content = $('<div>').addClass('card-content').html(`
                <div class="tourney-name">${escapeHtml(t.title)}</div>
                <div class="tourney-meta">
                    <span class="meta-badge">${getParticipantTypeIcon(t.participantType)}</span>
                    <span class="meta-badge">${getGameIcon(t.gameName)} ${escapeHtml(t.gameName)}</span>
                </div>
                <div class="organizer">👨‍💼 ${escapeHtml(t.organizerUsername)}</div>
            `);
            
            const $footer = $('<div>').addClass('card-footer');
            
            if (t.status === 'REGISTRATION_OPEN') {
                $footer.html(`
                    <span class="register-badge">🔥 Зарегистрироваться</span>
                    <span class="arrow-link">Подробнее →</span>
                `);
                
                $footer.find('.register-badge').on('click', function(e) {
                    e.stopPropagation();
                    registerForTournament(t.id);
                });
            } else {
                $footer.html(`<span class="arrow-link" style="justify-content: flex-end;">Подробнее →</span>`);
            }
            
            $card.append($banner, $content, $footer);
            $grid.append($card);
        });
    }

    // ========== РЕГИСТРАЦИЯ НА ТУРНИР ==========
    function registerForTournament(tournamentId) {
        $.ajax({
            url: '/api/auth/check',
            method: 'GET',
            success: function(authData) {
                if (!authData.authenticated) {
                    showToast('❌ Войдите в аккаунт для регистрации на турнир', true);
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1500);
                    return;
                }
                
                $.ajax({
                    url: `/api/tournaments/${tournamentId}/register`,
                    method: 'POST',
                    contentType: 'application/json',
                    success: function(data) {
                        if (data.success) {
                            showToast('✅ Вы успешно зарегистрированы на турнир!');
                        } else {
                            showToast('❌ ' + (data.message || 'Ошибка регистрации'), true);
                        }
                    },
                    error: function(xhr) {
                        console.error('Ошибка регистрации:', xhr);
                        showToast('❌ Ошибка соединения с сервером', true);
                    }
                });
            },
            error: function() {
                showToast('❌ Войдите в аккаунт для регистрации на турнир', true);
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
        });
    }

    // ========== АВТОРИЗАЦИЯ ==========
    function updateAuthButtons() {
        $.ajax({
            url: '/api/auth/check',
            method: 'GET',
            success: function(data) {
                if (data.authenticated) {
                    const savedAvatar = localStorage.getItem('userAvatar');
                    
                    $('#authButtons').html(`
                        <div class="profile-icon" id="profileIcon">
                            ${savedAvatar ? `<img src="${savedAvatar}" class="avatar-mini">` : '<i class="fas fa-user-circle"></i>'}
                        </div>
                    `);
                    
                    $('#profileIcon').on('click', function() {
                        window.location.href = '/profile';
                    });
                } else {
                    $('#authButtons').html(`
                        <button class="btn-outline" id="registerBtn">Регистрация</button>
                        <button class="btn-primary" id="loginBtn">Вход</button>
                    `);
                    
                    $('#registerBtn').on('click', () => window.location.href = '/register');
                    $('#loginBtn').on('click', () => window.location.href = '/login');
                }
            },
            error: function() {
                $('#authButtons').html(`
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `);
                $('#registerBtn').on('click', () => window.location.href = '/register');
                $('#loginBtn').on('click', () => window.location.href = '/login');
            }
        });
    }

    function updateCreateTournamentButton() {
        $.ajax({
            url: '/api/auth/check',
            method: 'GET',
            success: function(data) {
                $('#createTournamentBtn').css('display', data.authenticated ? 'flex' : 'none');
            },
            error: function() {
                $('#createTournamentBtn').css('display', 'none');
            }
        });
    }

    function initNavBar() {
        $('.nav-item').each(function() {
            const $item = $(this);
            const href = $item.attr('href');
            if (href && href !== '#') return;
            
            $item.on('click', function() {
                const page = $(this).text().trim().toLowerCase();
                const routes = {
                    'команды': '/teams',
                    'матчи': '/matches',
                    'рейтинг': '/rating'
                };
                
                if (routes[page]) {
                    window.location.href = routes[page];
                } else {
                    showToast('📋 Этот раздел в разработке');
                }
            });
        });
    }

    // ========== ЗАПУСК ==========
    // Сначала загружаем турниры, потом категории
    loadTournaments();
    loadCategories();
    initNavBar();
    updateAuthButtons();
    updateCreateTournamentButton();
});