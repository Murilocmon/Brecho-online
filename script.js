// ======================================================
// CONFIGURAÇÕES GLOBAIS E ESTADO
// ======================================================
const CONFIG = { ADMIN_PASSWORD: '1907' };
const STORAGE_KEYS = { ROUPAS: 'achadinhos_data', USERS: 'achadinhos_users', CURRENT_USER: 'achadinhos_user', CART: 'achadinhos_cart', RESERVATIONS: 'achadinhos_reservations' };
let currentUser = null, roupas = [], users = [], cart = [], reservations = [];

// ======================================================
// INICIALIZAÇÃO
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    updateUI();
    renderClothes();
});

// ======================================================
// CARREGAMENTO E SALVAMENTO DE DADOS
// ======================================================
function loadData() {
    try {
        currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
        cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
        reservations = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) || [];
        users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        const roupasJson = localStorage.getItem(STORAGE_KEYS.ROUPAS);
        if (roupasJson) {
            roupas = JSON.parse(roupasJson);
        } else {
            roupas = [
                { id: 1, nome: 'Camiseta Básica', descricao: 'Camiseta de algodão 100%, confortável e durável. Uma peça essencial para qualquer guarda-roupa.', tamanho: 'M', preco: 25.00, categoria: 'Camisetas', imagem: 'https://via.placeholder.com/400x400/7A3E2E/FFFFFF?text=Camiseta', status: 'disponivel' },
                { id: 2, nome: 'Calça Jeans', descricao: 'Calça jeans clássica de corte reto, perfeita para o dia a dia. Tecido de alta qualidade e durabilidade.', tamanho: 'G', preco: 45.00, categoria: 'Calças', imagem: 'https://via.placeholder.com/400x400/D6A77A/3A2A20?text=Calça', status: 'disponivel' },
                { id: 3, nome: 'Vestido Floral', descricao: 'Vestido leve e fresco para o verão, com estampa floral vibrante. Ideal para passeios ao ar livre.', tamanho: 'P', preco: 80.00, categoria: 'Vestidos', imagem: 'https://via.placeholder.com/400x400/2E7A67/FFFFFF?text=Vestido', status: 'disponivel' },
                { id: 4, nome: 'Casaco de Lã', descricao: 'Casaco quente para os dias frios.', tamanho: 'M', preco: 120.00, categoria: 'Casacos', imagem: 'https://via.placeholder.com/400x400/BF4E30/FFFFFF?text=Casaco', status: 'disponivel' },
            ];
            saveRoupas();
        }
    } catch (error) {
        console.error("Erro ao carregar dados. Resetando localStorage.", error);
        localStorage.clear();
        currentUser = null; cart = []; reservations = []; roupas = []; users = [];
    }
}

function saveRoupas() { localStorage.setItem(STORAGE_KEYS.ROUPAS, JSON.stringify(roupas)); }
function saveCart() { localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)); }
function saveReservations() { localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations)); }
function saveUsers() { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }

// ======================================================
// EVENT LISTENERS
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
}

// ======================================================
// LÓGICA DE UI E RENDERIZAÇÃO
// ======================================================
function showModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.classList.remove('hidden'); }
function hideModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.classList.add('hidden'); }
function updateAndRenderAll() { updateUI(); renderClothes(); }

function updateUI() {
    const userSection = document.getElementById('userSection');
    const registerBtn = document.getElementById('registerBtn');
    const clientLoginBtn = document.getElementById('clientLoginBtn');
    const cartBtn = document.getElementById('cartBtn');
    const adminPanel = document.getElementById('adminPanel');
    if (currentUser) {
        userSection.classList.remove('hidden');
        document.getElementById('userGreeting').textContent = `Olá, ${currentUser.name}`;
        registerBtn.classList.add('hidden');
        clientLoginBtn.classList.add('hidden');
        cartBtn.classList.toggle('hidden', currentUser.isAdmin);
        adminPanel.classList.toggle('hidden', !currentUser.isAdmin);
        if (currentUser.isAdmin) {
            renderDashboard();
        }
    } else {
        userSection.classList.add('hidden');
        adminPanel.classList.add('hidden');
        cartBtn.classList.add('hidden');
        registerBtn.classList.remove('hidden');
        clientLoginBtn.classList.remove('hidden');
    }
    updateCartCount();
}

function getFilteredClothes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    const size = document.getElementById('sizeFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    return roupas.filter(roupa => {
        if (roupa.status === 'vendido') return false;
        const matchSearch = searchTerm ? roupa.nome.toLowerCase().includes(searchTerm) : true;
        const matchCategory = category ? roupa.categoria === category : true;
        const matchSize = size ? roupa.tamanho === size : true;
        let matchPrice = true;
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(Number);
            matchPrice = roupa.preco >= min && roupa.preco <= max;
        }
        return matchSearch && matchCategory && matchSize && matchPrice;
    });
}

function renderClothes() {
    const container = document.getElementById('clothesContainer');
    container.innerHTML = '';
    const roupasFiltradas = getFilteredClothes();
    if (!roupasFiltradas || roupasFiltradas.length === 0) { container.innerHTML = '<p>Nenhuma roupa encontrada com os critérios selecionados.</p>'; return; }
    roupasFiltradas.forEach(roupa => {
        const itemInCart = cart.some(item => item.id === roupa.id);
        const itemInWishlist = currentUser?.wishlist?.includes(roupa.id);
        const card = document.createElement('div');
        card.className = `roupa-card ${itemInCart ? 'in-cart' : ''}`;
        let clientButtonHtml = '';
        if (roupa.status === 'reservado') { clientButtonHtml = `<button class="btn btn-small btn-reserved" disabled><i class="fas fa-bookmark"></i> Reservado</button>`; }
        else if (itemInCart) { clientButtonHtml = `<button class="btn btn-secondary btn-small" onclick="toggleReserva(${roupa.id})"><i class="fas fa-check"></i> No Carrinho</button>`; }
        else { clientButtonHtml = `<button class="btn btn-reserve btn-small" onclick="toggleReserva(${roupa.id})"><i class="fas fa-shopping-cart"></i> Reservar</button>`; }
        let adminButtonsHtml = '';
        if (currentUser && currentUser.isAdmin) {
            adminButtonsHtml = `<button class="btn btn-primary btn-small" onclick='showEditRoupaModal(${JSON.stringify(roupa)})'><i class="fas fa-edit"></i> Editar</button>
                                <button class="btn btn-danger btn-small" onclick='confirmDelete(${roupa.id})'><i class="fas fa-trash"></i> Excluir</button>`;
        }
        let wishlistButtonHtml = '';
        if (currentUser && !currentUser.isAdmin) {
            wishlistButtonHtml = `<button class="wishlist-btn ${itemInWishlist ? 'active' : ''}" onclick="toggleWishlist(${roupa.id}, event)"><i class="fas fa-heart"></i></button>`;
        }
        card.innerHTML = `<img src="${roupa.imagem}" class="roupa-image" alt="${roupa.nome}" onclick="showQuickView(${roupa.id})">${wishlistButtonHtml}<div class="roupa-info"><h3 class="roupa-nome">${roupa.nome}</h3><div class="roupa-details"><span class="roupa-tamanho">${roupa.tamanho}</span><span class="roupa-preco">R$ ${roupa.preco.toFixed(2)}</span></div><div class="roupa-actions">${currentUser && currentUser.isAdmin ? adminButtonsHtml : clientButtonHtml}</div></div>`;
        container.appendChild(card);
    });
}

function showToast(message, type = 'success') { const toast = document.getElementById('toast'); const toastMessage = document.getElementById('toastMessage'); toastMessage.textContent = message; toast.className = `toast show ${type}`; setTimeout(() => { toast.classList.add('hidden'); }, 3000); }
function clearFilters() { document.getElementById('searchInput').value = ''; document.getElementById('categoryFilter').value = ''; document.getElementById('sizeFilter').value = ''; document.getElementById('priceFilter').value = ''; renderClothes(); }

// ======================================================
// AUTENTICAÇÃO E ADMIN
// ======================================================
function handleLogoClick() { if (currentUser && !currentUser.isAdmin) { showModal('loginModal'); } else if (!currentUser) { showToast("Faça login para solicitar acesso de admin.", "info"); } }
function handleAdminLogin(e) { e.preventDefault(); const password = document.getElementById('loginPassword').value; if (password === CONFIG.ADMIN_PASSWORD) { const userEmail = currentUser.email; const userReservations = reservations.filter(res => res.userEmail === userEmail); if (userReservations.length > 0) { const reservedIds = userReservations.map(res => res.roupa.id); roupas.forEach(roupa => { if (reservedIds.includes(roupa.id)) { roupa.status = 'disponivel'; } }); reservations = reservations.filter(res => res.userEmail !== userEmail); showToast("Suas reservas pessoais foram canceladas ao se tornar admin.", "info"); } currentUser.isAdmin = true; localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); saveRoupas(); saveReservations(); hideModal('loginModal'); updateAndRenderAll(); showToast(`Privilégios de admin concedidos!`, 'success'); } else { showToast('Senha de administrador incorreta!', 'error'); } }
function handleClientLogin(e) { e.preventDefault(); const email = document.getElementById('clientLoginEmail').value; const password = document.getElementById('clientLoginPassword').value; users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || []; const foundUser = users.find(user => user.email === email && user.password === password); if (foundUser) { currentUser = foundUser; localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); hideModal('clientLoginModal'); updateAndRenderAll(); showToast(`Bem-vindo(a) de volta, ${currentUser.name}!`, 'success'); } else { showToast('Email ou senha incorretos!', 'error'); } }
function handleRegister(e) { e.preventDefault(); const name = document.getElementById('registerName').value; const email = document.getElementById('registerEmail').value; const password = document.getElementById('registerPassword').value; users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || []; if (users.some(u => u.email === email)) { showToast('Este email já está cadastrado.', 'error'); return; } const newUser = { name, email, password, isAdmin: false, wishlist: [] }; users.push(newUser); saveUsers(); currentUser = newUser; localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); hideModal('registerModal'); updateAndRenderAll(); showToast('Cadastro realizado com sucesso!', 'success'); }
function logout() { currentUser = null; localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); updateAndRenderAll(); showToast('Você saiu da sua conta.', 'info'); }
function showAddRoupaModal() { document.getElementById('roupaModalTitle').textContent = 'Adicionar Roupa'; document.getElementById('roupaForm').reset(); document.getElementById('roupaId').value = ''; showModal('roupaModal'); }
function showEditRoupaModal(roupa) { document.getElementById('roupaModalTitle').textContent = 'Editar Roupa'; document.getElementById('roupaId').value = roupa.id; document.getElementById('roupaNome').value = roupa.nome; document.getElementById('roupaDescricao').value = roupa.descricao; document.getElementById('roupaTamanho').value = roupa.tamanho; document.getElementById('roupaPreco').value = roupa.preco; document.getElementById('roupaCategoria').value = roupa.categoria; document.getElementById('roupaImagem').value = roupa.imagem; showModal('roupaModal'); }
function handleRoupaSubmit(e) { e.preventDefault(); const id = document.getElementById('roupaId').value; const data = { nome: document.getElementById('roupaNome').value, descricao: document.getElementById('roupaDescricao').value, tamanho: document.getElementById('roupaTamanho').value, preco: parseFloat(document.getElementById('roupaPreco').value), categoria: document.getElementById('roupaCategoria').value, imagem: document.getElementById('roupaImagem').value }; if (id) { const index = roupas.findIndex(r => r.id == id); if (index > -1) roupas[index] = { ...roupas[index], ...data }; } else { roupas.push({ ...data, id: Date.now(), status: 'disponivel' }); } saveRoupas(); renderClothes(); hideModal('roupaModal'); showToast('Roupa salva!', 'success'); }
function confirmDelete(id) { const r = roupas.find(rp => rp.id === id); if (!r) return; document.getElementById('confirmMessage').textContent = `Tem certeza que deseja excluir "${r.nome}"?`; showModal('confirmModal'); const yesBtn = document.getElementById('confirmYes'); const newYesBtn = yesBtn.cloneNode(true); yesBtn.parentNode.replaceChild(newYesBtn, yesBtn); newYesBtn.onclick = () => { roupas = roupas.filter(rp => rp.id !== id); saveRoupas(); renderClothes(); hideModal('confirmModal'); showToast("Item excluído!", "success"); }; document.getElementById('confirmNo').onclick = () => hideModal('confirmModal'); }
function renderDashboard() { const d = document.getElementById('adminDashboard'); if (!d) return; const totalItems = roupas.filter(r => r.status !== 'vendido').length; const reservedItems = reservations.length; const totalUsers = users.length; d.innerHTML = `<div class="stat-card"><h4>Itens na Loja</h4><p>${totalItems}</p></div><div class="stat-card"><h4>Itens Reservados</h4><p>${reservedItems}</p></div><div class="stat-card"><h4>Usuários</h4><p>${totalUsers}</p></div>`; renderAdminReservations(); }

// ======================================================
// AÇÕES DO USUÁRIO
// ======================================================
function showProfileModal() { if (!currentUser) { showToast("Faça login para ver seu perfil.", "error"); return; } document.getElementById('profileName').value = currentUser.name; document.getElementById('profileEmail').value = currentUser.email; openTab({currentTarget: document.querySelector('.tab-link')}, 'tabDados'); showModal('profileModal'); }
function handleProfileUpdate(e) { e.preventDefault(); const name = document.getElementById('profileName').value; const userDb = users.find(u => u.email === currentUser.email); if(userDb) { userDb.name = name; currentUser.name = name; saveUsers(); localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); updateUI(); } showToast('Perfil atualizado!', 'success'); }
function openTab(evt, tabName) { document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none'); document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active')); document.getElementById(tabName).style.display = 'block'; evt.currentTarget.classList.add('active'); if (tabName === 'tabFavoritos') renderWishlist(); if (tabName === 'tabReservas') renderMyReservations(); }
function renderWishlist() { const c = document.getElementById('profileWishlist'); c.innerHTML = ''; if (!currentUser?.wishlist?.length) { c.innerHTML = "<p>Sua lista de favoritos está vazia.</p>"; return; } const items = roupas.filter(r => currentUser.wishlist.includes(r.id)); if (items.length === 0) { c.innerHTML = "<p>Nenhum favorito encontrado.</p>"; return; } items.forEach(r => { const card = document.createElement('div'); card.className = 'roupa-card'; card.innerHTML = `<img src="${r.imagem}" class="roupa-image" onclick="showQuickView(${r.id})"><div class="roupa-info"><h3 class="roupa-nome">${r.nome}</h3></div>`; c.appendChild(card); }); }
function toggleWishlist(id, e) { e.stopPropagation(); if (!currentUser || currentUser.isAdmin) return; const user = users.find(u => u.email === currentUser.email); if (!user) return; if (!user.wishlist) user.wishlist = []; const index = user.wishlist.indexOf(id); if (index > -1) { user.wishlist.splice(index, 1); showToast("Removido dos favoritos.", "info"); } else { user.wishlist.push(id); showToast("Adicionado aos favoritos!", "success"); } currentUser.wishlist = user.wishlist; localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); saveUsers(); renderClothes(); }
function showQuickView(roupaId) { const roupa = roupas.find(r => r.id === roupaId); if (!roupa) return; document.getElementById('quickViewNome').textContent = roupa.nome; document.getElementById('quickViewContent').innerHTML = `<img src="${roupa.imagem}" alt="${roupa.nome}" class="quick-view-image"><div class="quick-view-details"><p>${roupa.descricao}</p><p><strong>Categoria:</strong> ${roupa.categoria}</p><p><strong>Tamanho:</strong> ${roupa.tamanho}</p><h3 class="roupa-preco">R$ ${roupa.preco.toFixed(2)}</h3><div class="roupa-actions">${roupa.status === 'disponivel' && !(currentUser && currentUser.isAdmin) ? `<button class="btn btn-primary" onclick="addFromQuickView(${roupa.id})"><i class="fas fa-shopping-cart"></i> Reservar</button>` : `<button class="btn btn-reserved" disabled><i class="fas fa-bookmark"></i> Indisponível</button>`}</div></div>`; showModal('quickViewModal'); }
function addFromQuickView(roupaId) { toggleReserva(roupaId); hideModal('quickViewModal'); }

// ======================================================
// CARRINHO E RESERVAS
// ======================================================
function renderCart() { const c = document.getElementById('cartItems'); const t = document.getElementById('cartTotalItems'); c.innerHTML = ''; if (cart.length === 0) { c.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><h3>Seu carrinho está vazio</h3></div>`; } else { cart.forEach(i => { const item = document.createElement('div'); item.className = 'cart-item'; item.innerHTML = `<img src="${i.imagem}" class="cart-item-image"><div class="cart-item-info"><div class="cart-item-name">${i.nome}</div><div class="cart-item-price">R$ ${i.preco.toFixed(2)}</div></div><button class="btn btn-danger btn-small" onclick="removeFromCartAndUpdate(${i.id})"><i class="fas fa-trash"></i></button>`; c.appendChild(item); }); } t.textContent = cart.length; }
function openCart() { renderCart(); showModal('cartModal'); }
function updateCartCount() { document.getElementById('cartCount').textContent = cart.length; }
function clearCart() { if (cart.length === 0) return; cart = []; saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Carrinho esvaziado!', 'success'); }
function toggleReserva(id) { if (!currentUser || currentUser.isAdmin) return; const r = roupas.find(rp => rp.id === id); if (!r || r.status === 'reservado') return; const index = cart.findIndex(i => i.id === id); if (index > -1) { cart.splice(index, 1); } else { cart.push(r); } saveCart(); updateCartCount(); renderClothes(); }
function removeFromCartAndUpdate(id) { const i = cart.findIndex(item => item.id === id); if (i > -1) { cart.splice(i, 1); saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Item removido.', 'info'); } }
function checkout() { if (!currentUser) return; if (cart.length === 0) { showToast('Seu carrinho está vazio!', 'error'); return; } const count = cart.length; cart.forEach(item => { reservations.push({ id: Date.now() + Math.random(), userEmail: currentUser.email, reservedAt: new Date().toISOString(), roupa: item }); const r = roupas.find(rp => rp.id === item.id); if (r) r.status = 'reservado'; }); cart = []; saveCart(); saveRoupas(); saveReservations(); updateAndRenderAll(); renderCart(); showToast(`${count} peça(s) reservada(s)!`, 'success'); }
function cancelReservation(resId) { const index = reservations.findIndex(r => r.id === resId); if (index === -1) return; const roupaId = reservations[index].roupa.id; reservations.splice(index, 1); const r = roupas.find(rp => rp.id === roupaId); if (r) r.status = 'disponivel'; saveRoupas(); saveReservations(); renderMyReservations(); renderClothes(); showToast('Reserva cancelada.', 'info'); }
function renderMyReservations() { const c = document.getElementById('profileReservations'); c.innerHTML = ''; if (!currentUser) return; const myRes = reservations.filter(r => r.userEmail === currentUser.email); if (myRes.length === 0) { c.innerHTML = '<p>Você não tem reservas ativas.</p>'; return; } myRes.forEach(r => { const i = document.createElement('div'); i.className = 'reservation-item'; const d = new Date(r.reservedAt).toLocaleDateString('pt-BR'); i.innerHTML = `<img src="${r.roupa.imagem}" class="reservation-item-image"><div class="reservation-item-info"><div class="reservation-item-name">${r.roupa.nome}</div><div class="reservation-item-date">Reservado em: ${d}</div></div><button class="btn btn-danger btn-small" onclick="cancelReservation(${r.id})"><i class="fas fa-times"></i></button>`; c.appendChild(i); }); }
function renderAdminReservations() {
    const container = document.getElementById('adminReservationsList');
    document.getElementById('activeReservationsCount').textContent = reservations.length;
    container.innerHTML = '';
    if (reservations.length === 0) {
        container.innerHTML = '<p>Nenhuma reserva ativa no momento.</p>';
        return;
    }
    reservations.forEach(res => {
        const item = document.createElement('div');
        item.className = 'reservation-item';
        item.innerHTML = `
            <img src="${res.roupa.imagem}" class="reservation-item-image" alt="${res.roupa.nome}">
            <div class="reservation-item-info">
                <div class="reservation-item-name">${res.roupa.nome}</div>
                <div class="reservation-item-date">Reservado por: ${res.userEmail}</div>
            </div>
            <button class="btn btn-success btn-small" onclick="markAsSold(${res.id})">
                <i class="fas fa-check"></i> Vendido
            </button>`;
        container.appendChild(item);
    });
}
function markAsSold(reservationId) {
    const resIndex = reservations.findIndex(r => r.id === reservationId);
    if (resIndex === -1) return;

    const roupaId = reservations[resIndex].roupa.id;
    reservations.splice(resIndex, 1); // Remove da lista de reservas

    const roupaOriginal = roupas.find(r => r.id === roupaId);
    if (roupaOriginal) {
        roupaOriginal.status = 'vendido'; // Muda o status para vendido
    }

    saveRoupas();
    saveReservations();
    renderDashboard(); // Re-renderiza o dashboard e a lista de reservas do admin
    renderClothes(); // Re-renderiza a vitrine para remover o item vendido
    showToast("Item marcado como vendido com sucesso!", "success");
}

// ======================================================
// FUNÇÕES GLOBAIS (PARA ONCLICK NO HTML)
// ======================================================
window.openTab = openTab; window.toggleReserva = toggleReserva; window.cancelReservation = cancelReservation; window.showEditRoupaModal = showEditRoupaModal; window.removeFromCartAndUpdate = removeFromCartAndUpdate; window.confirmDelete = confirmDelete; window.toggleWishlist = toggleWishlist; window.showQuickView = showQuickView; window.addFromQuickView = addFromQuickView; window.markAsSold = markAsSold;