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
async function updateAuthButtons() {
    const authContainer = document.getElementById('authButtons');
    if (!authContainer) return;
    
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
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
    } catch (error) {
        console.error('Auth error:', error);
    }
}
Л
// ========== УПРАВЕНИЕ ТУРНИРОМ ==========
async function initTournamentActions() {
    const startBtn = document.getElementById('startTournamentBtn');
    const deleteBtn = document.getElementById('deleteTournamentBtn');
    const openRegBtn = document.getElementById('openRegistrationBtn');
    
    if (openRegBtn) {
        openRegBtn.addEventListener('click', async () => {
            if (confirm('Открыть регистрацию на турнир?')) {
                try {
                    const response = await fetch(`/api/tournaments/${window.tournamentData?.id}/open-registration`, {
                        method: 'POST'
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast('✅ ' + result.message);
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    showToast(`❌ ${error.message}`, true);
                }
            }
        });
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', async () => {
            if (confirm('Начать турнир? Регистрация будет закрыта.')) {
                try {
                    const response = await fetch(`/api/tournaments/${window.tournamentData?.id}/start`, {
                        method: 'POST'
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast('✅ Турнир начат');
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        throw new Error(result.message || 'Не удалось начать турнир');
                    }
                } catch (error) {
                    showToast(`❌ ${error.message}`, true);
                }
            }
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Удалить турнир? Это необратимо.')) {
                try {
                    const response = await fetch(`/api/tournaments/${window.tournamentData?.id}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast('✅ Турнир удалён');
                        setTimeout(() => window.location.href = '/', 1500);
                    } else {
                        throw new Error(result.message || 'Не удалось удалить');
                    }
                } catch (error) {
                    showToast(`❌ ${error.message}`, true);
                }
            }
        });
    }
}

// ========== ГЕНЕРАЦИЯ ТУРНИРНОЙ СЕТКИ ==========
function generateBracket(maxParticipants) {
    let teamsCount = maxParticipants;
    
    if ((teamsCount & (teamsCount - 1)) !== 0 || teamsCount < 2) {
        let power = 1;
        while (power < teamsCount) {
            power *= 2;
        }
        teamsCount = power;
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
            return "2-Й РАУНД";
        },
        3: (total) => {
            if (total === 8) return "ФИНАЛ";
            if (total === 16) return "1/2 ФИНАЛА";
            if (total === 32) return "1/4 ФИНАЛА";
            return "3-Й РАУНД";
        },
        4: (total) => {
            if (total === 16) return "ФИНАЛ";
            if (total === 32) return "1/2 ФИНАЛА";
            return "4-Й РАУНД";
        },
        5: (total) => {
            if (total === 32) return "ФИНАЛ";
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
            round.matches.push({
                id: `${roundNumber}_${i}`,
                team1: { name: `TBD ${i * 2 + 1}`, score: null },
                team2: { name: `TBD ${i * 2 + 2}`, score: null },
                winner: null,
                finished: false
            });
        }
        
        rounds.push(round);
        matchesCount = Math.floor(matchesCount / 2);
        roundNumber++;
    }
    
    return rounds;
}

// ========== ЗАГРУЗКА МАТЧЕЙ ==========
async function loadMatchesData(tournamentId) {
    if (!tournamentId) return null;
    
    try {
        const response = await fetch(`/api/matches/tournament/${tournamentId}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error('Failed to load matches');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading matches:', error);
        return null;
    }
}

// ========== ПРИМЕНЕНИЕ ДАННЫХ МАТЧЕЙ ==========
function applyMatchesData(rounds, matchesData) {
    if (!matchesData || matchesData.length === 0) return rounds;
    
    const matchesByRound = {};
    matchesData.forEach(match => {
        const roundNumber = match.roundNumber || 1;
        if (!matchesByRound[roundNumber]) matchesByRound[roundNumber] = [];
        matchesByRound[roundNumber].push(match);
    });
    
    rounds.forEach(round => {
        const roundMatches = matchesByRound[round.number];
        if (roundMatches) {
            round.matches.forEach((match, idx) => {
                const realMatch = roundMatches[idx] || roundMatches.find(m => m.position === idx);
                
                if (realMatch) {
                    if (realMatch.participant1Name) match.team1.name = realMatch.participant1Name;
                    if (realMatch.participant1Score !== undefined) match.team1.score = realMatch.participant1Score;
                    if (realMatch.participant2Name) match.team2.name = realMatch.participant2Name;
                    if (realMatch.participant2Score !== undefined) match.team2.score = realMatch.participant2Score;
                    
                    if (realMatch.winnerName) {
                        match.winner = realMatch.winnerName === match.team1.name ? 'team1' : 'team2';
                    }
                    
                    match.finished = realMatch.status === 'FINISHED';
                }
            });
        }
    });
    
    return rounds;
}

// ========== РЕНДЕР СЕТКИ ==========
async function renderBracket(maxParticipants, tournamentId) {
    const container = document.getElementById('bracketContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Загрузка сетки...</div>';
    
    const rounds = generateBracket(maxParticipants);
    
    if (tournamentId) {
        const matchesData = await loadMatchesData(tournamentId);
        if (matchesData && matchesData.length > 0) {
            applyMatchesData(rounds, matchesData);
        }
    }
    
    renderBracketHTML(container, rounds);
}

function renderBracketHTML(container, rounds) {
    const bracketDiv = document.createElement('div');
    bracketDiv.className = 'bracket';
    
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
        
        round.matches.forEach((match) => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match';
            if (match.finished) matchDiv.classList.add('finished');
            
            const isTeam1Winner = match.winner === 'team1';
            const isTeam2Winner = match.winner === 'team2';
            const isFinished = match.finished;
            
            const team1Icon = match.team1.name.includes('TBD') ? 'fa-question-circle' : 'fa-users';
            const team2Icon = match.team2.name.includes('TBD') ? 'fa-question-circle' : 'fa-users';
            
            matchDiv.innerHTML = `
                <div class="match-teams">
                    <div class="team ${isFinished ? (isTeam1Winner ? 'winner' : 'loser') : ''}">
                        <div class="team-avatar"><i class="fas ${team1Icon}"></i></div>
                        <span class="team-name">${escapeHtml(match.team1.name)}</span>
                        ${match.team1.score !== null ? `<span class="team-score">${match.team1.score}</span>` : ''}
                        ${isFinished && isTeam1Winner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
                    </div>
                    <div class="match-divider-line"></div>
                    <div class="team ${isFinished ? (isTeam2Winner ? 'winner' : 'loser') : ''}">
                        <div class="team-avatar"><i class="fas ${team2Icon}"></i></div>
                        <span class="team-name">${escapeHtml(match.team2.name)}</span>
                        ${match.team2.score !== null ? `<span class="team-score">${match.team2.score}</span>` : ''}
                        ${isFinished && isTeam2Winner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
                    </div>
                </div>
                <div class="match-status">
                    <span class="${match.finished ? 'status-finished' : 'status-pending'}">
                        ${match.finished ? '✓ Победитель определён' : '⏳ Ожидает'}
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
}

// ========== ESCAPE HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== ЗАГРУЗКА КОЛИЧЕСТВА УЧАСТНИКОВ ==========
async function loadParticipantsCount(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/participants/count`);
        if (response.ok) {
            const data = await response.json();
            return data.count;
        }
        return 0;
    } catch (error) {
        console.error('Error loading participants count:', error);
        return 0;
    }
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
async function init() {
    if (!window.tournamentData || !window.tournamentData.id) {
        console.warn('Данные турнира отсутствуют');
        const container = document.getElementById('bracketContainer');
        if (container) {
            container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Данные турнира не загружены</div>';
        }
        return;
    }
    
    console.log('Загрузка турнира:', window.tournamentData);
    
    const maxParticipants = window.tournamentData.maxParticipants;
    const tournamentId = window.tournamentData.id;
    
    // Загружаем количество участников
    const actualParticipantsCount = await loadParticipantsCount(tournamentId);
    
    const teamsCountDisplay = document.getElementById('teamsCountDisplay');
    if (teamsCountDisplay) {
        teamsCountDisplay.textContent = `${actualParticipantsCount}/${maxParticipants}`;
    }
    
    // Обновляем мета-информацию
    const participantsMetaItem = document.querySelector('.meta-item .fa-users')?.parentElement;
    if (participantsMetaItem) {
        const strongElement = participantsMetaItem.querySelector('strong');
        if (strongElement) {
            strongElement.textContent = `${actualParticipantsCount}/${maxParticipants}`;
        }
    }
    
    // Рендерим сетку
    await renderBracket(maxParticipants, tournamentId);
    
    // Инициализируем кнопки управления
    initTournamentActions();
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    init();
    initNavBar();
});