(function() {
  // Используем абсолютные пути для Spring Boot
  const images = [
    "/images/image1.webp",
    "/images/image2.jpg", 
    "/images/image3.webp",
    "/images/image4.webp",
    "/images/image5.jpg"
  ];
  
  console.log("🔍 Проверка изображений:");
  images.forEach(imgPath => {
    const testImg = new Image();
    testImg.onload = () => console.log(`  ✅ ${imgPath} - найдено`);
    testImg.onerror = () => console.log(`  ❌ ${imgPath} - НЕ НАЙДЕНО!`);
    testImg.src = imgPath;
  });
  
  let currentIndex = 0;
  let slides = [];
  let intervalId = null;
  let isTransitioning = false;
  
  const slideshowContainer = document.getElementById('slideshowBg');
  const dotsContainer = document.getElementById('sliderDots');
  
  // Проверяем, есть ли контейнер для слайдов
  if (!slideshowContainer || !dotsContainer) {
    console.log("Слайдер не найден на этой странице");
    return;
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
      slideDiv.style.backgroundRepeat = 'no-repeat';
      
      slideDiv.onerror = () => {
        console.log(`⚠️ Ошибка загрузки: ${imgUrl}`);
        slideDiv.style.backgroundColor = '#2d3748';
        // Можно установить fallback цвет или градиент
        slideDiv.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      };
      
      slideshowContainer.appendChild(slideDiv);
      slides.push(slideDiv);
      
      const dot = document.createElement('span');
      dot.className = 'dot';
      if (idx === 0) dot.classList.add('active');
      dot.dataset.index = idx;
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isTransitioning) return;
        const newIndex = parseInt(dot.dataset.index, 10);
        if (newIndex !== currentIndex) {
          goToSlide(newIndex);
          resetInterval();
        }
      });
      dotsContainer.appendChild(dot);
    });
    
    console.log(`✅ Слайдер инициализирован с ${images.length} изображениями`);
  }
  
  function goToSlide(index) {
    if (index === currentIndex) return;
    if (isTransitioning) return;
    isTransitioning = true;
    
    slides[currentIndex].classList.remove('active');
    const currentDot = dotsContainer.children[currentIndex];
    if (currentDot) currentDot.classList.remove('active');
    
    slides[index].classList.add('active');
    const newDot = dotsContainer.children[index];
    if (newDot) newDot.classList.add('active');
    
    currentIndex = index;
    
    setTimeout(() => {
      isTransitioning = false;
    }, 1300);
  }
  
  function nextSlide() {
    if (isTransitioning) return;
    let nextIdx = currentIndex + 1;
    if (nextIdx >= slides.length) nextIdx = 0;
    goToSlide(nextIdx);
  }
  
  function resetInterval() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    intervalId = setInterval(() => {
      nextSlide();
    }, 12000);
  }
  
  // Функция для показа уведомлений (будет использоваться и в login)
  window.showToast = function(text, isError = false) {
    const toast = document.getElementById('demoToast');
    if (!toast) return;
    
    toast.textContent = text;
    toast.style.background = isError ? '#b91c1c' : '#1f2937';
    toast.style.opacity = '1';
    toast.style.visibility = 'visible';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.visibility = 'hidden';
    }, 2800);
  };
  
  // Инициализация слайдера
  initSlideshow();
  resetInterval();
  
  // Пауза при наведении на левую панель
  const heroPanel = document.querySelector('.hero-panel');
  if (heroPanel) {
    heroPanel.addEventListener('mouseenter', () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    });
    heroPanel.addEventListener('mouseleave', () => {
      if (!intervalId) {
        resetInterval();
      }
    });
  }
  
  // Очистка интервала при уходе со страницы
  window.addEventListener('beforeunload', () => {
    if (intervalId) clearInterval(intervalId);
  });
  
  // Если есть форма регистрации - добавляем валидацию
  const regForm = document.getElementById('registrationForm');
  if (regForm) {
    initRegistrationForm(regForm);
  }
  
  function initRegistrationForm(form) {
    function validatePassword(pwd, confirm) {
      if (pwd.length < 6) {
        window.showToast('❌ Пароль должен содержать минимум 6 символов', true);
        return false;
      }
      if (pwd !== confirm) {
        window.showToast('❌ Пароли не совпадают', true);
        return false;
      }
      return true;
    }
    
    function validateEmail(email) {
      const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
      if (!email || !re.test(email)) {
        window.showToast('❌ Укажите корректный email', true);
        return false;
      }
      return true;
    }
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const firstName = document.getElementById('firstName')?.value.trim();
      const lastName = document.getElementById('lastName')?.value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword')?.value;
      const termsChecked = document.getElementById('terms')?.checked;
      
      if (firstName === '') {
        window.showToast('⚠️ Укажите ваше имя', true);
        return;
      }
      if (lastName === '') {
        window.showToast('⚠️ Укажите фамилию', true);
        return;
      }
      if (!validateEmail(email)) return;
      if (confirm && !validatePassword(password, confirm)) return;
      if (termsChecked !== undefined && !termsChecked) {
        window.showToast('📜 Примите условия использования', true);
        return;
      }
      
      window.showToast(`🎉 Добро пожаловать, ${firstName}!`, false);
      const btn = form.querySelector('.btn-register');
      const originalText = btn.innerText;
      btn.innerText = '✓ Успешно!';
      setTimeout(() => {
        btn.innerText = originalText;
      }, 2000);
    });
    
    // Валидация пароля в реальном времени
    const pwdField = document.getElementById('password');
    const confirmField = document.getElementById('confirmPassword');
    
    if (pwdField && confirmField) {
      function checkPasswordMatchInline() {
        if (confirmField.value.length > 0 && pwdField.value !== confirmField.value) {
          confirmField.style.borderColor = '#ef4444';
          confirmField.style.backgroundColor = '#fff5f5';
        } else if (confirmField.value.length > 0 && pwdField.value === confirmField.value) {
          confirmField.style.borderColor = '#10b981';
          confirmField.style.backgroundColor = '#f0fdf4';
        } else {
          confirmField.style.borderColor = '#e5e7eb';
          confirmField.style.backgroundColor = '#fafbfc';
        }
      }
      
      pwdField.addEventListener('input', checkPasswordMatchInline);
      confirmField.addEventListener('input', checkPasswordMatchInline);
    }
    
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
  }
})();