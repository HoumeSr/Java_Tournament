(function() {
    const images = [
        "/images/games/image1.webp",
        "/images/games/image2.jpg",
        "/images/games/image3.jpg",
        "/images/games/image4.jpg"
    ];

    let currentIndex = 0;
    let slides = [];
    let intervalId = null;
    let isTransitioning = false;

    const slideshowContainer = document.getElementById('slideshowBg');
    const dotsContainer = document.getElementById('sliderDots');

    // Инициализация слайдшоу (если элементы существуют)
    if (slideshowContainer && dotsContainer) {
        initSlideshow();
        resetInterval();
    }

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

    function isValidEmail(value) {
        return /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value);
    }

    function isValidUsername(value) {
        return value.length >= 3;
    }

    function validateLoginValue(value) {
        if (!value) {
            return { valid: false, message: '❌ Введите никнейм или email' };
        }

        if (value.includes('@')) {
            if (!isValidEmail(value)) {
                return { valid: false, message: '❌ Укажите корректный email' };
            }
            return { valid: true };
        }

        if (!isValidUsername(value)) {
            return { valid: false, message: '❌ Никнейм должен содержать минимум 3 символа' };
        }

        return { valid: true };
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

    async function loginUser(loginData) {
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn?.textContent;
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Вход...';
        }

        try {
            // Создаем FormData для отправки как @RequestParam
            const formData = new FormData();
            formData.append('login', loginData.login);
            formData.append('password', loginData.password);
            
            // Отправляем на AJAX endpoint
            const response = await window.api.post('/api/auth/login', formData);
            
            // Проверяем успешность ответа
            if (response && response.success) {
                showToast('✅ ' + (response.message || 'Вход выполнен успешно! Перенаправление...'));
                
                // Сохраняем данные пользователя в sessionStorage (опционально)
                if (response.user) {
                    sessionStorage.setItem('user', JSON.stringify(response.user));
                }
                
                // Перенаправление через 1.5 секунды
                setTimeout(() => {
                    window.location.href = response.redirectUrl || '/profile';
                }, 1500);
            } else {
                showToast(response?.message || 'Ошибка входа', true);
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Обработка ошибок с бэкенда
            let errorMessage = '❌ Ошибка сервера';
            
            if (error.message) {
                if (error.message.includes('Неверный') || error.message.includes('пароль')) {
                    errorMessage = '❌ Неверный логин/email или пароль';
                } else if (error.message.includes('отключен')) {
                    errorMessage = '❌ Аккаунт отключен. Обратитесь к администратору';
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
        const form = document.getElementById('loginForm');
        if (!form) {
            console.log("Форма входа не найдена на этой странице");
            return;
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault(); // Отменяем стандартную отправку формы

            const loginInput = document.getElementById('login');
            const passwordInput = document.getElementById('password');

            const login = loginInput ? loginInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            // Валидация перед отправкой
            const loginValidation = validateLoginValue(login);
            if (!loginValidation.valid) {
                showToast(loginValidation.message, true);
                return;
            }

            if (!password) {
                showToast('❌ Введите пароль', true);
                return;
            }

            if (password.length < 6) {
                showToast('❌ Пароль должен содержать минимум 6 символов', true);
                return;
            }

            // Отправка через API хелпер
            await loginUser({ login, password });
        });
    }

    function initLiveValidation() {
        const loginInput = document.getElementById('login');
        const passwordInput = document.getElementById('password');

        if (loginInput) {
            const validateLoginField = () => {
                const val = loginInput.value.trim();

                if (!val) {
                    loginInput.style.borderColor = '#374151';
                    loginInput.style.backgroundColor = '#2d2d2d';
                    return;
                }

                const validation = validateLoginValue(val);

                if (!validation.valid) {
                    loginInput.style.borderColor = '#ef4444';
                    loginInput.style.backgroundColor = '#3d3d3d';
                } else {
                    loginInput.style.borderColor = '#10b981';
                    loginInput.style.backgroundColor = '#3d3d3d';
                }
            };

            loginInput.addEventListener('input', validateLoginField);
            loginInput.addEventListener('blur', validateLoginField);
        }

        if (passwordInput) {
            const validatePasswordField = () => {
                if (passwordInput.value.length > 0 && passwordInput.value.length < 6) {
                    passwordInput.style.borderColor = '#ef4444';
                    passwordInput.style.backgroundColor = '#3d3d3d';
                } else if (passwordInput.value.length >= 6) {
                    passwordInput.style.borderColor = '#10b981';
                    passwordInput.style.backgroundColor = '#3d3d3d';
                } else {
                    passwordInput.style.borderColor = '#374151';
                    passwordInput.style.backgroundColor = '#2d2d2d';
                }
            };

            passwordInput.addEventListener('input', validatePasswordField);
            passwordInput.addEventListener('blur', validatePasswordField);
        }
    }

    // Пауза слайдшоу при наведении
    const heroPanel = document.querySelector('.hero-panel');
    if (heroPanel) {
        heroPanel.addEventListener('mouseenter', () => {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
        });
        heroPanel.addEventListener('mouseleave', resetInterval);
    }

    // Очистка интервала при уходе со страницы
    window.addEventListener('beforeunload', () => {
        if (intervalId) clearInterval(intervalId);
    });


    // Инициализация
    initFormValidation();
    initLiveValidation();
})();