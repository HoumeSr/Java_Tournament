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

// ========== ПРОВЕРКА РЕГИСТРАЦИИ ПОЛЬЗОВАТЕЛЯ ==========
async function checkUserRegistration(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/my-registration`);
        if (response.ok) {
            const data = await response.json();
            return data.registered;
        }
        return false;
    } catch (error) {
        console.error('Error checking registration:', error);
        return false;
    }
}

// ========== ЗАГРУЗКА КОМАНД ДЛЯ ТУРНИРА ==========
async function loadUserTeamsForTournament(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/my-eligible-teams`);
        if (response.ok) {
            const teams = await response.json();
            return teams;
        }
        return [];
    } catch (error) {
        console.error('Error loading teams:', error);
        return [];
    }
}

// ========== ЗАГРУЗКА КОМАНД В SELECT ==========
async function loadTeamsIntoSelect() {
    const tournamentId = window.tournamentData?.id;
    const teamSelect = document.getElementById('teamSelect');
    const registerTeamBtn = document.getElementById('registerTeamBtn');
    
    if (!teamSelect || !tournamentId) return;
    
    // Показываем загрузку
    teamSelect.innerHTML = '<option value="">Загрузка команд...</option>';
    teamSelect.disabled = true;
    
    const teams = await loadUserTeamsForTournament(tournamentId);
    
    if (teams.length === 0) {
        teamSelect.innerHTML = '<option value="">Нет доступных команд</option>';
        if (registerTeamBtn) registerTeamBtn.disabled = true;
    } else {
        teamSelect.innerHTML = '<option value="">Выберите команду...</option>';
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = `${team.name} (${team.currentMembersCount || 0}/${team.maxMembersCount || 1} участников)`;
            if (team.captainUsername === window.currentUsername) {
                option.textContent += ' 👑';
            }
            teamSelect.appendChild(option);
        });
        teamSelect.disabled = false;
    }
    
    // Обработчик изменения выбора команды
    teamSelect.addEventListener('change', () => {
        if (registerTeamBtn) {
            registerTeamBtn.disabled = !teamSelect.value;
        }
    });
}

// ========== РЕГИСТРАЦИЯ В СОЛО ТУРНИР ==========
async function registerForSoloTournament(tournamentId) {
    const registerBtn = document.getElementById('registerSoloBtn');
    const originalText = registerBtn?.innerHTML;
    
    try {
        // Показываем состояние загрузки
        if (registerBtn) {
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
            registerBtn.disabled = true;
        }
        
        const response = await fetch('/api/tournaments/join/solo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tournamentId: tournamentId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ ' + result.message);
            // Обновляем страницу через 2 секунды
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showToast('❌ ' + result.message, true);
            if (registerBtn) {
                registerBtn.innerHTML = originalText;
                registerBtn.disabled = false;
            }
        }
    } catch (error) {
        showToast('❌ Ошибка при регистрации: ' + error.message, true);
        if (registerBtn) {
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    }
}

// ========== РЕГИСТРАЦИЯ КОМАНДЫ В ТУРНИР ==========
async function registerTeamForTournament(tournamentId, teamId) {
    const registerBtn = document.getElementById('registerTeamBtn');
    const originalText = registerBtn?.innerHTML;
    
    try {
        // Показываем состояние загрузки
        if (registerBtn) {
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';
            registerBtn.disabled = true;
        }
        
        const response = await fetch('/api/tournaments/join/team', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tournamentId: tournamentId,
                teamId: teamId
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ ' + result.message);
            // Обновляем страницу через 2 секунды
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showToast('❌ ' + result.message, true);
            if (registerBtn) {
                registerBtn.innerHTML = originalText;
                registerBtn.disabled = false;
            }
        }
    } catch (error) {
        showToast('❌ Ошибка при регистрации: ' + error.message, true);
        if (registerBtn) {
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ КНОПОК РЕГИСТРАЦИИ ==========
async function initRegistrationButtons() {
    const tournamentId = window.tournamentData?.id;
    const tournamentStatus = window.tournamentData?.status;
    const isOwner = window.tournamentData?.isOwner;
    const participantType = window.tournamentData?.participantType;
    
    if (!tournamentId || isOwner) return;
    
    // Сначала проверяем авторизацию пользователя
    let isAuthenticated = false;
    try {
        const authCheck = await fetch('/api/auth/check');
        const authData = await authCheck.json();
        isAuthenticated = authData.authenticated;
        if (authData.user?.username) {
            window.currentUsername = authData.user.username;
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
    
    if (!isAuthenticated) {
        const participantActions = document.querySelector('.participant-actions');
        if (participantActions) {
            participantActions.style.display = 'none';
        }
        return;
    }
    
    // Проверяем, зарегистрирован ли уже пользователь
    const isRegistered = await checkUserRegistration(tournamentId);
    
    if (isRegistered) {
        const alreadyRegisteredDiv = document.getElementById('alreadyRegisteredMessage');
        if (alreadyRegisteredDiv) {
            alreadyRegisteredDiv.style.display = 'block';
        }
        // Скрываем кнопки регистрации
        const participantActions = document.querySelector('.participant-actions');
        if (participantActions) {
            participantActions.style.display = 'none';
        }
        return;
    }
    
    // Если турнир не в статусе регистрации, скрываем кнопки
    if (tournamentStatus !== 'REGISTRATION_OPEN') {
        const participantActions = document.querySelector('.participant-actions');
        if (participantActions) {
            participantActions.style.display = 'none';
        }
        return;
    }
    
    // Инициализируем кнопку для соло турнира
    const registerSoloBtn = document.getElementById('registerSoloBtn');
    if (registerSoloBtn && participantType === 'SOLO') {
        registerSoloBtn.addEventListener('click', () => {
            registerForSoloTournament(tournamentId);
        });
    }
    
    // Инициализируем выбор команды для командного турнира
    if (participantType === 'TEAM') {
        const teamSelect = document.getElementById('teamSelect');
        if (teamSelect) {
            await loadTeamsIntoSelect();
        }
        
        const registerTeamBtn = document.getElementById('registerTeamBtn');
        if (registerTeamBtn) {
            registerTeamBtn.addEventListener('click', () => {
                const teamId = document.getElementById('teamSelect')?.value;
                if (teamId) {
                    registerTeamForTournament(tournamentId, parseInt(teamId));
                }
            });
        }
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

    setTimeout(() => drawConnections(), 100);
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
    const startBtn = document.getElementById('startTournamentBtn');
    const deleteBtn = document.getElementById('deleteTournamentBtn');
    const openRegBtn = document.getElementById('openRegistrationBtn');
    
    if (openRegBtn) {
        openRegBtn.addEventListener('click', async () => {
            if (confirm('Открыть регистрацию на турнир? Участники смогут регистрироваться.')) {
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
            // Используем данные из уже загруженного турнира
            // Они передаются в HTML и доступны в window.tournamentData
            const participantsCount = 3;
            const minParticipants = window.tournamentData?.minParticipants || 2;
            
            console.log('Participants count from tournament data:', participantsCount);
            console.log('Min participants:', minParticipants);
            
            if (participantsCount < minParticipants) {
                showToast(`❌ Недостаточно участников. Минимум: ${minParticipants}, зарегистрировано: ${participantsCount}`, true);
                return;
            }
            
            if (confirm(`Зарегистрировано участников: ${participantsCount}\nМинимум: ${minParticipants}\n\nВы уверены, что хотите начать турнир? После начала регистрация будет закрыта.`)) {
                try {
                    const response = await fetch(`/api/tournaments/${window.tournamentData?.id}/start`, {
                        method: 'POST'
                    });
                    const result = await response.json();
                    if (result.success) {
                        showToast('✅ Турнир успешно начат');
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
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

// ========== ЗАГРУЗКА СПИСКА УЧАСТНИКОВ ==========
async function loadParticipantsList(tournamentId) {
    try {
        const response = await fetch(`/api/tournaments/${tournamentId}/participants`);
        if (response.ok) {
            const participants = await response.json();
            console.log('Участники:', participants);
            return participants;
        }
        return [];
    } catch (error) {
        console.error('Error loading participants list:', error);
        return [];
    }
}

// ========== ДОБАВЛЕНИЕ КНОПКИ РЕГИСТРАЦИИ В META ==========
async function addRegistrationToMeta() {
    const tournamentId = window.tournamentData?.id;
    const tournamentStatus = window.tournamentData?.status;
    const isOwner = window.tournamentData?.isOwner;
    const participantType = window.tournamentData?.participantType;
    const tournamentMeta = document.querySelector('.tournament-meta');
    
    if (!tournamentMeta || isOwner || tournamentStatus !== 'REGISTRATION_OPEN') return;
    
    // Проверяем авторизацию и регистрацию
    let isAuthenticated = false;
    let isRegistered = false;
    let currentUsername = null;
    
    try {
        const authCheck = await fetch('/api/auth/check');
        const authData = await authCheck.json();
        isAuthenticated = authData.authenticated;
        currentUsername = authData.user?.username;
        
        if (isAuthenticated) {
            const regCheck = await fetch(`/api/tournaments/${tournamentId}/my-registration`);
            const regData = await regCheck.json();
            isRegistered = regData.registered;
        }
    } catch (error) {
        console.error('Error:', error);
    }
    
    // Если уже зарегистрирован
    if (isRegistered) {
        tournamentMeta.innerHTML += `
            <div class="meta-registered">
                <i class="fas fa-check-circle"></i> Вы уже зарегистрированы на этот турнир
            </div>
        `;
        return;
    }
    
    // Если не авторизован
    if (!isAuthenticated) {
        tournamentMeta.innerHTML += `
            <div class="meta-auth-prompt">
                <i class="fas fa-sign-in-alt"></i> 
                <a href="/login">Войдите в аккаунт</a>, чтобы зарегистрироваться
            </div>
        `;
        return;
    }
    
    // Если авторизован и статус позволяет регистрироваться
    if (participantType === 'SOLO') {
        tournamentMeta.innerHTML += `
            <button class="meta-register-btn" id="metaSoloRegisterBtn">
                <i class="fas fa-user-plus"></i> Зарегистрироваться на турнир
            </button>
        `;
        
        const soloBtn = document.getElementById('metaSoloRegisterBtn');
        if (soloBtn) {
            soloBtn.addEventListener('click', () => registerForSoloTournament(tournamentId));
        }
    } else if (participantType === 'TEAM') {
        // Загружаем команды
        const teams = await loadUserTeamsForTournament(tournamentId);
        
        if (teams.length === 0) {
            tournamentMeta.innerHTML += `
                <div class="meta-auth-prompt">
                    <i class="fas fa-users"></i> 
                    У вас нет команд, подходящих для этого турнира.<br>
                    <a href="/teams">Создайте команду</a>
                </div>
            `;
        } else {
            tournamentMeta.innerHTML += `
                <div class="meta-team-select" id="metaTeamSelectContainer">
                    <select id="metaTeamSelect">
                        <option value="">Выберите команду...</option>
                        ${teams.map(team => `
                            <option value="${team.id}">
                                ${team.name} (${team.currentMembersCount || 0}/${team.maxMembersCount || 1})
                                ${team.captainUsername === currentUsername ? ' 👑' : ''}
                            </option>
                        `).join('')}
                    </select>
                    <button id="metaTeamRegisterBtn" disabled>
                        <i class="fas fa-users"></i> Регистрация
                    </button>
                </div>
            `;
            
            const teamSelect = document.getElementById('metaTeamSelect');
            const teamBtn = document.getElementById('metaTeamRegisterBtn');
            
            if (teamSelect) {
                teamSelect.addEventListener('change', () => {
                    if (teamBtn) teamBtn.disabled = !teamSelect.value;
                });
            }
            
            if (teamBtn) {
                teamBtn.addEventListener('click', () => {
                    const teamId = teamSelect?.value;
                    if (teamId) {
                        registerTeamForTournament(tournamentId, parseInt(teamId));
                    }
                });
            }
        }
    }
}

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


// ========== УПРАВЛЕНИЕ ПЛАВАЮЩЕЙ КНОПКОЙ ==========
async function initFloatingRegisterButton() {
    const tournamentId = window.tournamentData?.id;
    const tournamentStatus = window.tournamentData?.status;
    const isOwner = window.tournamentData?.isOwner;
    const participantType = window.tournamentData?.participantType;
    const floatingBtn = document.getElementById('floatingRegisterBtn');
    
    if (!floatingBtn || isOwner || tournamentStatus !== 'REGISTRATION_OPEN') {
        if (floatingBtn) floatingBtn.style.display = 'none';
        return;
    }
    
    // Проверяем авторизацию и регистрацию
    let isAuthenticated = false;
    let isRegistered = false;
    
    try {
        const authCheck = await fetch('/api/auth/check');
        const authData = await authCheck.json();
        isAuthenticated = authData.authenticated;
        
        if (isAuthenticated) {
            const regCheck = await fetch(`/api/tournaments/${tournamentId}/my-registration`);
            const regData = await regCheck.json();
            isRegistered = regData.registered;
        }
    } catch (error) {
        console.error('Error:', error);
    }
    
    // Если уже зарегистрирован - скрываем кнопку
    if (isRegistered) {
        floatingBtn.style.display = 'none';
        return;
    }
    
    // Если не авторизован - показываем с redirect на логин
    if (!isAuthenticated) {
        floatingBtn.style.display = 'flex';
        floatingBtn.onclick = () => {
            window.location.href = '/login';
        };
        return;
    }
    
    // Для соло турнира - сразу регистрируем
    if (participantType === 'SOLO') {
        floatingBtn.style.display = 'flex';
        floatingBtn.onclick = () => {
            registerForSoloTournament(tournamentId);
        };
    } 
    // Для командного турнира - ВСЕГДА открываем модалку
    else if (participantType === 'TEAM') {
        const teams = await loadUserTeamsForTournament(tournamentId);
        
        if (teams.length === 0) {
            // Нет команд - показываем сообщение
            floatingBtn.style.display = 'flex';
            floatingBtn.onclick = () => {
                showToast('❌ У вас нет команд, подходящих для этого турнира', true);
                setTimeout(() => {
                    if (confirm('Хотите создать новую команду?')) {
                        window.location.href = '/teams';
                    }
                }, 1000);
            };
        } else {
            // ВСЕГДА открываем модальное окно выбора команды
            floatingBtn.style.display = 'flex';
            floatingBtn.onclick = () => {
                showTeamSelectionModal(teams, tournamentId);
            };
        }
    }
}

// Модалка для выбора команды (всегда открывается)
function showTeamSelectionModal(teams, tournamentId) {
    const modalHtml = `
        <div class="team-selection-modal" id="teamSelectionModal">
            <div class="team-selection-overlay"></div>
            <div class="team-selection-content">
                <h3><i class="fas fa-users"></i> Выберите команду</h3>
                <div class="team-selection-list">
                    ${teams.map(team => `
                        <button class="team-selection-item" data-team-id="${team.id}">
                            <i class="fas fa-users"></i>
                            <span>${escapeHtml(team.name)}</span>
                            <small>${team.currentMembersCount || 0}/${team.maxMembersCount || 1}</small>
                            ${team.captainUsername === window.currentUsername ? '<span class="captain-badge">👑</span>' : ''}
                        </button>
                    `).join('')}
                </div>
                <button class="team-selection-cancel">Отмена</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('teamSelectionModal');
    const overlay = modal.querySelector('.team-selection-overlay');
    const cancelBtn = modal.querySelector('.team-selection-cancel');
    
    modal.style.display = 'flex';
    
    const closeModal = () => modal.remove();
    
    overlay.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.querySelectorAll('.team-selection-item').forEach(btn => {
        btn.addEventListener('click', async () => {
            const teamId = parseInt(btn.dataset.teamId);
            closeModal();
            await registerTeamForTournament(tournamentId, teamId);
        });
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function init() {
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
    
    // ИСПРАВЛЕНИЕ ТУТ: используем maxParticipants, а не actualParticipantsCount
    // Потому что generateBracket ожидает максимальное количество мест в турнирной сетке
    const maxParticipants = window.tournamentData.maxParticipants;
    const tournamentId = window.tournamentData.id;
    const tournamentStatus = window.tournamentData.status;
    
    // Загружаем реальное количество участников (только для отображения, не для сетки)
    const actualParticipantsCount = await loadParticipantsCount(tournamentId);
    
    // Обновляем отображение количества участников
    const teamsCountDisplay = document.getElementById('teamsCountDisplay');
    if (teamsCountDisplay) {
        teamsCountDisplay.textContent = `${actualParticipantsCount}/${maxParticipants}`;
    }
    
    // Обновляем информацию в мета-данных
    const participantsMetaItem = document.querySelector('.meta-item .fa-users')?.parentElement;
    if (participantsMetaItem) {
        const strongElement = participantsMetaItem.querySelector('strong');
        if (strongElement) {
            strongElement.textContent = `${actualParticipantsCount}/${maxParticipants}`;
        }
    }

    let bracketSize = maxParticipants;
    
    if (tournamentStatus === 'IN_PROGRESS' || tournamentStatus === 'FINISHED') {
        bracketSize = actualParticipantsCount;
        console.log('Турнир в статусе', tournamentStatus, '- строим сетку по фактическим участникам:', bracketSize);
    } else {
        console.log('Турнир в статусе', tournamentStatus, '- строим сетку по максимальному количеству:', bracketSize);
    }
    
    // Рендерим сетку с выбранным размером
    await renderBracket(bracketSize, tournamentId);
    
    // Инициализируем кнопки управления (только для организатора)
    initTournamentActions();
    
    // Инициализируем кнопки регистрации (для участников)
    await initFloatingRegisterButton();
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthButtons();
    init();
    initNavBar();
    window.addEventListener('resize', handleResize);
});