(function() {
    const form = document.getElementById('loginForm');
    
    if (!form) {
        console.log("Форма входа не найдена на этой странице");
        return;
    }
    
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
    
    // ========== ВАЛИДАЦИЯ ФОРМЫ ==========
    form.addEventListener('submit', function(e) {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        if (!isValidEmail(email)) {
            e.preventDefault();
            showToast('❌ Укажите корректный email', true);
            return;
        }
        
        if (password.length === 0) {
            e.preventDefault();
            showToast('❌ Введите пароль', true);
            return;
        }
        
        if (password.length < 6) {
            e.preventDefault();
            showToast('❌ Пароль должен содержать минимум 6 символов', true);
            return;
        }
        
        // Если всё ок, форма отправится на бэкенд
    });
    
    // ========== ВАЛИДАЦИЯ EMAIL В РЕАЛЬНОМ ВРЕМЕНИ ==========
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
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
    
    // ========== ВАЛИДАЦИЯ ПАРОЛЯ В РЕАЛЬНОМ ВРЕМЕНИ (опционально) ==========
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            if (this.value.length > 0 && this.value.length < 6) {
                this.style.borderColor = '#ef4444';
                this.style.backgroundColor = '#3d3d3d';
            } else if (this.value.length >= 6) {
                this.style.borderColor = '#10b981';
                this.style.backgroundColor = '#3d3d3d';
            } else {
                this.style.borderColor = '#374151';
                this.style.backgroundColor = '#2d2d2d';
            }
        });
    }
})();