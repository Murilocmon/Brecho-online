// ======================================================
// CONFIGURAÇÕES GLOBAIS E ESTADO
// ======================================================
const CONFIG = {
    SUPABASE_URL: 'https://hamqyanzgfzcxnxnqzev.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXF5YW56Z2Z6Y3hueG5xemV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mjg2NDAsImV4cCI6MjA2MzQwNDY0MH0.6l3dW3OXC8M_CX2TrejJR8EY5xgZvsIcKzTIXQ14rTs',
    ADMIN_PASSWORD: '1907'
};
const STORAGE_KEYS = { CART: 'achadinhos_cart', RESERVATIONS: 'achadinhos_reservations' };

const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let currentUser = null, roupas = [], cart = [], reservations = [];

// ======================================================
// INICIALIZAÇÃO
// ======================================================
document.addEventListener('DOMContentLoaded', async () => {
    listenToAuthState(); // ATIVADO: Começa a escutar eventos de auth
    await checkUserSession();
    await loadRoupasFromDB();
    loadLocalData();
    setupEventListeners();
    updateUI();
    renderClothes();
});

// ======================================================
// CARREGAMENTO DE DADOS
// ======================================================
async function checkUserSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user) {
        const { data: profile } = await supabaseClient.from('perfis').select('name, wishlist').eq('id', session.user.id).single();
        if (profile) {
            currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: profile.name,
                wishlist: profile.wishlist || [],
                isAdmin: false 
            };
        }
    } else {
        currentUser = null;
    }
}
async function loadRoupasFromDB() { const { data, error } = await supabaseClient.from('roupas').select('*').order('created_at', { ascending: false }); roupas = error ? [] : data; }
function loadLocalData() { cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || []; reservations = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) || []; }
function saveCart() { localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)); }
function saveReservations() { localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations)); }

// ======================================================
// EVENT LISTENERS E UI
// ======================================================
function setupEventListeners() { 
    document.getElementById('logo').addEventListener('click', handleLogoClick);
    document.getElementById('registerBtn').addEventListener('click', () => showModal('registerModal'));
    document.getElementById('clientLoginBtn').addEventListener('click', () => showModal('clientLoginModal'));
    document.getElementById('cartBtn').addEventListener('click', openCart);
    document.getElementById('profileBtn').addEventListener('click', showProfileModal);
    document.getElementById('addRoupaBtn').addEventListener('click', showAddRoupaModal);
    document.getElementById('closeLoginModal').addEventListener('click', () => hideModal('loginModal'));
    document.getElementById('closeClientLoginModal').addEventListener('click', () => hideModal('clientLoginModal'));
    document.getElementById('closeRegisterModal').addEventListener('click', () => hideModal('registerModal'));
    document.getElementById('closeRoupaModal').addEventListener('click', () => hideModal('roupaModal'));
    document.getElementById('closeConfirmModal').addEventListener('click', () => hideModal('confirmModal'));
    document.getElementById('closeCartModal').addEventListener('click', () => hideModal('cartModal'));
    document.getElementById('closeProfileModal').addEventListener('click', () => hideModal('profileModal'));
    document.getElementById('closeQuickViewModal').addEventListener('click', () => hideModal('quickViewModal'));
    document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(modal.id); }));
    document.getElementById('loginForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('clientLoginForm').addEventListener('submit', handleClientLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('roupaForm').addEventListener('submit', handleRoupaSubmit);
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    document.getElementById('switchToRegister').addEventListener('click', () => { hideModal('clientLoginModal'); showModal('registerModal'); });
    document.getElementById('searchBtn').addEventListener('click', renderClothes);
    document.getElementById('searchInput').addEventListener('keyup', (e) => { if (e.key === 'Enter') renderClothes(); });
    document.getElementById('categoryFilter').addEventListener('change', renderClothes);
    document.getElementById('sizeFilter').addEventListener('change', renderClothes);
    document.getElementById('priceFilter').addEventListener('change', renderClothes);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    
    // NOVOS LISTENERS PARA REDEFINIÇÃO DE SENHA
    document.getElementById('forgotPasswordBtn').addEventListener('click', () => { hideModal('clientLoginModal'); showModal('resetPasswordModal'); });
    document.getElementById('closeResetPasswordModal').addEventListener('click', () => hideModal('resetPasswordModal'));
    document.getElementById('resetPasswordForm').addEventListener('submit', handlePasswordResetRequest);
    document.getElementById('closeUpdatePasswordModal').addEventListener('click', () => hideModal('updatePasswordModal'));
    document.getElementById('updatePasswordForm').addEventListener('submit', handleUpdatePassword);
}
function showModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.classList.remove('hidden'); }
function hideModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.classList.add('hidden'); }
function updateAndRenderAll() { updateUI(); renderClothes(); }
function updateUI() { const userSection = document.getElementById('userSection'); const registerBtn = document.getElementById('registerBtn'); const clientLoginBtn = document.getElementById('clientLoginBtn'); const cartBtn = document.getElementById('cartBtn'); const adminPanel = document.getElementById('adminPanel'); if (currentUser) { userSection.classList.remove('hidden'); document.getElementById('userGreeting').textContent = `Olá, ${currentUser.name}`; registerBtn.classList.add('hidden'); clientLoginBtn.classList.add('hidden'); cartBtn.classList.toggle('hidden', currentUser.isAdmin); adminPanel.classList.toggle('hidden', !currentUser.isAdmin); if (currentUser.isAdmin) renderDashboard(); } else { userSection.classList.add('hidden'); adminPanel.classList.add('hidden'); cartBtn.classList.add('hidden'); registerBtn.classList.remove('hidden'); clientLoginBtn.classList.remove('hidden'); } updateCartCount(); }
function getFilteredClothes() { const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim(); const category = document.getElementById('categoryFilter').value; const size = document.getElementById('sizeFilter').value; const priceRange = document.getElementById('priceFilter').value; return roupas.filter(r => (searchTerm ? r.nome.toLowerCase().includes(searchTerm) : true) && (category ? r.categoria === category : true) && (size ? r.tamanho === size : true) && (priceRange ? (r.preco >= priceRange.split('-')[0] && r.preco <= priceRange.split('-')[1]) : true) && r.status !== 'vendido'); }
function renderClothes() { const container = document.getElementById('clothesContainer'); container.innerHTML = ''; const roupasFiltradas = getFilteredClothes(); if (!roupasFiltradas || roupasFiltradas.length === 0) { container.innerHTML = '<p>Nenhuma roupa encontrada.</p>'; return; } roupasFiltradas.forEach(roupa => { if (roupa.status === 'vendido') return; const itemInCart = cart.some(item => item.id === roupa.id); const itemInWishlist = currentUser?.wishlist?.includes(roupa.id); const card = document.createElement('div'); card.className = `roupa-card ${itemInCart ? 'in-cart' : ''}`; let clientButtonHtml = ''; if (roupa.status === 'reservado') { clientButtonHtml = `<button class="btn btn-small btn-reserved" disabled><i class="fas fa-bookmark"></i> Reservado</button>`; } else if (itemInCart) { clientButtonHtml = `<button class="btn btn-secondary btn-small" onclick="toggleReserva(${roupa.id})"><i class="fas fa-check"></i> No Carrinho</button>`; } else { clientButtonHtml = `<button class="btn btn-reserve btn-small" onclick="toggleReserva(${roupa.id})"><i class="fas fa-shopping-cart"></i> Reservar</button>`; } let adminButtonsHtml = ''; if (currentUser && currentUser.isAdmin) { adminButtonsHtml = `<button class="btn btn-primary btn-small" onclick='showEditRoupaModal(${roupa.id})'><i class="fas fa-edit"></i> Editar</button><button class="btn btn-danger btn-small" onclick='confirmDelete(${roupa.id})'><i class="fas fa-trash"></i> Excluir</button>`; } let wishlistButtonHtml = ''; if (currentUser && !currentUser.isAdmin) { wishlistButtonHtml = `<button class="wishlist-btn ${itemInWishlist ? 'active' : ''}" onclick="toggleWishlist(${roupa.id}, event)"><i class="fas fa-heart"></i></button>`; } card.innerHTML = `<img src="${roupa.imagem}" class="roupa-image" alt="${roupa.nome}" onclick="showQuickView(${roupa.id})">${wishlistButtonHtml}<div class="roupa-info"><h3 class="roupa-nome">${roupa.nome}</h3><p class="roupa-descricao">${roupa.descricao || ''}</p><div class="roupa-details"><span class="roupa-tamanho">${roupa.tamanho}</span><span class="roupa-preco">R$ ${parseFloat(roupa.preco).toFixed(2)}</span></div><div class="roupa-actions">${currentUser && currentUser.isAdmin ? adminButtonsHtml : clientButtonHtml}</div></div>`; container.appendChild(card); }); }
function showToast(message, type = 'success') { const toast = document.getElementById('toast'); const toastMessage = document.getElementById('toastMessage'); toastMessage.textContent = message; toast.className = `toast show ${type}`; setTimeout(() => { toast.classList.add('hidden'); }, 3000); }
function clearFilters() { document.getElementById('searchInput').value = ''; document.getElementById('categoryFilter').value = ''; document.getElementById('sizeFilter').value = ''; document.getElementById('priceFilter').value = ''; renderClothes(); }
function renderDashboard() { const d = document.getElementById('adminDashboard'); d.innerHTML = `<div class="stat-card"><h4>Itens na Loja</h4><p>${roupas.filter(r => r.status !== 'vendido').length}</p></div><div class="stat-card"><h4>Itens Reservados</h4><p>${reservations.length}</p></div><div class="stat-card"><h4>Usuários</h4><p>Gerenciado pelo Supabase</p></div>`; renderAdminReservations(); }

// ======================================================
// AUTENTICAÇÃO E ADMIN COM SUPABASE
// ======================================================
function listenToAuthState() {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        // Este evento é disparado quando o usuário clica no link do email
        if (event === "PASSWORD_RECOVERY") {
            hideModal('resetPasswordModal');
            showModal('updatePasswordModal');
        }
    });
}
async function handleRegister(e) { e.preventDefault(); const name = document.getElementById('registerName').value; const email = document.getElementById('registerEmail').value; const password = document.getElementById('registerPassword').value; showToast("Cadastrando...", "info"); const { error } = await supabaseClient.auth.signUp({ email, password, options: { data: { name } } }); if (error) { showToast(`Erro no cadastro: ${error.message}`, 'error'); } else { showToast('Cadastro realizado! Verifique seu email para confirmar.', 'success'); hideModal('registerModal'); } }
async function handleClientLogin(e) { e.preventDefault(); const email = document.getElementById('clientLoginEmail').value; const password = document.getElementById('clientLoginPassword').value; showToast("Entrando...", "info"); const { error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) { showToast(`Erro no login: ${error.message}`, 'error'); } else { await checkUserSession(); hideModal('clientLoginModal'); updateAndRenderAll(); showToast(`Bem-vindo(a) de volta, ${currentUser.name}!`, 'success'); } }
async function logout() { const { error } = await supabaseClient.auth.signOut(); if (error) { showToast(`Erro ao sair: ${error.message}`, 'error'); } else { currentUser = null; updateAndRenderAll(); showToast('Você saiu da sua conta.', 'info'); } }
function handleLogoClick() { if (currentUser && !currentUser.isAdmin) { showModal('loginModal'); } else if (!currentUser) { showToast("Faça login para solicitar acesso de admin.", "info"); } }
function handleAdminLogin(e) { e.preventDefault(); const password = document.getElementById('loginPassword').value; if (password === CONFIG.ADMIN_PASSWORD) { currentUser.isAdmin = true; hideModal('loginModal'); updateAndRenderAll(); showToast(`Privilégios de admin concedidos!`, 'success'); } else { showToast('Senha de administrador incorreta!', 'error'); } }
async function handlePasswordResetRequest(e) {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;
    showToast("Enviando link...", "info");
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href, // Link mágico aponta de volta para a página atual
    });
    if (error) {
        showToast(`Erro: ${error.message}`, "error");
    } else {
        showToast("Se o email estiver cadastrado, um link de recuperação foi enviado!", "success");
        hideModal('resetPasswordModal');
    }
}
async function handleUpdatePassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    showToast("Salvando nova senha...", "info");
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) {
        showToast(`Erro ao atualizar: ${error.message}`, "error");
    } else {
        showToast("Senha alterada com sucesso! Você já pode fazer o login.", "success");
        hideModal('updatePasswordModal');
    }
}

// ======================================================
// PERFIL, ABAS E FAVORITOS COM SUPABASE
// ======================================================
async function handleProfileUpdate(e) { e.preventDefault(); const newName = document.getElementById('profileName').value; const { error } = await supabaseClient.from('perfis').update({ name: newName }).eq('id', currentUser.id); if (error) { showToast(`Erro ao atualizar perfil: ${error.message}`, 'error'); } else { currentUser.name = newName; updateUI(); showToast('Perfil atualizado com sucesso!', 'success'); } }
async function toggleWishlist(id, e) { e.stopPropagation(); if (!currentUser || currentUser.isAdmin) return; const currentWishlist = [...(currentUser.wishlist || [])]; const itemIndex = currentWishlist.indexOf(id); if (itemIndex > -1) { currentWishlist.splice(itemIndex, 1); } else { currentWishlist.push(id); } const { error } = await supabaseClient.from('perfis').update({ wishlist: currentWishlist }).eq('id', currentUser.id); if (error) { showToast('Erro ao atualizar favoritos.', 'error'); } else { currentUser.wishlist = currentWishlist; showToast(itemIndex > -1 ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!', 'info'); renderClothes(); } }
function showProfileModal() { if (!currentUser) { showToast("Faça login para ver seu perfil.", "error"); return; } document.getElementById('profileName').value = currentUser.name; document.getElementById('profileEmail').value = currentUser.email; openTab({currentTarget: document.querySelector('.tab-link')}, 'tabDados'); showModal('profileModal'); }
function openTab(evt, tabName) { document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none'); document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active')); document.getElementById(tabName).style.display = 'block'; evt.currentTarget.classList.add('active'); if (tabName === 'tabFavoritos') renderWishlist(); if (tabName === 'tabReservas') renderMyReservations(); }
function renderWishlist() { const c = document.getElementById('profileWishlist'); c.innerHTML = ''; if (!currentUser?.wishlist?.length) { c.innerHTML = "<p>Sua lista de favoritos está vazia.</p>"; return; } const items = roupas.filter(r => currentUser.wishlist.includes(r.id)); if (items.length === 0) { c.innerHTML = "<p>Nenhum favorito encontrado.</p>"; return; } items.forEach(r => { const card = document.createElement('div'); card.className = 'roupa-card'; card.innerHTML = `<img src="${r.imagem}" class="roupa-image" onclick="showQuickView(${r.id})"><div class="roupa-info"><h3 class="roupa-nome">${r.nome}</h3></div>`; c.appendChild(card); }); }

// ======================================================
// FUNÇÕES DE ADMIN COM SUPABASE
// ======================================================
async function handleRoupaSubmit(e) {e.preventDefault(); const id = document.getElementById('roupaId').value; const roupaData = { nome: document.getElementById('roupaNome').value, descricao: document.getElementById('roupaDescricao').value, tamanho: document.getElementById('roupaTamanho').value, preco: parseFloat(document.getElementById('roupaPreco').value), categoria: document.getElementById('roupaCategoria').value, imagem: document.getElementById('roupaImagem').value }; let res; if (id) { res = await supabaseClient.from('roupas').update(roupaData).eq('id', id); } else { res = await supabaseClient.from('roupas').insert([roupaData]); } if (res.error) { showToast("Erro ao salvar roupa: " + res.error.message, "error"); } else { showToast('Roupa salva com sucesso!', 'success'); hideModal('roupaModal'); await loadRoupasFromDB(); renderClothes(); } }
async function deleteRoupa(roupaId) { const { error } = await supabaseClient.from('roupas').delete().eq('id', roupaId); if (error) { showToast("Erro ao excluir roupa.", "error"); } else { showToast("Roupa excluída!", "success"); await loadRoupasFromDB(); renderClothes(); } }
function confirmDelete(id) { const r = roupas.find(rp => rp.id === id); if (!r) return; document.getElementById('confirmMessage').textContent = `Tem certeza que deseja excluir "${r.nome}"?`; showModal('confirmModal'); const yesBtn = document.getElementById('confirmYes'); const newYesBtn = yesBtn.cloneNode(true); yesBtn.parentNode.replaceChild(newYesBtn, yesBtn); newYesBtn.onclick = () => { deleteRoupa(id); hideModal('confirmModal'); }; document.getElementById('confirmNo').onclick = () => hideModal('confirmModal'); }
function showAddRoupaModal() { document.getElementById('roupaModalTitle').textContent = 'Adicionar Roupa'; document.getElementById('roupaForm').reset(); document.getElementById('roupaId').value = ''; showModal('roupaModal'); }
function showEditRoupaModal(id) { const r = roupas.find(rp => rp.id === id); if (!r) return; document.getElementById('roupaModalTitle').textContent = 'Editar Roupa'; document.getElementById('roupaId').value = r.id; document.getElementById('roupaNome').value = r.nome; document.getElementById('roupaDescricao').value = r.descricao; document.getElementById('roupaTamanho').value = r.tamanho; document.getElementById('roupaPreco').value = r.preco; document.getElementById('roupaCategoria').value = r.categoria; document.getElementById('roupaImagem').value = r.imagem; showModal('roupaModal'); }
function renderAdminReservations() { /* ... */ }

// ======================================================
// CARRINHO E RESERVAS (AINDA LOCAL)
// ======================================================
function renderCart() { const c = document.getElementById('cartItems'); const t = document.getElementById('cartTotalItems'); c.innerHTML = ''; if (cart.length === 0) { c.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><h3>Seu carrinho está vazio</h3></div>`; } else { cart.forEach(i => { const item = document.createElement('div'); item.className = 'cart-item'; item.innerHTML = `<img src="${i.imagem}" class="cart-item-image"><div class="cart-item-info"><div class="cart-item-name">${i.nome}</div><div class="cart-item-price">R$ ${parseFloat(i.preco).toFixed(2)}</div></div><button class="btn btn-danger btn-small" onclick="removeFromCartAndUpdate(${i.id})"><i class="fas fa-trash"></i></button>`; c.appendChild(item); }); } t.textContent = cart.length; }
function openCart() { renderCart(); showModal('cartModal'); }
function updateCartCount() { document.getElementById('cartCount').textContent = cart.length; }
function clearCart() { if (cart.length === 0) return; cart = []; saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Carrinho esvaziado!', 'success'); }
function toggleReserva(id) { if (!currentUser || currentUser.isAdmin) return; const r = roupas.find(rp => rp.id === id); if (!r || r.status === 'reservado') return; const index = cart.findIndex(i => i.id === id); if (index > -1) { cart.splice(index, 1); } else { cart.push(r); } saveCart(); updateCartCount(); renderClothes(); }
function removeFromCartAndUpdate(id) { const i = cart.findIndex(item => item.id === id); if (i > -1) { cart.splice(i, 1); saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Item removido.', 'info'); } }
function checkout() { if (!currentUser) return; if (cart.length === 0) { showToast('Seu carrinho está vazio!', 'error'); return; } const count = cart.length; cart.forEach(item => { reservations.push({ id: Date.now() + Math.random(), userEmail: currentUser.email, reservedAt: new Date().toISOString(), roupa: item }); const r = roupas.find(rp => rp.id === item.id); if (r) r.status = 'reservado'; }); cart = []; saveCart(); saveReservations(); updateAndRenderAll(); renderCart(); showToast(`${count} peça(s) reservada(s)!`, 'success'); }
function cancelReservation(resId) { const index = reservations.findIndex(r => r.id === resId); if (index === -1) return; const roupaId = reservations[index].roupa.id; reservations.splice(index, 1); const r = roupas.find(rp => rp.id === roupaId); if (r) r.status = 'disponivel'; saveReservations(); renderMyReservations(); renderClothes(); showToast('Reserva cancelada.', 'info'); }
function renderMyReservations() { const c = document.getElementById('profileReservations'); c.innerHTML = ''; if (!currentUser) return; const myRes = reservations.filter(r => r.userEmail === currentUser.email); if (myRes.length === 0) { c.innerHTML = '<p>Você não tem reservas ativas.</p>'; return; } myRes.forEach(r => { const i = document.createElement('div'); i.className = 'reservation-item'; const d = new Date(r.reservedAt).toLocaleDateString('pt-BR'); i.innerHTML = `<img src="${r.roupa.imagem}" class="reservation-item-image"><div class="reservation-item-info"><div class="reservation-item-name">${r.roupa.nome}</div><div class="reservation-item-date">Reservado em: ${d}</div></div><button class="btn btn-danger btn-small" onclick="cancelReservation(${r.id})"><i class="fas fa-times"></i></button>`; c.appendChild(i); }); }
function showQuickView(id) { /* ... */ }

// ======================================================
// FUNÇÕES GLOBAIS
// ======================================================
window.openTab = openTab; window.toggleReserva = toggleReserva; window.cancelReservation = cancelReservation; window.showEditRoupaModal = showEditRoupaModal; window.removeFromCartAndUpdate = removeFromCartAndUpdate; window.confirmDelete = confirmDelete; window.toggleWishlist = toggleWishlist; window.showQuickView = showQuickView;
