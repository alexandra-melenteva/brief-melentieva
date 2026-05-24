document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('briefForm');
  if (!form) return;

  const totalEl = document.getElementById('totalValue');
  const totalHidden = document.getElementById('totalHidden');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');

  // === Telegram настройки ===
  const TG_TOKEN = '8780405954:AAHY2jmVd91TbhfUKdrmWPkXFcCswI83Onw';
  const TG_CHAT_ID = '1266707229';

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
        // Если поле уже есть (чекбоксы с одним name) — собираем массив
        data[key] = [].concat(data[key], value);
      } else {
        data[key] = value;
      }
    }
    return data;
  }

  // === Формирование сообщения для Telegram ===
  function buildTelegramMessage(data) {
    let msg = '🔔 <b>НОВАЯ ЗАЯВКА С БРИФА</b>\n\n';

    // Контакты
    const contactFields = ['Имя', 'Телефон', 'Email', 'Telegram', 'Компания'];
    const contactIcons = {
      'Имя': '👤',
      'Телефон': '📞',
      'Email': '✉️',
      'Telegram': '💬',
      'Компания': '🏢'
    };

    let hasContacts = false;
    contactFields.forEach(field => {
      if (data[field]) {
        msg += `${contactIcons[field]} <b>${field}:</b> ${escapeHtml(data[field])}\n`;
        hasContacts = true;
      }
    });

    if (hasContacts) msg += '\n';

    // Пакет
    if (data['Пакет']) {
      msg += `📦 <b>Пакет:</b> ${escapeHtml(data['Пакет'])}\n`;
    }

    // Итоговая сумма
    if (data['Итого']) {
      msg += `💰 <b>Сумма:</b> ${escapeHtml(data['Итого'])}\n`;
    }

    msg += '\n━━━━━━━━━━━━━━━\n<b>Детали брифа:</b>\n\n';

    // Все остальные поля
    const skipFields = [...contactFields, 'Пакет', 'Итого', '_subject', '_captcha', '_template', '_next', '_honey'];
    
    for (const key in data) {
      if (skipFields.includes(key)) continue;
      if (key.startsWith('_')) continue;
      
      const value = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
      if (!value || !value.toString().trim()) continue;
      
      msg += `<b>${escapeHtml(key)}:</b> ${escapeHtml(value)}\n`;
    }

    // Ограничение Telegram — 4096 символов
    if (msg.length > 4000) {
      msg = msg.substring(0, 3990) + '\n\n... (обрезано)';
    }

    return msg;
  }

  // Экранирование HTML для Telegram
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // === Отправка в Telegram ===
  async function sendToTelegram(data) {
    const message = buildTelegramMessage(data);
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
      const result = await response.json();
      if (!result.ok) {
        console.warn('Telegram error:', result);
      }
      return result.ok;
    } catch (e) {
      console.warn('Telegram send failed:', e);
      return false;
    }
  }

  // === Перехват отправки формы ===
  form.addEventListener('submit', (e) => {
    // Собираем данные ДО отправки
    const data = collectFormData();
    
    // Отправляем в Telegram параллельно (не блокируя основную отправку)
    sendToTelegram(data);
    
    // Форма продолжает уходить на FormSubmit как обычно — НЕ делаем preventDefault
  });
});