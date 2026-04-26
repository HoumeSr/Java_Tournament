(function() {
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

    function resolveImageUrl(path) {
        if (!path) return null;
        if (/^https?:\/\//.test(path) || path.startsWith('/') || path.startsWith('data:')) return path;
        return '/images/' + path;
    }

    async function authCheck() {
        try {
            const response = await fetch('/api/auth/check');
            return await response.json();
        } catch {
            return { authenticated: false };
        }
    }

    async function updateAuthButtons() {
        const authContainer = document.getElementById('authButtons');
        if (!authContainer) return;
        const data = await authCheck();
        if (data.authenticated) {
            const imageUrl = data.user?.imageUrl ? resolveImageUrl(data.user.imageUrl) : null;
            authContainer.innerHTML = `
                <div class="profile-icon" id="profileIcon">
                    ${imageUrl ? `<img src="${imageUrl}" class="avatar-mini" alt="avatar">` : '<i class="fas fa-user-circle"></i>'}
                </div>`;
            document.getElementById('profileIcon')?.addEventListener('click', () => window.location.href = '/profile');
            const captain = document.getElementById('captain');
            const member1 = document.getElementById('member1');
            if (captain) captain.value = data.user?.username || '';
            if (member1) member1.value = data.user?.username || '';
        } else {
            authContainer.innerHTML = `
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>`;
            document.getElementById('registerBtn')?.addEventListener('click', () => window.location.href = '/register');
            document.getElementById('loginBtn')?.addEventListener('click', () => window.location.href = '/login');
        }
    }

    function generateMemberFields() {
        const container = document.getElementById('membersContainer');
        if (!container) return;
        container.innerHTML = '';
        const size = parseInt(document.getElementById('teamSizeHidden')?.value || '3', 10);
        for (let i = 2; i <= size; i++) {
            const row = document.createElement('div');
            row.className = 'member-row';
            row.innerHTML = `
                <div class="member-number">${i}</div>
                <div class="member-input">
                    <input type="text" name="member${i}" placeholder="Никнейм игрока">
                </div>`;
            container.appendChild(row);
        }
    }

    function initFormSubmit() {
        const form = document.getElementById('createTeamForm');
        if (!form) return;
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const auth = await authCheck();
            if (!auth.authenticated) {
                showToast('❌ Для создания команды нужно войти в аккаунт', true);
                setTimeout(() => window.location.href = '/login', 1200);
                return;
            }
            const teamName = document.getElementById('teamName')?.value.trim();
            if (!teamName) {
                showToast('❌ Введите название команды', true);
                return;
            }
            const payload = { name: teamName, imageUrl: null };
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
                showToast('✅ Команда создана. Участников можно пригласить позже.');
                setTimeout(() => window.location.href = '/', 1200);
            } catch (error) {
                showToast(`❌ ${error.message}`, true);
            }
        });
    }

    function initCancel() {
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            if (confirm('Все введённые данные будут потеряны. Продолжить?')) {
                window.location.href = '/';
            }
        });
    }

    updateAuthButtons();
    generateMemberFields();
    initFormSubmit();
    initCancel();
})();
