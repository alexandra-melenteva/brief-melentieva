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
    const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
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

  // === Валидация контакта (email или телефон) ===
  function validateContact(value) {
    const cleaned = value.trim();
    if (!cleaned) return false;
    // Email — содержит @ и точку
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
    // Телефон — минимум 7 цифр
    const digits = cleaned.replace(/\D/g, '');
    const isPhone = digits.length >= 7;
    return isEmail || isPhone;
  }

  // === Кастомный тост ===
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // === Сбор данных из формы ===
  function collectFormData() {
    const data = {};
    const fd = new FormData(form);
    for (const [key, value] of fd.entries()) {
      if (data[key]) {
        data[key] = [].concat(data[key], value);
      } else {
        data[key] = value;
      }
    }
    // Массивы → строка через запятую
    for (const key in data) {
      if (Array.isArray(data[key])) {
        data[key] = data[key].join(', ');
      }
    }
    // Заглушка для пустых опций
    if (!data['Доп_опции']) {
      data['Доп_опции'] = 'Не выбрано';
    }
    // ✅ Имя столбца «Дата» — совпадает с Google Sheets
    data['Дата'] = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow'
    });

    // 🐛 ОТЛАДКА с акцентом на нишу
    console.log(`📤 Отправка [${data['Ниша'] || 'без ниши'}]:`, data);

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

      const responseText = await response.text();
      console.log('📥 Ответ Make.com:', response.status, responseText);

      return response.ok;
    } catch (e) {
      console.error('❌ Ошибка отправки в Make.com:', e);
      return false;
    }
  }

  // === Перехват отправки формы ===
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // === Проверка согласия на ПД ===
    const consent = document.getElementById('consentCheckbox');
    if (consent && !consent.checked) {
      showToast('⚠️ Для отправки формы необходимо дать согласие на обработку персональных данных.', 'error');
      consent.focus();
      return;
    }

    // === Валидация контакта ===
    const contactField = form.querySelector('input[name="Контакт"]');
    if (contactField && !validateContact(contactField.value)) {
      showToast('⚠️ Проверьте поле «Контакт» — нужен email или телефон (минимум 7 цифр).', 'error');
      contactField.focus();
      return;
    }

    // Блокировка кнопки
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Отправка...';
    }

    const data = collectFormData();
    const success = await sendToMake(data);

    if (success) {
      // ✅ Успех: редирект на thanks.html
      form.reset();
      // Принудительный сброс калькулятора
      if (totalEl) totalEl.textContent = '0 ₽';
      if (totalHidden) totalHidden.value = '0 ₽';
      calcProgress();

      showToast('✅ Заявка отправлена! Перенаправляем…', 'success');

      // Редирект через 1.5 сек
      setTimeout(() => {
        window.location.href = 'thanks.html';
      }, 1500);
    } else {
      showToast('❌ Ошибка отправки. Попробуйте ещё раз или напишите в Telegram: @MeleSandra', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
});