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

// ========== ГЕНЕРАЦИЯ ТУРНИРНОЙ СЕТКИ ==========
function generateBracket(maxParticipants) {
    // Проверяем, что число участников - степень двойки
    let teamsCount = maxParticipants;
    
    // Если не степень двойки, находим ближайшую степень двойки вверх
    if ((teamsCount & (teamsCount - 1)) !== 0 || teamsCount < 2) {
        let power = 1;
        while (power < teamsCount) {
            power *= 2;
        }
        teamsCount = power;
        console.log(`Количество участников ${maxParticipants} округлено до ${teamsCount} (ближайшая степень двойки)`);
    }
    
    const rounds = [];
    let matchesCount = teamsCount / 2;
    let roundNumber = 1;
    
    const roundNames = {
        1: (total) => {
            if (total === 2) return "ФИНАЛ";
            if (total === 4) return "1/2 ФИНАЛА";
            if (total === 8) return "1/4 ФИНАЛА";
            if (total === 16) return "1/8 ФИНАЛА";
            if (total === 32) return "1/16 ФИНАЛА";
            if (total === 64) return "1/32 ФИНАЛА";
            return "1-Й РАУНД";
        },
        2: (total) => {
            if (total === 4) return "ФИНАЛ";
            if (total === 8) return "1/2 ФИНАЛА";
            if (total === 16) return "1/4 ФИНАЛА";
            if (total === 32) return "1/8 ФИНАЛА";
            if (total === 64) return "1/16 ФИНАЛА";
            return "2-Й РАУНД";
        },
        3: (total) => {
            if (total === 8) return "ФИНАЛ";
            if (total === 16) return "1/2 ФИНАЛА";
            if (total === 32) return "1/4 ФИНАЛА";
            if (total === 64) return "1/8 ФИНАЛА";
            return "3-Й РАУНД";
        },
        4: (total) => {
            if (total === 16) return "ФИНАЛ";
            if (total === 32) return "1/2 ФИНАЛА";
            if (total === 64) return "1/4 ФИНАЛА";
            return "4-Й РАУНД";
        },
        5: (total) => {
            if (total === 32) return "ФИНАЛ";
            if (total === 64) return "1/2 ФИНАЛА";
            return "5-Й РАУНД";
        },
        6: (total) => {
            if (total === 64) return "ФИНАЛ";
            return "6-Й РАУНД";
        }
    };
    
    while (matchesCount >= 1) {
        const round = {
            number: roundNumber,
            name: roundNames[roundNumber]?.(teamsCount) || `${roundNumber}-Й РАУНД`,
            matches: []
        };
        
        for (let i = 0; i < matchesCount; i++) {
            const match = {
                id: `${roundNumber}_${i}`,
                team1: {
                    name: `TBD ${i * 2 + 1}`,
                    score: null
                },
                team2: {
                    name: `TBD ${i * 2 + 2}`,
                    score: null
                },
                winner: null,
                finished: false
            };
            
            round.matches.push(match);
        }
        
        rounds.push(round);
        matchesCount = Math.floor(matchesCount / 2);
        roundNumber++;
    }
    
    return rounds;
}

// ========== ЗАГРУЗКА РЕАЛЬНЫХ ДАННЫХ МАТЧЕЙ ==========
async function loadMatchesData(tournamentId) {
    if (!tournamentId) return null;
    
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
        if (!response.ok) {
            if (response.status === 404) {
                console.log('Матчи ещё не созданы');
                return null;
            }
            throw new Error('Failed to load matches');
        }
        const matches = await response.json();
        return matches;
    } catch (error) {
        console.error('Error loading matches:', error);
        return null;
    }
}

// ========== ПРИМЕНЕНИЕ РЕАЛЬНЫХ ДАННЫХ К СЕТКЕ ==========
function applyMatchesData(rounds, matchesData) {
    if (!matchesData || matchesData.length === 0) return rounds;
    
    // Группируем матчи по раундам
    const matchesByRound = {};
    matchesData.forEach(match => {
        const roundNumber = match.roundNumber || match.round || 1;
        if (!matchesByRound[roundNumber]) {
            matchesByRound[roundNumber] = [];
        }
        matchesByRound[roundNumber].push(match);
    });
    
    // Заполняем данные в раунды
    rounds.forEach(round => {
        const roundMatches = matchesByRound[round.number];
        if (roundMatches) {
            round.matches.forEach((match, idx) => {
                const realMatch = roundMatches.find(m => m.matchIndex === idx || m.position === idx);
                if (realMatch) {
                    match.team1 = {
                        name: realMatch.team1Name || realMatch.team1?.name || match.team1.name,
                        score: realMatch.team1Score || realMatch.team1?.score
                    };
                    match.team2 = {
                        name: realMatch.team2Name || realMatch.team2?.name || match.team2.name,
                        score: realMatch.team2Score || realMatch.team2?.score
                    };
                    match.winner = realMatch.winner;
                    match.finished = realMatch.finished || realMatch.status === 'FINISHED';
                }
            });
        }
    });
    
    return rounds;
}

// ========== РЕНДЕР СЕТКИ ==========
function renderBracket(maxParticipants, tournamentId = null) {
    const container = document.getElementById('bracketContainer');
    if (!container) return;
    
    // Показываем загрузку
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Построение турнирной сетки...</div>';
    
    const rounds = generateBracket(maxParticipants);
    
    // Если есть ID турнира, пробуем загрузить реальные матчи
    if (tournamentId) {
        loadMatchesData(tournamentId).then(matchesData => {
            if (matchesData && matchesData.length > 0) {
                applyMatchesData(rounds, matchesData);
            }
            renderBracketHTML(container, rounds);
        }).catch(() => {
            renderBracketHTML(container, rounds);
        });
    } else {
        renderBracketHTML(container, rounds);
    }
}

function renderBracketHTML(container, rounds) {
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
            
            // Определяем иконку для команды
            const team1Icon = match.team1.name.includes('TBD') ? 'fa-question-circle' : 'fa-users';
            const team2Icon = match.team2.name.includes('TBD') ? 'fa-question-circle' : 'fa-users';
            
            matchDiv.innerHTML = `
                <div class="match-teams">
                    <div class="team ${isFinished ? (isTeam1Winner ? 'winner' : 'loser') : ''}">
                        <div class="team-avatar">
                            <i class="fas ${team1Icon}"></i>
                        </div>
                        <span class="team-name">${escapeHtml(match.team1.name)}</span>
                        ${match.team1.score !== null && match.team1.score !== undefined ? `<span class="team-score">${match.team1.score}</span>` : ''}
                        ${isFinished && isTeam1Winner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
                    </div>
                    <div class="match-divider-line"></div>
                    <div class="team ${isFinished ? (isTeam2Winner ? 'winner' : 'loser') : ''}">
                        <div class="team-avatar">
                            <i class="fas ${team2Icon}"></i>
                        </div>
                        <span class="team-name">${escapeHtml(match.team2.name)}</span>
                        ${match.team2.score !== null && match.team2.score !== undefined ? `<span class="team-score">${match.team2.score}</span>` : ''}
                        ${isFinished && isTeam2Winner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
                    </div>
                </div>
                <div class="match-status">
                    <span class="${match.finished ? 'status-finished' : 'status-pending'}">
                        ${match.finished ? '✓ Победитель определён' : '⏳ Ожидает начала'}
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
    setTimeout(() => drawConnections(), 100);
}

// ========== РИСОВАНИЕ ЛИНИЙ ==========
function drawConnections() {
    const rounds = document.querySelectorAll('.round');
    if (rounds.length < 2) return;
    
    // Создаём SVG поверх всей сетки
    const container = document.getElementById('bracketContainer');
    if (!container) return;
    
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
        
        const nextMatchesCount = nextMatches.length;
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
            line1.setAttribute('stroke', '#6366f1');
            line1.setAttribute('stroke-width', '2');
            line1.setAttribute('opacity', '0.5');
            svg.appendChild(line1);
            
            // Линия от последнего матча к соединителю
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', endX);
            line2.setAttribute('y1', endY);
            line2.setAttribute('x2', connectorX);
            line2.setAttribute('y2', endY);
            line2.setAttribute('stroke', '#6366f1');
            line2.setAttribute('stroke-width', '2');
            line2.setAttribute('opacity', '0.5');
            svg.appendChild(line2);
            
            // Вертикальная линия
            const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            verticalLine.setAttribute('x1', connectorX);
            verticalLine.setAttribute('y1', startY);
            verticalLine.setAttribute('x2', connectorX);
            verticalLine.setAttribute('y2', endY);
            verticalLine.setAttribute('stroke', '#6366f1');
            verticalLine.setAttribute('stroke-width', '2');
            verticalLine.setAttribute('opacity', '0.5');
            svg.appendChild(verticalLine);
            
            // Линия к следующему матчу
            const line3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line3.setAttribute('x1', connectorX);
            line3.setAttribute('y1', (startY + endY) / 2);
            line3.setAttribute('x2', targetX);
            line3.setAttribute('y2', (startY + endY) / 2);
            line3.setAttribute('stroke', '#6366f1');
            line3.setAttribute('stroke-width', '2');
            line3.setAttribute('opacity', '0.5');
            svg.appendChild(line3);
        }
    }
    
    const oldSvg = container.querySelector('svg');
    if (oldSvg) oldSvg.remove();
    container.style.position = 'relative';
    container.appendChild(svg);
}

// ========== ОБНОВЛЕНИЕ ПРИ ИЗМЕНЕНИИ РАЗМЕРА ==========
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const maxParticipants = window.tournamentData?.maxParticipants || 4;
        const tournamentId = window.tournamentData?.id;
        renderBracket(maxParticipants, tournamentId);
    }, 200);
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

// ========== УПРАВЛЕНИЕ ТУРНИРОМ ==========
function initTournamentActions() {
    const manageBtn = document.getElementById('manageTournamentBtn');
    const deleteBtn = document.getElementById('deleteTournamentBtn');
    
    if (manageBtn) {
        manageBtn.addEventListener('click', () => {
            window.location.href = `/tournaments/${window.tournamentData?.id}/manage`;
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Вы уверены, что хотите удалить этот турнир? Это действие необратимо.')) {
                try {
                    const response = await fetch(`/api/tournaments/${window.tournamentData?.id}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast('✅ Турнир успешно удалён');
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 1500);
                    } else {
                        throw new Error(result.message || 'Не удалось удалить турнир');
                    }
                } catch (error) {
                    showToast(`❌ ${error.message}`, true);
                }
            }
        });
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function init() {
    // Проверяем, существуют ли данные турнира
    if (!window.tournamentData || !window.tournamentData.id) {
        console.warn('Данные турнира отсутствуют');
        const container = document.getElementById('bracketContainer');
        if (container) {
            container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Данные турнира не загружены</div>';
        }
        return;
    }
    
    console.log('Загрузка турнира:', window.tournamentData);
    
    const maxParticipants = window.tournamentData.maxParticipants || 4;
    const tournamentId = window.tournamentData.id;
    
    // Обновляем отображение количества участников
    const teamsCountDisplay = document.getElementById('teamsCountDisplay');
    if (teamsCountDisplay) {
        teamsCountDisplay.textContent = maxParticipants;
    }
    
    // Рендерим сетку
    renderBracket(maxParticipants, tournamentId);
    
    // Инициализируем кнопки управления
    initTournamentActions();
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    init();
    initNavBar();
    window.addEventListener('resize', handleResize);
});