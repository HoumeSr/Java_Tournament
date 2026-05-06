
let currentMatches = [];
let currentSelectedMatch = null;
let isLoading = false;


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


function escapeHtml(str) {
    if (!str) return '—';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
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


function getRoundName(round, maxRound) {
    if (round === maxRound) return 'ФИНАЛ';
    if (maxRound === 4 && round === 3) return '1/2 ФИНАЛА';
    if (maxRound === 4 && round === 2) return '1/4 ФИНАЛА';
    if (maxRound === 4 && round === 1) return '1/8 ФИНАЛА';
    if (maxRound === 3 && round === 2) return '1/2 ФИНАЛА';
    if (maxRound === 3 && round === 1) return '1/4 ФИНАЛА';
    if (maxRound === 2 && round === 1) return '1/2 ФИНАЛА';
    return `${round}-й раунд`;
}


function groupMatchesByRound(matches) {
    const grouped = new Map();
    
    matches.forEach(match => {
        const round = match.roundNumber;
        if (!grouped.has(round)) {
            grouped.set(round, []);
        }
        grouped.get(round).push(match);
    });
    
    const sortedRounds = Array.from(grouped.keys()).sort((a, b) => a - b);
    const maxRound = Math.max(...sortedRounds);
    
    return sortedRounds.map(round => ({
        number: round,
        name: getRoundName(round, maxRound),
        matches: grouped.get(round).sort((a, b) => a.id - b.id)
    }));
}


function createMatchCard(match) {
    const $matchDiv = $('<div>')
        .addClass('match')
        .attr('data-match-id', match.id)
        .attr('data-match-type', match.matchType);
    
    const isFinished = match.status === 'FINISHED' || match.winnerId !== null;
    const isSolo = match.matchType === 'SOLO';
    
    if (isFinished) {
        $matchDiv.addClass('finished');
    }
    
    const participant1 = {
        id: match.participant1Id,
        name: match.participant1Name || 'TBD',
        isWinner: match.winnerId === match.participant1Id
    };
    
    const participant2 = {
        id: match.participant2Id,
        name: match.participant2Name || 'TBD',
        isWinner: match.winnerId === match.participant2Id
    };
    
    $matchDiv.html(`
        <div class="match-teams">
            <div class="team ${isFinished && participant1.isWinner ? 'winner' : ''}">
                <div class="team-avatar">
                    <i class="fas ${isSolo ? 'fa-user' : 'fa-users'}"></i>
                </div>
                <span class="team-name">${escapeHtml(participant1.name)}</span>
                ${isFinished && participant1.isWinner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
            </div>
            <div class="match-divider-line"></div>
            <div class="team ${isFinished && participant2.isWinner ? 'winner' : ''}">
                <div class="team-avatar">
                    <i class="fas ${isSolo ? 'fa-user' : 'fa-users'}"></i>
                </div>
                <span class="team-name">${escapeHtml(participant2.name)}</span>
                ${isFinished && participant2.isWinner ? '<span class="winner-badge"><i class="fas fa-crown"></i></span>' : ''}
            </div>
        </div>
        <div class="match-status">
            <span class="${isFinished ? 'status-finished' : 'status-pending'}">
                ${isFinished ? '✓ Победитель определён' : '⏳ Ожидает результатов'}
            </span>
        </div>
    `);
    
    const canEdit = match.owner === true && !isFinished && match.participant1Id && match.participant2Id;
    
    if (canEdit) {
        $matchDiv.addClass('clickable').on('click', (e) => {
            e.stopPropagation();
            openWinnerModal(match);
        });
    }
    
    return $matchDiv;
}


function renderBracket(matches) {
    const $container = $('#bracketContainer');
    if (!$container.length) return;
    
    const rounds = groupMatchesByRound(matches);
    
    const $bracketDiv = $('<div>').addClass('bracket');
    
    rounds.forEach(round => {
        const $roundDiv = $('<div>').addClass('round').attr('data-round', round.number);
        
        $roundDiv.append($('<div>').addClass('round-header').text(round.name));
        
        const $matchesContainer = $('<div>').addClass('matches-container');
        
        round.matches.forEach(match => {
            $matchesContainer.append(createMatchCard(match));
        });
        
        $roundDiv.append($matchesContainer);
        $bracketDiv.append($roundDiv);
    });
    
    $container.empty().append($bracketDiv);
    
    setTimeout(() => drawConnections(), 100);
}


async function loadMatches() {
    if (isLoading) return;
    isLoading = true;
    
    const $container = $('#bracketContainer');
    if (!$container.length) return;
    
    $container.html('<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Загрузка сетки...</div>');
    
    const tournamentId = window.tournamentData?.id;
    
    if (!tournamentId) {
        $container.html(`
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>ID турнира не найден</p>
            </div>
        `);
        isLoading = false;
        return;
    }
    
    try {
        const matches = await window.api.get(`/api/matches/tournament/${tournamentId}`);
        
        if (!matches || matches.length === 0) {
            $container.html(`
                <div class="empty-message">
                    <i class="fas fa-info-circle"></i>
                    <p>Матчи ещё не созданы для этого турнира</p>
                </div>
            `);
            return;
        }
        
        currentMatches = matches;
        renderBracket(matches);
        
    } catch (error) {
        console.error('Error loading matches:', error);
        $container.html(`
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка загрузки сетки турнира: ${error.message}</p>
            </div>
        `);
        showToast('Не удалось загрузить матчи', true);
    } finally {
        isLoading = false;
    }
}


function openWinnerModal(match) {
    currentSelectedMatch = match;
    
    const $modal = $('#winnerModal');
    const $modalRound = $('#modalRound');
    const $modalMatchId = $('#modalMatchId');
    const $participantsSelector = $('#participantsSelector');
    
    const maxRound = Math.max(...currentMatches.map(m => m.roundNumber));
    $modalRound.text(`${getRoundName(match.roundNumber, maxRound)} - Раунд ${match.roundNumber}`);
    
    const isSolo = match.matchType === 'SOLO';
    const participants = [
        { id: match.participant1Id, name: match.participant1Name, type: 'participant1' },
        { id: match.participant2Id, name: match.participant2Name, type: 'participant2' }
    ];
    
    $participantsSelector.html(`
        <div class="selector-title">Выберите победителя матча:</div>
        <div class="selector-options">
            ${participants.map(p => `
                <div class="selector-option" data-winner-id="${p.id}" data-winner-type="${p.type}">
                    <div class="option-avatar">
                        <i class="fas ${isSolo ? 'fa-user' : 'fa-users'}"></i>
                    </div>
                    <div class="option-info">
                        <div class="option-name">${escapeHtml(p.name)}</div>
                        <div class="option-label">${p.type === 'participant1' ? 'Участник 1' : 'Участник 2'}</div>
                    </div>
                    <div class="option-check">
                        <i class="far fa-circle"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `);
    
    $('.selector-option').off('click').on('click', function() {
        $('.selector-option').removeClass('selected');
        $('.selector-option .option-check i').attr('class', 'far fa-circle');
        $(this).addClass('selected');
        $(this).find('.option-check i').attr('class', 'fas fa-check-circle');
    });
    
    $('#modalError').css('display', 'none');
    $modal.css('display', 'flex');
}


async function submitWinner() {
    const $selectedOption = $('.selector-option.selected');
    if (!$selectedOption.length) {
        showModalError('Пожалуйста, выберите победителя');
        return;
    }
    
    const winnerId = $selectedOption.data('winner-id');
    
    if (!currentSelectedMatch) return;
    
    const isSolo = currentSelectedMatch.matchType === 'SOLO';
    
    const body = isSolo
        ? { winnerUserId: parseInt(winnerId), status: 'FINISHED' }
        : { winnerTeamId: parseInt(winnerId), status: 'FINISHED' };
    
    const url = isSolo
        ? `/api/matches/solo/${currentSelectedMatch.id}/result`
        : `/api/matches/team/${currentSelectedMatch.id}/result`;
    
    const $submitBtn = $('#submitWinnerBtn');
    const originalText = $submitBtn.html();
    $submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Отправка...').prop('disabled', true);
    
    try {
        await window.api.post(url, body);
        showToast('Победитель успешно определён!');
        closeModal();
        await loadMatches();
    } catch (error) {
        console.error('Error submitting winner:', error);
        showModalError(error.message);
    } finally {
        $submitBtn.html(originalText).prop('disabled', false);
    }
}

function showModalError(message) {
    $('#modalErrorMessage').text(message);
    $('#modalError').css('display', 'flex');
    setTimeout(() => $('#modalError').css('display', 'none'), 3000);
}

function closeModal() {
    $('#winnerModal').css('display', 'none');
    currentSelectedMatch = null;
}


function drawConnections() {
    const $container = $('#bracketContainer');
    const $rounds = $('.round');
    if (!$container.length || $rounds.length < 2) return;
    
    $container.find('svg').remove();
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '10';
    
    const containerRect = $container[0].getBoundingClientRect();
    
    for (let i = 0; i < $rounds.length - 1; i++) {
        const $currentRound = $rounds.eq(i);
        const $nextRound = $rounds.eq(i + 1);
        
        const $currentMatches = $currentRound.find('.match');
        const $nextMatches = $nextRound.find('.match');
        
        if (!$currentMatches.length || !$nextMatches.length) continue;
        
        const nextMatchesCount = $nextMatches.length;
        const matchesPerNext = $currentMatches.length / nextMatchesCount;
        
        for (let j = 0; j < nextMatchesCount; j++) {
            const startIdx = j * matchesPerNext;
            const endIdx = startIdx + matchesPerNext - 1;
            
            const $firstMatch = $currentMatches.eq(startIdx);
            const $lastMatch = $currentMatches.eq(endIdx);
            const $targetMatch = $nextMatches.eq(j);
            
            if (!$firstMatch.length || !$lastMatch.length || !$targetMatch.length) continue;
            
            const firstRect = $firstMatch[0].getBoundingClientRect();
            const lastRect = $lastMatch[0].getBoundingClientRect();
            const targetRect = $targetMatch[0].getBoundingClientRect();
            
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
    
    $container.css('position', 'relative');
    $container[0].appendChild(svg);
}


function initEventListeners() {
    $('.modal-close, #cancelModalBtn').on('click', closeModal);
    $('#submitWinnerBtn').on('click', submitWinner);
    
    $(window).on('click', (e) => {
        if ($(e.target).is('#winnerModal')) closeModal();
    });
    
    let resizeTimeout;
    $(window).on('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (currentMatches.length > 0) drawConnections();
        }, 200);
    });
}


$(document).ready(() => {
    updateAuthButtons();
    initEventListeners();
    loadMatches();
});