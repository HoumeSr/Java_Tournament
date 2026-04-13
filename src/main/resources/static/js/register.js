(function() {
    // ========== СЛАЙДЕР ==========
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
    
    // ========== УТИЛИТЫ ==========
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
    
    // ========== СЛАЙДЕР ==========
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
    
    // ========== ВАЛИДАЦИЯ ФОРМЫ ==========
    function initFormValidation() {
        const form = document.getElementById('registrationForm');
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            const firstName = document.getElementById('firstName')?.value.trim();
            const lastName = document.getElementById('lastName')?.value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword')?.value;
            
            if (!firstName) {
                e.preventDefault();
                showToast('⚠️ Укажите ваше имя', true);
                return;
            }
            if (!lastName) {
                e.preventDefault();
                showToast('⚠️ Укажите фамилию', true);
                return;
            }
            if (!isValidEmail(email)) {
                e.preventDefault();
                showToast('❌ Укажите корректный email', true);
                return;
            }
            if (password.length < 6) {
                e.preventDefault();
                showToast('❌ Пароль должен содержать минимум 6 символов', true);
                return;
            }
            if (password !== confirm) {
                e.preventDefault();
                showToast('❌ Пароли не совпадают', true);
                return;
            }
        });
    }
    
    // ========== ВАЛИДАЦИЯ В РЕАЛЬНОМ ВРЕМЕНИ ==========
    function initLiveValidation() {
        const pwdField = document.getElementById('password');
        const confirmField = document.getElementById('confirmPassword');
        const emailInput = document.getElementById('email');
        
        const updateConfirmStyle = () => {
            if (!confirmField || !pwdField) return;
            
            if (confirmField.value.length > 0 && pwdField.value !== confirmField.value) {
                confirmField.style.borderColor = '#ef4444';
                confirmField.style.backgroundColor = '#3d3d3d';
            } else if (confirmField.value.length > 0 && pwdField.value === confirmField.value) {
                confirmField.style.borderColor = '#10b981';
                confirmField.style.backgroundColor = '#3d3d3d';
            } else {
                confirmField.style.borderColor = '#374151';
                confirmField.style.backgroundColor = '#2d2d2d';
            }
        };
        
        pwdField?.addEventListener('input', updateConfirmStyle);
        confirmField?.addEventListener('input', updateConfirmStyle);
        
        emailInput?.addEventListener('blur', function() {
            const val = this.value.trim();
            if (val && !isValidEmail(val)) {
                this.style.borderColor = '#ef4444';
                this.style.backgroundColor = '#3d3d3d';
            } else if (val && isValidEmail(val)) {
                this.style.borderColor = '#10b981';
                this.style.backgroundColor = '#3d3d3d';
            } else {
                this.style.borderColor = '#374151';
                this.style.backgroundColor = '#2d2d2d';
            }
        });
    }
    
    // ========== ЗАПУСК ==========
    initSlideshow();
    resetInterval();
    initFormValidation();
    initLiveValidation();
    
    const heroPanel = document.querySelector('.hero-panel');
    heroPanel?.addEventListener('mouseenter', () => {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
    });
    heroPanel?.addEventListener('mouseleave', resetInterval);
    
    window.addEventListener('beforeunload', () => {
        if (intervalId) clearInterval(intervalId);
    });
})();