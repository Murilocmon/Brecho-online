// ======================================================
// CONFIGURAÇÕES GLOBAIS E ESTADO
// ======================================================
const CONFIG = {
    SUPABASE_URL: 'https://hamqyanzgfzcxnxnqzev.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXF5YW56Z2Z6Y3hueG5xemV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mjg2NDAsImV4cCI6MjA2MzQwNDY0MH0.6l3dW3OXC8M_CX2TrejJR8EY5xgZvsIcKzTIXQ14rTs',
    ADMIN_PASSWORD: '1907'
};
const STORAGE_KEYS = { USERS: 'achadinhos_users', CURRENT_USER: 'achadinhos_user', CART: 'achadinhos_cart', RESERVATIONS: 'achadinhos_reservations' };

const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let currentUser = null, roupas = [], users = [], cart = [], reservations = [];

// ======================================================
// INICIALIZAÇÃO
// ======================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
    updateUI();
    renderClothes();
});

// ======================================================
// CARREGAMENTO E SALVAMENTO DE DADOS
// ======================================================
async function loadData() {
    showToast("Carregando achadinhos...", "info");
    const { data, error } = await supabaseClient.from('roupas').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao buscar roupas:", error);
        showToast("Erro ao carregar produtos.", "error");
        roupas = [];
    } else {
        roupas = data;
        showToast("Achadinhos carregados!", "success");
    }
    
    currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
    cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    reservations = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) || [];
}

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

    if (!roupasFiltradas || roupasFiltradas.length === 0) {
        container.innerHTML = '<p>Nenhuma roupa encontrada com os critérios selecionados.</p>';
        return;
    }
    
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
            // --- CORREÇÃO AQUI: Passa o ID como número, não como objeto stringificado ---
            adminButtonsHtml = `<button class="btn btn-primary btn-small" onclick='showEditRoupaModal(${roupa.id})'><i class="fas fa-edit"></i> Editar</button>
                                <button class="btn btn-danger btn-small" onclick='confirmDelete(${roupa.id})'><i class="fas fa-trash"></i> Excluir</button>`;
        }
        
        let wishlistButtonHtml = '';
        if (currentUser && !currentUser.isAdmin) {
            wishlistButtonHtml = `<button class="wishlist-btn ${itemInWishlist ? 'active' : ''}" onclick="toggleWishlist(${roupa.id}, event)"><i class="fas fa-heart"></i></button>`;
        }
        
        card.innerHTML = `
            <img src="${roupa.imagem_url}" class="roupa-image" alt="${roupa.nome}" onclick="showQuickView(${roupa.id})">
            ${wishlistButtonHtml}
            <div class="roupa-info">
                <h3 class="roupa-nome">${roupa.nome}</h3>
                <p class="roupa-descricao">Cor: ${roupa.cor || 'Não informada'}</p>
                <div class="roupa-details">
                    <span class="roupa-tamanho">${roupa.tamanho}</span>
                    <span class="roupa-preco">R$ ${parseFloat(roupa.preco).toFixed(2)}</span>
                </div>
                <div class="roupa-actions">${currentUser && currentUser.isAdmin ? adminButtonsHtml : clientButtonHtml}</div>
            </div>`;
        container.appendChild(card);
    });
}

function showToast(message, type = 'success') { const toast = document.getElementById('toast'); const toastMessage = document.getElementById('toastMessage'); toastMessage.textContent = message; toast.className = `toast show ${type}`; setTimeout(() => { toast.classList.add('hidden'); }, 3000); }

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('sizeFilter').value = '';
    document.getElementById('priceFilter').value = '';
    renderClothes();
}

// ======================================================
// AUTENTICAÇÃO E ADMIN
// ======================================================
function handleLogoClick() { if (currentUser && !currentUser.isAdmin) { showModal('loginModal'); } else if (!currentUser) { showToast("Faça login como cliente para solicitar acesso de admin.", "info"); } }
function handleAdminLogin(e) { e.preventDefault(); const password = document.getElementById('loginPassword').value; if (password === CONFIG.ADMIN_PASSWORD) { currentUser.isAdmin = true; localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); hideModal('loginModal'); updateAndRenderAll(); showToast(`Privilégios de admin concedidos!`, 'success'); } else { showToast('Senha de administrador incorreta!', 'error'); } }
function handleClientLogin(e) { e.preventDefault(); const email = document.getElementById('clientLoginEmail').value; const password = document.getElementById('clientLoginPassword').value; const currentUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || []; const foundUser = currentUsers.find(user => user.email === email && user.password === password); if (foundUser) { currentUser = foundUser; localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); hideModal('clientLoginModal'); updateAndRenderAll(); showToast(`Bem-vindo(a) de volta, ${currentUser.name}!`, 'success'); } else { showToast('Email ou senha incorretos!', 'error'); } }
function handleRegister(e) { e.preventDefault(); const name = document.getElementById('registerName').value; const email = document.getElementById('registerEmail').value; const password = document.getElementById('registerPassword').value; const currentUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || []; if (currentUsers.some(u => u.email === email)) { showToast('Este email já está cadastrado.', 'error'); return; } const newUser = { name, email, password, isAdmin: false, wishlist: [] }; currentUsers.push(newUser); users = currentUsers; saveUsers(); currentUser = newUser; localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); hideModal('registerModal'); updateAndRenderAll(); showToast('Cadastro realizado com sucesso!', 'success'); }
function logout() { currentUser = null; localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); updateAndRenderAll(); showToast('Você saiu da sua conta.', 'info'); }

async function handleRoupaSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('roupaId').value;
    const roupaData = {
        nome: document.getElementById('roupaNome').value,
        cor: document.getElementById('roupaCor').value,
        tamanho: document.getElementById('roupaTamanho').value,
        preco: parseFloat(document.getElementById('roupaPreco').value),
        imagem_url: document.getElementById('roupaImagem').value
    };
    let response;
    if (id) {
        response = await supabaseClient.from('roupas').update(roupaData).eq('id', id);
    } else {
        response = await supabaseClient.from('roupas').insert([roupaData]);
    }
    if (response.error) {
        console.error("Erro ao salvar roupa:", response.error);
        showToast("Erro ao salvar roupa.", "error");
    } else {
        showToast('Roupa salva com sucesso!', 'success');
        hideModal('roupaModal');
        await loadData();
        renderClothes();
    }
}

async function deleteRoupa(roupaId) {
    const { error } = await supabaseClient.from('roupas').delete().eq('id', roupaId);
    if (error) {
        console.error("Erro ao excluir roupa:", error);
        showToast("Erro ao excluir roupa.", "error");
    } else {
        showToast("Roupa excluída com sucesso!", "success");
        await loadData();
        renderClothes();
    }
}

function confirmDelete(id) { const r = roupas.find(rp => rp.id === id); if (!r) return; document.getElementById('confirmMessage').textContent = `Tem certeza que deseja excluir "${r.nome}"?`; showModal('confirmModal'); const yesBtn = document.getElementById('confirmYes'); const newYesBtn = yesBtn.cloneNode(true); yesBtn.parentNode.replaceChild(newYesBtn, yesBtn); newYesBtn.onclick = () => { deleteRoupa(id); hideModal('confirmModal'); }; document.getElementById('confirmNo').onclick = () => hideModal('confirmModal'); }
function showAddRoupaModal() { document.getElementById('roupaModalTitle').textContent = 'Adicionar Roupa'; document.getElementById('roupaForm').reset(); document.getElementById('roupaId').value = ''; showModal('roupaModal'); }

// --- FUNÇÃO CORRIGIDA ---
function showEditRoupaModal(roupaId) {
    // Busca a roupa pelo ID na lista de roupas já carregada
    const roupa = roupas.find(r => r.id == roupaId); // Usar '==' para flexibilidade de tipo (número vs string)
    if (!roupa) {
        console.error("Roupa não encontrada para edição:", roupaId);
        showToast("Erro: roupa não encontrada.", "error");
        return;
    }
    
    document.getElementById('roupaModalTitle').textContent = 'Editar Roupa';
    document.getElementById('roupaId').value = roupa.id;
    document.getElementById('roupaNome').value = roupa.nome;
    document.getElementById('roupaCor').value = roupa.cor;
    document.getElementById('roupaTamanho').value = roupa.tamanho;
    document.getElementById('roupaPreco').value = roupa.preco;
    document.getElementById('roupaImagem').value = roupa.imagem_url;
    showModal('roupaModal');
}

// ======================================================
// AÇÕES DO USUÁRIO
// ======================================================
function showProfileModal() { if (!currentUser) { showToast("Faça login para ver seu perfil.", "error"); return; } document.getElementById('profileName').value = currentUser.name; document.getElementById('profileEmail').value = currentUser.email; openTab({currentTarget: document.querySelector('.tab-link')}, 'tabDados'); showModal('profileModal'); }
function handleProfileUpdate(e) { e.preventDefault(); const name = document.getElementById('profileName').value; const userDb = users.find(u => u.email === currentUser.email); if(userDb) { userDb.name = name; currentUser.name = name; saveUsers(); localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); updateUI(); } showToast('Perfil atualizado!', 'success'); }
function openTab(evt, tabName) { document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none'); document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active')); document.getElementById(tabName).style.display = 'block'; evt.currentTarget.classList.add('active'); if (tabName === 'tabFavoritos') renderWishlist(); if (tabName === 'tabReservas') renderMyReservations(); }
function renderWishlist() { const c = document.getElementById('profileWishlist'); c.innerHTML = ''; if (!currentUser?.wishlist?.length) { c.innerHTML = "<p>Sua lista de favoritos está vazia.</p>"; return; } const items = roupas.filter(r => currentUser.wishlist.includes(r.id)); if (items.length === 0) { c.innerHTML = "<p>Nenhum favorito encontrado.</p>"; return; } items.forEach(r => { const card = document.createElement('div'); card.className = 'roupa-card'; card.innerHTML = `<img src="${r.imagem_url}" class="roupa-image" onclick="showQuickView(${r.id})"><div class="roupa-info"><h3 class="roupa-nome">${r.nome}</h3></div>`; c.appendChild(card); }); }
function toggleWishlist(id, e) { e.stopPropagation(); if (!currentUser || currentUser.isAdmin) return; const user = users.find(u => u.email === currentUser.email); if (!user) return; if (!user.wishlist) user.wishlist = []; const index = user.wishlist.indexOf(id); if (index > -1) { user.wishlist.splice(index, 1); showToast("Removido dos favoritos.", "info"); } else { user.wishlist.push(id); showToast("Adicionado aos favoritos!", "success"); } currentUser.wishlist = user.wishlist; localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser)); saveUsers(); renderClothes(); }
function showQuickView(id) { const r = roupas.find(rp => rp.id === id); if (!r) return; document.getElementById('quickViewNome').textContent = r.nome; document.getElementById('quickViewContent').innerHTML = `<img src="${r.imagem_url}" alt="${r.nome}" class="quick-view-image"><div class="quick-view-details"><p>${r.cor}</p><p><strong>Tamanho:</strong> ${r.tamanho}</p><h3 class="roupa-preco">R$ ${parseFloat(r.preco).toFixed(2)}</h3><div class="roupa-actions">${r.status === 'disponivel' && !(currentUser && currentUser.isAdmin) ? `<button class="btn btn-primary" onclick="addFromQuickView(${r.id})"><i class="fas fa-shopping-cart"></i> Reservar</button>` : `<button class="btn btn-reserved" disabled><i class="fas fa-bookmark"></i> Indisponível</button>`}</div></div>`; showModal('quickViewModal'); }
function addFromQuickView(id) { toggleReserva(id); hideModal('quickViewModal'); }
function renderCart() { const c = document.getElementById('cartItems'); const t = document.getElementById('cartTotalItems'); c.innerHTML = ''; if (cart.length === 0) { c.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><h3>Seu carrinho está vazio</h3></div>`; } else { cart.forEach(i => { const item = document.createElement('div'); item.className = 'cart-item'; item.innerHTML = `<img src="${i.imagem_url}" class="cart-item-image"><div class="cart-item-info"><div class="cart-item-name">${i.nome}</div><div class="cart-item-price">R$ ${parseFloat(i.preco).toFixed(2)}</div></div><button class="btn btn-danger btn-small" onclick="removeFromCartAndUpdate(${i.id})"><i class="fas fa-trash"></i></button>`; c.appendChild(item); }); } t.textContent = cart.length; }
function openCart() { renderCart(); showModal('cartModal'); }
function updateCartCount() { document.getElementById('cartCount').textContent = cart.length; }
function clearCart() { if (cart.length === 0) return; cart = []; saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Carrinho esvaziado!', 'success'); }
function toggleReserva(id) { if (!currentUser || currentUser.isAdmin) return; const r = roupas.find(rp => rp.id === id); if (!r || r.status === 'reservado') return; const index = cart.findIndex(i => i.id === id); if (index > -1) { cart.splice(index, 1); } else { cart.push(r); } saveCart(); updateCartCount(); renderClothes(); }
function removeFromCartAndUpdate(id) { const i = cart.findIndex(item => item.id === id); if (i > -1) { cart.splice(i, 1); saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Item removido.', 'info'); } }
function checkout() { /* Lógica futura para salvar reservas no Supabase */ }
function cancelReservation(resId) { /* Lógica futura para atualizar reservas no Supabase */ }
function renderMyReservations() { /* ... */ }

// ======================================================
// FUNÇÕES GLOBAIS (PARA ONCLICK NO HTML)
// ======================================================
window.openTab = openTab; window.toggleReserva = toggleReserva; window.cancelReservation = cancelReservation; window.showEditRoupaModal = showEditRoupaModal; window.removeFromCartAndUpdate = removeFromCartAndUpdate; window.confirmDelete = confirmDelete; window.toggleWishlist = toggleWishlist; window.showQuickView = showQuickView; window.addFromQuickView = addFromQuickView;
