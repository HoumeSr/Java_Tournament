// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let currentUser = null;
let currentUserId = null;
let viewedUserId = null;

function detectViewedUserId() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length === 2 && parts[0] === 'profile') {
        const parsed = parseInt(parts[1], 10);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return null;
}

// ========== УВЕДОМЛЕНИЯ ==========
function showToast(message, isError = false) {
    let toast = document.getElementById('demoToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'demoToast';
        toast.className = 'demo-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.background = isError ? '#b91c1c' : '#1f2937';
    toast.style.opacity = '1';
    toast.style.visibility = 'visible';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.visibility = 'hidden';
    }, 3000);
}

// ========== ПОЛУЧЕНИЕ ID ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ==========
async function getCurrentUserId() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        if (data.authenticated && data.user) {
            currentUserId = data.user.id;
            return data.user.id;
        }
    } catch (error) {
        console.error('Ошибка получения userId:', error);
    }
    return null;
}

// ========== ЗАГРУЗКА ПРОФИЛЯ ИЗ DTO ==========
async function loadUserProfile() {
    viewedUserId = detectViewedUserId();
    if (!currentUserId) {
        currentUserId = await getCurrentUserId();
    }

    const targetUserId = viewedUserId || currentUserId;

    if (!targetUserId) {
        showToast('❌ Пользователь не найден', true);
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }

    try {
        const response = await fetch(`/api/users/${targetUserId}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const userDTO = await response.json();
        console.log('📥 Загружен UserProfileDTO:', userDTO);

        currentUser = userDTO;
        renderProfile(userDTO);

        if (userDTO.owner) {
            const editProfileBtn = document.getElementById('editProfileBtn');
            const changeAvatarBtn = document.getElementById('changeAvatarBtn');
            const emailRow = document.getElementById('emailRow');
            const passwordCard = document.getElementById('passwordCard');
            const logoutCard = document.getElementById('logoutCard');

            if (editProfileBtn) editProfileBtn.style.display = 'flex';
            if (changeAvatarBtn) changeAvatarBtn.style.display = 'flex';
            if (emailRow) emailRow.style.display = 'flex';
            if (passwordCard) passwordCard.style.display = 'flex';
            if (logoutCard) logoutCard.style.display = 'block';
        }

    } catch (error) {
        console.error('❌ Ошибка загрузки профиля:', error);
        showToast('❌ Не удалось загрузить профиль', true);
    }
}
// ========== ОТОБРАЖЕНИЕ ПРОФИЛЯ ИЗ DTO ==========
function renderProfile(userDTO) {
    // Левая колонка - имя и дата
    const profileUsername = document.getElementById('profileUsername');
    if (profileUsername) profileUsername.textContent = userDTO.username || 'Пользователь';
    
    // Дата регистрации
    if (userDTO.createdAt) {
        const date = new Date(userDTO.createdAt);
        const memberSince = document.getElementById('memberSince');
        const displayCreatedAt = document.getElementById('displayCreatedAt');
        
        if (memberSince) memberSince.textContent = date.toLocaleDateString('ru-RU');
        if (displayCreatedAt) {
            displayCreatedAt.textContent = date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } else {
        const memberSince = document.getElementById('memberSince');
        const displayCreatedAt = document.getElementById('displayCreatedAt');
        if (memberSince) memberSince.textContent = 'неизвестно';
        if (displayCreatedAt) displayCreatedAt.textContent = 'неизвестно';
    }
    
    // Статистика (если есть в DTO)
    const tournamentsCount = document.getElementById('tournamentsCount');
    const winsCount = document.getElementById('winsCount');
    const rating = document.getElementById('rating');
    
    if (tournamentsCount) tournamentsCount.textContent = userDTO.totalTournaments || 0;
    if (winsCount) winsCount.textContent = userDTO.totalWins || 0;
    if (rating) rating.textContent = userDTO.rating || 1200;
    
    // Список игр пользователя (если есть)
    if (userDTO.games && userDTO.games.length > 0) {
        const gamesCard = document.getElementById('gamesCard');
        const gamesList = document.getElementById('gamesList');
        
        if (gamesCard && gamesList) {
            gamesList.innerHTML = '';
            
            userDTO.games.forEach(game => {
                const gameItem = document.createElement('div');
                gameItem.className = 'game-item';
                gameItem.innerHTML = `
                    <span class="game-name">${escapeHtml(game.gameName)}</span>
                    <div class="game-stats">
                        <span class="match-count">${game.matchCount || 0} матчей</span>
                        <span class="win-percent">${game.winPercent || 0}%</span>
                    </div>
                `;
                gamesList.appendChild(gameItem);
            });
            
            gamesCard.style.display = 'block';
        }
    }
    
    // Правая колонка
    const userId = document.getElementById('userId');
    const displayUsername = document.getElementById('displayUsername');
    const displayEmail = document.getElementById('displayEmail');
    const displayCountry = document.getElementById('displayCountry');
    
    if (userId) userId.textContent = userDTO.userId || '--';
    if (displayUsername) displayUsername.textContent = userDTO.username || '--';
    
    // Показываем email только если это владелец профиля
    if (userDTO.owner && userDTO.email && displayEmail) {
        displayEmail.textContent = userDTO.email;
    }
    
    if (displayCountry) displayCountry.textContent = userDTO.country || 'Не указана';
    
    // Аватар
    if (userDTO.imageUrl && userDTO.imageUrl.trim() !== '' && userDTO.imageUrl !== 'null') {
        setAvatar(userDTO.imageUrl);
    } else {
        setDefaultAvatar();
    }
}

// ========== АВАТАР ==========
function setAvatar(avatarData) {
    const avatarPreview = document.getElementById('avatarPreview');
    const profileIcon = document.getElementById('profileIcon');
    
    if (!avatarData || avatarData === 'null' || avatarData.trim() === '') {
        setDefaultAvatar();
        return;
    }
    
    localStorage.setItem('userAvatar', avatarData);
    
    if (avatarPreview) {
        avatarPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = avatarData;
        img.alt = 'Аватар';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        img.onerror = () => {
            setDefaultAvatar();
        };
        avatarPreview.appendChild(img);
    }
    
    if (profileIcon) {
        profileIcon.innerHTML = `<img src="${avatarData}" class="avatar-mini" alt="Аватар">`;
        profileIcon.style.padding = '0';
        profileIcon.style.overflow = 'hidden';
    }
}

function setDefaultAvatar() {
    const avatarPreview = document.getElementById('avatarPreview');
    const profileIcon = document.getElementById('profileIcon');
    
    if (avatarPreview) {
        avatarPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
        avatarPreview.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
        avatarPreview.style.display = 'flex';
        avatarPreview.style.alignItems = 'center';
        avatarPreview.style.justifyContent = 'center';
    }
    
    if (profileIcon && !localStorage.getItem('userAvatar')) {
        profileIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
        profileIcon.style.padding = '';
        profileIcon.style.overflow = '';
        profileIcon.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
    }
}

function resetAvatar() {
    const avatarPreview = document.getElementById('avatarPreview');
    const profileIcon = document.getElementById('profileIcon');
    
    localStorage.removeItem('userAvatar');
    
    if (avatarPreview) {
        avatarPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
        avatarPreview.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
        avatarPreview.style.padding = '';
    }
    
    if (profileIcon) {
        profileIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
        profileIcon.style.padding = '';
        profileIcon.style.overflow = '';
        profileIcon.style.background = 'linear-gradient(135deg, #1a1a2e, #16213e)';
    }
}

function initAvatarChange() {
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (!changeAvatarBtn || !avatarUpload) return;
    
    changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
    
    avatarUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image/jpeg|image/png|image/gif|image/webp')) {
            showToast('❌ Поддерживаются JPEG, PNG, GIF, WEBP', true);
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ Файл не более 5MB', true);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const avatarBase64 = e.target.result;
            
            try {
                const response = await fetch('/api/users/avatar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imageUrl: avatarBase64 })
                });
                
                if (response.ok) {
                    setAvatar(avatarBase64);
                    showToast('✅ Аватар обновлён!');
                } else {
                    showToast('❌ Ошибка загрузки аватара', true);
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showToast('❌ Ошибка соединения с сервером', true);
            }
        };
        reader.readAsDataURL(file);
    });
    
    if (avatarPreview) {
        avatarPreview.addEventListener('dblclick', async () => {
            if (confirm('Сбросить аватар на стандартный?')) {
                try {
                    const response = await fetch('/api/users/avatar', {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        resetAvatar();
                        showToast('🔄 Аватар сброшен');
                    } else {
                        showToast('❌ Ошибка сброса аватара', true);
                    }
                } catch (error) {
                    console.error('Ошибка:', error);
                    showToast('❌ Ошибка соединения с сервером', true);
                }
            }
        });
    }
}

// ========== РЕДАКТИРОВАНИЕ ПРОФИЛЯ ==========
function initProfile() {
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const profileForm = document.getElementById('profileForm');
    
    if (!editBtn || !cancelBtn || !viewMode || !editMode) return;
    
    editBtn.addEventListener('click', () => {
        if (currentUser) {
            const editUsername = document.getElementById('editUsername');
            const editCountry = document.getElementById('editCountry');
            
            if (editUsername) editUsername.value = currentUser.username || '';
            
            if (currentUser.country && editCountry) {
                for (let option of editCountry.options) {
                    if (option.value === currentUser.country) {
                        option.selected = true;
                        break;
                    }
                }
            }
        }
        
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
    });
    
    cancelBtn.addEventListener('click', () => {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
    });
    
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const editUsername = document.getElementById('editUsername');
            const editCountry = document.getElementById('editCountry');
            
            const username = editUsername ? editUsername.value.trim() : '';
            const country = (editCountry && editCountry.value) || null;
            
            if (!username) {
                showToast('❌ Имя пользователя обязательно', true);
                return;
            }
            
            if (username.length < 3) {
                showToast('❌ Имя пользователя должно содержать минимум 3 символа', true);
                return;
            }
            
            const updateData = {
                username: username,
                country: country
            };
            
            try {
                const response = await fetch('/api/users/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    const updatedUser = await response.json();
                    currentUser = updatedUser;
                    renderProfile(updatedUser);
                    
                    viewMode.style.display = 'block';
                    editMode.style.display = 'none';
                    showToast('✅ Профиль успешно обновлён');
                } else {
                    const error = await response.json();
                    showToast('❌ ' + (error.message || 'Ошибка обновления'), true);
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showToast('❌ Ошибка соединения с сервером', true);
            }
        });
    }
}

// ========== МОДАЛЬНОЕ ОКНО СМЕНЫ ПАРОЛЯ ==========
let isModalOpen = false;

function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (!modal) return;
    
    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    
    if (currentPasswordInput) currentPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    
    document.querySelectorAll('.modal-input').forEach(input => {
        input.classList.remove('error');
    });
    
    const newPasswordHint = document.getElementById('newPasswordHint');
    const confirmPasswordHint = document.getElementById('confirmPasswordHint');
    
    if (newPasswordHint) newPasswordHint.innerHTML = '';
    if (confirmPasswordHint) confirmPasswordHint.innerHTML = '';
    
    modal.style.display = 'flex';
    isModalOpen = true;
    document.body.style.overflow = 'hidden';
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    isModalOpen = false;
    document.body.style.overflow = '';
}

function initPasswordModal() {
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const submitPasswordBtn = document.getElementById('submitPasswordBtn');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    
    if (!changePasswordBtn) return;
    
    changePasswordBtn.addEventListener('click', openPasswordModal);
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closePasswordModal);
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', closePasswordModal);
    
    window.addEventListener('click', (e) => {
        if (isModalOpen && e.target.classList.contains('modal')) {
            closePasswordModal();
        }
    });
    
    function validateNewPassword() {
        if (!newPasswordInput) return false;
        
        const newPassword = newPasswordInput.value;
        const hint = document.getElementById('newPasswordHint');
        
        if (newPassword.length === 0) {
            if (hint) hint.innerHTML = '';
            newPasswordInput.classList.remove('error', 'success');
            return false;
        }
        
        if (newPassword.length < 6) {
            if (hint) {
                hint.innerHTML = '❌ Пароль должен содержать минимум 6 символов';
                hint.className = 'input-hint error';
            }
            newPasswordInput.classList.add('error');
            newPasswordInput.classList.remove('success');
            return false;
        } else {
            if (hint) {
                hint.innerHTML = '✅ Хороший пароль';
                hint.className = 'input-hint success';
            }
            newPasswordInput.classList.remove('error');
            newPasswordInput.classList.add('success');
            return true;
        }
    }
    
    function validateConfirmPassword() {
        if (!newPasswordInput || !confirmPasswordInput) return false;
        
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const hint = document.getElementById('confirmPasswordHint');
        
        if (confirmPassword.length === 0) {
            if (hint) hint.innerHTML = '';
            confirmPasswordInput.classList.remove('error', 'success');
            return false;
        }
        
        if (newPassword !== confirmPassword) {
            if (hint) {
                hint.innerHTML = '❌ Пароли не совпадают';
                hint.className = 'input-hint error';
            }
            confirmPasswordInput.classList.add('error');
            confirmPasswordInput.classList.remove('success');
            return false;
        } else {
            if (hint) {
                hint.innerHTML = '✅ Пароли совпадают';
                hint.className = 'input-hint success';
            }
            confirmPasswordInput.classList.remove('error');
            confirmPasswordInput.classList.add('success');
            return true;
        }
    }
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            validateNewPassword();
            validateConfirmPassword();
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    }
    
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', async () => {
            const currentPasswordInput = document.getElementById('currentPasswordInput');
            const currentPassword = currentPasswordInput ? currentPasswordInput.value : '';
            
            if (!currentPassword) {
                showToast('❌ Введите текущий пароль', true);
                return;
            }
            
            if (!validateNewPassword()) {
                showToast('❌ Новый пароль должен содержать минимум 6 символов', true);
                return;
            }
            
            if (!validateConfirmPassword()) {
                showToast('❌ Пароли не совпадают', true);
                return;
            }
            
            const newPassword = newPasswordInput ? newPasswordInput.value : '';
            
            submitPasswordBtn.disabled = true;
            const originalText = submitPasswordBtn.textContent;
            submitPasswordBtn.textContent = 'Отправка...';
            
            try {
                const response = await fetch('/api/users/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showToast('✅ ' + (data.message || 'Пароль успешно изменён'));
                    closePasswordModal();
                } else {
                    showToast('❌ ' + (data.message || 'Ошибка смены пароля'), true);
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showToast('❌ Ошибка соединения с сервером', true);
            } finally {
                submitPasswordBtn.disabled = false;
                submitPasswordBtn.textContent = originalText;
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isModalOpen) {
            closePasswordModal();
        }
    });
}

// ========== АВТОРИЗАЦИЯ В ШАПКЕ ==========
function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                const savedAvatar = localStorage.getItem('userAvatar');
                
                authContainer.innerHTML = `
                    <div class="profile-icon" id="profileIcon">
                        ${savedAvatar ? `<img src="${savedAvatar}" class="avatar-mini">` : '<i class="fas fa-user-circle"></i>'}
                    </div>
                `;
                
                const profileIcon = document.getElementById('profileIcon');
                if (profileIcon) {
                    if (savedAvatar) {
                        profileIcon.style.padding = '0';
                        profileIcon.style.overflow = 'hidden';
                    }
                    profileIcon.addEventListener('click', () => {
                        window.location.href = '/profile';
                    });
                }
            } else {
                authContainer.innerHTML = `
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>
                `;
                
                const registerBtn = document.getElementById('registerBtn');
                const loginBtn = document.getElementById('loginBtn');
                
                if (registerBtn) {
                    registerBtn.addEventListener('click', () => {
                        window.location.href = '/register';
                    });
                }
                
                if (loginBtn) {
                    loginBtn.addEventListener('click', () => {
                        window.location.href = '/login';
                    });
                }
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
        });
}

// ========== ВЫХОД ИЗ АККАУНТА ==========
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', async () => {
        if (!confirm('Вы уверены, что хотите выйти из аккаунта?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.removeItem('userAvatar');
                showToast('👋 Вы вышли из аккаунта');
                setTimeout(() => {
                    window.location.href = data.redirectUrl || '/';
                }, 500);
            }
        } catch (error) {
            console.error('Ошибка при выходе:', error);
            showToast('❌ Ошибка при выходе', true);
        }
    });
}

// ========== НАВИГАЦИЯ ==========
function initNavBar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href !== '#') return;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('📋 Этот раздел в разработке');
        });
    });
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
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
document.addEventListener('DOMContentLoaded', async () => {
    currentUserId = await getCurrentUserId();
    updateAuthButtons();
    await loadUserProfile();
    initProfile();
    initAvatarChange();
    initNavBar();
    initLogout();
    initPasswordModal();
});