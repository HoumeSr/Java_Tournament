
function showToast(message, isError = false) {
    const $toast = $('#demoToast');
    if (!$toast.length) return;
    
    $toast.text(message).css({
        background: isError ? '#b91c1c' : '#1f2937',
        opacity: '1',
        visibility: 'visible'
    });
    
    setTimeout(() => {
        $toast.css({ opacity: '0', visibility: 'hidden' });
    }, 3000);
}


async function updateAuthButtons() {
    const $auth = $('#authButtons');
    if (!$auth.length) return;
    
    try {
        const data = await window.api.get('/api/auth/check');
        
        if (data.authenticated) {
            const imageUrl = data.user?.imageUrl;
            
            $auth.html(`
                <div class="profile-icon" id="profileIcon">
                    <img src="${escapeHtml(imageUrl)}">
                </div>
            `);
            $('#profileIcon').off('click').on('click', () => {
                window.location.href = '/profile';
            });
        } else {
            $auth.html(`
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>
            `);
            $('#registerBtn').off('click').on('click', () => {
                window.location.href = '/register';
            });
            $('#loginBtn').off('click').on('click', () => {
                window.location.href = '/login';
            });
        }
    } catch (error) {
        console.error('Auth error:', error);
    }
}


async function checkUserRegistration(tournamentId) {
    try {
        const data = await window.api.get(`/api/tournaments/${tournamentId}/my-registration`);
        return data.registered || false;
    } catch (error) {
        console.error('Error checking registration:', error);
        return false;
    }
}


async function loadUserTeamsForTournament(tournamentId) {
    try {
        const teams = await window.api.get(`/api/tournaments/${tournamentId}/my-eligible-teams`);
        return teams || [];
    } catch (error) {
        console.error('Error loading teams:', error);
        return [];
    }
}


async function loadTeamsIntoSelect() {
    const tournamentId = window.tournamentData?.id;
    const $teamSelect = $('#teamSelect');
    const $registerTeamBtn = $('#registerTeamBtn');
    
    if (!$teamSelect.length || !tournamentId) return;
    
    $teamSelect.html('<option value="">Загрузка команд...</option>').prop('disabled', true);
    
    const teams = await loadUserTeamsForTournament(tournamentId);
    
    if (teams.length === 0) {
        $teamSelect.html('<option value="">Нет доступных команд</option>');
        if ($registerTeamBtn.length) $registerTeamBtn.prop('disabled', true);
    } else {
        $teamSelect.html('<option value="">Выберите команду...</option>');
        teams.forEach(team => {
            let text = `${team.name} (${team.currentMembersCount || 0}/${team.maxMembersCount || 1} участников)`;
            if (team.captainUsername === window.currentUsername) {
                text += ' 👑';
            }
            $teamSelect.append(`<option value="${team.id}">${escapeHtml(text)}</option>`);
        });
        $teamSelect.prop('disabled', false);
    }
    
    $teamSelect.off('change').on('change', () => {
        if ($registerTeamBtn.length) {
            $registerTeamBtn.prop('disabled', !$teamSelect.val());
        }
    });
}


async function registerForSoloTournament(tournamentId) {
    const $registerBtn = $('#registerSoloBtn');
    const originalText = $registerBtn.html();
    
    try {
        if ($registerBtn.length) {
            $registerBtn.html('<i class="fas fa-spinner fa-spin"></i> Регистрация...').prop('disabled', true);
        }
        
        const result = await window.api.post('/api/tournaments/join/solo', { tournamentId: tournamentId });
        
        if (result.success) {
            showToast('✅ ' + result.message);
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showToast('❌ ' + result.message, true);
            if ($registerBtn.length) {
                $registerBtn.html(originalText).prop('disabled', false);
            }
        }
    } catch (error) {
        showToast('❌ Ошибка при регистрации: ' + error.message, true);
        if ($registerBtn.length) {
            $registerBtn.html(originalText).prop('disabled', false);
        }
    }
}


async function registerTeamForTournament(tournamentId, teamId) {
    const $registerBtn = $('#registerTeamBtn');
    const originalText = $registerBtn.html();
    
    try {
        if ($registerBtn.length) {
            $registerBtn.html('<i class="fas fa-spinner fa-spin"></i> Регистрация...').prop('disabled', true);
        }
        
        const result = await window.api.post('/api/tournaments/join/team', {
            tournamentId: tournamentId,
            teamId: teamId
        });
        
        if (result.success) {
            showToast('✅ ' + result.message);
            setTimeout(() => window.location.reload(), 2000);
        } else {
            showToast('❌ ' + result.message, true);
            if ($registerBtn.length) {
                $registerBtn.html(originalText).prop('disabled', false);
            }
        }
    } catch (error) {
        showToast('❌ Ошибка при регистрации: ' + error.message, true);
        if ($registerBtn.length) {
            $registerBtn.html(originalText).prop('disabled', false);
        }
    }
}


async function initRegistrationButtons() {
    const tournamentId = window.tournamentData?.id;
    const tournamentStatus = window.tournamentData?.status;
    const isOwner = window.tournamentData?.isOwner;
    const participantType = window.tournamentData?.participantType;
    
    if (!tournamentId || isOwner) return;
    
    let isAuthenticated = false;
    try {
        const authData = await window.api.get('/api/auth/check');
        isAuthenticated = authData.authenticated;
        if (authData.user?.username) {
            window.currentUsername = authData.user.username;
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
    
    if (!isAuthenticated) {
        $('.participant-actions').css('display', 'none');
        return;
    }
    
    const isRegistered = await checkUserRegistration(tournamentId);
    
    if (isRegistered) {
        $('#alreadyRegisteredMessage').css('display', 'block');
        $('.participant-actions').css('display', 'none');
        return;
    }
    
    if (tournamentStatus !== 'REGISTRATION_OPEN') {
        $('.participant-actions').css('display', 'none');
        return;
    }
    
    const $registerSoloBtn = $('#registerSoloBtn');
    if ($registerSoloBtn.length && participantType === 'SOLO') {
        $registerSoloBtn.off('click').on('click', () => {
            registerForSoloTournament(tournamentId);
        });
    }
    
    if (participantType === 'TEAM') {
        if ($('#teamSelect').length) {
            await loadTeamsIntoSelect();
        }
        
        const $registerTeamBtn = $('#registerTeamBtn');
        if ($registerTeamBtn.length) {
            $registerTeamBtn.off('click').on('click', () => {
                const teamId = $('#teamSelect').val();
                if (teamId) {
                    registerTeamForTournament(tournamentId, parseInt(teamId));
                }
            });
        }
    }
}

function generateBracket(maxParticipants, actualParticipants = null) {
    let teamsCount = actualParticipants || maxParticipants;
    
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
            
            let team1Name = `TBD ${i * 2 + 1}`;
            let team2Name = `TBD ${i * 2 + 2}`;
            let team1Id = null;
            let team2Id = null;
            
            
            if (roundNumber === 1 && actualParticipants) {
                const totalSlots = teamsCount;
                const actualCount = actualParticipants;
                const byeCount = totalSlots - actualCount;
                
                
                if (i < byeCount) {
                    team1Name = 'BYE';
                    team1Id = null;
                    team2Name = `TBD ${i * 2 + 2}`;
                }
            }
            
            round.matches.push({
                id: `${roundNumber}_${i}`,
                team1: { name: team1Name, score: null, id: team1Id, type: null },
                team2: { name: team2Name, score: null, id: team2Id, type: null },
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


async function loadMatchesData(tournamentId) {
    if (!tournamentId) return null;
    
    try {
        const matches = await window.api.get(`/api/matches/tournament/${tournamentId}`);
        
        const enhancedMatches = (matches || []).map(match => ({
            ...match,
            participant1Id: match.participant1?.id || match.participant1Id,
            participant1Type: match.participant1?.type || 
                (window.tournamentData?.participantType === 'TEAM' ? 'team' : 'user'),
            participant1ImageUrl: match.participant1?.imageUrl || match.participant1ImageUrl,
            participant2Id: match.participant2?.id || match.participant2Id,
            participant2Type: match.participant2?.type ||
                (window.tournamentData?.participantType === 'TEAM' ? 'team' : 'user'),
            participant2ImageUrl: match.participant2?.imageUrl || match.participant2ImageUrl  
        }));
        
        return enhancedMatches;
    } catch (error) {
        console.error('Error loading matches:', error);
        return null;
    }
}

const teamImageCache = {};
const userImageCache = {};

async function loadTeamImageUrl(teamId) {
    if (!teamId) return null;
    if (teamImageCache[teamId]) return teamImageCache[teamId];
    
    try {
        const team = await window.api.get(`/api/teams/${teamId}`);
        const imageUrl = team.imageUrl || null;
        teamImageCache[teamId] = imageUrl;
        return imageUrl;
    } catch (error) {
        console.error(`Error loading team ${teamId} image:`, error);
        return null;
    }
}

async function loadUserImageUrl(userId) {
    if (!userId) return null;
    if (userImageCache[userId]) return userImageCache[userId];
    
    try {
        const user = await window.api.get(`/api/users/${userId}`);
        const imageUrl = user.imageUrl || null;
        userImageCache[userId] = imageUrl;
        return imageUrl;
    } catch (error) {
        console.error(`Error loading user ${userId} image:`, error);
        return null;
    }
}

async function applyMatchesDataWithImages(rounds, matchesData) {
    if (!matchesData || matchesData.length === 0) return rounds;
    
    const matchesByRound = {};
    matchesData.forEach(match => {
        const roundNumber = match.roundNumber || 1;
        if (!matchesByRound[roundNumber]) matchesByRound[roundNumber] = [];
        matchesByRound[roundNumber].push(match);
    });
    
    for (const round of rounds) {
        const roundMatches = matchesByRound[round.number];
        if (roundMatches) {
            for (let idx = 0; idx < round.matches.length; idx++) {
                const match = round.matches[idx];
                const realMatch = roundMatches[idx] || roundMatches.find(m => m.position === idx);
                
                if (realMatch) {
                    
                    if (realMatch.participant1Id) {
                        let imageUrl = null;
                        if (realMatch.participant1Type === 'team') {
                            imageUrl = await loadTeamImageUrl(realMatch.participant1Id);
                        } else {
                            imageUrl = await loadUserImageUrl(realMatch.participant1Id);
                        }
                        match.team1.imageUrl = imageUrl;
                    }
                    
                    
                    if (realMatch.participant2Id) {
                        let imageUrl = null;
                        if (realMatch.participant2Type === 'team') {
                            imageUrl = await loadTeamImageUrl(realMatch.participant2Id);
                        } else {
                            imageUrl = await loadUserImageUrl(realMatch.participant2Id);
                        }
                        match.team2.imageUrl = imageUrl;
                    }
                    
                    
                    if (realMatch.participant1Name === 'BYE' || !realMatch.participant1Id) {
                        match.team1.name = 'BYE';
                        match.team1.id = null;
                        if (realMatch.participant2Id) {
                            match.winner = 'team2';
                            match.finished = true;
                        }
                    } else if (realMatch.participant2Name === 'BYE' || !realMatch.participant2Id) {
                        match.team2.name = 'BYE';
                        match.team2.id = null;
                        if (realMatch.participant1Id) {
                            match.winner = 'team1';
                            match.finished = true;
                        }
                    }
                    
                    if (realMatch.participant1Name && realMatch.participant1Name !== 'BYE') {
                        match.team1.name = realMatch.participant1Name;
                        match.team1.id = realMatch.participant1Id;
                        match.team1.type = realMatch.participant1Type;
                    }
                    if (realMatch.participant1Score !== undefined) match.team1.score = realMatch.participant1Score;
                    
                    if (realMatch.participant2Name && realMatch.participant2Name !== 'BYE') {
                        match.team2.name = realMatch.participant2Name;
                        match.team2.id = realMatch.participant2Id;
                        match.team2.type = realMatch.participant2Type;
                    }
                    if (realMatch.participant2Score !== undefined) match.team2.score = realMatch.participant2Score;
                    
                    if (realMatch.winnerName && !match.winner) {
                        match.winner = realMatch.winnerName === match.team1.name ? 'team1' : 'team2';
                        match.finished = realMatch.status === 'FINISHED';
                    }
                }
            }
        }
    }
    
    return rounds;
}

async function renderBracket(maxParticipants, tournamentId) {
    const $container = $('#bracketContainer');
    if (!$container.length) return;
    
    $container.html('<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Загрузка сетки...</div>');
    
    
    const actualParticipants = window.actualParticipantsCount || 0;
    const tournamentStatus = window.tournamentData?.status;
    
    
    
    let rounds;
    
    if (tournamentStatus === 'DRAFT' || tournamentStatus === 'REGISTRATION_OPEN') {
        
        rounds = generateBracket(maxParticipants, null);
    } else {
        
        const size = actualParticipants > 0 ? actualParticipants : maxParticipants;
        rounds = generateBracket(size, actualParticipants);
    }
    
    
    if (tournamentId && (tournamentStatus === 'IN_PROGRESS' || tournamentStatus === 'FINISHED')) {
        const matchesData = await loadMatchesData(tournamentId);
        if (matchesData && matchesData.length > 0) {
            rounds = await applyMatchesDataWithImages(rounds, matchesData);
        }
    }
    
    renderBracketHTML($container[0], rounds);
    setTimeout(() => drawConnections(), 100);
}

function renderBracketHTML(container, rounds) {
    const bracketDiv = document.createElement('div');
    bracketDiv.className = 'bracket';

    function getAvatarHtml(team, participantType) {
        const imageUrl = team.imageUrl;
        const name = team.name;
        const isBye = name === 'BYE';
        const isTbd = name && name.includes('TBD');
        
        if (isBye) {
            return '<div class="team-avatar"><i class="fas fa-sleeping"></i></div>';
        }
        
        if (isTbd) {
            return '<div class="team-avatar"><i class="fas fa-question-circle"></i></div>';
        }
        
        if (imageUrl && imageUrl !== 'null' && imageUrl !== '') {
            
            let cleanUrl = String(imageUrl).trim();
            
            cleanUrl = cleanUrl.replace(/['"]/g, '');
            
            
            const $avatar = $('<div>').addClass('team-avatar');
            const $img = $('<img>')
                .attr('src', cleanUrl)
                .addClass('avatar-img')
                .on('error', function() {
                    const $this = $(this);
                    const defaultIcon = participantType === 'TEAM' ? 'fa-users' : 'fa-user';
                    $this.remove();
                    $avatar.html(`<i class="fas ${defaultIcon}"></i>`);
                    $avatar.css('background', 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(96, 165, 250, 0.1))');
                });
            
            $avatar.append($img);
            return $avatar[0].outerHTML;
        }
        
        const defaultIcon = participantType === 'TEAM' ? 'fa-users' : 'fa-user';
        return `<div class="team-avatar"><i class="fas ${defaultIcon}"></i></div>`;
    }
    
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
            
            
            const isBye = match.team1.name === 'BYE' || match.team2.name === 'BYE' ||
                         (!match.team1.id && match.team1.name.includes('TBD')) && match.team2.id;
            
            if (isBye) {
                matchDiv.className = 'match bye-match';
            } else {
                matchDiv.className = 'match';
                if (match.finished) matchDiv.classList.add('finished');
            }
            
            const isTeam1Winner = match.winner === 'team1';
            const isTeam2Winner = match.winner === 'team2';
            const isFinished = match.finished;
            
            
            let winnerName = null;
            if (isFinished && !isBye) {
                if (isTeam1Winner && match.team1.name !== 'BYE') {
                    winnerName = match.team1.name;
                } else if (isTeam2Winner && match.team2.name !== 'BYE') {
                    winnerName = match.team2.name;
                }
            }
            
            
            const advancingTeam = !match.team1.id && match.team2.id ? match.team2 : 
                                 (match.team1.id && !match.team2.id ? match.team1 : null);
            
            const team1Icon = match.team1.name === 'BYE' ? 'fa-sleeping' : 
                             (match.team1.name.includes('TBD') ? 'fa-question-circle' : 
                             (window.tournamentData?.participantType === 'TEAM' ? 'fa-users' : 'fa-user'));
            
            const team2Icon = match.team2.name === 'BYE' ? 'fa-sleeping' :
                             (match.team2.name.includes('TBD') ? 'fa-question-circle' :
                             (window.tournamentData?.participantType === 'TEAM' ? 'fa-users' : 'fa-user'));
            
            
            const team1Id = match.team1.id || null;
            const team2Id = match.team2.id || null;
            const team1Type = match.team1.type || (window.tournamentData?.participantType === 'TEAM' ? 'team' : 'user');
            const team2Type = match.team2.type || (window.tournamentData?.participantType === 'TEAM' ? 'team' : 'user');

            const team1Avatar = getAvatarHtml(match.team1, window.tournamentData?.participantType);
            const team2Avatar = getAvatarHtml(match.team2, window.tournamentData?.participantType);
            
            let matchHtml = `
                <div class="match-teams">
                    <div class="team ${isFinished && !isBye ? (isTeam1Winner ? 'winner' : 'loser') : ''} ${match.team1.name === 'BYE' ? 'bye-team' : ''}" 
                         data-id="${team1Id || ''}" 
                         data-type="${team1Type}"
                         data-name="${escapeHtml(match.team1.name)}"
                         data-image="${escapeHtml(match.team1.imageUrl || '')}">
                        ${team1Avatar}
                        <span class="team-name">${match.team1.name === 'BYE' ? 'BYE' : escapeHtml(match.team1.name)}</span>
                        ${match.team1.score !== null && !isBye ? `<span class="team-score">${match.team1.score}</span>` : ''}
                        ${isFinished && !isBye && isTeam1Winner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
                    </div>
                    <div class="match-divider-line"></div>
                    <div class="team ${isFinished && !isBye ? (isTeam2Winner ? 'winner' : 'loser') : ''} ${match.team2.name === 'BYE' ? 'bye-team' : ''}"
                         data-id="${team2Id || ''}"
                         data-type="${team2Type}"
                         data-name="${escapeHtml(match.team2.name)}"
                         data-image="${escapeHtml(match.team2.imageUrl || '')}">
                        ${team2Avatar}
                        <span class="team-name">${match.team2.name === 'BYE' ? 'BYE' : escapeHtml(match.team2.name)}</span>
                        ${match.team2.score !== null && !isBye ? `<span class="team-score">${match.team2.score}</span>` : ''}
                        ${isFinished && !isBye && isTeam2Winner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
                    </div>
                </div>
                <div class="match-status">
            `;
            
            if (isBye && advancingTeam) {
                matchHtml += `
                    <span class="status-bye">
                        <i class="fas fa-forward"></i> ${escapeHtml(advancingTeam.name)} проходит дальше
                    </span>
                `;
            } else if (isFinished && winnerName) {
                matchHtml += `
                    <span class="status-winner">
                        <i class="fas fa-trophy"></i> ${escapeHtml(winnerName)} выиграл
                    </span>
                `;
            } else {
                matchHtml += `
                    <span class="status-pending">
                        <i class="fas fa-clock"></i> Ожидает
                    </span>
                `;
            }
            
            matchHtml += `</div>`;
            matchDiv.innerHTML = matchHtml;
            
            matchesContainer.appendChild(matchDiv);
        });
        
        roundDiv.appendChild(matchesContainer);
        bracketDiv.appendChild(roundDiv);
    });
    
    container.innerHTML = '';
    container.appendChild(bracketDiv);
    
    attachBracketClickHandlers();
}

function attachBracketClickHandlers() {
    const isTeamTournament = window.tournamentData?.participantType === 'TEAM';
    
    $('.team').off('click').on('click', function(e) {
        e.stopPropagation();
        
        const $team = $(this);
        const id = $team.data('id');
        const type = $team.data('type');
        const name = $team.data('name');
        
        
        if (!id || name === 'TBD' || name.includes('TBD')) {
            return;
        }
        
        if (type === 'team' || isTeamTournament) {
            
            window.location.href = `/teams/${id}`;
        } else {
            
            window.location.href = `/profile/${id}`;
        }
    });
    
    
    $('.team[data-id]:not([data-id=""])').css('cursor', 'pointer');
}


function drawConnections() {
    const rounds = document.querySelectorAll('.round');
    if (rounds.length < 2) return;
    
    const $container = $('#bracketContainer');
    if (!$container.length) return;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '10';
    
    const containerRect = $container[0].getBoundingClientRect();
    
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
            
            const connectorX = targetX - 20;
            
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', startX);
            line1.setAttribute('y1', startY);
            line1.setAttribute('x2', connectorX);
            line1.setAttribute('y2', startY);
            line1.setAttribute('stroke', '#6366f1');
            line1.setAttribute('stroke-width', '2');
            line1.setAttribute('opacity', '0.5');
            svg.appendChild(line1);
            
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', endX);
            line2.setAttribute('y1', endY);
            line2.setAttribute('x2', connectorX);
            line2.setAttribute('y2', endY);
            line2.setAttribute('stroke', '#6366f1');
            line2.setAttribute('stroke-width', '2');
            line2.setAttribute('opacity', '0.5');
            svg.appendChild(line2);
            
            const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            verticalLine.setAttribute('x1', connectorX);
            verticalLine.setAttribute('y1', startY);
            verticalLine.setAttribute('x2', connectorX);
            verticalLine.setAttribute('y2', endY);
            verticalLine.setAttribute('stroke', '#6366f1');
            verticalLine.setAttribute('stroke-width', '2');
            verticalLine.setAttribute('opacity', '0.5');
            svg.appendChild(verticalLine);
            
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
    
    $container.find('svg').remove();
    $container.css('position', 'relative');
    $container[0].appendChild(svg);
}


let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const maxParticipants = window.tournamentData?.maxParticipants || 4;
        const tournamentId = window.tournamentData?.id;
        renderBracket(maxParticipants, tournamentId);
    }, 200);
}


function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}


function initNavBar() {
    $('.nav-item').each(function() {
        const $item = $(this);
        const href = $item.attr('href');
        if (href && href !== '#') return;
        $item.off('click').on('click', () => {
            showToast('📋 Этот раздел в разработке');
        });
    });
}


function initTournamentActions() {
    const $startBtn = $('#startTournamentBtn');
    const $deleteBtn = $('#deleteTournamentBtn');
    const $openRegBtn = $('#openRegistrationBtn');
    
    if ($openRegBtn.length) {
        $openRegBtn.off('click').on('click', async () => {
            if (confirm('Открыть регистрацию на турнир? Участники смогут регистрироваться.')) {
                try {
                    const result = await window.api.post(`/api/tournaments/${window.tournamentData?.id}/open-registration`);
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
    
    if ($startBtn.length) {
        $startBtn.off('click').on('click', async () => {
            const participantsCount = window.actualParticipantsCount || 0;
            const minParticipants = window.tournamentData?.minParticipants || 2;
            
            if (participantsCount < minParticipants) {
                showToast(`❌ Недостаточно участников. Минимум: ${minParticipants}, зарегистрировано: ${participantsCount}`, true);
                return;
            }
            
            if (confirm(`Зарегистрировано участников: ${participantsCount}\nМинимум: ${minParticipants}\n\nВы уверены, что хотите начать турнир?`)) {
                try {
                    const result = await window.api.post(`/api/tournaments/${window.tournamentData?.id}/start`);
                    if (result.success) {
                        showToast('✅ Турнир успешно начат');
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
    
    if ($deleteBtn.length) {
        $deleteBtn.off('click').on('click', async () => {
            if (confirm('Вы уверены, что хотите удалить этот турнир? Это действие необратимо.')) {
                try {
                    await window.api.delete(`/api/tournaments/${window.tournamentData?.id}`);
                    showToast('✅ Турнир успешно удалён');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } catch (error) {
                    showToast(`❌ ${error.message}`, true);
                }
            }
        });
    }
}


async function loadParticipantsCount(tournamentId) {
    try {
        const data = await window.api.get(`/api/tournaments/${tournamentId}/participants/count`);
        return data.count || 0;
    } catch (error) {
        console.error('Error loading participants count:', error);
        return 0;
    }
}


async function loadParticipantsList(tournamentId) {
    try {
        const participants = await window.api.get(`/api/tournaments/${tournamentId}/participants`);
        return participants || [];
    } catch (error) {
        console.error('Error loading participants list:', error);
        return [];
    }
}


async function addRegistrationToMeta() {
    const tournamentId = window.tournamentData?.id;
    const tournamentStatus = window.tournamentData?.status;
    const isOwner = window.tournamentData?.isOwner;
    const participantType = window.tournamentData?.participantType;
    const $tournamentMeta = $('.tournament-meta');
    
    if (!$tournamentMeta.length || isOwner || tournamentStatus !== 'REGISTRATION_OPEN') return;
    
    let isAuthenticated = false;
    let isRegistered = false;
    let currentUsername = null;
    
    try {
        const authData = await window.api.get('/api/auth/check');
        isAuthenticated = authData.authenticated;
        currentUsername = authData.user?.username;
        
        if (isAuthenticated) {
            const regData = await window.api.get(`/api/tournaments/${tournamentId}/my-registration`);
            isRegistered = regData.registered;
        }
    } catch (error) {
        console.error('Error:', error);
    }
    
    if (isRegistered) {
        $tournamentMeta.append(`
            <div class="meta-registered">
                <i class="fas fa-check-circle"></i> Вы уже зарегистрированы на этот турнир
            </div>
        `);
        return;
    }
    
    if (!isAuthenticated) {
        $tournamentMeta.append(`
            <div class="meta-auth-prompt">
                <i class="fas fa-sign-in-alt"></i> 
                <a href="/login">Войдите в аккаунт</a>, чтобы зарегистрироваться
            </div>
        `);
        return;
    }
    
    if (participantType === 'SOLO') {
        $tournamentMeta.append(`
            <button class="meta-register-btn" id="metaSoloRegisterBtn">
                <i class="fas fa-user-plus"></i> Зарегистрироваться на турнир
            </button>
        `);
        $('#metaSoloRegisterBtn').off('click').on('click', () => registerForSoloTournament(tournamentId));
    } else if (participantType === 'TEAM') {
        const teams = await loadUserTeamsForTournament(tournamentId);
        
        if (teams.length === 0) {
            $tournamentMeta.append(`
                <div class="meta-auth-prompt">
                    <i class="fas fa-users"></i> 
                    У вас нет команд, подходящих для этого турнира.<br>
                    <a href="/teams">Создайте команду</a>
                </div>
            `);
        } else {
            $tournamentMeta.append(`
                <div class="meta-team-select" id="metaTeamSelectContainer">
                    <select id="metaTeamSelect">
                        <option value="">Выберите команду...</option>
                        ${teams.map(team => `
                            <option value="${team.id}">
                                ${escapeHtml(team.name)} (${team.currentMembersCount || 0}/${team.maxMembersCount || 1})
                                ${team.captainUsername === currentUsername ? ' 👑' : ''}
                            </option>
                        `).join('')}
                    </select>
                    <button id="metaTeamRegisterBtn" disabled>
                        <i class="fas fa-users"></i> Регистрация
                    </button>
                </div>
            `);
            
            const $teamSelect = $('#metaTeamSelect');
            const $teamBtn = $('#metaTeamRegisterBtn');
            
            $teamSelect.off('change').on('change', () => {
                $teamBtn.prop('disabled', !$teamSelect.val());
            });
            
            $teamBtn.off('click').on('click', () => {
                const teamId = $teamSelect.val();
                if (teamId) {
                    registerTeamForTournament(tournamentId, parseInt(teamId));
                }
            });
        }
    }
}


async function initFloatingRegisterButton() {
    const tournamentId = window.tournamentData?.id;
    const tournamentStatus = window.tournamentData?.status;
    const isOwner = window.tournamentData?.isOwner;
    const participantType = window.tournamentData?.participantType;
    const $floatingBtn = $('#floatingRegisterBtn');
    
    if (!$floatingBtn.length || isOwner || tournamentStatus !== 'REGISTRATION_OPEN') {
        if ($floatingBtn.length) $floatingBtn.css('display', 'none');
        return;
    }
    
    let isAuthenticated = false;
    let isRegistered = false;
    
    try {
        const authData = await window.api.get('/api/auth/check');
        isAuthenticated = authData.authenticated;
        
        if (isAuthenticated) {
            const regData = await window.api.get(`/api/tournaments/${tournamentId}/my-registration`);
            isRegistered = regData.registered;
        }
    } catch (error) {
        console.error('Error:', error);
    }
    
    if (isRegistered) {
        $floatingBtn.css('display', 'none');
        return;
    }
    
    if (!isAuthenticated) {
        $floatingBtn.css('display', 'flex').off('click').on('click', () => {
            window.location.href = '/login';
        });
        return;
    }
    
    if (participantType === 'SOLO') {
        $floatingBtn.css('display', 'flex').off('click').on('click', () => {
            registerForSoloTournament(tournamentId);
        });
    } else if (participantType === 'TEAM') {
        const teams = await loadUserTeamsForTournament(tournamentId);
        
        if (teams.length === 0) {
            $floatingBtn.css('display', 'flex').off('click').on('click', () => {
                showToast('❌ У вас нет команд, подходящих для этого турнира', true);
                setTimeout(() => {
                    if (confirm('Хотите создать новую команду?')) {
                        window.location.href = '/teams';
                    }
                }, 1000);
            });
        } else {
            $floatingBtn.css('display', 'flex').off('click').on('click', () => {
                showTeamSelectionModal(teams, tournamentId);
            });
        }
    }
}


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
    
    $('body').append(modalHtml);
    
    const $modal = $('#teamSelectionModal');
    $modal.css('display', 'flex');
    
    const closeModal = () => $modal.remove();
    
    $modal.find('.team-selection-overlay, .team-selection-cancel').off('click').on('click', closeModal);
    
    $modal.find('.team-selection-item').off('click').on('click', async function() {
        const teamId = parseInt($(this).data('team-id'));
        closeModal();
        await registerTeamForTournament(tournamentId, teamId);
    });
}

async function loadParticipants() {
    const tournamentId = window.tournamentData?.id;
    if (!tournamentId) return [];
    
    try {
        const participants = await window.api.get(`/api/tournaments/${tournamentId}/participants`);
        console.log('Raw participants data:', participants);
        
        if (!participants || !Array.isArray(participants)) {
            return [];
        }
        
        const isTeamTournament = window.tournamentData?.participantType === 'TEAM';
        
        
        if (isTeamTournament && participants.length > 0) {
            
            const teamDetailsPromises = participants.map(async (participant) => {
                try {
                    const teamDetails = await window.api.get(`/api/teams/${participant.teamId}`);
                    return {
                        ...participant,
                        teamName: teamDetails.name,
                        captainUsername: teamDetails.captain?.username || teamDetails.captainUsername
                    };
                } catch (error) {
                    console.error(`Error loading team ${participant.teamId}:`, error);
                    return participant;
                }
            });
            
            const results = await Promise.all(teamDetailsPromises);
            return results;
        }
        
        return participants;
    } catch (error) {
        console.error('Error loading participants:', error);
        showToast('Не удалось загрузить список участников', true);
        return [];
    }
}

async function openParticipantsModal() {
    const $modal = $('#participantsModal');
    const $participantsList = $('#participantsList');
    const $participantsCount = $('#participantsCount');
    
    if (!$modal.length) return;
    
    $modal.css('display', 'flex');
    $participantsList.html('<div class="loading-spinner-small"><i class="fas fa-spinner fa-spin"></i> Загрузка участников...</div>');
    
    const participants = await loadParticipants();
    const isTeamTournament = window.tournamentData?.participantType === 'TEAM';
    
    console.log('Loaded participants:', participants);
    
    if (!participants || participants.length === 0) {
        $participantsList.html(`
            <div class="empty-participants">
                <i class="fas fa-user-slash"></i>
                <p>Пока нет зарегистрированных участников</p>
            </div>
        `);
        $participantsCount.text('0');
        return;
    }
    
    $participantsCount.text(participants.length);
    
    let participantsHtml = '';
    
    if (isTeamTournament) {
        
        participantsHtml = participants.map((participant, index) => {
            const teamName = participant.teamName || participant.name || 'Команда';
            const captainName = participant.captainUsername || 'Не указан';
            const seed = participant.seed;
            
            const animationDelay = index * 0.05;
            
            return `
                <div class="participant-item" style="animation: slideUp 0.3s ease ${animationDelay}s both;">
                    <div class="participant-avatar">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="participant-info">
                        <div class="participant-name">
                            ${escapeHtml(teamName)}
                            ${seed ? `<span class="participant-seed">#${seed}</span>` : ''}
                        </div>
                        <div class="participant-role">
                            <i class="fas fa-crown"></i> Капитан: ${escapeHtml(captainName)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        
        participantsHtml = participants.map((participant, index) => {
            const username = participant.name || participant.username || 'Игрок';
            const seed = participant.seed;
            
            const animationDelay = index * 0.05;
            
            return `
                <div class="participant-item" style="animation: slideUp 0.3s ease ${animationDelay}s both;">
                    <div class="participant-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="participant-info">
                        <div class="participant-name">
                            ${escapeHtml(username)}
                            ${seed ? `<span class="participant-seed">#${seed}</span>` : ''}
                        </div>
                        <div class="participant-role">
                            Участник турнира
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    $participantsList.html(participantsHtml);
}


function closeParticipantsModal() {
    $('#participantsModal').css('display', 'none');
}


function initParticipantsButton() {
    
    $('.participants-btn').off('click').on('click', async (e) => {
        e.preventDefault();
        await openParticipantsModal();
    });
    
    
    $('#closeParticipantsModal, #cancelParticipantsBtn').off('click').on('click', closeParticipantsModal);
    
    
    $('#participantsModal').off('click').on('click', (e) => {
        if ($(e.target).is('#participantsModal')) {
            closeParticipantsModal();
        }
    });
}


async function init() {
    if (!window.tournamentData || !window.tournamentData.id) {
        console.warn('Данные турнира отсутствуют');
        $('#bracketContainer').html('<div class="error-message"><i class="fas fa-exclamation-triangle"></i> Данные турнира не загружены</div>');
        return;
    }
    
    const maxParticipants = window.tournamentData.maxParticipants;
    const tournamentId = window.tournamentData.id;
    const tournamentStatus = window.tournamentData.status;
    
    const actualParticipantsCount = await loadParticipantsCount(tournamentId);
    window.actualParticipantsCount = actualParticipantsCount;
    
    $('#teamsCountDisplay').text(`${actualParticipantsCount}/${maxParticipants}`);
    
    const $participantsMetaItem = $('.meta-item .fa-users').parent();
    if ($participantsMetaItem.length) {
        $participantsMetaItem.find('strong').text(`${actualParticipantsCount}/${maxParticipants}`);
    }
    
    let bracketSize = maxParticipants;
    
    if (tournamentStatus === 'IN_PROGRESS' || tournamentStatus === 'FINISHED') {
        bracketSize = actualParticipantsCount;
    }
    
    await renderBracket(bracketSize, tournamentId);
    initTournamentActions();
    await initFloatingRegisterButton();
    initParticipantsButton();
}


$(document).ready(() => {
    updateAuthButtons();
    init();
    initNavBar();
    $(window).on('resize', handleResize);
});