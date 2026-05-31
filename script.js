/* ========================================
   СТИЛИ ДЛЯ <SELECT> (выпадающие списки)
   ======================================== */

.field select{
  width:100%;
  padding:14px 16px;
  background:rgba(11,15,26,.6);
  border:1px solid rgba(255,255,255,.1);
  border-radius:12px;
  color:#fff;
  font-family:inherit;
  font-size:15px;
  cursor:pointer;
  transition:all .2s;
  -webkit-appearance:none;
  -moz-appearance:none;
  appearance:none;
  /* Кастомная стрелочка */
  background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23A5B4FC' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-repeat:no-repeat;
  background-position:right 16px center;
  background-size:12px 8px;
  padding-right:44px;
}

.field select:focus{
  outline:none;
  border-color:#A5B4FC;
  background-color:rgba(11,15,26,.9);
  box-shadow:0 0 0 4px rgba(99,102,241,.15);
}

.field select option{
  background:#0B0F1A;
  color:#fff;
  padding:10px;
}

/* ========================================
   СТИЛИ ДЛЯ DISABLED-КАРТОЧЕК (на будущее)
   ======================================== */

.niche-card.disabled{
  opacity:.45;
  cursor:not-allowed;
  pointer-events:none;
  filter:grayscale(.4);
}
.niche-card.disabled:hover{
  transform:none;
  box-shadow:none;
}