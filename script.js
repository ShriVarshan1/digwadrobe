/* ========= app object =========
   holds auth + wardrobe functions and page renderers
*/
const app = (function(){
  const LS_USERS = 'dw_users_v2';
  const LS_SESSION = 'dw_session_v2';
  const LS_ITEMS = 'dw_items_v2';

  /* ---------- auth ---------- */
  function readUsers(){ return JSON.parse(localStorage.getItem(LS_USERS) || '{}'); }
  function writeUsers(obj){ localStorage.setItem(LS_USERS, JSON.stringify(obj)); }

  function signup(username, password){
    const users = readUsers();
    if (users[username]) return false; // exists
    users[username] = { password };
    writeUsers(users);
    localStorage.setItem(LS_SESSION, username);
    return true;
  }

  function login(username, password){
    const users = readUsers();
    if (!users[username] || users[username].password !== password) return false;
    localStorage.setItem(LS_SESSION, username);
    return true;
  }

  function logout(){ localStorage.removeItem(LS_SESSION); }
  function getCurrentUser(){ return localStorage.getItem(LS_SESSION); }

  /* ---------- items ---------- */
  function readItems(){ return JSON.parse(localStorage.getItem(LS_ITEMS) || '{}'); }
  function writeItems(obj){ localStorage.setItem(LS_ITEMS, JSON.stringify(obj)); }

  function saveItemForUser(item){
    const user = getCurrentUser();
    if (!user) return false;
    const all = readItems();
    if (!all[user]) all[user] = [];
    all[user].push(item);
    writeItems(all);
    return true;
  }

  function getItemsForUser(){
    const user = getCurrentUser();
    if (!user) return [];
    const all = readItems();
    return all[user] || [];
  }

  function deleteItem(id){
    const user = getCurrentUser();
    if (!user) return false;
    const all = readItems();
    if (!all[user]) return false;
    all[user] = all[user].filter(it => it.id !== id);
    writeItems(all);
    return true;
  }

  /* ---------- UI helpers ---------- */

  // Called by dashboard page to render items
  function renderDashboard(){
    const grid = document.getElementById('itemsGrid');
    const empty = document.getElementById('emptyNotice');
    if (!grid) return;
    grid.innerHTML = '';
    const items = getItemsForUser();
    if (!items || items.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';
    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${it.image}" alt="${it.category}">
        <div class="cat">${it.category}</div>
        <div class="meta">${it.note ? escapeHtml(it.note) : ''}</div>
        <div class="actions">
          <button class="delete-btn" data-id="${it.id}">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });

    // attach delete handlers
    grid.querySelectorAll('.delete-btn').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const id = Number(btn.getAttribute('data-id'));
        if (!confirm('Delete this item?')) return;
        deleteItem(id);
        // re-render
        renderDashboard();
      });
    });
  }

  // generate outfit (pick random from categories)
  function generateOutfit(){
    const items = getItemsForUser();
    if (!items || items.length === 0) return null;
    const byCat = {};
    items.forEach(it => {
      if (!byCat[it.category]) byCat[it.category] = [];
      byCat[it.category].push(it);
    });
    // required: Shirt, Pant, Shoes
    if (!byCat['Shirt'] || !byCat['Pant'] || !byCat['Shoes']) return null;
    function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
    const combo = {
      Shirt: pick(byCat['Shirt']),
      Pant: pick(byCat['Pant']),
      Shoes: pick(byCat['Shoes'])
    };
    if (byCat['Jacket']) combo.Jacket = pick(byCat['Jacket']);
    if (byCat['Accessory']) combo.Accessory = pick(byCat['Accessory']);
    // store last combo
    localStorage.setItem('dw_last_combo', JSON.stringify(combo));
    return combo;
  }

  /* ---------- Add page helper ---------- */
  function saveClothFromAddPage(){
    const fileInput = document.getElementById('imageInput');
    const category = document.getElementById('category').value;
    const addError = document.getElementById('addError');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0){
      showAddError('Please choose an image file.');
      return;
    }
    if (!category){
      showAddError('Please choose a category.');
      return;
    }
    const file = fileInput.files[0];
    if (!file.type.startsWith('image/')) { showAddError('Select a valid image.'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const items = getItemsForUser();
      const id = Date.now();
      const item = { id, category, image: reader.result, note: '' };
      saveItemForUser(item);
      // reset and go to dashboard
      fileInput.value = '';
      location.href = 'dashboard.html';
    };
    reader.readAsDataURL(file);
  }

  /* ---------- utility ---------- */
  function showAddError(text){
    const el = document.getElementById('addError');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
  }

  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[s]); }

  /* ---------- public API ---------- */
  return {
    signup, login, logout, getCurrentUser,
    saveClothFromAddPage, renderDashboard, generateOutfit,
    // advanced: expose deleteItem for manual calling
    deleteItem
  };
})();

// expose app globally
window.app = app;
