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
        
        fileInput.addEventListener('change', async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            // Сначала загружаем изображение на сервер
            const formData = new FormData();
            formData.append('image', file);
            
            try {
                showToast('📤 Загрузка изображения...');
                const uploadResponse = await fetch('/api/images/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!uploadResponse.ok) throw new Error('Не удалось загрузить изображение');
                
                const uploadResult = await uploadResponse.json();
                uploadedImageName = uploadResult.imageUrl; // Сохраняем URL загруженного изображения
                
                // Показываем превью
                const reader = new FileReader();
                reader.onload = ev => {
                    preview.innerHTML = `<img src="${ev.target.result}" style="width:100%;max-height:200px;object-fit:cover;border-radius:1rem">`;
                    preview.classList.add('has-image');
                };
                reader.readAsDataURL(file);
                
                showToast('✅ Изображение загружено');
            } catch (error) {
                showToast(`❌ ${error.message}`, true);
            }
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
            
            // Сбор данных из формы
            const title = document.getElementById('tournamentName')?.value.trim();
            const description = document.getElementById('description')?.value.trim();
            const participantType = document.getElementById('participantType')?.value || 'SOLO';
            const access = document.getElementById('access')?.value || 'OPEN';
            const gameTypeId = document.getElementById('category')?.value;
            const startDate = document.getElementById('startDate')?.value;
            const registrationDeadline = document.getElementById('registrationDeadline')?.value;
            const maxParticipants = parseInt(document.getElementById('maxPlayers')?.value || '0', 10);
            
            // Валидация
            if (!title) return showToast('❌ Введите название турнира', true);
            if (!gameTypeId) return showToast('❌ Выберите игру', true);
            if (!validateDates()) return;
            
            // Формируем DTO в точном соответствии с CreateTournamentDTO
            const createTournamentDTO = {
                title: title,
                description: description || 'Описание пока не добавлено',
                participantType: participantType,
                access: access,
                gameTypeId: Number(gameTypeId),
                status: 'DRAFT', // Статус по умолчанию для создаваемого турнира
                startDate: `${startDate}T12:00:00`,
                registrationDeadline: registrationDeadline ? `${registrationDeadline}T23:59:00` : null,
                maxParticipants: Number.isFinite(maxParticipants) && maxParticipants > 1 ? maxParticipants : 16,
                imageUrl: uploadedImageName || null // URL загруженного изображения или null
            };
            
            console.log('Отправляем DTO:', createTournamentDTO);
            
            try {
                const response = await fetch('/api/tournaments', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(createTournamentDTO)
                });
                
                const result = await response.json();
                
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Не удалось создать турнир');
                }
                
                showToast('✅ Турнир успешно создан');
                
                // Перенаправление на страницу созданного турнира
                setTimeout(() => {
                    const tournamentId = result.tournament?.id;
                    if (tournamentId) {
                        window.location.href = `/tournaments/${tournamentId}`;
                    } else {
                        window.location.href = '/';
                    }
                }, 1500);
                
            } catch (error) {
                console.error('Ошибка создания турнира:', error);
                showToast(`❌ ${error.message}`, true);
            }
        });
    }

    function initCancel() {
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (confirm('Все введённые данные будут потеряны. Продолжить?')) {
                    window.location.href = '/';
                }
            });
        }
    }

    function initNavBar() {
        document.querySelectorAll('.nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href && href !== '#') return;
            item.addEventListener('click', () => showToast('📋 Этот раздел пока в разработке'));
        });
    }

    // Инициализация
    updateAuthButtons();
    loadGameTypes();
    setMinDate();
    initImageUpload();
    initFormSubmit();
    initCancel();
    initNavBar();
})();