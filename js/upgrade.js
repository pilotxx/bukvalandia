'use strict';
/* Скачивание исходного сохранения перед большим обновлением. */
function downloadPreUpgradeSave() {
  let raw;
  try { raw=localStorage.getItem(KEY+'_before_v6'); } catch(e) { return; }
  if(!raw)return toast('На этом устройстве нет копии предыдущей версии.');
  const a=document.createElement('a'),url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
  a.href=url;a.download='bukvalandia-before-big-update.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
