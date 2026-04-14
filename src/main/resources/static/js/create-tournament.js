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
                
                if (savedAvatar && savedAvatar !== 'null' && savedAvatar !== 'undefined') {
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

// ========== ВАЛИДАЦИЯ ДАТ ==========
function validateDates() {
    const startDate = document.getElementById('startDate').value;
    
    if (startDate) {
        const today = new Date().toISOString().split('T')[0];
        if (startDate < today) {
            showToast('❌ Дата начала не может быть раньше сегодняшнего дня', true);
            return false;
        }
    }
    return true;
}

// ========== ПОКАЗ/СКРЫТИЕ ПОЛЕЙ ПРИЗОВЫХ ==========
function initPrizeToggle() {
    const hasPrizeCheckbox = document.getElementById('hasPrize');
    const prizeFields = document.getElementById('prizeFields');
    
    if (!hasPrizeCheckbox || !prizeFields) return;
    
    hasPrizeCheckbox.addEventListener('change', () => {
        prizeFields.style.display = hasPrizeCheckbox.checked ? 'block' : 'none';
    });
}

// ========== ЗАГРУЗКА ИЗОБРАЖЕНИЯ ==========
let uploadedImage = null;

function initImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const fileInput = document.getElementById('tournamentImage');
    const preview = document.getElementById('imagePreview');
    
    if (!uploadArea || !fileInput || !preview) return;
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        preview.style.borderColor = 'var(--accent)';
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        preview.style.borderColor = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        preview.style.borderColor = '';
        const file = e.dataTransfer.files[0];
        if (file) handleImageFile(file);
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
    });
    
    function handleImageFile(file) {
        if (!file.type.match('image/jpeg|image/png|image/webp')) {
            showToast('❌ Поддерживаются JPEG, PNG, WEBP', true);
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ Файл не более 5MB', true);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = e.target.result;
            preview.innerHTML = `<img src="${uploadedImage}" style="width:100%;max-height:200px;object-fit:cover;border-radius:1rem">`;
            preview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
}

// ========== ОТПРАВКА ФОРМЫ ==========
function initFormSubmit() {
    const form = document.getElementById('createTournamentForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const tournamentData = {
            name: document.getElementById('tournamentName').value.trim(),
            category: document.getElementById('category').value,
            startDate: document.getElementById('startDate').value,
            location: document.getElementById('location').value,
            maxPlayers: document.getElementById('maxPlayers').value,
            hasPrize: document.getElementById('hasPrize').checked,
            prizeAmount: document.getElementById('hasPrize').checked ? document.getElementById('prizeAmount').value : null,
            prizeCurrency: document.getElementById('hasPrize').checked ? document.getElementById('prizeCurrency').value : null,
            visibility: document.getElementById('visibility').value,
            description: document.getElementById('description').value,
            image: uploadedImage
        };
        
        if (!tournamentData.name) {
            showToast('❌ Введите название турнира', true);
            return;
        }
        
        if (!tournamentData.category) {
            showToast('❌ Выберите категорию', true);
            return;
        }
        
        if (!tournamentData.startDate) {
            showToast('❌ Укажите дату проведения', true);
            return;
        }
        
        if (!validateDates()) return;
        
        console.log('Данные турнира:', tournamentData);
        showToast('✅ Турнир успешно создан!');
        
        form.reset();
        uploadedImage = null;
        
        const prizeFields = document.getElementById('prizeFields');
        if (prizeFields) prizeFields.style.display = 'none';
        
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Нажмите или перетащите изображение</p>
                <span class="image-hint">PNG, JPG, WEBP до 5MB</span>
            `;
            preview.classList.remove('has-image');
        }
        
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
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

// ========== УСТАНОВКА МИНИМАЛЬНОЙ ДАТЫ ==========
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.min = today;
    }
}

function initNumberControls() {
    const numberInput = document.getElementById('maxPlayers');
    if (!numberInput) return;
    
    const controls = numberInput.nextElementSibling;
    if (!controls || !controls.classList.contains('number-controls')) return;
    
    const upBtn = controls.querySelector('.number-up');
    const downBtn = controls.querySelector('.number-down');
    
    if (upBtn) {
        upBtn.addEventListener('click', () => {
            let value = parseInt(numberInput.value) || 0;
            const max = parseInt(numberInput.getAttribute('max')) || 256;
            if (value < max) {
                numberInput.value = value + 1;
            }
        });
    }
    
    if (downBtn) {
        downBtn.addEventListener('click', () => {
            let value = parseInt(numberInput.value) || 0;
            const min = parseInt(numberInput.getAttribute('min')) || 2;
            if (value > min) {
                numberInput.value = value - 1;
            }
        });
    }
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    initPrizeToggle();
    initImageUpload();
    initFormSubmit();
    initCancel();
    initNavBar();
    setMinDate();
    initNumberControls();
});