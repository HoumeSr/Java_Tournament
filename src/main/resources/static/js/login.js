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
    
    // Здесь будет запрос к бэкенду
    window.showToast(`🔐 Добро пожаловать!`, false);
    
    // Пример отправки на сервер:
    // fetch('/signin', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password, remember })
    // })
    // .then(response => response.json())
    // .then(data => {
    //   if (data.success) {
    //     window.location.href = '/dashboard';
    //   } else {
    //     window.showToast(data.message, true);
    //   }
    // })
    // .catch(error => {
    //   window.showToast('Ошибка соединения с сервером', true);
    // });
  });
  
  // Валидация email в реальном времени
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      const val = this.value.trim();
      const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
      if (val !== '' && !re.test(val)) {
        this.style.borderColor = '#f97316';
        this.style.backgroundColor = '#fff7ed';
      } else if (val !== '' && re.test(val)) {
        this.style.borderColor = '#10b981';
        this.style.backgroundColor = '#f0fdf4';
      } else {
        this.style.borderColor = '#e5e7eb';
        this.style.backgroundColor = '#fafbfc';
      }
    });
  }
})();