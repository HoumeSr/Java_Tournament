// ========== УВЕДОМЛЕНИЯ ==========
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
                            <img src="${imageUrl}">
                        </div>
                    `;
                } else {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <i class="fas fa-user-circle"></i>
                        </div>
                    `;
                }
                document.getElementById('profileIcon')?.addEventListener('click', () => {
                    window.location.href = '/profile';
                });
            } else {
                authContainer.innerHTML = `
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `;
                document.getElementById('registerBtn')?.addEventListener('click', () => {
                    window.location.href = '/register';
                });
                document.getElementById('loginBtn')?.addEventListener('click', () => {
                    window.location.href = '/login';
                });
            }
        })
        .catch(() => {});
}

// ========== МОДАЛЬНОЕ ОКНО ПРИГЛАШЕНИЯ ==========
let selectedUserId = null;
let selectedUserData = null;
let searchTimeout = null;

function openInviteModal() {
    const modal = document.getElementById('inviteModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Сбрасываем форму
        document.getElementById('usernameOrEmail').value = '';
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('selectedUserContainer').style.display = 'none';
        document.getElementById('sendInviteBtn').disabled = true;
        selectedUserId = null;
        selectedUserData = null;
    }
}

function closeInviteModal() {
    const modal = document.getElementById('inviteModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        selectedUserId = null;
        selectedUserData = null;
    }
}

// Поиск пользователей
async function searchUsers(query) {
    if (!query || query.length < 2) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }
    
    const resultsDiv = document.getElementById('searchResults');
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
                <button class="search-result-select" data-user-id="${user.id}" data-username="${user.username}" data-country="${escapeHtml(user.country || '')}" data-image="${user.imageUrl || ''}">
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
            
            resultsDiv.appendChild(userDiv);
        });
    } catch (error) {
        console.error('Search error:', error);
        resultsDiv.innerHTML = `<div class="no-results">❌ ${error.message}</div>`;
    }
}

// Выбор пользователя
function selectUser(user) {
    selectedUserId = user.id;
    selectedUserData = user;
    
    // Скрываем результаты поиска
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('usernameOrEmail').value = user.username;
    
    // Показываем выбранного пользователя
    const selectedContainer = document.getElementById('selectedUserContainer');
    const selectedCard = document.getElementById('selectedUserCard');
    
    selectedCard.innerHTML = `
        <div class="selected-user-avatar">
            ${user.imageUrl ? 
                `<img src="${user.imageUrl}" alt="avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                 <i class="fas fa-user-circle" style="display: none;"></i>` : 
                `<i class="fas fa-user-circle"></i>`
            }
        </div>
        <div class="selected-user-info">
            <span class="selected-user-name">${escapeHtml(user.username)}</span>
            <span class="selected-user-email">${escapeHtml(user.country || 'Игрок')}</span>
        </div>
        <button class="change-user-btn" id="changeUserBtn" title="Изменить">
            <i class="fas fa-pen"></i>
        </button>
    `;
    
    selectedContainer.style.display = 'block';
    document.getElementById('sendInviteBtn').disabled = false;
    
    // Кнопка изменения выбора
    document.getElementById('changeUserBtn').addEventListener('click', () => {
        selectedContainer.style.display = 'none';
        document.getElementById('sendInviteBtn').disabled = true;
        document.getElementById('usernameOrEmail').value = '';
        document.getElementById('usernameOrEmail').focus();
        selectedUserId = null;
        selectedUserData = null;
    });
}

// Отправка приглашения
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
    
    // Проверка, не пытается ли капитан пригласить самого себя
    const currentUserResponse = await fetch('/api/auth/check');
    const currentUser = await currentUserResponse.json();
    if (currentUser.user?.id === selectedUserId) {
        showToast('❌ Нельзя пригласить самого себя', true);
        return;
    }
    
    const sendBtn = document.getElementById('sendInviteBtn');
    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    
    try {
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
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
    }
}

// Инициализация модального окна
function initInviteModal() {
    // Поиск при вводе
    const searchInput = document.getElementById('usernameOrEmail');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchUsers(e.target.value.trim());
            }, 300);
        });
        
        // Очистка при фокусе
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2 && !selectedUserId) {
                searchUsers(searchInput.value.trim());
            }
        });
    }
    
    // Отправка приглашения
    const sendBtn = document.getElementById('sendInviteBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendInvite);
    }
    
    // Закрытие модалки
    const closeModalBtn = document.getElementById('closeInviteModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeInviteModal);
    
    const cancelInviteBtn = document.getElementById('cancelInviteBtn');
    if (cancelInviteBtn) cancelInviteBtn.addEventListener('click', closeInviteModal);
    
    const overlay = document.querySelector('#inviteModal .modal-overlay');
    if (overlay) overlay.addEventListener('click', closeInviteModal);
    
    // ESC для закрытия
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('inviteModal');
            if (modal && modal.style.display === 'flex') {
                closeInviteModal();
            }
        }
    });
}
// ========== КНОПКИ ДЕЙСТВИЙ ==========
function initActionButtons() {
    // Кнопка добавления участника (открывает модалку)
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }
            openInviteModal();
        });
    }
    
    // Карточка добавления участника
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
    
    // Поиск при вводе
    const searchInput = document.getElementById('usernameOrEmail');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (searchTimeout) clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchUsers(e.target.value.trim());
            }, 300);
        });
    }
    
    // Отправка приглашения
    const inviteForm = document.getElementById('inviteForm');
    if (inviteForm) {
        inviteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await sendInvite();
        });
    }
    
    // Закрытие модалки
    const closeModalBtn = document.getElementById('closeInviteModalBtn');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeInviteModal);
    
    const cancelInviteBtn = document.getElementById('cancelInviteBtn');
    if (cancelInviteBtn) cancelInviteBtn.addEventListener('click', closeInviteModal);
    
    const overlay = document.querySelector('#inviteModal .modal-overlay');
    if (overlay) overlay.addEventListener('click', closeInviteModal);
    
    // ESC для закрытия
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('inviteModal');
            if (modal && modal.style.display === 'flex') {
                closeInviteModal();
            }
        }
    });
    
    // Выгнать участника
    const kickBtns = document.querySelectorAll('.btn-kick');
    kickBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const userId = btn.dataset.userId;
            if (confirm('Вы уверены, что хотите исключить этого участника?')) {
                showToast(`❌ Не удалось исключить участника (в разработке)`, true);
            }
        });
    });
    
    // Вступить в команду
    const joinBtn = document.getElementById('joinTeamBtn');
    if (joinBtn) {
        joinBtn.addEventListener('click', async () => {
            if (window.teamData.currentMembersCount >= window.teamData.maxMembersCount) {
                showToast('❌ Команда уже заполнена', true);
                return;
            }
            showToast(`🔜 Функция вступления в команду в разработке`);
        });
    }
    
    // Выйти из команды
    const leaveBtn = document.getElementById('leaveTeamBtn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите покинуть команду?')) {
                showToast(`❌ Не удалось покинуть команду (в разработке)`, true);
            }
        });
    }
}

// ========== ESCAPE HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    initActionButtons();
});