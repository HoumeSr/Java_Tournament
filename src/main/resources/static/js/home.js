// ========== ДАННЫЕ ТУРНИРОВ ==========
const tournamentsData = [
    { id: 1, name: "Гран-при Москва 2025", category: "chess", prize: "1 200 000 ₽", date: "15–20 июня", location: "Online / Москва", players: 128 },
    { id: 2, name: "Кубок мира по рапиду", category: "chess", prize: "$85,000", date: "3–7 июля", location: "Дубай", players: 64 },
    { id: 3, name: "Лига чемпионов (блиц)", category: "chess", prize: "500 000 ₽", date: "28 авг", location: "Санкт-Петербург", players: 32 },
    { id: 4, name: "Кубок Кремля 2025", category: "tennis", prize: "$750,000", date: "18–26 окт", location: "Москва", players: 48 },
    { id: 5, name: "Adriatic Challenger", category: "tennis", prize: "€54,000", date: "12–19 сент", location: "Белград", players: 32 },
    { id: 6, name: "Открытый чемпионат Казани", category: "tennis", prize: "3 200 000 ₽", date: "1–7 нояб", location: "Казань", players: 64 },
    { id: 7, name: "VALORANT Challengers EMEA", category: "esports", prize: "$100,000", date: "5–9 июн", location: "Online", players: 16 },
    { id: 8, name: "CS2 Major RMR", category: "esports", prize: "$250,000", date: "22–30 авг", location: "Кёльн", players: 24 },
    { id: 9, name: "Dota 2 Pro Circuit", category: "esports", prize: "$500,000", date: "10–18 дек", location: "Сингапур", players: 12 },
    { id: 10, name: "League of Legends EMEA Masters", category: "esports", prize: "€150,000", date: "17–21 июля", location: "Мюнхен", players: 20 },
    { id: 11, name: "eFootball Open Cup", category: "football", prize: "50 000 $", date: "1–4 сент", location: "Online", players: 64 },
    { id: 12, name: "Cyber Football League", category: "football", prize: "30 000 €", date: "12–15 нояб", location: "Милан", players: 32 },
    { id: 13, name: "MMA Esports GP", category: "fighting", prize: "$75,000", date: "5–8 окт", location: "Лас-Вегас", players: 16 },
    { id: 14, name: "Tekken World Tour", category: "fighting", prize: "$120,000", date: "20–24 фев", location: "Токио", players: 32 },
    { id: 15, name: "Суперфинал чемпионата России", category: "chess", prize: "3 000 000 ₽", date: "9–18 дек", location: "Сочи", players: 12 },
    { id: 16, name: "St. Petersburg Open", category: "tennis", prize: "$1,200,000", date: "10–17 фев", location: "СПб", players: 56 },
    { id: 17, name: "R6 Siege Major", category: "esports", prize: "$300,000", date: "14–21 мар", location: "Бостон", players: 16 }
];

const categories = [
    { id: "all", label: "Все", icon: "🌍" },
    { id: "chess", label: "Шахматы", icon: "♟️" },
    { id: "tennis", label: "Теннис", icon: "🎾" },
    { id: "esports", label: "Киберспорт", icon: "🎮" },
    { id: "football", label: "Киберфутбол", icon: "⚽" },
    { id: "fighting", label: "Файтинги", icon: "🥋" }
];

let currentCategory = 'all';

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function getCategoryDisplay(category) {
    const map = {
        'chess': '♟️ Шахматы',
        'tennis': '🎾 Теннис',
        'esports': '🎮 Киберспорт',
        'football': '⚽ Киберфутбол',
        'fighting': '🥋 Файтинг'
    };
    return map[category] || '🏆 Турнир';
}

function getFilteredTournaments(category) {
    if (category === 'all') return [...tournamentsData];
    return tournamentsData.filter(t => t.category === category);
}

// ========== АВТОРИЗАЦИЯ И ПРОФИЛЬ В ШАПКЕ ==========
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return { authenticated: false };
    }
}

function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    // Проверяем сессию через AJAX
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                const username = data.user?.username || 'User';
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
            // Fallback: показываем кнопки входа
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

// ========== РЕНДЕР ТУРНИРОВ ==========
function renderTournaments() {
    const filtered = getFilteredTournaments(currentCategory);
    const grid = document.getElementById('tournamentsGrid');
    const countSpan = document.getElementById('tournamentCount');
    
    if (!grid || !countSpan) return;
    
    countSpan.innerText = `${filtered.length} событий`;
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-results">😔 В этой категории пока нет турниров. Загляни позже!</div>`;
        return;
    }
    
    grid.innerHTML = '';
    
    filtered.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tournament-card';
        
        card.addEventListener('click', (e) => {
            if (e.target.closest('.register-badge') || e.target.closest('.arrow-link')) return;
            alert(`🔁 Переход на страницу турнира: "${t.name}"`);
        });
        
        const bannerDiv = document.createElement('div');
        bannerDiv.className = 'card-banner';
        bannerDiv.style.background = `linear-gradient(125deg, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url('https://source.unsplash.com/featured/?${t.category},tournament')`;
        bannerDiv.style.backgroundSize = 'cover';
        bannerDiv.style.backgroundPosition = 'center 30%';
        bannerDiv.innerHTML = `<span class="category-badge">${getCategoryDisplay(t.category)}</span>`;
        
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
        
        const footerDiv = document.createElement('div');
        footerDiv.className = 'card-footer';
        footerDiv.innerHTML = `
            <span class="register-badge">🔥 Открыта регистрация</span>
            <span class="arrow-link">Подробнее →</span>
        `;
        
        footerDiv.querySelector('.register-badge')?.addEventListener('click', (e) => {
            e.stopPropagation();
            alert(`📝 Регистрация на турнир "${t.name}"`);
        });
        
        card.appendChild(bannerDiv);
        card.appendChild(contentDiv);
        card.appendChild(footerDiv);
        grid.appendChild(card);
    });
}

// ========== НАВИГАЦИЯ ==========
function initNavBar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active-nav'));
            item.classList.add('active-nav');
            const page = item.innerText.trim().toLowerCase();
            const messages = {
                'команды': '📋 Страница команд в разработке',
                'матчи': '⚡ Расписание матчей в разработке',
                'рейтинг': '📊 Рейтинг игроков в разработке'
            };
            alert(messages[page] || 'Раздел в разработке');
        });
    });
}

function updateCreateTournamentButton() {
    const btn = document.getElementById('createTournamentBtn');
    if (!btn) return;
    
    fetch('/api/auth/check')
        .then(response => response.json())
        .then(data => {
            btn.style.display = data.authenticated ? 'flex' : 'none';
        });
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderTournaments();
    initNavBar();
    updateAuthButtons();
    updateCreateTournamentButton();
});