$(function () {
    let currentProfile = null;
    let currentAuthUser = null;

    const DEFAULT_IMAGE_URL = 'http://localhost:9000/images/profiles/DEFAULT_IMAGE.png';

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
        renderStats(userDTO.games || userDTO.gameStats || []);
        initCountryEdit();
    }

    async function loadProfile() {
        try {
            const profileId = await getTargetProfileId();
            const userDTO = await window.api.get(`/api/users/${profileId}`);
            renderProfile(userDTO);
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
            if (currentProfile) {
                currentProfile.imageUrl = DEFAULT_IMAGE_URL;
            }
            forceRefreshAvatar(DEFAULT_IMAGE_URL);
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