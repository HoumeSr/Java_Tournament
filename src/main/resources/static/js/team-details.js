function showToast(message, isError = false) {
    const $toast = $('#demoToast');
    if (!$toast.length) return;
    
    $toast.text(message).css({
        background: isError ? '#b91c1c' : '#1f2937',
        opacity: '1',
        visibility: 'visible'
    });
    
    setTimeout(() => {
        $toast.css({ opacity: '0', visibility: 'hidden' });
    }, 3000);
}

// ========== АВТОРИЗАЦИЯ ==========
async function updateAuthButtons() {
    const $auth = $('#authButtons');
    if (!$auth.length) return;
    
    try {
        // Используем api.get для проверки авторизации
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
            
            // Очищаем уведомления для неавторизованных
            if (window.NotificationsModule) {
                window.NotificationsModule.destroy();
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
        // Показываем кнопки входа в случае ошибки
        $auth.html(`
            <button class="btn-outline" id="registerBtn">Регистрация</button>
            <button class="btn-primary" id="loginBtn">Вход</button>
        `);
        $('#registerBtn').off('click').on('click', () => window.location.href = '/register');
        $('#loginBtn').off('click').on('click', () => window.location.href = '/login');
    }
}

let selectedUserId = null;
let selectedUserData = null;
let searchTimeout = null;

// ========== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ==========
function openInviteModal() {
    const $modal = $('#inviteModal');
    if (!$modal.length) return;

    $modal.css('display', 'flex');
    $('body').css('overflow', 'hidden');

    const $searchInput = $('#usernameOrEmail');
    const $searchResults = $('#searchResults');
    const $selectedUserContainer = $('#selectedUserContainer');
    const $sendInviteBtn = $('#sendInviteBtn');

    if ($searchInput.length) $searchInput.val('');
    if ($searchResults.length) {
        $searchResults.css('display', 'none').empty();
    }
    if ($selectedUserContainer.length) $selectedUserContainer.css('display', 'none');
    if ($sendInviteBtn.length) $sendInviteBtn.prop('disabled', true);

    selectedUserId = null;
    selectedUserData = null;

    setTimeout(() => $searchInput.trigger('focus'), 50);
}

function closeInviteModal() {
    const $modal = $('#inviteModal');
    if (!$modal.length) return;

    $modal.css('display', 'none');
    $('body').css('overflow', '');
    selectedUserId = null;
    selectedUserData = null;
}

// ========== ПОИСК ПОЛЬЗОВАТЕЛЕЙ ==========
async function searchUsers(query) {
    const $resultsDiv = $('#searchResults');
    if (!$resultsDiv.length) return;

    if (!query || query.length < 2) {
        $resultsDiv.css('display', 'none');
        return;
    }

    $resultsDiv.css('display', 'block').html('<div class="loading-users"><i class="fas fa-spinner fa-spin"></i> Поиск...</div>');

    try {
        const users = await window.api.get(`/api/users/search?q=${encodeURIComponent(query)}`);

        if (!users || users.length === 0) {
            $resultsDiv.html('<div class="no-results">👤 Пользователь не найден</div>');
            return;
        }

        $resultsDiv.empty();

        users.forEach(user => {
            const $userDiv = $(`
                <div class="search-result-item" data-user-id="${user.id}">
                    <div class="search-result-info">
                        <span class="search-result-username">${escapeHtml(user.username)}</span>
                        <span class="search-result-email">${escapeHtml(user.country || '')}</span>
                    </div>
                    <button class="search-result-select" type="button">
                        Выбрать
                    </button>
                </div>
            `);

            $userDiv.find('.search-result-select').on('click', (e) => {
                e.stopPropagation();
                selectUser({
                    id: user.id,
                    username: user.username,
                    country: user.country,
                    imageUrl: user.imageUrl
                });
            });

            $userDiv.on('click', () => {
                selectUser({
                    id: user.id,
                    username: user.username,
                    country: user.country,
                    imageUrl: user.imageUrl
                });
            });

            $resultsDiv.append($userDiv);
        });
    } catch (error) {
        console.error('Search error:', error);
        $resultsDiv.html(`<div class="no-results">❌ ${escapeHtml(error.message)}</div>`);
    }
}

// ========== ВЫБОР ПОЛЬЗОВАТЕЛЯ ==========
function selectUser(user) {
    selectedUserId = user.id;
    selectedUserData = user;

    const $searchResults = $('#searchResults');
    const $searchInput = $('#usernameOrEmail');
    const $selectedContainer = $('#selectedUserContainer');
    const $selectedCard = $('#selectedUserCard');
    const $sendInviteBtn = $('#sendInviteBtn');

    if ($searchResults.length) $searchResults.css('display', 'none');
    if ($searchInput.length) $searchInput.val(user.username);

    if (!$selectedContainer.length || !$selectedCard.length) return;

    const avatarHtml = user.imageUrl
        ? `<img src="${user.imageUrl}" alt="avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
           <i class="fas fa-user-circle" style="display: none;"></i>`
        : `<i class="fas fa-user-circle"></i>`;

    $selectedCard.html(`
        <div class="selected-user-avatar">
            ${avatarHtml}
        </div>
        <div class="selected-user-info">
            <span class="selected-user-name">${escapeHtml(user.username)}</span>
            <span class="selected-user-email">${escapeHtml(user.country || 'Игрок')}</span>
        </div>
        <button class="change-user-btn" id="changeUserBtn" type="button" title="Изменить">
            <i class="fas fa-pen"></i>
        </button>
    `);

    $selectedContainer.css('display', 'block');
    if ($sendInviteBtn.length) $sendInviteBtn.prop('disabled', false);

    $('#changeUserBtn').off('click').on('click', () => {
        $selectedContainer.css('display', 'none');
        if ($sendInviteBtn.length) $sendInviteBtn.prop('disabled', true);
        if ($searchInput.length) {
            $searchInput.val('').trigger('focus');
        }
        selectedUserId = null;
        selectedUserData = null;
    });
}

// ========== ОТПРАВКА ПРИГЛАШЕНИЯ ==========
async function sendInvite() {
    if (!selectedUserId) {
        showToast('❌ Выберите пользователя', true);
        return;
    }

    if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
        showToast('❌ Команда уже заполнена', true);
        closeInviteModal();
        return;
    }

    const $sendBtn = $('#sendInviteBtn');
    const originalText = $sendBtn.length ? $sendBtn.html() : '';

    if ($sendBtn.length) {
        $sendBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Отправка...');
    }

    try {
        const currentUser = await window.api.get('/api/auth/check');

        if (currentUser.user?.id === selectedUserId) {
            showToast('❌ Нельзя пригласить самого себя', true);
            return;
        }

        await window.api.post(`/api/teams/${window.teamData.id}/invite`, {
            userId: selectedUserId
        });

        showToast(`✅ Приглашение отправлено игроку ${selectedUserData.username}!`);
        closeInviteModal();
    } catch (error) {
        showToast(`❌ ${error.message}`, true);
    } finally {
        if ($sendBtn.length) {
            $sendBtn.prop('disabled', false).html(originalText);
        }
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ МОДАЛЬНОГО ОКНА ==========
function initInviteModal() {
    const $searchInput = $('#usernameOrEmail');
    if ($searchInput.length) {
        $searchInput.on('input', (e) => {
            if (searchTimeout) clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                searchUsers($(e.target).val().trim());
            }, 300);
        });

        $searchInput.on('focus', () => {
            const val = $searchInput.val().trim();
            if (val.length >= 2 && !selectedUserId) {
                searchUsers(val);
            }
        });
    }

    $('#sendInviteBtn').off('click').on('click', sendInvite);
    $('#closeInviteModalBtn, #cancelInviteBtn').off('click').on('click', closeInviteModal);
    $('#inviteModal .modal-overlay').off('click').on('click', closeInviteModal);
}

// ========== КНОПКИ ДЕЙСТВИЙ ==========
function initActionButtons() {
    const $addMemberBtn = $('#addMemberBtn');
    if ($addMemberBtn.length) {
        $addMemberBtn.on('click', (e) => {
            e.stopPropagation();

            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }

            openInviteModal();
        });
    }

    const $addMemberCard = $('#addMemberCard');
    if ($addMemberCard.length) {
        $addMemberCard.on('click', (e) => {
            if ($(e.target).hasClass('btn-add') || $(e.target).closest('.btn-add').length) return;

            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }

            openInviteModal();
        });
    }

    $('.btn-kick').each(function() {
        $(this).on('click', async (e) => {
            e.stopPropagation();

            if (confirm('Вы уверены, что хотите исключить этого участника?')) {
                showToast('❌ Не удалось исключить участника (в разработке)', true);
            }
        });
    });

    const $joinBtn = $('#joinTeamBtn');
    if ($joinBtn.length) {
        $joinBtn.on('click', async () => {
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }

            showToast('🔜 Функция вступления в команду в разработке');
        });
    }

    const $leaveBtn = $('#leaveTeamBtn');
    if ($leaveBtn.length) {
        $leaveBtn.on('click', async () => {
            if (confirm('Вы уверены, что хотите покинуть команду?')) {
                showToast('❌ Не удалось покинуть команду (в разработке)', true);
            }
        });
    }

    $(document).on('keydown', (e) => {
        if (e.key !== 'Escape') return;

        const $modal = $('#inviteModal');
        if ($modal.length && $modal.css('display') === 'flex') {
            closeInviteModal();
        }
    });
}

// ========== ESCAPE HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        if (m === "'") return '&#039;';
        return m;
    });
}

// ========== ЗАПУСК ==========
$(document).ready(() => {
    updateAuthButtons();
    initInviteModal();
    initActionButtons();
});