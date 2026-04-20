// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let currentUserDFH = null;

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

// ========== ЗАГРУЗКА ПРОФИЛЯ ЧЕРЕЗ API ==========
async function loadUserProfile() {
    const userId = window.currentUserId;
    
    if (!userId) {
        showToast('❌ Пользователь не авторизован', true);
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const userDFH = await response.json();
        currentUserDFH = userDFH;
        
        renderProfile(userDFH);
        
        // Показываем кнопки редактирования только если owner = true
        if (userDFH.owner) {
            document.getElementById('editProfileBtn').style.display = 'flex';
            document.getElementById('changeAvatarBtn').style.display = 'flex';
            document.getElementById('emailRow').style.display = 'flex';
            document.getElementById('roleRow').style.display = 'flex';
            document.getElementById('passwordCard').style.display = 'flex';
            document.getElementById('logoutCard').style.display = 'block';
        }
        
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showToast('❌ Не удалось загрузить профиль', true);
    }
}

// ========== ОТОБРАЖЕНИЕ ПРОФИЛЯ ==========
function renderProfile(userDFH) {
    // Левая колонка
    document.getElementById('profileUsername').textContent = userDFH.username;
    
    // Форматируем дату регистрации
    if (userDFH.createdAt) {
        const date = new Date(userDFH.createdAt);
        document.getElementById('memberSince').textContent = date.toLocaleDateString('ru-RU');
    }
    
    // Статистика
    document.getElementById('tournamentsCount').textContent = userDFH.totalTournaments || 0;
    document.getElementById('winsCount').textContent = userDFH.totalWins || 0;
    document.getElementById('rating').textContent = userDFH.rating || 1200;
    
    // Игры пользователя (UserGameStatsDFH)
    if (userDFH.games && userDFH.games.length > 0) {
        const gamesCard = document.getElementById('gamesCard');
        const gamesList = document.getElementById('gamesList');
        gamesList.innerHTML = '';
        
        userDFH.games.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';
            gameItem.innerHTML = `
                <span class="game-name">${escapeHtml(game.gameName)}</span>
                <div class="game-stats">
                    <span class="match-count">${game.matchCount} матчей</span>
                    <span class="win-percent">${game.winPercent}%</span>
                </div>
            `;
            gamesList.appendChild(gameItem);
        });
        
        gamesCard.style.display = 'block';
    }
    
    // Правая колонка - режим просмотра
    document.getElementById('userId').textContent = userDFH.userId;
    document.getElementById('displayUsername').textContent = userDFH.username;
    
    if (userDFH.owner) {
        document.getElementById('displayEmail').textContent = userDFH.email || '—';
    }
    
    document.getElementById('displayCountry').textContent = userDFH.country || 'Не указана';
    
    if (userDFH.createdAt) {
        const date = new Date(userDFH.createdAt);
        document.getElementById('createdAt').textContent = date.toLocaleString('ru-RU');
    }
    
    document.getElementById('displayBio').textContent = userDFH.bio || 'Пока ничего не добавлено';
    
    if (userDFH.owner && userDFH.role) {
        const roleMap = {
            'PLAYER': 'Игрок',
            'ORGANIZER': 'Организатор',
            'ADMIN': 'Администратор'
        };
        document.getElementById('displayRole').textContent = roleMap[userDFH.role] || userDFH.role;
    }
    
    // Загружаем аватар если есть
    if (userDFH.imageUrl) {
        setAvatar(userDFH.imageUrl);
    }
}

// ========== РЕДАКТИРОВАНИЕ ПРОФИЛЯ ==========
function initProfile() {
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const profileForm = document.getElementById('profileForm');
    
    // Открыть форму редактирования
    if (editBtn && cancelBtn && viewMode && editMode) {
        editBtn.addEventListener('click', () => {
            // Заполняем форму текущими данными
            if (currentUserDFH) {
                document.getElementById('editUsername').value = currentUserDFH.username || '';
                document.getElementById('editEmail').value = currentUserDFH.email || '';
                
                if (currentUserDFH.country) {
                    const countrySelect = document.getElementById('editCountry');
                    for (let option of countrySelect.options) {
                        if (option.value === currentUserDFH.country) {
                            option.selected = true;
                            break;
                        }
                    }
                }
                
                document.getElementById('editBio').value = currentUserDFH.bio || '';
            }
            
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        });
        
        cancelBtn.addEventListener('click', () => {
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
        });
    }
    
    // Сохранение изменений профиля - отправляем UpdateUserDFH
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('editUsername').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const country = document.getElementById('editCountry').value || null;
            const bio = document.getElementById('editBio').value.trim() || null;
            
            if (!username || !email) {
                showToast('❌ Имя пользователя и email обязательны', true);
                return;
            }
            
            if (!email.includes('@')) {
                showToast('❌ Введите корректный email', true);
                return;
            }
            
            const updateData = {
                username: username,
                email: email,
                country: country,
                bio: bio
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
                    currentUserDFH = updatedUser;
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
    
    document.getElementById('currentPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    
    document.querySelectorAll('.modal-input').forEach(input => {
        input.classList.remove('error');
    });
    document.getElementById('newPasswordHint').innerHTML = '';
    document.getElementById('confirmPasswordHint').innerHTML = '';
    
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
    closeModalBtn?.addEventListener('click', closePasswordModal);
    cancelPasswordBtn?.addEventListener('click', closePasswordModal);
    
    window.addEventListener('click', (e) => {
        if (isModalOpen && e.target.classList.contains('modal')) {
            closePasswordModal();
        }
    });
    
    function validateNewPassword() {
        const newPassword = newPasswordInput.value;
        const hint = document.getElementById('newPasswordHint');
        
        if (newPassword.length === 0) {
            hint.innerHTML = '';
            newPasswordInput.classList.remove('error', 'success');
            return false;
        }
        
        if (newPassword.length < 6) {
            hint.innerHTML = '❌ Пароль должен содержать минимум 6 символов';
            hint.className = 'input-hint error';
            newPasswordInput.classList.add('error');
            newPasswordInput.classList.remove('success');
            return false;
        } else {
            hint.innerHTML = '✅ Хороший пароль';
            hint.className = 'input-hint success';
            newPasswordInput.classList.remove('error');
            newPasswordInput.classList.add('success');
            return true;
        }
    }
    
    function validateConfirmPassword() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const hint = document.getElementById('confirmPasswordHint');
        
        if (confirmPassword.length === 0) {
            hint.innerHTML = '';
            confirmPasswordInput.classList.remove('error', 'success');
            return false;
        }
        
        if (newPassword !== confirmPassword) {
            hint.innerHTML = '❌ Пароли не совпадают';
            hint.className = 'input-hint error';
            confirmPasswordInput.classList.add('error');
            confirmPasswordInput.classList.remove('success');
            return false;
        } else {
            hint.innerHTML = '✅ Пароли совпадают';
            hint.className = 'input-hint success';
            confirmPasswordInput.classList.remove('error');
            confirmPasswordInput.classList.add('success');
            return true;
        }
    }
    
    newPasswordInput?.addEventListener('input', () => {
        validateNewPassword();
        validateConfirmPassword();
    });
    
    confirmPasswordInput?.addEventListener('input', validateConfirmPassword);
    
    submitPasswordBtn?.addEventListener('click', async () => {
        const currentPassword = document.getElementById('currentPasswordInput').value;
        const newPassword = newPasswordInput.value;
        
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
        
        submitPasswordBtn.disabled = true;
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
            submitPasswordBtn.textContent = 'Сменить пароль';
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isModalOpen) {
            closePasswordModal();
        }
    });
}

// ========== АВАТАР ==========
function setAvatar(avatarData) {
    const avatarPreview = document.getElementById('avatarPreview');
    const profileIcon = document.getElementById('profileIcon');
    
    if (avatarPreview) {
        avatarPreview.innerHTML = '';
        const img = document.createElement('img');
        img.src = avatarData;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        avatarPreview.appendChild(img);
    }
    
    if (profileIcon && document.querySelector('.profile-icon')) {
        const icon = document.querySelector('.profile-icon');
        icon.innerHTML = `<img src="${avatarData}" class="avatar-mini">`;
        icon.style.padding = '0';
        icon.style.overflow = 'hidden';
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
}

// ========== АВТОРИЗАЦИЯ В ШАПКЕ ==========
function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                authContainer.innerHTML = `
                    <div class="profile-icon" id="profileIcon">
                        <i class="fas fa-user-circle"></i>
                    </div>
                `;
                
                const profileIcon = document.getElementById('profileIcon');
                if (profileIcon) {
                    profileIcon.addEventListener('click', () => {
                        window.location.href = '/profile';
                    });
                }
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
        .catch(error => {
            console.error('Ошибка:', error);
        });
}

// ========== ВЫХОД ИЗ АККАУНТА ==========
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
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
        if (item.getAttribute('href') && item.getAttribute('href') !== '#') return;
        item.addEventListener('click', () => showToast('📋 Этот раздел в разработке'));
    });
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    loadUserProfile();      // ← Загружаем профиль через API
    initProfile();
    initAvatarChange();
    initNavBar();
    initLogout();
    initPasswordModal();
});