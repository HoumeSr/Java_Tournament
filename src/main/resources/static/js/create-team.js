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
                const savedAvatar = localStorage.getItem('userAvatar');
                
                if (savedAvatar) {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <img src="${savedAvatar}" class="avatar-mini">
                        </div>
                    `;
                    const profileIcon = document.getElementById('profileIcon');
                    if (profileIcon) {
                        profileIcon.style.padding = '0';
                        profileIcon.style.overflow = 'hidden';
                        profileIcon.addEventListener('click', () => {
                            window.location.href = '/profile';
                        });
                    }
                } else {
                    authContainer.innerHTML = `
                        <div class="profile-icon" id="profileIcon">
                            <i class="fas fa-user-circle"></i>
                        </div>
                    `;
                    document.getElementById('profileIcon')?.addEventListener('click', () => {
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
        });
}

// ========== ПОЛУЧАЕМ РАЗМЕР КОМАНДЫ ИЗ БЭКЕНДА ==========
let teamSize = 3; // значение по умолчанию

function getTeamSize() {
    // Получаем из Thymeleaf (переменная из модели)
    const sizeElement = document.querySelector('.count-number');
    if (sizeElement && sizeElement.textContent) {
        teamSize = parseInt(sizeElement.textContent) || 3;
    }
    return teamSize;
}

// ========== ГЕНЕРАЦИЯ ПОЛЕЙ ДЛЯ ИГРОКОВ ==========
function generateMemberFields() {
    const container = document.getElementById('membersContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const size = getTeamSize();
    
    // Начинаем с 2 (так как 1-й игрок - капитан)
    for (let i = 2; i <= size; i++) {
        const row = document.createElement('div');
        row.className = 'member-row';
        row.innerHTML = `
            <div class="member-number">${i}</div>
            <div class="member-input">
                <input type="text" name="member${i}" placeholder="Никнейм игрока" required>
            </div>
        `;
        container.appendChild(row);
    }
}

// ========== АВТО-КОПИРОВАНИЕ КАПИТАНА ==========
function initCaptainCopy() {
    const captainInput = document.getElementById('captain');
    const member1Field = document.getElementById('member1');
    
    if (captainInput && member1Field) {
        const updateCaptain = () => {
            member1Field.value = captainInput.value;
        };
        
        updateCaptain();
        captainInput.addEventListener('input', updateCaptain);
    }
}

// ========== СБОР ДАННЫХ С ФОРМЫ ==========
function collectMembers() {
    const members = [];
    const size = getTeamSize();
    
    // Добавляем капитана
    const captain = document.getElementById('captain').value.trim();
    if (captain) members.push(captain);
    
    // Добавляем остальных игроков
    for (let i = 2; i <= size; i++) {
        const input = document.querySelector(`input[name="member${i}"]`);
        if (input && input.value.trim()) {
            members.push(input.value.trim());
        }
    }
    
    return members;
}

// ========== ВАЛИДАЦИЯ ФОРМЫ ==========
function validateMembers() {
    const size = getTeamSize();
    const captain = document.getElementById('captain').value.trim();
    
    if (!captain) {
        showToast('❌ Укажите капитана команды', true);
        return false;
    }
    
    for (let i = 2; i <= size; i++) {
        const input = document.querySelector(`input[name="member${i}"]`);
        if (!input || !input.value.trim()) {
            showToast(`❌ Заполните никнейм игрока №${i}`, true);
            return false;
        }
    }
    
    return true;
}

// ========== ОТПРАВКА ФОРМЫ ==========
function initFormSubmit() {
    const form = document.getElementById('createTeamForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const teamName = document.getElementById('teamName').value.trim();
        const captain = document.getElementById('captain').value.trim();
        const telegram = document.getElementById('telegram').value.trim();
        const description = document.getElementById('description').value.trim();
        
        if (!teamName) {
            showToast('❌ Введите название команды', true);
            return;
        }
        
        if (!validateMembers()) return;
        
        const members = collectMembers();
        const teamSize = members.length;
        
        const teamData = {
            name: teamName,
            captain: captain,
            telegram: telegram,
            description: description,
            membersCount: teamSize,
            members: members
        };
        
        console.log('Данные команды:', teamData);
        
        // ОТПРАВКА НА БЭКЕНД
        try {
            const formData = new URLSearchParams();
            formData.append('name', teamName);
            formData.append('captain', captain);
            formData.append('telegram', telegram);
            formData.append('description', description);
            formData.append('membersCount', teamSize);
            members.forEach((member, index) => {
                formData.append(`members[${index}]`, member);
            });
            
            const response = await fetch('/api/teams/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('✅ ' + data.message);
                setTimeout(() => {
                    window.location.href = '/teams';
                }, 2000);
            } else {
                showToast('❌ ' + data.message, true);
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showToast('❌ Ошибка соединения с сервером', true);
        }
    });
}

// ========== ОТМЕНА ==========
function initCancel() {
    const cancelBtn = document.getElementById('cancelBtn');
    if (!cancelBtn) return;
    
    cancelBtn.addEventListener('click', () => {
        if (confirm('Все введённые данные будут потеряны. Продолжить?')) {
            window.location.href = '/';
        }
    });
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


// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    generateMemberFields();    // ← генерируем поля под нужный размер
    initCaptainCopy();
    initFormSubmit();
    initCancel();
    initNavBar();
});