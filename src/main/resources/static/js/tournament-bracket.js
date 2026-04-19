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
                            <img src="${savedAvatar}">
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
        });
}

// ========== ГЕНЕРАЦИЯ ТУРНИРНОЙ СЕТКИ ==========
function generateBracket(teamsCount) {
    const rounds = [];
    let matchesCount = teamsCount / 2;
    let roundNumber = 1;
    
    const roundNames = {
        1: (total) => {
            if (total === 2) return "Финал";
            if (total === 4) return "1/2 финала";
            if (total === 8) return "1/4 финала";
            if (total === 16) return "1/8 финала";
            return "1-й раунд";
        },
        2: (total) => {
            if (total === 4) return "Финал";
            if (total === 8) return "1/2 финала";
            if (total === 16) return "1/4 финала";
            return "2-й раунд";
        },
        3: (total) => {
            if (total === 8) return "Финал";
            if (total === 16) return "1/2 финала";
            return "3-й раунд";
        },
        4: (total) => {
            if (total === 16) return "Финал";
            return "4-й раунд";
        }
    };
    
    while (matchesCount >= 1) {
        const round = {
            number: roundNumber,
            name: roundNames[roundNumber]?.(teamsCount) || `${roundNumber}-й раунд`,
            matches: []
        };
        
        for (let i = 0; i < matchesCount; i++) {
            const match = {
                id: `${roundNumber}_${i}`,
                team1: {
                    name: `Команда ${i * 2 + 1}`,
                    score: null
                },
                team2: {
                    name: `Команда ${i * 2 + 2}`,
                    score: null
                },
                winner: null,
                finished: false
            };
            
            // ========== ТЕСТОВЫЕ ПОБЕДИТЕЛИ ==========
            // Для первого матча (Команда 1 vs Команда 2)
            if (roundNumber === 1 && i === 0) {
                match.winner = 'team1';
                match.finished = true;
                match.team1.score = 2;
                match.team2.score = 0;
            }
            
            // Для второго матча (Команда 3 vs Команда 4)
            if (roundNumber === 1 && i === 1) {
                match.winner = 'team2';
                match.finished = true;
                match.team1.score = 1;
                match.team2.score = 2;
            }
            // ======================================
            
            round.matches.push(match);
        }
        
        rounds.push(round);
        matchesCount = Math.floor(matchesCount / 2);
        roundNumber++;
    }
    
    return rounds;
}

// ========== РЕНДЕР СЕТКИ ==========
function renderBracket(teamsCount) {
    const container = document.getElementById('bracketContainer');
    if (!container) return;
    
    const rounds = generateBracket(teamsCount);
    
    // Создаём контейнер для сетки
    const bracketDiv = document.createElement('div');
    bracketDiv.className = 'bracket';
    
    // Сначала создаём все раунды с матчами
    rounds.forEach((round, roundIdx) => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round';
        roundDiv.setAttribute('data-round', roundIdx);
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'round-header';
        headerDiv.textContent = round.name;
        roundDiv.appendChild(headerDiv);
        
        const matchesContainer = document.createElement('div');
        matchesContainer.className = 'matches-container';
        
        round.matches.forEach((match, matchIdx) => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match';
            matchDiv.setAttribute('data-match-id', match.id);
            if (match.finished) matchDiv.classList.add('finished');
            
            // Определяем победителя и проигравшего
            const isTeam1Winner = match.winner === 'team1';
            const isTeam2Winner = match.winner === 'team2';
            const isFinished = match.finished;
            
            matchDiv.innerHTML = `
                <div class="match-teams">
                    <div class="team ${isFinished ? (isTeam1Winner ? 'winner' : 'loser') : ''}">
                        <div class="team-avatar">
                            <i class="fas fa-users"></i>
                        </div>
                        <span class="team-name">${escapeHtml(match.team1.name)}</span>
                        ${isFinished && isTeam1Winner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
                        ${isFinished && !isTeam1Winner && isTeam2Winner ? '<span class="loser-badge"><i class="fas fa-skull"></i></span>' : ''}
                    </div>
                    <div class="match-divider-line"></div>
                    <div class="team ${isFinished ? (isTeam2Winner ? 'winner' : 'loser') : ''}">
                        <div class="team-avatar">
                            <i class="fas fa-users"></i>
                        </div>
                        <span class="team-name">${escapeHtml(match.team2.name)}</span>
                        ${isFinished && isTeam2Winner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
                        ${isFinished && !isTeam2Winner && isTeam1Winner ? '<span class="loser-badge"><i class="fas fa-skull"></i></span>' : ''}
                    </div>
                </div>
                <div class="match-status">
                    <span class="${match.finished ? 'status-finished' : 'status-pending'}">
                        ${match.finished ? 'Победитель определён' : 'Ожидает начала'}
                    </span>
                </div>
            `;
            
            matchesContainer.appendChild(matchDiv);
        });
        
        roundDiv.appendChild(matchesContainer);
        bracketDiv.appendChild(roundDiv);
    });
    
    container.innerHTML = '';
    container.appendChild(bracketDiv);
    
    // Добавляем соединительные линии
    setTimeout(() => drawConnections(teamsCount), 50);
}

// ========== РИСОВАНИЕ ЛИНИЙ ==========
function drawConnections(teamsCount) {
    const rounds = document.querySelectorAll('.round');
    if (rounds.length < 2) return;
    
    // Создаём SVG поверх всей сетки
    const container = document.getElementById('bracketContainer');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '10';
    
    const containerRect = container.getBoundingClientRect();
    
    for (let i = 0; i < rounds.length - 1; i++) {
        const currentRound = rounds[i];
        const nextRound = rounds[i + 1];
        
        const currentMatches = currentRound.querySelectorAll('.match');
        const nextMatches = nextRound.querySelectorAll('.match');
        
        if (currentMatches.length === 0 || nextMatches.length === 0) continue;
        
        // Количество матчей в следующем раунде
        const nextMatchesCount = nextMatches.length;
        
        // Группируем матчи текущего раунда по парам для следующего раунда
        const matchesPerNext = currentMatches.length / nextMatchesCount;
        
        for (let j = 0; j < nextMatchesCount; j++) {
            const startIdx = j * matchesPerNext;
            const endIdx = startIdx + matchesPerNext - 1;
            
            const firstMatch = currentMatches[startIdx];
            const lastMatch = currentMatches[endIdx];
            const targetMatch = nextMatches[j];
            
            if (!firstMatch || !lastMatch || !targetMatch) continue;
            
            const firstRect = firstMatch.getBoundingClientRect();
            const lastRect = lastMatch.getBoundingClientRect();
            const targetRect = targetMatch.getBoundingClientRect();
            
            // Координаты относительно контейнера
            const startX = firstRect.right - containerRect.left;
            const startY = firstRect.top + firstRect.height / 2 - containerRect.top;
            const endX = lastRect.right - containerRect.left;
            const endY = lastRect.top + lastRect.height / 2 - containerRect.top;
            const targetX = targetRect.left - containerRect.left;
            const targetY = targetRect.top + targetRect.height / 2 - containerRect.top;
            
            const connectorX = targetX - 20;
            
            // Линия от первого матча к соединителю
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', startX);
            line1.setAttribute('y1', startY);
            line1.setAttribute('x2', connectorX);
            line1.setAttribute('y2', startY);
            line1.setAttribute('stroke', 'var(--accent)');
            line1.setAttribute('stroke-width', '2');
            line1.setAttribute('opacity', '0.5');
            svg.appendChild(line1);
            
            // Линия от последнего матча к соединителю
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', endX);
            line2.setAttribute('y1', endY);
            line2.setAttribute('x2', connectorX);
            line2.setAttribute('y2', endY);
            line2.setAttribute('stroke', 'var(--accent)');
            line2.setAttribute('stroke-width', '2');
            line2.setAttribute('opacity', '0.5');
            svg.appendChild(line2);
            
            // Вертикальная линия, соединяющая два горизонтальных отрезка
            const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            verticalLine.setAttribute('x1', connectorX);
            verticalLine.setAttribute('y1', startY);
            verticalLine.setAttribute('x2', connectorX);
            verticalLine.setAttribute('y2', endY);
            verticalLine.setAttribute('stroke', 'var(--accent)');
            verticalLine.setAttribute('stroke-width', '2');
            verticalLine.setAttribute('opacity', '0.5');
            svg.appendChild(verticalLine);
            
            // Горизонтальная линия от соединителя к следующему матчу
            const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line3.setAttribute('x1', connectorX);
            line3.setAttribute('y1', (startY + endY) / 2);
            line3.setAttribute('x2', targetX);
            line3.setAttribute('y2', (startY + endY) / 2);
            line3.setAttribute('stroke', 'var(--accent)');
            line3.setAttribute('stroke-width', '2');
            line3.setAttribute('opacity', '0.5');
            svg.appendChild(line3);
        }
    }
    
    // Удаляем старый SVG и добавляем новый
    const oldSvg = container.querySelector('svg');
    if (oldSvg) oldSvg.remove();
    container.style.position = 'relative';
    container.appendChild(svg);
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

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function init() {
    const generateBtn = document.getElementById('generateBtn');
    const teamsSelect = document.getElementById('teamsCount');
    
    renderBracket(4);
    
    if (generateBtn && teamsSelect) {
        generateBtn.addEventListener('click', () => {
            const teamsCount = parseInt(teamsSelect.value, 10);
            renderBracket(teamsCount);
        });
    }
    
    // Перерисовываем линии при изменении размера окна
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const teamsCount = parseInt(document.getElementById('teamsCount')?.value || 4, 10);
            renderBracket(teamsCount);
        }, 200);
    });
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    init();
    initNavBar();
});