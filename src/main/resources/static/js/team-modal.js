// ========== МОДАЛЬНОЕ ОКНО ПРИГЛАШЕНИЯ ==========

let selectedUserId = null;
let selectedUserData = null;
let searchTimeout = null;

function openInviteModal() {
    const modal = document.getElementById('inviteModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
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

async function searchUsers(query) {
    if (!query || query.length < 2) {
        document.getElementById('searchResults').style.display = 'none';
        return;
    }
    
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '<div class="loading-users"><i class="fas fa-spinner fa-spin"></i><br>Поиск...</div>';
    
    try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}`);
        }
        
        const users = await response.json();
        
        if (!users || users.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results"><i class="fas fa-user-slash"></i><br>Пользователь не найден</div>';
            return;
        }
        
        resultsDiv.innerHTML = '';
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'search-result-item';
            userDiv.innerHTML = `
                <div class="search-result-info">
                    <span class="search-result-username">${escapeHtml(user.username)}</span>
                    <span class="search-result-email">${escapeHtml(user.country || 'Игрок')}</span>
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
        resultsDiv.innerHTML = `<div class="no-results"><i class="fas fa-exclamation-triangle"></i><br>${error.message}</div>`;
    }
}

function selectUser(user) {
    selectedUserId = user.id;
    selectedUserData = user;
    
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('usernameOrEmail').value = user.username;
    
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
    
    document.getElementById('changeUserBtn').addEventListener('click', () => {
        selectedContainer.style.display = 'none';
        document.getElementById('sendInviteBtn').disabled = true;
        document.getElementById('usernameOrEmail').value = '';
        document.getElementById('usernameOrEmail').focus();
        selectedUserId = null;
        selectedUserData = null;
    });
}


async function readErrorMessage(response, fallbackMessage) {
    try {
        const text = await response.text();
        if (!text) {
            return fallbackMessage;
        }

        try {
            const data = JSON.parse(text);
            return data.message || data.error || data.detail || fallbackMessage;
        } catch (_) {
            return text;
        }
    } catch (_) {
        return fallbackMessage;
    }
}

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
    
    if (currentUser && currentUser.id === selectedUserId) {
        showToast('❌ Нельзя пригласить самого себя', true);
        return;
    }
    
    const sendBtn = document.getElementById('sendInviteBtn');
    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    
    try {
        const teamId = window.teamData && window.teamData.id;
        if (!teamId) {
            throw new Error('Не удалось определить команду для приглашения');
        }

        const response = await fetch(`/api/teams/${teamId}/invite`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: selectedUserId
            })
        });

        if (!response.ok) {
            const message = await readErrorMessage(response, 'Не удалось отправить приглашение');
            throw new Error(message);
        }

        closeInviteModal();
        showToast(`✅ Приглашение отправлено игроку ${selectedUserData.username}!`);
    } catch (error) {
        showToast(`❌ ${error.message}`, true);
    } finally {
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
    }
}

function initModal() {
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
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('inviteModal');
            if (modal && modal.style.display === 'flex') {
                closeInviteModal();
            }
        }
    });
}