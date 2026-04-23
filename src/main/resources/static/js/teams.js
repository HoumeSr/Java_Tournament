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

// ========== ПРОВЕРКА АВТОРИЗАЦИИ ==========
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        return data.authenticated;
    } catch (error) {
        return false;
    }
}

// ========== ЗАГРУЗКА КОМАНД ==========
async function loadTeams() {
    const container = document.getElementById('teamsContainer');
    
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <h3>Требуется авторизация</h3>
                <p>Войдите в аккаунт, чтобы просматривать свои команды</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка команд...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/api/teams/my');
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки команд');
        }
        
        const teams = await response.json();
        
        if (!teams || teams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Пока нет команд</h3>
                    <p>Создайте свою первую команду, нажав на кнопку "+"</p>
                </div>
            `;
            return;
        }
        
        renderTeams(teams);
    } catch (error) {
        console.error('Error loading teams:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ошибка загрузки</h3>
                <p>Не удалось загрузить список команд. Попробуйте позже.</p>
                <button class="retry-btn" onclick="loadTeams()">
                    <i class="fas fa-sync-alt"></i> Повторить
                </button>
            </div>
        `;
    }
}

// ========== ОТРИСОВКА КОМАНД ==========
function renderTeams(teams) {
    const container = document.getElementById('teamsContainer');
    
    container.innerHTML = `
        <div class="teams-grid">
            ${teams.map(team => `
                <div class="team-card" onclick="window.location.href='/team/${team.id}'">
                    <div class="team-image">
                        ${team.imageUrl ? 
                            `<img src="${team.imageUrl}" alt="${escapeHtml(team.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                             <i class="fas fa-users" style="display: none;"></i>` : 
                            `<i class="fas fa-users"></i>`
                        }
                    </div>
                    <div class="team-info">
                        <div class="team-name">
                            ${escapeHtml(team.name)}
                            <span class="team-captain">
                                <i class="fas fa-crown"></i> ${escapeHtml(team.captainUsername || 'Нет капитана')}
                            </span>
                        </div>
                        <div class="team-tag">
                            <i class="fas fa-hashtag"></i> ${escapeHtml(team.name.substring(0, 3).toUpperCase())}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
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

// ========== МОДАЛЬНОЕ ОКНО СОЗДАНИЯ КОМАНДЫ ==========
let currentUploadedImageUrl = null;
let availableGames = [];

async function loadGamesForModal() {
    try {
        const response = await fetch('/api/gametypes');
        if (!response.ok) throw new Error('Ошибка загрузки игр');
        
        const games = await response.json();
        availableGames = games.filter(game => game.isActive !== false);
        
        const select = document.getElementById('modalGameType');
        if (select) {
            if (availableGames.length > 0) {
                select.innerHTML = '<option value="">— Выберите игру —</option>';
                availableGames.forEach(game => {
                    select.innerHTML += `<option value="${game.id}">${getGameIcon(game.name)} ${escapeHtml(game.name)}</option>`;
                });
            } else {
                select.innerHTML = '<option value="">— Игры не найдены —</option>';
            }
        }
    } catch (error) {
        console.error('Error loading games:', error);
        const select = document.getElementById('modalGameType');
        if (select) {
            select.innerHTML = '<option value="">— Ошибка загрузки игр —</option>';
        }
    }
}

function getGameIcon(gameName) {
    if (!gameName) return '🎮';
    const lower = gameName.toLowerCase();
    if (lower.includes('chess')) return '♟️';
    if (lower.includes('tennis')) return '🎾';
    if (lower.includes('dota')) return '⚔️';
    if (lower.includes('counter') || lower.includes('cs')) return '🔫';
    if (lower.includes('valorant')) return '🎯';
    if (lower.includes('league') || lower.includes('lol')) return '🏆';
    if (lower.includes('football') || lower.includes('fifa')) return '⚽';
    if (lower.includes('rocket')) return '🚗';
    if (lower.includes('fortnite')) return '🎈';
    return '🎮';
}

function openCreateTeamModal() {
    const modal = document.getElementById('createTeamModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        const form = document.getElementById('modalCreateTeamForm');
        if (form) form.reset();
        
        const preview = document.getElementById('modalImagePreview');
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Нажмите для загрузки</p>
                <span>PNG, JPG, WEBP до 5MB</span>
            `;
        }
        currentUploadedImageUrl = null;
        
        if (availableGames.length === 0) {
            loadGamesForModal();
        }
    }
}

function closeCreateTeamModal() {
    const modal = document.getElementById('createTeamModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

async function uploadModalImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        const result = await response.json();
        return result.url || result.imageUrl;
    } catch (error) {
        console.error('Upload error:', error);
        return null;
    }
}

function initModalImageUpload() {
    const uploadArea = document.getElementById('modalImageUploadArea');
    const imageInput = document.getElementById('modalTeamImage');
    const previewContainer = document.getElementById('modalImagePreview');
    
    if (!uploadArea || !imageInput) return;
    
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });
    
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ Изображение не должно превышать 5MB', true);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            previewContainer.innerHTML = `
                <div class="image-preview-modal">
                    <img src="${ev.target.result}" alt="Preview">
                    <button type="button" class="remove-image-modal" id="removeModalImage">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            const removeBtn = document.getElementById('removeModalImage');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    previewContainer.innerHTML = `
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Нажмите для загрузки</p>
                        <span>PNG, JPG, WEBP до 5MB</span>
                    `;
                    currentUploadedImageUrl = null;
                    imageInput.value = '';
                });
            }
        };
        reader.readAsDataURL(file);
        
        const imageUrl = await uploadModalImage(file);
        if (imageUrl) {
            currentUploadedImageUrl = imageUrl;
            showToast('✅ Изображение загружено');
        }
    });
}

async function initModalFormSubmit() {
    const form = document.getElementById('modalCreateTeamForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const auth = await checkAuth();
        if (!auth) {
            showToast('❌ Для создания команды нужно войти в аккаунт', true);
            closeCreateTeamModal();
            setTimeout(() => window.location.href = '/login', 1200);
            return;
        }
        
        const teamName = document.getElementById('modalTeamName')?.value.trim();
        if (!teamName) {
            showToast('❌ Введите название команды', true);
            return;
        }
        
        if (teamName.length < 3) {
            showToast('❌ Название команды должно быть не менее 3 символов', true);
            return;
        }
        
        const gameTypeId = document.getElementById('modalGameType')?.value;
        if (!gameTypeId) {
            showToast('❌ Выберите игру', true);
            return;
        }
        
        const payload = {
            name: teamName,
            gameTypeId: parseInt(gameTypeId),
            imageUrl: currentUploadedImageUrl || null
        };
        
        try {
            const response = await fetch('/api/teams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const team = await response.json();
            
            if (!response.ok || !team.id) {
                throw new Error(team.message || 'Не удалось создать команду');
            }
            
            showToast('✅ Команда успешно создана!');
            closeCreateTeamModal();
            
            setTimeout(() => {
                window.location.href = `/team/${team.id}`;
            }, 1500);
            
        } catch (error) {
            showToast(`❌ ${error.message}`, true);
        }
    });
}

function initModal() {
    loadGamesForModal();
    initModalImageUpload();
    initModalFormSubmit();
    
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeCreateTeamModal);
    }
    
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeCreateTeamModal);
    
    const cancelBtn = document.getElementById('cancelModalBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeCreateTeamModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('createTeamModal');
            if (modal && modal.style.display === 'flex') {
                closeCreateTeamModal();
            }
        }
    });
}

function initFloatingButton() {
    const fabBtn = document.getElementById('createTeamFab');
    if (fabBtn) {
        const newFabBtn = fabBtn.cloneNode(true);
        fabBtn.parentNode.replaceChild(newFabBtn, fabBtn);
        newFabBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openCreateTeamModal();
        });
    }
}

function init() {
    loadTeams();
    initModal();
    initFloatingButton();
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    init();
});