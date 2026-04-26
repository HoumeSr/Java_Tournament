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
            
            // Заполняем поле капитана username авторизованного пользователя
            const captainInput = document.getElementById('captain');
            if (captainInput) captainInput.value = data.user?.username || '';
        } else {
            authContainer.innerHTML = `
                <button class="btn-outline" id="registerBtn">Регистрация</button>
                <button class="btn-primary" id="loginBtn">Вход</button>`;
            document.getElementById('registerBtn')?.addEventListener('click', () => window.location.href = '/register');
            document.getElementById('loginBtn')?.addEventListener('click', () => window.location.href = '/login');
        }
    }

    // Загрузка игр для выбора
    async function loadGameTypes() {
        const select = document.getElementById('gameType');
        if (!select) return;
        
        try {
            const response = await fetch('/api/game-types');
            if (!response.ok) throw new Error('Ошибка загрузки игр');
            
            const games = await response.json();
            
            if (games && games.length > 0) {
                select.innerHTML = '<option value="">— Выберите игру —</option>';
                games.forEach(game => {
                    select.innerHTML += `<option value="${game.id}">${game.name} ${game.code ? '(' + game.code + ')' : ''}</option>`;
                });
            } else {
                select.innerHTML = '<option value="">— Игры не найдены —</option>';
            }
        } catch (error) {
            console.error('Error loading games:', error);
            select.innerHTML = '<option value="">— Ошибка загрузки игр —</option>';
        }
    }

    // Загрузка изображения
    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/images/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки изображения');
            
            const result = await response.json();
            return result.url || result.imageUrl;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    }

    function initImageUpload() {
        const uploadArea = document.getElementById('imageUploadArea');
        const imageInput = document.getElementById('teamImage');
        const imagePreview = document.getElementById('imagePreview');
        
        if (!uploadArea || !imageInput) return;
        
        uploadArea.addEventListener('click', () => {
            imageInput.click();
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--accent)';
            uploadArea.style.background = 'rgba(124, 58, 237, 0.05)';
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-dim)';
            uploadArea.style.background = 'transparent';
        });
        
        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-dim)';
            uploadArea.style.background = 'transparent';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                await handleImageUpload(file, imagePreview);
            } else {
                showToast('❌ Пожалуйста, выберите изображение', true);
            }
        });
        
        imageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await handleImageUpload(file, imagePreview);
            }
        });
    }
    
    async function handleImageUpload(file, previewContainer) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ Изображение не должно превышать 5MB', true);
            return null;
        }
        
        // Показываем превью
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" id="removeImageBtn">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;
            const removeBtn = document.getElementById('removeImageBtn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    previewContainer.innerHTML = `
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Нажмите или перетащите изображение</p>
                        <span class="image-hint">PNG, JPG, WEBP до 5MB</span>
                    `;
                    window.uploadedImageUrl = null;
                });
            }
        };
        reader.readAsDataURL(file);
        
        // Загружаем на сервер
        const imageUrl = await uploadImage(file);
        if (imageUrl) {
            window.uploadedImageUrl = imageUrl;
            showToast('✅ Изображение загружено');
            return imageUrl;
        }
        return null;
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
            
            const gameTypeId = document.getElementById('gameType')?.value;
            if (!gameTypeId) {
                showToast('❌ Выберите игру', true);
                return;
            }
            
            // Формируем DTO
            const payload = {
                name: teamName,
                gameTypeId: parseInt(gameTypeId),
                imageUrl: window.uploadedImageUrl || null
            };
            
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
                
                showToast('✅ Команда успешно создана!');
                setTimeout(() => {
                    window.location.href = `/team/${team.id}`;
                }, 1500);
                
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

    // Инициализация
    updateAuthButtons();
    loadGameTypes();
    initImageUpload();
    initFormSubmit();
    initCancel();
})();