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
        });
}

// ========== ЛОКАЛЬНЫЕ ДАННЫЕ ПРОФИЛЯ ==========
let profileData = {
    country: localStorage.getItem('userCountry') || '',
    bio: localStorage.getItem('userBio') || ''
};

function loadSavedData() {
    const savedCountry = localStorage.getItem('userCountry');
    const savedBio = localStorage.getItem('userBio');
    
    if (savedCountry) {
        document.getElementById('displayCountry').textContent = savedCountry;
        profileData.country = savedCountry;
    }
    
    if (savedBio) {
        document.getElementById('displayBio').textContent = savedBio;
        profileData.bio = savedBio;
    }
    
    const editCountry = document.getElementById('editCountry');
    const editBio = document.getElementById('editBio');
    
    if (editCountry && savedCountry) {
        for (let option of editCountry.options) {
            if (option.value === savedCountry) {
                option.selected = true;
                break;
            }
        }
    }
    
    if (editBio && savedBio) {
        editBio.value = savedBio;
    }
}

function saveProfileDataLocally(country, bio) {
    if (country) {
        localStorage.setItem('userCountry', country);
        document.getElementById('displayCountry').textContent = country;
        profileData.country = country;
    } else {
        localStorage.removeItem('userCountry');
        document.getElementById('displayCountry').textContent = 'Не указана';
        profileData.country = '';
    }
    
    if (bio) {
        localStorage.setItem('userBio', bio);
        document.getElementById('displayBio').textContent = bio;
        profileData.bio = bio;
    } else {
        localStorage.removeItem('userBio');
        document.getElementById('displayBio').textContent = 'Пока ничего не добавлено';
        profileData.bio = '';
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
            viewMode.style.display = 'none';
            editMode.style.display = 'block';
        });
        
        cancelBtn.addEventListener('click', () => {
            viewMode.style.display = 'block';
            editMode.style.display = 'none';
        });
    }
    
    // Сохранение изменений профиля
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('editUsername').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const country = document.getElementById('editCountry').value;
            const bio = document.getElementById('editBio').value.trim();
            
            if (!username || !email) {
                showToast('❌ Имя пользователя и email обязательны', true);
                return;
            }
            
            if (!email.includes('@')) {
                showToast('❌ Введите корректный email', true);
                return;
            }
            
            try {
                const formData = new URLSearchParams();
                formData.append('username', username);
                formData.append('email', email);
                if (country) formData.append('country', country);
                if (bio) formData.append('bio', bio);
                
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Обновляем отображение
                    document.getElementById('displayUsername').textContent = username;
                    document.getElementById('displayUsernameField').textContent = username;
                    document.getElementById('displayEmail').textContent = email;
                    if (country) document.getElementById('displayCountry').textContent = country;
                    if (bio) document.getElementById('displayBio').textContent = bio;
                    
                    // Сохраняем локально
                    saveProfileDataLocally(country, bio);
                    
                    viewMode.style.display = 'block';
                    editMode.style.display = 'none';
                    showToast('✅ ' + data.message);
                } else {
                    showToast('❌ ' + data.message, true);
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showToast('❌ Ошибка соединения с сервером', true);
            }
        });
    }
    
    loadSavedData();
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
        const confirmPassword = confirmPasswordInput.value;
        
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
            const formData = new URLSearchParams();
            formData.append('currentPassword', currentPassword);
            formData.append('newPassword', newPassword);
            
            const response = await fetch('/api/profile/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('✅ ' + data.message);
                closePasswordModal();
            } else {
                showToast('❌ ' + data.message, true);
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

// ========== ВЫХОД ИЗ АККАУНТА ==========
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.removeItem('userCountry');
                localStorage.removeItem('userBio');
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

// ========== АВАТАР ==========
let uploadedImage = null;

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

function initAvatarChange() {
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (!avatarPreview) return;
    
    if (changeAvatarBtn && avatarUpload) {
        changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
        
        avatarUpload.addEventListener('change', (event) => {
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
            reader.onload = (e) => {
                setAvatar(e.target.result);
                showToast('✅ Аватар обновлён!');
            };
            reader.readAsDataURL(file);
        });
    }
    
    avatarPreview.addEventListener('dblclick', () => {
        if (confirm('Сбросить аватар на стандартный?')) {
            resetAvatar();
            showToast('🔄 Аватар сброшен');
        }
    });
    
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) setAvatar(savedAvatar);
}

// ========== НАВИГАЦИЯ ==========
function initNavBar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('href') && item.getAttribute('href') !== '#') return;
        item.addEventListener('click', () => showToast('📋 Этот раздел в разработке'));
    });
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    initProfile();
    initAvatarChange();
    initNavBar();
    initLogout();
    initPasswordModal();
});