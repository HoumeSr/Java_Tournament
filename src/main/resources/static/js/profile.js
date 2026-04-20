(function() {
    let currentUser = null;

    function showToast(message, isError = false) {
        const toast = document.getElementById('demoToast');
        if (!toast) return;
        toast.textContent = message;
        toast.style.background = isError ? '#b91c1c' : '#1f2937';
        toast.style.opacity = '1';
        toast.style.visibility = 'visible';
        setTimeout(() => { toast.style.opacity = '0'; toast.style.visibility = 'hidden'; }, 3000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
    }

    async function getCurrentUserId() {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        if (!data.authenticated) return null;
        return data.user?.id || null;
    }

    function setAvatar(imageUrl) {
        const avatar = document.getElementById('avatarPreview');
        if (!avatar) return;
        if (imageUrl) {
            const src = /^https?:\/\//.test(imageUrl) || imageUrl.startsWith('/') ? imageUrl : `/images/${imageUrl}`;
            avatar.innerHTML = `<img src="${src}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        }
    }

    function renderProfile(user) {
        currentUser = user;
        document.getElementById('profileUsername').textContent = user.username || '—';
        document.getElementById('memberSince').textContent = 'недавно';
        document.getElementById('userId').textContent = user.userId ?? '—';
        document.getElementById('displayUsername').textContent = user.username || '—';
        document.getElementById('displayCountry').textContent = user.country || 'Не указана';
        document.getElementById('displayBio').textContent = 'Профиль синхронизирован с API. Дополнительная информация пока не заполняется.';
        if (user.owner) {
            document.getElementById('emailRow').style.display = 'flex';
            document.getElementById('displayEmail').textContent = user.email || '—';
            document.getElementById('roleRow').style.display = 'flex';
            document.getElementById('displayRole').textContent = user.role || 'PLAYER';
            document.getElementById('logoutCard').style.display = 'block';
        }
        const games = Array.isArray(user.games) ? user.games : [];
        document.getElementById('tournamentsCount').textContent = games.reduce((sum, g) => sum + (g.matchCount || 0), 0);
        document.getElementById('winsCount').textContent = games.reduce((sum, g) => sum + Math.round((g.matchCount || 0) * ((g.winPercent || 0) / 100)), 0);
        document.getElementById('rating').textContent = games.length ? Math.round(games.reduce((sum, g) => sum + (g.winPercent || 0), 0) / games.length) : 0;
        const gamesCard = document.getElementById('gamesCard');
        const gamesList = document.getElementById('gamesList');
        gamesList.innerHTML = '';
        if (games.length) {
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'game-item';
                item.innerHTML = `<span class="game-name">${escapeHtml(game.gameName)}</span><div class="game-stats"><span class="match-count">${game.matchCount || 0} матчей</span><span class="win-percent">${game.winPercent || 0}%</span></div>`;
                gamesList.appendChild(item);
            });
            gamesCard.style.display = 'block';
        }
        setAvatar(user.imageUrl);
        document.getElementById('editProfileBtn').style.display = 'none';
        document.getElementById('changeAvatarBtn').style.display = 'none';
        document.getElementById('passwordCard').style.display = 'none';
    }

    async function loadProfile() {
        try {
            const userId = await getCurrentUserId();
            if (!userId) {
                showToast('❌ Нужно войти в аккаунт', true);
                setTimeout(() => window.location.href = '/login', 1200);
                return;
            }
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) throw new Error('Не удалось загрузить профиль');
            const user = await response.json();
            renderProfile(user);
        } catch (error) {
            console.error(error);
            showToast('❌ Не удалось загрузить профиль', true);
        }
    }

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
            window.location.href = '/';
        }
    });

    loadProfile();
})();
