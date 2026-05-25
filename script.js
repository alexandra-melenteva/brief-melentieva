document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('briefForm');
  if (!form) return;

  const totalEl = document.getElementById('totalValue');
  const totalHidden = document.getElementById('totalHidden');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  // === Make.com Webhook URL ===
  const WEBHOOK_URL = 'https://hook.us2.make.com/yte6ky5kq46dlgbk7tvfvyhbtjt4wkr1';

  // === Калькулятор ===
  function calcTotal() {
    let base = 0;
    let extras = 0;
    let percent = 0;

    const pkg = form.querySelector('input[name="Пакет"]:checked');
    if (pkg) base = parseInt(pkg.dataset.price) || 0;

    form.querySelectorAll('input[type="checkbox"]:checked').forEach(c => {
      if (c.dataset.price) extras += parseInt(c.dataset.price);
      if (c.dataset.percent) percent += parseInt(c.dataset.percent);
    });

    const total = Math.round((base + extras) * (1 + percent / 100));
    const formatted = total.toLocaleString('ru-RU') + ' ₽';

    if (totalEl) totalEl.textContent = formatted;
    if (totalHidden) totalHidden.value = formatted;
  }

  // === Прогресс заполнения ===
  function calcProgress() {
    const fields = form.querySelectorAll('input[required], textarea[required]');
    const pkgChecked = form.querySelector('input[name="Пакет"]:checked');

    let filled = 0;
    let total = fields.length + 1;

    fields.forEach(f => {
      if (f.value.trim() !== '') filled++;
    });
    if (pkgChecked) filled++;

    const pct = Math.round((filled / total) * 100);
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = pct;
  }

  // Слушатели
  form.addEventListener('input', () => {
    calcTotal();
    calcProgress();
  });
  form.addEventListener('change', () => {
    calcTotal();
    calcProgress();
  });

  calcTotal();
  calcProgress();

  // === Сбор данных из формы ===
  function collectFormData() {
    const data = {};
    const fd = new FormData(form);
    for (const [key, value] of fd.entries()) {
      if (data[key]) {
        // Чекбоксы с одним name — собираем массив, затем строкой
        data[key] = [].concat(data[key], value);
      } else {
        data[key] = value;
      }
    }
    // Превращаем массивы в строку через запятую (удобно для Make.com)
    for (const key in data) {
      if (Array.isArray(data[key])) {
        data[key] = data[key].join(', ');
      }
    }
    // Добавим временную метку
    data['Дата_заявки'] = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow'
    });
    return data;
  }

  // === Отправка в Make.com ===
  async function sendToMake(data) {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (e) {
      console.error('Ошибка отправки в Make.com:', e);
      return false;
    }
  }

  // === Перехват отправки формы ===
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Останавливаем стандартную отправку

    // Блокируем кнопку, чтобы не нажали дважды
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Отправка...';
    }

    // Собираем данные
    const data = collectFormData();

    // Отправляем в Make.com
    const success = await sendToMake(data);

    if (success) {
      // Успех — показываем сообщение / редиректим
      form.reset();
      calcTotal();
      calcProgress();
      
      // Вариант 1: показать alert
      alert('✅ Спасибо! Ваша заявка отправлена. Я свяжусь с вами в ближайшее время.');
      
      // Вариант 2 (если есть страница "спасибо") — раскомментируйте строку ниже:
      // window.location.href = '/thanks.html';
    } else {
      alert('❌ Произошла ошибка при отправке. Пожалуйста, попробуйте ещё раз или свяжитесь с нами напрямую.');
      
      // Возвращаем кнопку
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
});