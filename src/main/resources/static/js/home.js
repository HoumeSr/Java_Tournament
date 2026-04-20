// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let currentCategory = 'all';
let tournaments = [];      // Реальные турниры из API
let categories = [];       // Категории из API или статические

// Статические категории (можно загружать с бэка)
const staticCategories = [
    { id: "all", label: "Все", icon: "🌍" },
    { id: "chess", label: "Шахматы", icon: "♟️" },
    { id: "tennis", label: "Теннис", icon: "🎾" },
    { id: "esports", label: "Киберспорт", icon: "🎮" },
    { id: "football", label: "Киберфутбол", icon: "⚽" },
    { id: "fighting", label: "Файтинги", icon: "🥋" }
];

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

function showToast(message, isError = false) {
    // Создаём toast если его нет
    let toast = document.getElementById('demoToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'demoToast';
        toast.className = 'demo-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1f2937;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
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

function getCategoryDisplay(categoryId) {
    const map = {
        'chess': '♟️ Шахматы',
        'tennis': '🎾 Теннис',
        'esports': '🎮 Киберспорт',
        'football': '⚽ Киберфутбол',
        'fighting': '🥋 Файтинг'
    };
    return map[categoryId] || '🏆 Турнир';
}

function formatDate(dateString) {
    if (!dateString) return 'Дата не указана';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// ========== ЗАГРУЗКА ДАННЫХ С БЭКЕНДА ==========
// GET /api/tournaments - возвращает List<TournamentShortDFH>
async function loadTournaments() {
    try {
        const response = await fetch('/api/tournaments');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📥 Загружены турниры:', data);
        
        // Преобразуем TournamentShortDFH в формат для отображения
        tournaments = data.map(tournament => ({
            id: tournament.id,
            name: tournament.title,
            category: mapGameToCategory(tournament.gameName),
            prize: tournament.prizeFund || 'Не указан',
            date: tournament.startDate ? formatDate(tournament.startDate) : 'Дата не указана',
            location: tournament.location || 'Online',
            players: tournament.maxParticipants || 0,
            status: tournament.status,
            organizer: tournament.organizerUsername,
            imageUrl: tournament.imageUrl
        }));
        
        renderTournaments();
        updateTournamentCount();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки турниров:', error);
        showToast('❌ Не удалось загрузить турниры', true);
        
        // Показываем заглушку
        tournaments = [];
        renderTournaments();
    }
}

// Маппинг игры в категорию
function mapGameToCategory(gameName) {
    if (!gameName) return 'all';
    
    const lowerName = gameName.toLowerCase();
    
    if (lowerName.includes('шахм') || lowerName.includes('chess')) return 'chess';
    if (lowerName.includes('теннис') || lowerName.includes('tennis')) return 'tennis';
    if (lowerName.includes('cs') || lowerName.includes('valorant') || 
        lowerName.includes('dota') || lowerName.includes('lol') || 
        lowerName.includes('кибер')) return 'esports';
    if (lowerName.includes('футбол') || lowerName.includes('football') || 
        lowerName.includes('efootball')) return 'football';
    if (lowerName.includes('tekken') || lowerName.includes('mma') || 
        lowerName.includes('файтинг')) return 'fighting';
    
    return 'all';
}

// ========== ЗАГРУЗКА КАТЕГОРИЙ ==========
// GET /api/gametypes - возвращает List<GameTypeDFH>
async function loadCategories() {
    try {
        const response = await fetch('/api/gametypes');
        
        if (response.ok) {
            const gameTypes = await response.json();
            console.log('📥 Загружены игры:', gameTypes);
            
            // Преобразуем GameTypeDFH в категории
            const dynamicCategories = gameTypes
                .filter(game => game.isActive)
                .map(game => ({
                    id: game.code || game.name.toLowerCase(),
                    label: game.name,
                    icon: getGameIcon(game.name)
                }));
            
            // Объединяем с "Все"
            categories = [
                { id: "all", label: "Все", icon: "🌍" },
                ...dynamicCategories
            ];
        } else {
            // Fallback на статические категории
            categories = staticCategories;
        }
        
        renderCategories();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки категорий:', error);
        categories = staticCategories;
        renderCategories();
    }
}

function getGameIcon(gameName) {
    const icons = {
        'chess': '♟️',
        'tennis': '🎾',
        'cs': '🎮',
        'valorant': '🎮',
        'dota': '🎮',
        'football': '⚽',
        'fighting': '🥋'
    };
    
    const lowerName = gameName.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
        if (lowerName.includes(key)) return icon;
    }
    return '🏆';
}

// ========== РЕНДЕР КАТЕГОРИЙ ==========
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `cat-btn ${currentCategory === cat.id ? 'active-cat' : ''}`;
        btn.innerHTML = `${cat.icon} ${cat.label}`;
        btn.dataset.cat = cat.id;
        btn.addEventListener('click', () => {
            currentCategory = cat.id;
            renderCategories();
            renderTournaments();
        });
        container.appendChild(btn);
    });
}

// ========== ФИЛЬТРАЦИЯ ТУРНИРОВ ==========
function getFilteredTournaments() {
    if (currentCategory === 'all') {
        return [...tournaments];
    }
    return tournaments.filter(t => t.category === currentCategory);
}

function updateTournamentCount() {
    const countSpan = document.getElementById('tournamentCount');
    if (countSpan) {
        const filtered = getFilteredTournaments();
        countSpan.innerText = `${filtered.length} событий`;
    }
}

// ========== РЕНДЕР ТУРНИРОВ ==========
function renderTournaments() {
    const filtered = getFilteredTournaments();
    const grid = document.getElementById('tournamentsGrid');
    const countSpan = document.getElementById('tournamentCount');
    
    if (!grid) return;
    
    if (countSpan) {
        countSpan.innerText = `${filtered.length} событий`;
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-results">😔 В этой категории пока нет турниров. Загляни позже!</div>`;
        return;
    }
    
    grid.innerHTML = '';
    
    filtered.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tournament-card';
        
        // Клик по карточке - переход на страницу турнира
        card.addEventListener('click', (e) => {
            if (e.target.closest('.register-badge') || e.target.closest('.arrow-link')) return;
            window.location.href = `/tournaments/${t.id}`;
        });
        
        // Баннер с картинкой
        const bannerDiv = document.createElement('div');
        bannerDiv.className = 'card-banner';
        
        if (t.imageUrl) {
            bannerDiv.style.backgroundImage = `linear-gradient(125deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('${t.imageUrl}')`;
        } else {
            bannerDiv.style.background = `linear-gradient(125deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('https://source.unsplash.com/featured/?${t.category},tournament')`;
        }
        bannerDiv.style.backgroundSize = 'cover';
        bannerDiv.style.backgroundPosition = 'center 30%';
        
        // Статус турнира
        let statusBadge = '';
        if (t.status === 'REGISTRATION_OPEN') {
            statusBadge = '<span class="status-badge open">🔥 Регистрация открыта</span>';
        } else if (t.status === 'IN_PROGRESS') {
            statusBadge = '<span class="status-badge in-progress">⚡ Идёт турнир</span>';
        } else if (t.status === 'FINISHED') {
            statusBadge = '<span class="status-badge finished">🏆 Завершён</span>';
        } else {
            statusBadge = `<span class="category-badge">${getCategoryDisplay(t.category)}</span>`;
        }
        
        bannerDiv.innerHTML = statusBadge;
        
        // Контент карточки
        const contentDiv = document.createElement('div');
        contentDiv.className = 'card-content';
        contentDiv.innerHTML = `
            <div class="tourney-name">${escapeHtml(t.name)}</div>
            <div class="tourney-details">
                <span class="detail-item">📅 ${t.date}</span>
                <span class="detail-item">📍 ${t.location}</span>
                <span class="detail-item">👥 ${t.players} участ.</span>
            </div>
            <div class="prize">🏆 Призовой фонд: ${t.prize}</div>
        `;
        
        // Футер карточки
        const footerDiv = document.createElement('div');
        footerDiv.className = 'card-footer';
        
        // Показываем кнопку регистрации только если статус позволяет
        if (t.status === 'REGISTRATION_OPEN') {
            footerDiv.innerHTML = `
                <span class="register-badge">🔥 Зарегистрироваться</span>
                <span class="arrow-link">Подробнее →</span>
            `;
            
            footerDiv.querySelector('.register-badge')?.addEventListener('click', async (e) => {
                e.stopPropagation();
                await registerForTournament(t.id);
            });
        } else {
            footerDiv.innerHTML = `
                <span class="arrow-link" style="justify-content: flex-end;">Подробнее →</span>
            `;
        }
        
        card.appendChild(bannerDiv);
        card.appendChild(contentDiv);
        card.appendChild(footerDiv);
        grid.appendChild(card);
    });
}

// ========== РЕГИСТРАЦИЯ НА ТУРНИР ==========
async function registerForTournament(tournamentId) {
    // Сначала проверяем авторизацию
    const authCheck = await fetch('/api/auth/check');
    const authData = await authCheck.json();
    
    if (!authData.authenticated) {
        showToast('❌ Войдите в аккаунт для регистрации на турнир', true);
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        return;
    }
    
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast('✅ Вы успешно зарегистрированы на турнир!');
        } else {
            showToast('❌ ' + (data.message || 'Ошибка регистрации'), true);
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showToast('❌ Ошибка соединения с сервером', true);
    }
}

// ========== АВТОРИЗАЦИЯ И ПРОФИЛЬ В ШАПКЕ ==========
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

// ========== КНОПКА СОЗДАНИЯ ТУРНИРА ==========
function updateCreateTournamentButton() {
    const btn = document.getElementById('createTournamentBtn');
    if (!btn) return;
    
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            // Показываем кнопку только авторизованным пользователям
            // и желательно с ролью ORGANIZER или ADMIN
            btn.style.display = data.authenticated ? 'flex' : 'none';
        })
        .catch(() => {
            btn.style.display = 'none';
        });
}

// ========== НАВИГАЦИЯ ==========
function initNavBar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href !== '#') return;
        
        item.addEventListener('click', () => {
            const page = item.innerText.trim().toLowerCase();
            const routes = {
                'команды': '/teams',
                'матчи': '/matches',
                'рейтинг': '/rating'
            };
            
            if (routes[page]) {
                window.location.href = routes[page];
            } else {
                showToast('📋 Этот раздел в разработке');
            }
        });
    });
}

// ========== CSS ДЛЯ СТАТУСОВ (добавить в home.css) ==========
const styleForStatuses = document.createElement('style');
styleForStatuses.textContent = `
    .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background: rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
    }
    .status-badge.open {
        background: #10b981;
        color: white;
    }
    .status-badge.in-progress {
        background: #f59e0b;
        color: white;
    }
    .status-badge.finished {
        background: #6b7280;
        color: white;
    }
    .demo-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(styleForStatuses);

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', async () => {
    // Загружаем данные
    await loadCategories();
    await loadTournaments();
    
    // Инициализируем UI
    initNavBar();
    updateAuthButtons();
    updateCreateTournamentButton();
});