(function() {
    const form = document.getElementById('loginForm');

    if (!form) {
        console.log("Форма входа не найдена на этой странице");
        return;
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

    form.addEventListener('submit', function(e) {
        const loginInput = document.getElementById('login');
        const passwordInput = document.getElementById('password');

        const login = loginInput ? loginInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        const loginValidation = validateLoginValue(login);
        if (!loginValidation.valid) {
            e.preventDefault();
            showToast(loginValidation.message, true);
            return;
        }

        if (!password) {
            e.preventDefault();
            showToast('❌ Введите пароль', true);
            return;
        }

        if (password.length < 6) {
            e.preventDefault();
            showToast('❌ Пароль должен содержать минимум 6 символов', true);
            return;
        }
    });

    const loginInput = document.getElementById('login');
    if (loginInput) {
        loginInput.addEventListener('blur', function() {
            const val = this.value.trim();

            if (!val) {
                this.style.borderColor = '#374151';
                this.style.backgroundColor = '#2d2d2d';
                return;
            }

            const validation = validateLoginValue(val);

            if (!validation.valid) {
                this.style.borderColor = '#ef4444';
                this.style.backgroundColor = '#3d3d3d';
            } else {
                this.style.borderColor = '#10b981';
                this.style.backgroundColor = '#3d3d3d';
            }
        });
    }

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