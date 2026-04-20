(function() {
    let uploadedImageName = null;
    let gameTypes = [];

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

    function updateAuthButtons() {
        const authContainer = document.getElementById('authButtons');
        if (!authContainer) return;
        fetch('/api/auth/check').then(r => r.json()).then(data => {
            if (data.authenticated) {
                const imageUrl = data.user?.imageUrl ? resolveImageUrl(data.user.imageUrl) : null;
                authContainer.innerHTML = `
                    <div class="profile-icon" id="profileIcon">
                        ${imageUrl ? `<img src="${imageUrl}" class="avatar-mini" alt="avatar">` : '<i class="fas fa-user-circle"></i>'}
                    </div>`;
                document.getElementById('profileIcon')?.addEventListener('click', () => window.location.href = '/profile');
            } else {
                authContainer.innerHTML = `
                    <button class="btn-outline" id="registerBtn">Регистрация</button>
                    <button class="btn-primary" id="loginBtn">Вход</button>`;
                document.getElementById('registerBtn')?.addEventListener('click', () => window.location.href = '/register');
                document.getElementById('loginBtn')?.addEventListener('click', () => window.location.href = '/login');
            }
        }).catch(() => {});
    }

    async function loadGameTypes() {
        const select = document.getElementById('category');
        if (!select) return;
        try {
            const response = await fetch('/api/gametypes/active');
            if (!response.ok) throw new Error('load failed');
            gameTypes = await response.json();
            select.innerHTML = '<option value="">— Выберите игру —</option>';
            gameTypes.forEach(game => {
                const option = document.createElement('option');
                option.value = String(game.id);
                option.textContent = `${game.name}`;
                option.dataset.maxPlayers = game.maxPlayers || 1;
                select.appendChild(option);
            });
        } catch (e) {
            showToast('❌ Не удалось загрузить игры', true);
        }
    }

    function validateDates() {
        const startDate = document.getElementById('startDate')?.value;
        const registrationDeadline = document.getElementById('registrationDeadline')?.value;
        if (!startDate) {
            showToast('❌ Укажите дату начала', true);
            return false;
        }
        if (registrationDeadline && registrationDeadline > startDate) {
            showToast('❌ Дедлайн регистрации должен быть не позже даты начала', true);
            return false;
        }
        return true;
    }

    function initImageUpload() {
        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('tournamentImage');
        const preview = document.getElementById('imagePreview');
        if (!uploadArea || !fileInput || !preview) return;
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => {
            const file = e.target.files?.[0];
            if (!file) return;
            uploadedImageName = file.name;
            const reader = new FileReader();
            reader.onload = ev => {
                preview.innerHTML = `<img src="${ev.target.result}" style="width:100%;max-height:200px;object-fit:cover;border-radius:1rem">`;
                preview.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        });
    }

    function setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('startDate');
        const registrationInput = document.getElementById('registrationDeadline');
        if (startDateInput) startDateInput.min = today;
        if (registrationInput) registrationInput.min = today;
    }

    function initFormSubmit() {
        const form = document.getElementById('createTournamentForm');
        if (!form) return;
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const title = document.getElementById('tournamentName')?.value.trim();
            const gameTypeId = document.getElementById('category')?.value;
            const description = document.getElementById('description')?.value.trim();
            const startDate = document.getElementById('startDate')?.value;
            const registrationDeadline = document.getElementById('registrationDeadline')?.value;
            const maxParticipants = parseInt(document.getElementById('maxPlayers')?.value || '0', 10);
            const minParticipants = parseInt(document.getElementById('minParticipants')?.value || '2', 10);
            const participantType = document.getElementById('participantType')?.value || 'SOLO';
            const access = document.getElementById('access')?.value || 'OPEN';
            if (!title) return showToast('❌ Введите название турнира', true);
            if (!gameTypeId) return showToast('❌ Выберите игру', true);
            if (!validateDates()) return;
            const payload = {
                title,
                description: description || 'Описание пока не добавлено',
                participantType,
                access,
                gameTypeId: Number(gameTypeId),
                status: 'DRAFT',
                startDate: `${startDate}T12:00:00`,
                registrationDeadline: registrationDeadline ? `${registrationDeadline}T23:59:00` : null,
                maxParticipants: Number.isFinite(maxParticipants) && maxParticipants > 1 ? maxParticipants : 16,
                minParticipants: Number.isFinite(minParticipants) && minParticipants > 1 ? minParticipants : 2,
                imageUrl: uploadedImageName
            };
            try {
                const response = await fetch('/api/tournaments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Не удалось создать турнир');
                }
                showToast('✅ Турнир успешно создан');
                setTimeout(() => {
                    const id = result.tournament?.id;
                    window.location.href = id ? `/tournaments/${id}` : '/';
                }, 1200);
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

    function initNavBar() {
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('href') && item.getAttribute('href') !== '#') return;
            item.addEventListener('click', () => showToast('📋 Этот раздел пока в разработке'));
        });
    }

    updateAuthButtons();
    loadGameTypes();
    setMinDate();
    initImageUpload();
    initFormSubmit();
    initCancel();
    initNavBar();
})();
