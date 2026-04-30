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

    // ✅ Функция для получения URL с anti-cache параметром
    function getAvatarUrlWithCacheBust(imageUrl) {
        if (!imageUrl || imageUrl === 'null' || imageUrl === 'DEFAULT_USER_IMAGE.jpg') return null;
        
        let baseUrl;
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/')) {
            baseUrl = imageUrl;
        } else {
            baseUrl = '/images/' + imageUrl;
        }
        
        // Добавляем timestamp для обхода кэша браузера
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}_t=${Date.now()}`;
    }

    // Оригинальная функция для совместимости (без cache-bust)
    function resolveImageUrl(imageUrl) {
        if (!imageUrl || imageUrl === 'null' || imageUrl === 'DEFAULT_USER_IMAGE.jpg') return null;
        if (/^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/')) return imageUrl;
        return '/images/' + imageUrl;
    }

    function getProfileIdFromUrlOrServer() {
        if (window.profileUserIdFromServer) return Number(window.profileUserIdFromServer);
        const match = window.location.pathname.match(/^\/profile\/(\d+)/);
        return match ? Number(match[1]) : null;
    }

    function updateHeaderAuth() {
        return $.ajax({ url: '/api/auth/check', method: 'GET', dataType: 'json' })
            .done(function (data) {
                const $auth = $('#authButtons');
                if (!$auth.length) return;

                if (data.authenticated && data.user) {
                    currentAuthUser = data.user;
                    // ✅ Используем cache-bust URL
                    const avatarUrl = getAvatarUrlWithCacheBust(data.user.imageUrl);
                    $auth.html(`
                        <div class="profile-icon" id="profileIcon" title="Мой профиль">
                            ${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" class="avatar-mini" alt="Аватар">` : '<i class="fas fa-user-circle"></i>'}
                        </div>
                    `);
                    $('#profileIcon').on('click', function () { window.location.href = '/profile'; });
                } else {
                    currentAuthUser = null;
                    $auth.html(`
                        <button class="btn-outline" id="registerBtn">Регистрация</button>
                        <button class="btn-primary" id="loginBtn">Вход</button>
                    `);
                    $('#registerBtn').on('click', function () { window.location.href = '/register'; });
                    $('#loginBtn').on('click', function () { window.location.href = '/login'; });
                }
            });
    }

    function getTargetProfileId() {
        const publicId = getProfileIdFromUrlOrServer();
        if (publicId) return $.Deferred().resolve(publicId).promise();

        return $.ajax({ url: '/api/auth/check', method: 'GET', dataType: 'json' }).then(function (data) {
            if (data.authenticated && data.user && data.user.id) {
                currentAuthUser = data.user;
                return data.user.id;
            }
            throw new Error('Необходимо авторизоваться');
        });
    }

    // ✅ Улучшенная функция setAvatar с принудительной перезагрузкой
    function setAvatar(imageUrl) {
        const $avatar = $('#avatarPreview');
        if (!$avatar.length) return;

        if (!imageUrl || imageUrl === 'null' || imageUrl === 'DEFAULT_USER_IMAGE.jpg') {
            $avatar.html('<i class="fas fa-user-circle"></i>');
            return;
        }

        // Получаем URL с cache-bust параметром
        const avatarUrl = getAvatarUrlWithCacheBust(imageUrl);
        
        // ✅ Принудительно перезагружаем изображение
        const img = new Image();
        const $avatarContainer = $avatar;
        
        img.onload = function() {
            $avatarContainer.html(`<img src="${escapeHtml(avatarUrl)}" alt="Аватар" class="avatar-image">`);
        };
        
        img.onerror = function() {
            // Если загрузка не удалась, пробуем без cache-bust
            const fallbackUrl = resolveImageUrl(imageUrl);
            if (fallbackUrl) {
                $avatarContainer.html(`<img src="${escapeHtml(fallbackUrl)}" alt="Аватар">`);
            } else {
                $avatarContainer.html('<i class="fas fa-user-circle"></i>');
            }
        };
        
        img.src = avatarUrl;
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
        $('#displayCountry').text(userDTO.country || 'Не указана');

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
    }

    function loadProfile() {
        getTargetProfileId()
            .then(function (profileId) {
                return $.ajax({ url: '/api/users/' + profileId, method: 'GET', dataType: 'json' });
            })
            .done(renderProfile)
            .fail(function (xhr) {
                const message = xhr.responseJSON?.message || xhr.message || 'Не удалось загрузить профиль';
                showToast('❌ ' + message, true);
                if (String(message).includes('авторизоваться')) {
                    setTimeout(function () { window.location.href = '/login'; }, 1200);
                }
            });
    }

    // ✅ Улучшенная функция изменения аватара с принудительным обновлением
    function initAvatarChange() {
        $('#changeAvatarBtn').on('click', function () {
            $('#avatarUpload').trigger('click');
        });

        $('#avatarUpload').on('change', function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file || !currentProfile || !currentProfile.owner) return;

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

            // Показываем превью загружаемого файла
            const reader = new FileReader();
            reader.onload = function(e) {
                const $avatar = $('#avatarPreview');
                if ($avatar.length) {
                    $avatar.html(`<img src="${e.target.result}" style="opacity: 0.6;" alt="Загрузка...">`);
                }
            };
            reader.readAsDataURL(file);

            const formData = new FormData();
            formData.append('file', file);

            $.ajax({
                url: '/api/users/avatar',
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false
            })
            .done(function (response) {
                const imageUrl = response.imageUrl;
                
                // ✅ Обновляем currentProfile
                if (currentProfile) {
                    currentProfile.imageUrl = imageUrl;
                }
                
                // ✅ Принудительно обновляем аватар с очисткой кэша
                forceRefreshAvatar(imageUrl);
                
                // ✅ Обновляем хедер
                updateHeaderAuth();
                
                showToast('✅ Аватар обновлён');
            })
            .fail(function (xhr) {
                showToast('❌ ' + (xhr.responseJSON?.message || 'Не удалось обновить аватар'), true);
                // Восстанавливаем старый аватар
                if (currentProfile) {
                    setAvatar(currentProfile.imageUrl);
                }
            })
            .always(() => {
                $('#avatarUpload').val('');
            });
        });
    }

    // ✅ Новая функция для принудительного обновления аватара
    function forceRefreshAvatar(imageUrl) {
        if (!imageUrl) return;
        
        // Получаем все элементы с аватарами на странице
        const avatarElements = [
            $('#avatarPreview'),
            $('#profileIcon img'),
            $('.profile-icon img'),
            $('.user-avatar')
        ].filter($el => $el && $el.length);
        
        // Создаем новый Image объект для принудительной загрузки
        const cacheBustUrl = getAvatarUrlWithCacheBust(imageUrl);
        
        // Загружаем новое изображение
        const img = new Image();
        img.onload = function() {
            // Обновляем все avatar элементы
            avatarElements.forEach($el => {
                if ($el.is('img')) {
                    $el.attr('src', cacheBustUrl);
                } else if ($el.find('img').length) {
                    $el.find('img').attr('src', cacheBustUrl);
                } else if ($el.hasClass('avatar-preview') || $el.attr('id') === 'avatarPreview') {
                    $el.html(`<img src="${escapeHtml(cacheBustUrl)}" alt="Аватар" class="avatar-image">`);
                }
            });
            
            // Обновляем стили если используются background-image
            $('[style*="background-image"]').each(function() {
                const $this = $(this);
                const style = $this.attr('style');
                if (style && (style.includes('avatar') || style.includes('profile-icon'))) {
                    $this.css('background-image', `url(${cacheBustUrl})`);
                }
            });
        };
        
        img.onerror = function() {
            // Если не загрузилось, пробуем обычный URL
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
        $('#changePasswordBtn').on('click', function () {
            if (!currentProfile?.owner) return;
            $('#passwordModal').css('display', 'flex');
            $('#currentPasswordInput, #newPasswordInput, #confirmPasswordInput').val('');
        });
        $('#closeModalBtn, #cancelPasswordBtn').on('click', function () { $('#passwordModal').hide(); });
        $('#passwordModal').on('click', function (e) { if (e.target === this) $('#passwordModal').hide(); });

        $('#savePasswordBtn').on('click', function () {
            const currentPassword = $('#currentPasswordInput').val();
            const newPassword = $('#newPasswordInput').val();
            const confirmPassword = $('#confirmPasswordInput').val();

            if (!currentPassword) return showToast('❌ Введите текущий пароль', true);
            if (!newPassword || newPassword.length < 6) return showToast('❌ Новый пароль должен быть минимум 6 символов', true);
            if (newPassword !== confirmPassword) return showToast('❌ Пароли не совпадают', true);

            $.ajax({
                url: '/api/users/change-password',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword })
            }).done(function () {
                $('#passwordModal').hide();
                showToast('✅ Пароль успешно изменён');
            }).fail(function (xhr) {
                showToast('❌ ' + (xhr.responseJSON?.message || 'Не удалось сменить пароль'), true);
            });
        });
    }

    function initLogout() {
        $('#logoutBtn').on('click', function () {
            $.post('/api/auth/logout').always(function () {
                window.location.href = '/login';
            });
        });
    }

    updateHeaderAuth().always(loadProfile);
    initAvatarChange();
    initPasswordModal();
    initLogout();
});