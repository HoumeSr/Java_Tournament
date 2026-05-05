$(function () {
    let currentProfile = null;
    let currentAuthUser = null;

    function showToast(message, isError = false) {
        let $toast = $('#demoToast');
        if (!$toast.length) {
            $toast = $('<div id="demoToast" class="demo-toast"></div>').appendTo('body');
        }
        $toast.text(message).css({
            background: isError ? '#b91c1c' : '#1f2937',
            opacity: '1',
            visibility: 'visible'
        });
        setTimeout(function () {
            $toast.css({ opacity: '0', visibility: 'hidden' });
        }, 3000);
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
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

    function getAvatarUrlWithCacheBust(imageUrl) {
        if (!imageUrl || imageUrl === 'null') return null;

        let baseUrl;
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/')) {
            baseUrl = imageUrl;
        } else {
            baseUrl = '/images/' + imageUrl;
        }

        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}_t=${Date.now()}`;
    }

    function resolveImageUrl(imageUrl) {
        if (!imageUrl || imageUrl === 'null') return null;
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/')) return imageUrl;
        return '/images/' + imageUrl;
    }

    function getProfileIdFromUrlOrServer() {
        if (window.profileUserIdFromServer) return Number(window.profileUserIdFromServer);
        const match = window.location.pathname.match(/^\/profile\/(\d+)/);
        return match ? Number(match[1]) : null;
    }

    async function updateHeaderAuth() {
        const $auth = $('#authButtons');
        if (!$auth.length) return;

        try {
            const data = await window.api.get('/api/auth/check');
            
            if (data.authenticated && data.user) {
                currentAuthUser = data.user;
                const avatarUrl = resolveImageUrl(data.user.imageUrl);
                $auth.html(`
                    <div class="profile-icon" id="profileIcon" title="Мой профиль">
                        <img src="${escapeHtml(avatarUrl)}" class="avatar-mini" alt="avatar">
                    </div>
                `);
                $('#profileIcon').off('click').on('click', function () { window.location.href = '/profile'; });
            } else {
                currentAuthUser = null;
                $auth.html(`
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `);
                $('#registerBtn').off('click').on('click', function () { window.location.href = '/register'; });
                $('#loginBtn').off('click').on('click', function () { window.location.href = '/login'; });
            }
        } catch (error) {
            console.error('Auth check error:', error);
            $auth.html(`
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>
            `);
            $('#registerBtn').off('click').on('click', function () { window.location.href = '/register'; });
            $('#loginBtn').off('click').on('click', function () { window.location.href = '/login'; });
        }
    }

    async function getTargetProfileId() {
        const publicId = getProfileIdFromUrlOrServer();
        if (publicId) return publicId;

        try {
            const data = await window.api.get('/api/auth/check');
            if (data.authenticated && data.user && data.user.id) {
                currentAuthUser = data.user;
                return data.user.id;
            }
            throw new Error('Необходимо авторизоваться');
        } catch (error) {
            throw new Error('Необходимо авторизоваться');
        }
    }

    function setAvatar(imageUrl) {
        const $avatar = $('#avatarPreview');
        if (!$avatar.length) return;

        if (!imageUrl || imageUrl === 'null') {
            $avatar.html('<i class="fas fa-user-circle"></i>');
            return;
        }

        const avatarUrl = getAvatarUrlWithCacheBust(imageUrl);

        const img = new Image();
        const $avatarContainer = $avatar;

        img.onload = function () {
            $avatarContainer.html(`<img src="${escapeHtml(avatarUrl)}" alt="Аватар" class="avatar-image">`);
        };

        img.onerror = function () {
            const fallbackUrl = resolveImageUrl(imageUrl);
            if (fallbackUrl) {
                $avatarContainer.html(`<img src="${escapeHtml(fallbackUrl)}" alt="Аватар">`);
            } else {
                $avatarContainer.html('<i class="fas fa-user-circle"></i>');
            }
        };

        img.src = avatarUrl;
    }

    // Рендер карусели рейтинга внутри статистики
    function renderRatingCarousel(ratingData) {
        const $wrapper = $('#ratingCarouselWrapper');
        const $track = $('#ratingCarouselTrack');
        
        // ПРОВЕРКА НА ПУСТОЙ СПИСОК
        if (!ratingData || ratingData.length === 0) {
            $wrapper.show();
            $track.html(`
                <div class="rating-empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>Нет статистики по играм</p>
                    <span>Участвуйте в турнирах, чтобы появился рейтинг</span>
                </div>
            `);
            return;
        }
        
        $wrapper.show();
        $('#ratingTotalGames').text(`${ratingData.length} ${getNoun(ratingData.length, 'игра', 'игры', 'игр')}`);
        
        $track.empty();
        
        ratingData.forEach((game, index) => {
            const winRateClass = getWinRateClassForRating(game.winRate);
            const gameIcon = getGameIconForRating(game.gameTypeName);
            const losses = (game.totalMatches || 0) - (game.totalWins || 0);
            
            const $card = $(`
                <div class="rating-card-mini" data-game-id="${game.gameTypeId}" data-game-name="${escapeHtml(game.gameTypeName)}" data-index="${index}">
                    <div class="rating-card-mini-game">
                        <i class="${gameIcon}"></i>
                        <span>${escapeHtml(game.gameTypeName)}</span>
                    </div>
                    <div class="rating-card-mini-stats">
                        <div class="rating-stat-mini">
                            <span class="rating-stat-mini-label"><i class="fas fa-trophy"></i> Матчи</span>
                            <span class="rating-stat-mini-value">${game.totalMatches || 0}</span>
                        </div>
                        <div class="rating-stat-mini">
                            <span class="rating-stat-mini-label"><i class="fas fa-check-circle"></i> Победы</span>
                            <span class="rating-stat-mini-value">${game.totalWins || 0}</span>
                        </div>
                        <div class="rating-stat-mini">
                            <span class="rating-stat-mini-label"><i class="fas fa-times-circle"></i> Поражения</span>
                            <span class="rating-stat-mini-value">${losses}</span>
                        </div>
                    </div>
                    <div class="rating-card-bottom">
                        <div class="rating-winrate-mini">
                            <span class="rating-winrate-mini-value ${winRateClass}">
                                ${game.winRate || 0}% побед
                            </span>
                        </div>
                        <div class="carousel-nav-buttons">
                            <button class="carousel-btn-mini prev-card" ${index === 0 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button class="carousel-btn-mini next-card" ${index === ratingData.length - 1 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `);
            
            // Обработчик клика по карточке
            $card.on('click', function(e) {
                if (!$(e.target).closest('.carousel-btn-mini').length) {
                    const gameId = $(this).data('game-id');
                    // Переход на страницу рейтинга с параметром game
                    window.location.href = `/rating?game=${gameId}`;
                }
            });

            $track.append($card);
        });
        
        initCarouselScroll();
    }

    function initCarouselScroll() {
        const $track = $('#ratingCarouselTrack');
        
        // Обработчики для кнопок внутри каждой карточки
        $('.carousel-btn-mini.prev-card').off('click').on('click', function(e) {
            e.stopPropagation();
            const $card = $(this).closest('.rating-card-mini');
            const currentIndex = $card.data('index');
            if (currentIndex > 0) {
                scrollToCard(currentIndex - 1);
            }
        });
        
        $('.carousel-btn-mini.next-card').off('click').on('click', function(e) {
            e.stopPropagation();
            const $card = $(this).closest('.rating-card-mini');
            const currentIndex = $card.data('index');
            const totalCards = $('.rating-card-mini').length;
            if (currentIndex < totalCards - 1) {
                scrollToCard(currentIndex + 1);
            }
        });
        
        function scrollToCard(index) {
            const $cards = $('.rating-card-mini');
            const $targetCard = $cards.eq(index);
            const cardWidth = $targetCard.outerWidth();
            const scrollLeft = index * (cardWidth + 16); // 16 - gap
            
            $track.animate({
                scrollLeft: scrollLeft
            }, 300, function() {
                // Обновляем data-index у всех карточек
                $cards.each(function(i) {
                    $(this).attr('data-index', i);
                });
                
                // Обновляем состояние кнопок
                $cards.each(function(i) {
                    const $card = $(this);
                    const total = $cards.length;
                    $card.find('.prev-card').prop('disabled', i === 0);
                    $card.find('.next-card').prop('disabled', i === total - 1);
                });
            });
        }
    }

    function getWinRateClassForRating(winRate) {
        if (winRate >= 70) return 'winrate-high';
        if (winRate >= 40) return 'winrate-medium';
        return 'winrate-low';
    }

    function getGameIconForRating(gameName) {
        return 'fas fa-gamepad';
    }

    function updateCountryDisplay(country) {
        const $countryFlag = $('#countryFlag');
        const $countryText = $('#countryText');
        
        $countryText.text(country);
        
        if (country === 'Россия') {
            $countryFlag.text('🇷🇺').show();
        } else if (country === 'Другое') {
            $countryFlag.text('🌍').show();
        } else {
            $countryFlag.hide();
        }
    }

    function initCountryEdit() {
        const isOwner = Boolean(currentProfile?.owner);

        const currentCountry = $('#countryText').text().trim();
        updateCountryDisplay(currentCountry);

        if (isOwner) {
            $('#editCountryBtn').show();
        } else {
            $('#editCountryBtn').hide();
            return;
        }

        $('#editCountryBtn').off('click').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!currentProfile || !currentProfile.owner) {
                showToast('❌ Нет прав для редактирования', true);
                $('#editCountryBtn').hide();
                return;
            }

            const currentCountry = $('#countryText').text().trim();

            $('#displayCountry').hide();
            $('#countryEditRow').show();

            $('.country-option').removeClass('selected');

            if (currentCountry === 'Россия') {
                $('.country-option[data-country="Россия"]').addClass('selected');
            } else if (currentCountry === 'Другое') {
                $('.country-option[data-country="Другое"]').addClass('selected');
            }
        });

        $('.country-option').off('click').on('click', function () {
            $('.country-option').removeClass('selected');
            $(this).addClass('selected');
        });

        $('#saveCountryBtn').off('click').on('click', async function () {
            if (!currentProfile || !currentProfile.owner) {
                showToast('❌ Нет прав для изменения страны', true);
                $('#editCountryBtn').hide();
                $('#countryEditRow').hide();
                $('#displayCountry').show();
                return;
            }
            
            const selectedCountry = $('.country-option.selected').data('country');

            if (!selectedCountry) {
                showToast('❌ Выберите страну', true);
                return;
            }

            try {
                await window.api.put('/api/users/update', { country: selectedCountry });
                updateCountryDisplay(selectedCountry);
                $('#displayCountry').show();
                $('#countryEditRow').hide();

                if (currentProfile) {
                    currentProfile.country = selectedCountry;
                }

                showToast('✅ Страна обновлена');
            } catch (error) {
                showToast('❌ ' + (error.message || 'Не удалось обновить страну'), true);
            }
        });

        $('#cancelCountryBtn').off('click').on('click', function () {
            $('#displayCountry').show();
            $('#countryEditRow').hide();
            $('.country-option').removeClass('selected');
        });
    }

    function renderStats(games) {
        const safeGames = Array.isArray(games) ? games : [];
        const totalMatches = safeGames.reduce((sum, game) => sum + Number(game.matchCount || game.totalMatches || 0), 0);
        const totalWins = safeGames.reduce((sum, game) => sum + Number(game.winCount || game.totalWins || 0), 0);
        const winPercent = totalMatches > 0 ? Math.round(totalWins * 100 / totalMatches) : 0;

        $('#tournamentsCount').text(totalMatches);
        $('#winsCount').text(totalWins);
        $('#rating').text(winPercent + '%');

        const $gamesCard = $('#gamesCard');
        const $gamesList = $('#gamesList');
        if (!safeGames.length) {
            $gamesCard.hide();
            return;
        }

        $gamesList.empty();
        safeGames.forEach(function (game) {
            const matches = Number(game.matchCount || game.totalMatches || 0);
            const wins = Number(game.winCount || game.totalWins || 0);
            const percent = Number(game.winPercent || game.winRate || 0);
            $gamesList.append(`
                <div class="game-item">
                    <span class="game-name">${escapeHtml(game.gameName)}</span>
                    <div class="game-stats">
                        <span class="match-count">${matches} матчей</span>
                        <span class="win-percent">${wins} побед / ${percent}%</span>
                    </div>
                </div>
            `);
        });
        $gamesCard.show();
    }

    function renderProfile(userDTO) {
        currentProfile = userDTO;
        const isOwner = Boolean(userDTO.owner);
        const createdAt = userDTO.createdAt ? new Date(userDTO.createdAt) : null;

        $('#profileUsername').text(userDTO.username || 'Пользователь');
        $('#memberSince').text(createdAt ? createdAt.toLocaleDateString('ru-RU') : 'неизвестно');
        $('#displayCreatedAt').text(createdAt ? createdAt.toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'неизвестно');

        $('#userId').text(userDTO.userId || '--');
        $('#displayUsername').text(userDTO.username || '--');

        const countryValue = userDTO.country || 'Не указана';
        $('#countryText').text(countryValue);
        $('#displayCountry').show();
        $('#countryEditRow').hide();

        if (isOwner && userDTO.email) {
            $('#displayEmail').text(userDTO.email);
            $('#emailRow').css('display', 'flex');
        } else {
            $('#emailRow').hide();
        }

        $('#passwordCard').toggle(isOwner);
        $('#logoutCard').toggle(isOwner);
        $('#changeAvatarBtn').toggle(isOwner);

        setAvatar(userDTO.imageUrl);
        initCountryEdit();
    }

    async function loadUserRating(userId) {
        try {
            const response = await window.api.get(`/api/rating/user/${userId}`);
            if (response && response.success && response.rating) {
                renderRatingCarousel(response.rating);
            } else {
                $('#ratingCarouselSection').hide();
            }
        } catch (error) {
            console.error('Error loading user rating:', error);
            $('#ratingCarouselSection').hide();
        }
    }

    async function loadProfile() {
        try {
            const profileId = await getTargetProfileId();
            const userDTO = await window.api.get(`/api/users/${profileId}`);
            renderProfile(userDTO);
            await loadUserRating(profileId);
        } catch (error) {
            const message = error.message || 'Не удалось загрузить профиль';
            showToast('❌ ' + message, true);
            if (String(message).includes('авторизоваться')) {
                setTimeout(function () { window.location.href = '/login'; }, 1200);
            }
        }
    }

    async function resetAvatar() {
        if (!currentProfile || !currentProfile.owner) {
            showToast('❌ Нет прав для изменения аватара', true);
            return;
        }

        showToast('⏳ Сброс аватара...');

        try {
            await window.api.delete('/api/users/avatar');
            await loadProfile();
            await updateHeaderAuth();
            showToast('✅ Аватар сброшен на стандартный');
        } catch (error) {
            let errorMsg = error.message || 'Не удалось сбросить аватар';
            showToast('❌ ' + errorMsg, true);
        }
    }

    function initAvatarChange() {
        $('#changeAvatarBtn').off('click').on('click', function () {
            $('#avatarUpload').trigger('click');
        });

        $('#avatarPreview').off('dblclick').on('dblclick', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (!currentProfile || !currentProfile.owner) {
                showToast('❌ Нет прав для изменения аватара', true);
                return;
            }

            if (confirm('Вы уверены, что хотите сбросить аватар на стандартный?')) {
                resetAvatar();
            }
        });

        $('#avatarUpload').off('change').on('change', async function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file || !currentProfile || !currentProfile.owner) {
                $(this).val('');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                showToast('❌ Файл должен быть до 5MB', true);
                $(this).val('');
                return;
            }

            const allowed = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowed.includes(file.type)) {
                showToast('❌ Разрешены только JPG, PNG и WEBP', true);
                $(this).val('');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const $avatar = $('#avatarPreview');
                if ($avatar.length) {
                    $avatar.html(`<img src="${e.target.result}" style="opacity: 0.6;" alt="Загрузка...">`);
                }
            };
            reader.readAsDataURL(file);

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await window.api.post('/api/users/avatar', formData);
                const imageUrl = response.imageUrl;

                if (currentProfile) {
                    currentProfile.imageUrl = imageUrl;
                }

                forceRefreshAvatar(imageUrl);
                await updateHeaderAuth();
                showToast('✅ Аватар обновлён');
            } catch (error) {
                showToast('❌ ' + (error.message || 'Не удалось обновить аватар'), true);
                if (currentProfile) {
                    setAvatar(currentProfile.imageUrl);
                }
            } finally {
                $(this).val('');
            }
        });
    }

    function forceRefreshAvatar(imageUrl) {
        const avatarElements = [
            $('#avatarPreview'),
            $('#profileIcon img'),
            $('.profile-icon img'),
            $('.user-avatar')
        ].filter($el => $el && $el.length);

        if (!imageUrl || imageUrl === 'null') {
            avatarElements.forEach($el => {
                if ($el.is('img')) {
                    $el.replaceWith('<i class="fas fa-user-circle"></i>');
                } else if ($el.find('img').length) {
                    $el.html('<i class="fas fa-user-circle"></i>');
                } else if ($el.hasClass('avatar-preview') || $el.attr('id') === 'avatarPreview') {
                    $el.html('<i class="fas fa-user-circle"></i>');
                }
            });
            return;
        }

        const cacheBustUrl = getAvatarUrlWithCacheBust(imageUrl);

        const img = new Image();
        img.onload = function () {
            avatarElements.forEach($el => {
                if ($el.is('img')) {
                    $el.attr('src', cacheBustUrl);
                } else if ($el.find('img').length) {
                    $el.find('img').attr('src', cacheBustUrl);
                } else if ($el.hasClass('avatar-preview') || $el.attr('id') === 'avatarPreview') {
                    $el.html(`<img src="${escapeHtml(cacheBustUrl)}" alt="Аватар" class="avatar-image">`);
                }
            });

            $('[style*="background-image"]').each(function () {
                const $this = $(this);
                const style = $this.attr('style');
                if (style && (style.includes('avatar') || style.includes('profile-icon'))) {
                    $this.css('background-image', `url(${cacheBustUrl})`);
                }
            });
        };

        img.onerror = function () {
            const fallbackUrl = resolveImageUrl(imageUrl);
            if (fallbackUrl) {
                avatarElements.forEach($el => {
                    if ($el.is('img')) {
                        $el.attr('src', fallbackUrl);
                    } else if ($el.find('img').length) {
                        $el.find('img').attr('src', fallbackUrl);
                    } else if ($el.hasClass('avatar-preview') || $el.attr('id') === 'avatarPreview') {
                        $el.html(`<img src="${escapeHtml(fallbackUrl)}" alt="Аватар">`);
                    }
                });
            }
        };

        img.src = cacheBustUrl;
    }

    function initPasswordModal() {
        $('#changePasswordBtn').off('click').on('click', function () {
            if (!currentProfile?.owner) return;
            $('#passwordModal').css('display', 'flex');
            $('#currentPasswordInput, #newPasswordInput, #confirmPasswordInput').val('');
            $('#newPasswordHint, #confirmPasswordHint').text('');
        });

        $('#closeModalBtn, #cancelPasswordBtn').off('click').on('click', function () {
            $('#passwordModal').hide();
        });

        $('#passwordModal').off('click').on('click', function (e) {
            if (e.target === this) $('#passwordModal').hide();
        });

        $('#submitPasswordBtn').off('click').on('click', async function () {
            const $btn = $(this);
            const currentPassword = $('#currentPasswordInput').val();
            const newPassword = $('#newPasswordInput').val();
            const confirmPassword = $('#confirmPasswordInput').val();

            if (!currentPassword) {
                showToast('❌ Введите текущий пароль', true);
                $('#currentPasswordInput').focus();
                return;
            }

            if (!newPassword || newPassword.length < 6) {
                showToast('❌ Новый пароль должен быть минимум 6 символов', true);
                $('#newPasswordInput').focus();
                return;
            }

            if (newPassword !== confirmPassword) {
                showToast('❌ Пароли не совпадают', true);
                $('#confirmPasswordInput').focus();
                return;
            }

            const originalText = $btn.text();
            $btn.prop('disabled', true).text('Сохранение...');

            try {
                await window.api.post('/api/users/change-password', {
                    currentPassword: currentPassword,
                    newPassword: newPassword
                });
                $('#passwordModal').hide();
                showToast('✅ Пароль успешно изменён');
                $('#currentPasswordInput, #newPasswordInput, #confirmPasswordInput').val('');
            } catch (error) {
                let errorMsg = 'Не удалось сменить пароль';
                if (error.message) {
                    errorMsg = error.message;
                }
                showToast('❌ ' + errorMsg, true);
            } finally {
                $btn.prop('disabled', false).text(originalText);
            }
        });

        $('#newPasswordInput').off('input').on('input', function () {
            const val = $(this).val();
            const $hint = $('#newPasswordHint');
            if (val.length === 0) {
                $hint.text('');
            } else if (val.length < 6) {
                $hint.html('❌ <small>Минимум 6 символов</small>').css('color', '#ef4444');
            } else {
                $hint.html('✅ <small>Хороший пароль</small>').css('color', '#10b981');
            }

            const confirmVal = $('#confirmPasswordInput').val();
            if (confirmVal) {
                $('#confirmPasswordInput').trigger('input');
            }
        });

        $('#confirmPasswordInput').off('input').on('input', function () {
            const newPass = $('#newPasswordInput').val();
            const confirmPass = $(this).val();
            const $hint = $('#confirmPasswordHint');

            if (confirmPass.length === 0) {
                $hint.text('');
            } else if (newPass !== confirmPass) {
                $hint.html('❌ <small>Пароли не совпадают</small>').css('color', '#ef4444');
            } else {
                $hint.html('✅ <small>Пароли совпадают</small>').css('color', '#10b981');
            }
        });

        $('#passwordModal input').off('keypress').on('keypress', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                $('#submitPasswordBtn').click();
            }
        });
    }

    function initLogout() {
        $('#logoutBtn').off('click').on('click', async function () {
            try {
                await window.api.post('/api/auth/logout', {});
            } finally {
                window.location.href = '/login';
            }
        });
    }

    // Асинхронная инициализация
    (async function init() {
        await updateHeaderAuth();
        await loadProfile();
        initAvatarChange();
        initPasswordModal();
        initLogout();
    })();
});