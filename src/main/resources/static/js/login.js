(function() {
  const form = document.getElementById('loginForm');
  
  if (!form) {
    console.log("Форма входа не найдена на этой странице");
    return;
  }
  
  function validateEmail(email) {
    const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return re.test(email);
  }
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;
    
    if (!validateEmail(email)) {
      window.showToast('❌ Укажите корректный email', true);
      return;
    }
    
    if (password.length === 0) {
      window.showToast('❌ Введите пароль', true);
      return;
    }
    
    if (password.length < 6) {
      window.showToast('❌ Пароль должен содержать минимум 6 символов', true);
      return;
    }
    
    window.showToast(`🔐 Добро пожаловать!`, false);
  });
  
  // Валидация email в реальном времени (исправленная)
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      const val = this.value.trim();
      const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
      if (val !== '' && !re.test(val)) {
        this.style.borderColor = '#ef4444';
        this.style.backgroundColor = '#3d3d3d';
      } else if (val !== '' && re.test(val)) {
        this.style.borderColor = '#10b981';
        this.style.backgroundColor = '#3d3d3d';
      } else {
        this.style.borderColor = '#374151';
        this.style.backgroundColor = '#2d2d2d';
      }
    });
  }
})();