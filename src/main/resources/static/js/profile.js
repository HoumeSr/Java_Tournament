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
    }, 2500);
}

// ========== АВТОРИЗАЦИЯ (ТЕСТОВАЯ) ==========
function isUserLoggedIn() {
    return localStorage.getItem('userLoggedIn') === 'true';
}

function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    const isLoggedIn = isUserLoggedIn();
    
    if (isLoggedIn) {
        const savedAvatar = localStorage.getItem('userAvatar');
        
        authContainer.innerHTML = `
            <div class="profile-wrapper">
                <div class="profile-icon" id="profileIcon">
                    ${savedAvatar ? `<img src="${savedAvatar}" class="avatar-mini">` : '<i class="fas fa-user-circle"></i>'}
                </div>
                <button class="logout-mini" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
        
        // Если есть аватар, применяем стили
        if (savedAvatar) {
            const profileIcon = document.getElementById('profileIcon');
            if (profileIcon) {
                profileIcon.style.padding = '0';
                profileIcon.style.overflow = 'hidden';
            }
        }
        
        document.getElementById('profileIcon')?.addEventListener('click', () => {
            window.location.href = '/profile';
        });
        
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('userAvatar');
            showToast('👋 Вы вышли из аккаунта');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        });
    } else {
        authContainer.innerHTML = `
            <button class="btn-outline" id="registerBtn">Регистрация</button>
            <button class="btn-primary" id="loginBtn">Вход</button>
            <button class="btn-test" id="testLoginBtn">🧪 Тест</button>
        `;
        
        document.getElementById('registerBtn')?.addEventListener('click', () => {
            window.location.href = '/register';
        });
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            window.location.href = '/login';
        });
        document.getElementById('testLoginBtn')?.addEventListener('click', () => {
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('username', 'БоевойБобёр');
            localStorage.setItem('userEmail', 'bobr@arenatop.ru');
            showToast('✅ Вы вошли как БоевойБобёр');
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
    }
}

// ========== ПРОФИЛЬ (СТАТИЧЕСКАЯ ВЕРСИЯ) ==========
let profileData = {
    id: '#10042',
    username: 'БоевойБобёр',
    email: 'bobr@arenatop.ru',
    country: 'Россия',
    createdAt: '15 января 2025, 12:00',
    createdAtShort: '15.01.2025',
    bio: 'КМС по шахматам, играю в CS2, организую любительские турниры'
};

function updateDisplayData() {
    document.getElementById('displayId').textContent = profileData.id;
    document.getElementById('displayUsername').textContent = profileData.username;
    document.getElementById('displayUsernameField').textContent = profileData.username;
    document.getElementById('displayEmail').textContent = profileData.email;
    document.getElementById('displayCountry').textContent = profileData.country;
    document.getElementById('displayCreatedAt').textContent = profileData.createdAtShort;
    document.getElementById('displayCreatedAtField').textContent = profileData.createdAt;
    document.getElementById('displayBio').textContent = profileData.bio;
    
    // Обновляем поля редактирования
    document.getElementById('editUsername').value = profileData.username;
    document.getElementById('editEmail').value = profileData.email;
    document.getElementById('editCountry').value = profileData.country;
    document.getElementById('editBio').value = profileData.bio;
}

function initProfile() {
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const profileForm = document.getElementById('profileForm');
    
    // Редактирование
    if (editBtn && cancelBtn && viewMode && editMode) {
        editBtn.addEventListener('click', () => {
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        });
        
        cancelBtn.addEventListener('click', () => {
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
        });
    }
    
    // Сохранение изменений
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Обновляем данные
            profileData.username = document.getElementById('editUsername').value.trim();
            profileData.email = document.getElementById('editEmail').value.trim();
            profileData.country = document.getElementById('editCountry').value;
            profileData.bio = document.getElementById('editBio').value.trim();
            
            if (!profileData.username || !profileData.email) {
                showToast('❌ Имя пользователя и email обязательны', true);
                return;
            }
            
            if (!profileData.email.includes('@')) {
                showToast('❌ Введите корректный email', true);
                return;
            }
            
            updateDisplayData();
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
            showToast('✅ Профиль успешно обновлён!');
        });
    }
    
    // Смена пароля
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            const newPassword = prompt('Введите новый пароль (минимум 6 символов):');
            if (newPassword && newPassword.length >= 6) {
                showToast('✅ Пароль успешно изменён!');
            } else if (newPassword && newPassword.length < 6) {
                showToast('❌ Пароль должен содержать минимум 6 символов', true);
            }
        });
    }
    
    // Заполняем начальные данные
    updateDisplayData();
}

// ========== НАВИГАЦИЯ ==========
function initNavBar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('href') && item.getAttribute('href') !== '#') return;
        item.addEventListener('click', () => {
            showToast('📋 Этот раздел в разработке');
        });
    });
}

function initAvatarChange() {
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (!avatarPreview) return;
    
    // Смена аватара (кнопка камера)
    if (changeAvatarBtn && avatarUpload) {
        changeAvatarBtn.addEventListener('click', () => {
            avatarUpload.click();
        });
        
        avatarUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/gif') && !file.type.match('image/webp')) {
                showToast('❌ Поддерживаются только JPEG, PNG, GIF и WEBP', true);
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showToast('❌ Файл не должен превышать 5MB', true);
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const avatarData = e.target.result;
                setAvatar(avatarData);
                showToast('✅ Аватар успешно обновлён!');
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // Двойной клик для сброса аватара
    avatarPreview.addEventListener('dblclick', () => {
    if (confirm('Вы уверены, что хотите сбросить аватар на стандартный?')) {
        resetAvatar();
        showToast('🔄 Аватар сброшен на стандартный');
    }
});
    
    // Загружаем сохранённую аватарку
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar && savedAvatar !== 'reset') {
        setAvatar(savedAvatar);
    }
}

// Функция установки аватара
function setAvatar(avatarData) {
    const avatarPreview = document.getElementById('avatarPreview');
    const profileIcon = document.getElementById('profileIcon');
    
    localStorage.setItem('userAvatar', avatarData);
    
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
    
    if (profileIcon) {
        profileIcon.innerHTML = `<img src="${avatarData}" class="avatar-mini">`;
        profileIcon.style.padding = '0';
        profileIcon.style.overflow = 'hidden';
    }
}

// Функция сброса аватара
function resetAvatar() {
    const avatarPreview = document.getElementById('avatarPreview');
    const profileIcon = document.getElementById('profileIcon');
    
    localStorage.removeItem('userAvatar');
    
    if (avatarPreview) {
        avatarPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
    
    if (profileIcon) {
        profileIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
        profileIcon.style.padding = '';
        profileIcon.style.overflow = '';
    }
}

// Функция установки аватара
function setAvatar(avatarData) {
    const avatarPreview = document.getElementById('avatarPreview');
    const profileIcon = document.getElementById('profileIcon');
    
    // Сохраняем в localStorage
    localStorage.setItem('userAvatar', avatarData);
    
    // Обновляем аватар в профиле
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
    
    // Обновляем иконку в шапке
    if (profileIcon) {
        profileIcon.innerHTML = `<img src="${avatarData}" class="avatar-mini">`;
        profileIcon.style.padding = '0';
        profileIcon.style.overflow = 'hidden';
    }
}

// Функция сброса аватара
function resetAvatar() {
    const avatarPreview = document.getElementById('avatarPreview');
    const profileIcon = document.getElementById('profileIcon');
    
    // Удаляем из localStorage
    localStorage.removeItem('userAvatar');
    
    // Восстанавливаем стандартную иконку в профиле
    if (avatarPreview) {
        avatarPreview.innerHTML = '<i class="fas fa-user-circle"></i>';
    }
    
    // Восстанавливаем стандартную иконку в шапке
    if (profileIcon) {
        profileIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
        profileIcon.style.padding = '';
        profileIcon.style.overflow = '';
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    initProfile();
    initNavBar();
    initAvatarChange();
});