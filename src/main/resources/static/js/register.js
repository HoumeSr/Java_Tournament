(function() {
    const images = [
        "/images/image1.webp",
        "/images/image2.jpg",
        "/images/image3.jpg",
        "/images/image4.jpg"
    ];

    let currentIndex = 0;
    let slides = [];
    let intervalId = null;
    let isTransitioning = false;

    const slideshowContainer = document.getElementById('slideshowBg');
    const dotsContainer = document.getElementById('sliderDots');

    if (!slideshowContainer || !dotsContainer) return;

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

    function isValidEmail(email) {
        return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);
    }

    function initSlideshow() {
        slideshowContainer.innerHTML = '';
        dotsContainer.innerHTML = '';
        slides = [];

        images.forEach((imgUrl, idx) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'slide';
            if (idx === 0) slideDiv.classList.add('active');
            slideDiv.style.backgroundImage = `url('${imgUrl}')`;
            slideDiv.style.backgroundSize = 'cover';
            slideDiv.style.backgroundPosition = 'center 30%';

            slideDiv.onerror = () => {
                slideDiv.style.backgroundImage = 'linear-gradient(135deg, #667eea, #764ba2)';
            };

            slideshowContainer.appendChild(slideDiv);
            slides.push(slideDiv);

            const dot = document.createElement('span');
            dot.className = 'dot';
            if (idx === 0) dot.classList.add('active');
            dot.dataset.index = idx;
            dot.addEventListener('click', () => {
                if (isTransitioning) return;
                const newIndex = parseInt(dot.dataset.index);
                if (newIndex !== currentIndex) {
                    goToSlide(newIndex);
                    resetInterval();
                }
            });
            dotsContainer.appendChild(dot);
        });
    }

    function goToSlide(index) {
        if (index === currentIndex || isTransitioning) return;
        isTransitioning = true;

        slides[currentIndex]?.classList.remove('active');
        dotsContainer.children[currentIndex]?.classList.remove('active');

        slides[index]?.classList.add('active');
        dotsContainer.children[index]?.classList.add('active');

        currentIndex = index;
        setTimeout(() => { isTransitioning = false; }, 1300);
    }

    function nextSlide() {
        if (isTransitioning) return;
        goToSlide((currentIndex + 1) % slides.length);
    }

    function resetInterval() {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(nextSlide, 7000);
    }

    async function registerUser(userData) {
        const submitBtn = document.querySelector('#registrationForm button[type="submit"]');
        const originalText = submitBtn?.textContent;
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Регистрация...';
        }

        try {
            // Создаем FormData для отправки как @RequestParam
            const formData = new FormData();
            formData.append('username', userData.username);
            formData.append('email', userData.email);
            formData.append('password', userData.password);
            formData.append('confirmPassword', userData.confirmPassword);
            
            // Отправляем на AJAX endpoint
            const response = await window.api.post('/api/auth/register', formData);
            
            // Проверяем успешность ответа
            if (response && response.success) {
                showToast('✅ ' + (response.message || 'Регистрация успешна! Перенаправление...'));
                
                try {
                    const loginFormData = new FormData();
                    loginFormData.append('login', userData.email);
                    loginFormData.append('password', userData.password);
                    
                    const loginResponse = await window.api.post('/api/auth/login', loginFormData);
                    
                    if (loginResponse && loginResponse.success) {
                        showToast('✅ Вы успешно вошли в аккаунт! Перенаправление...');
                        
                        if (loginResponse.user) {
                            sessionStorage.setItem('user', JSON.stringify(loginResponse.user));
                        }
                        
                        setTimeout(() => {
                            window.location.href = loginResponse.redirectUrl || '/profile';
                        }, 1500);
                    } else {
                        // Если автоматический вход не удался
                        setTimeout(() => {
                            window.location.href = '/login?registered=true';
                        }, 1500);
                    }
                } catch (loginError) {
                    console.error('Auto-login error:', loginError);
                    setTimeout(() => {
                        window.location.href = '/login?registered=true';
                    }, 1500);
                }
            } else {
                showToast(response?.message || 'Ошибка регистрации', true);
            }
        } catch (error) {
            console.error('Registration error:', error);
            
            // Обработка ошибок с бэкенда
            let errorMessage = '❌ Ошибка сервера';
            
            if (error.message) {
                // Парсим возможные ошибки от бэкенда
                if (error.message.includes('никнейм') || error.message.includes('username')) {
                    errorMessage = '❌ ' + error.message;
                } else if (error.message.includes('Email') || error.message.includes('email')) {
                    errorMessage = '❌ ' + error.message;
                } else if (error.message.includes('пароли') || error.message.includes('Пароли')) {
                    errorMessage = '❌ ' + error.message;
                } else if (error.message.includes('already')) {
                    errorMessage = '❌ Пользователь с таким именем или email уже существует';
                } else {
                    errorMessage = '❌ ' + error.message;
                }
            }
            
            showToast(errorMessage, true);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    function initFormValidation() {
        const form = document.getElementById('registrationForm');
        if (!form) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Получаем значения полей
            const username = document.getElementById('username')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const password = document.getElementById('password')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;

            // Валидация перед отправкой
            if (!username) {
                showToast('⚠️ Укажите никнейм', true);
                return;
            }
            if (username.length < 3) {
                showToast('⚠️ Никнейм должен содержать минимум 3 символа', true);
                return;
            }
            if (username.length > 50) {
                showToast('⚠️ Никнейм не должен превышать 50 символов', true);
                return;
            }
            if (!isValidEmail(email)) {
                showToast('❌ Укажите корректный email', true);
                return;
            }
            if (!password || password.length < 6) {
                showToast('❌ Пароль должен содержать минимум 6 символов', true);
                return;
            }
            if (password.length > 100) {
                showToast('❌ Пароль не должен превышать 100 символов', true);
                return;
            }
            if (password !== confirmPassword) {
                showToast('❌ Пароли не совпадают', true);
                return;
            }

            // Отправка через API хелпер
            await registerUser({ username, email, password, confirmPassword });
        });
    }

    function initLiveValidation() {
        const pwdField = document.getElementById('password');
        const confirmField = document.getElementById('confirmPassword');
        const emailInput = document.getElementById('email');
        const usernameInput = document.getElementById('username');

        const updateConfirmStyle = () => {
            if (!confirmField || !pwdField) return;

            if (confirmField.value.length > 0 && pwdField.value !== confirmField.value) {
                confirmField.style.borderColor = '#ef4444';
                confirmField.style.backgroundColor = '#3d3d3d';
            } else if (confirmField.value.length > 0 && pwdField.value === confirmField.value) {
                confirmField.style.borderColor = '#10b981';
                confirmField.style.backgroundColor = '#3d3d3d';
            } else {
                resetFieldStyle(confirmField);
            }
        };

        const resetFieldStyle = (field) => {
            field.style.borderColor = '#374151';
            field.style.backgroundColor = '#2d2d2d';
        };

        const validateEmailLive = () => {
            if (!emailInput) return;
            const val = emailInput.value.trim();
            if (val && !isValidEmail(val)) {
                emailInput.style.borderColor = '#ef4444';
                emailInput.style.backgroundColor = '#3d3d3d';
            } else if (val && isValidEmail(val)) {
                emailInput.style.borderColor = '#10b981';
                emailInput.style.backgroundColor = '#3d3d3d';
            } else {
                resetFieldStyle(emailInput);
            }
        };

        const validateUsernameLive = () => {
            if (!usernameInput) return;
            const val = usernameInput.value.trim();
            if (val && val.length < 3) {
                usernameInput.style.borderColor = '#ef4444';
                usernameInput.style.backgroundColor = '#3d3d3d';
            } else if (val && val.length >= 3) {
                usernameInput.style.borderColor = '#10b981';
                usernameInput.style.backgroundColor = '#3d3d3d';
            } else {
                resetFieldStyle(usernameInput);
            }
        };

        pwdField?.addEventListener('input', updateConfirmStyle);
        confirmField?.addEventListener('input', updateConfirmStyle);
        emailInput?.addEventListener('input', validateEmailLive);
        emailInput?.addEventListener('blur', validateEmailLive);
        usernameInput?.addEventListener('input', validateUsernameLive);
        usernameInput?.addEventListener('blur', validateUsernameLive);
    }

    // Показываем сообщение об успешной регистрации, если есть параметр в URL
    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            showToast('✅ Регистрация успешна! Теперь войдите в аккаунт.');
            // Очищаем параметр из URL для обновления страницы
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (urlParams.get('registered') === 'true') {
            showToast('✅ Аккаунт создан! Пожалуйста, войдите.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Проверяем, что API хелпер загружен
    if (typeof window.api === 'undefined') {
        console.error('API helper not loaded!');
        showToast('Ошибка загрузки API', true);
    } else {
        console.log('API helper loaded successfully');
    }

    // Инициализация
    initSlideshow();
    resetInterval();
    initFormValidation();
    initLiveValidation();
    checkUrlParams(); // Проверяем параметры URL

    // Пауза слайдшоу при наведении
    const heroPanel = document.querySelector('.hero-panel');
    heroPanel?.addEventListener('mouseenter', () => {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
    });
    heroPanel?.addEventListener('mouseleave', resetInterval);

    // Очистка интервала при уходе со страницы
    window.addEventListener('beforeunload', () => {
        if (intervalId) clearInterval(intervalId);
    });
})();