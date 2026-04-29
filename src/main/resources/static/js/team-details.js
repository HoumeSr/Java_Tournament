function showToast(message, isError = false) {
    const toast = document.getElementById('demoToast');
    if (!toast) return;

    toast.textContent = message;
    toast.style.background = isError ? '#b91c1c' : '#1f2937';
    toast.style.opacity = '1';
    toast.style.visibility = 'visible';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.visibility = 'hidden';
    }, 3000);
}

// ========== АВТОРИЗАЦИЯ ==========
function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;

    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                const imageUrl = data.user?.imageUrl;

                if (imageUrl) {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <img src="${imageUrl}" alt="avatar">
    if (!modal) return;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const searchInput = document.getElementById('usernameOrEmail');
    const searchResults = document.getElementById('searchResults');
    const selectedUserContainer = document.getElementById('selectedUserContainer');
    const sendInviteBtn = document.getElementById('sendInviteBtn');

    if (searchInput) searchInput.value = '';
    if (searchResults) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
    }
    if (selectedUserContainer) selectedUserContainer.style.display = 'none';
    if (sendInviteBtn) sendInviteBtn.disabled = true;

    selectedUserId = null;
    selectedUserData = null;

    setTimeout(() => searchInput?.focus(), 50);
}

function closeInviteModal() {
    const modal = document.getElementById('inviteModal');
    if (!modal) return;

    modal.style.display = 'none';
    document.body.style.overflow = '';
    selectedUserId = null;
    selectedUserData = null;
}

// ========== ПОИСК ПОЛЬЗОВАТЕЛЕЙ ==========
async function searchUsers(query) {
    const resultsDiv = document.getElementById('searchResults');
    if (!resultsDiv) return;

    if (!query || query.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }

    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div class="loading-users"><i class="fas fa-spinner fa-spin"></i> Поиск...</div>';

    try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }

        const users = await response.json();

        if (!users || users.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">👤 Пользователь не найден</div>';
            return;
        }

        resultsDiv.innerHTML = '';

        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'search-result-item';
            userDiv.innerHTML = `
                <div class="search-result-info">
                    <span class="search-result-username">${escapeHtml(user.username)}</span>
                    <span class="search-result-email">${escapeHtml(user.country || '')}</span>
                </div>
                <button class="search-result-select" type="button">
                    Выбрать
                </button>
            `;

            userDiv.querySelector('.search-result-select').addEventListener('click', (e) => {
                e.stopPropagation();
                selectUser({
                    id: user.id,
                    username: user.username,
                    country: user.country,
                    imageUrl: user.imageUrl
                });
            });

            userDiv.addEventListener('click', () => {
                selectUser({
                    id: user.id,
                    username: user.username,
                    country: user.country,
                    imageUrl: user.imageUrl
                });
            });

            resultsDiv.appendChild(userDiv);
        });
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = `<div class="no-results">❌ ${escapeHtml(error.message)}</div>`;
    }
}

// ========== ВЫБОР ПОЛЬЗОВАТЕЛЯ ==========
function selectUser(user) {
    selectedUserId = user.id;
    selectedUserData = user;

    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('usernameOrEmail');
    const selectedContainer = document.getElementById('selectedUserContainer');
    const selectedCard = document.getElementById('selectedUserCard');
    const sendInviteBtn = document.getElementById('sendInviteBtn');

    if (searchResults) searchResults.style.display = 'none';
    if (searchInput) searchInput.value = user.username;

    if (!selectedContainer || !selectedCard) return;

    selectedCard.innerHTML = `
        <div class="selected-user-avatar">
            ${
                user.imageUrl
                    ? `<img src="${user.imageUrl}" alt="avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                       <i class="fas fa-user-circle" style="display: none;"></i>`
                    : `<i class="fas fa-user-circle"></i>`
            }
        </div>
        <div class="selected-user-info">
            <span class="selected-user-name">${escapeHtml(user.username)}</span>
            <span class="selected-user-email">${escapeHtml(user.country || 'Игрок')}</span>
        </div>
        <button class="change-user-btn" id="changeUserBtn" type="button" title="Изменить">
            <i class="fas fa-pen"></i>
        </button>
    `;

    selectedContainer.style.display = 'block';
    if (sendInviteBtn) sendInviteBtn.disabled = false;

    document.getElementById('changeUserBtn')?.addEventListener('click', () => {
        selectedContainer.style.display = 'none';
        if (sendInviteBtn) sendInviteBtn.disabled = true;
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
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

    const sendBtn = document.getElementById('sendInviteBtn');
    const originalText = sendBtn ? sendBtn.innerHTML : '';

    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    }

    try {
        const currentUserResponse = await fetch('/api/auth/check');
        const currentUser = await currentUserResponse.json();

        if (currentUser.user?.id === selectedUserId) {
            showToast('❌ Нельзя пригласить самого себя', true);
            return;
        }

        const response = await fetch(`/api/teams/${window.teamData.id}/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUserId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Не удалось отправить приглашение');
        }

        showToast(`✅ Приглашение отправлено игроку ${selectedUserData.username}!`);
        closeInviteModal();
    } catch (error) {
        showToast(`❌ ${error.message}`, true);
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalText;
        }
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ МОДАЛЬНОГО ОКНА ==========
function initInviteModal() {
    const searchInput = document.getElementById('usernameOrEmail');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (searchTimeout) clearTimeout(searchTimeout);

            searchTimeout = setTimeout(() => {
                searchUsers(e.target.value.trim());
            }, 300);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2 && !selectedUserId) {
                searchUsers(searchInput.value.trim());
            }
        });
    }

    document.getElementById('sendInviteBtn')?.addEventListener('click', sendInvite);
    document.getElementById('closeInviteModalBtn')?.addEventListener('click', closeInviteModal);
    document.getElementById('cancelInviteBtn')?.addEventListener('click', closeInviteModal);
    document.querySelector('#inviteModal .modal-overlay')?.addEventListener('click', closeInviteModal);
}

// ========== КНОПКИ ДЕЙСТВИЙ ==========
function initActionButtons() {
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }

            openInviteModal();
        });
    }

    const addMemberCard = document.getElementById('addMemberCard');
    if (addMemberCard) {
        addMemberCard.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-add') || e.target.closest('.btn-add')) return;

            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }

            openInviteModal();
        });
    }

    document.querySelectorAll('.btn-kick').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();

            if (confirm('Вы уверены, что хотите исключить этого участника?')) {
                showToast('❌ Не удалось исключить участника (в разработке)', true);
            }
        });
    });

    const joinBtn = document.getElementById('joinTeamBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', async () => {
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }

            showToast('🔜 Функция вступления в команду в разработке');
        });
    }

    const leaveBtn = document.getElementById('leaveTeamBtn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите покинуть команду?')) {
                showToast('❌ Не удалось покинуть команду (в разработке)', true);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        const modal = document.getElementById('inviteModal');
        if (modal && modal.style.display === 'flex') {
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
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    initInviteModal();
    initActionButtons();
});