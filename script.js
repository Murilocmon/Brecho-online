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
    if (session) {
        const { data: profile, error } = await supabaseClient
            .from('perfis')
            .select('name, wishlist')
            .eq('id', session.user.id)
            .single();
        
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

async function loadRoupasFromDB() {
    const { data, error } = await supabaseClient.from('roupas').select('*').order('created_at', { ascending: false });
    if (error) { console.error("Erro ao buscar roupas:", error); roupas = []; } else { roupas = data; }
}

function loadLocalData() {
    cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
    reservations = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) || [];
}

function saveCart() { localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)); }
function saveReservations() { localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations)); }

// ======================================================
// EVENT LISTENERS E UI (sem alterações significativas)
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
}
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
function renderClothes() {
    const container = document.getElementById('clothesContainer');
    container.innerHTML = '';
    if (!roupas || roupas.length === 0) { container.innerHTML = '<p>Nenhuma roupa cadastrada na loja.</p>'; return; }
    roupas.forEach(roupa => {
        if (roupa.status === 'vendido') return;
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
            adminButtonsHtml = `<button class="btn btn-primary btn-small" onclick='showEditRoupaModal(${JSON.stringify(roupa)})'><i class="fas fa-edit"></i> Editar</button><button class="btn btn-danger btn-small" onclick='confirmDelete(${roupa.id})'><i class="fas fa-trash"></i> Excluir</button>`;
        }
        let wishlistButtonHtml = '';
        if (currentUser && !currentUser.isAdmin) {
            wishlistButtonHtml = `<button class="wishlist-btn ${itemInWishlist ? 'active' : ''}" onclick="toggleWishlist(${roupa.id}, event)"><i class="fas fa-heart"></i></button>`;
        }
        card.innerHTML = `<img src="${roupa.imagem_url}" class="roupa-image" alt="${roupa.nome}"><div class="roupa-info"><h3 class="roupa-nome">${roupa.nome}</h3><p class="roupa-descricao">Cor: ${roupa.cor || 'Não informada'}</p><div class="roupa-details"><span class="roupa-tamanho">${roupa.tamanho}</span><span class="roupa-preco">R$ ${parseFloat(roupa.preco).toFixed(2)}</span></div><div class="roupa-actions">${currentUser && currentUser.isAdmin ? adminButtonsHtml : clientButtonHtml}</div></div>`;
        container.appendChild(card);
    });
}
function showToast(message, type = 'success') { const toast = document.getElementById('toast'); const toastMessage = document.getElementById('toastMessage'); toastMessage.textContent = message; toast.className = `toast show ${type}`; setTimeout(() => { toast.classList.add('hidden'); }, 3000); }

// ======================================================
// AUTENTICAÇÃO E ADMIN COM SUPABASE
// ======================================================
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    // Agora passamos o nome nos 'options.data'. O trigger no Supabase vai usar essa informação.
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                name: name
            }
        }
    });

    if (error) {
        showToast(`Erro no cadastro: ${error.message}`, 'error');
        return;
    }

    // Se chegou aqui, o trigger já criou o perfil. Apenas informamos o sucesso.
    showToast('Cadastro realizado com sucesso! Por favor, faça o login.', 'success');
    hideModal('registerModal');
    document.getElementById('registerForm').reset();
}

async function handleClientLogin(e) {
    e.preventDefault();
    const email = document.getElementById('clientLoginEmail').value;
    const password = document.getElementById('clientLoginPassword').value;

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        showToast(`Erro no login: ${error.message}`, 'error');
    } else {
        await checkUserSession();
        hideModal('clientLoginModal');
        updateAndRenderAll();
        showToast(`Bem-vindo(a) de volta, ${currentUser.name}!`, 'success');
    }
}

async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) { showToast(`Erro ao sair: ${error.message}`, 'error'); } 
    else {
        currentUser = null;
        updateAndRenderAll();
        showToast('Você saiu da sua conta.', 'info');
    }
}

function handleLogoClick() { if (currentUser && !currentUser.isAdmin) { showModal('loginModal'); } else if (!currentUser) { showToast("Faça login para solicitar acesso de admin.", "info"); } }
function handleAdminLogin(e) { e.preventDefault(); const password = document.getElementById('loginPassword').value; if (password === CONFIG.ADMIN_PASSWORD) { currentUser.isAdmin = true; hideModal('loginModal'); updateAndRenderAll(); showToast(`Privilégios de admin concedidos!`, 'success'); } else { showToast('Senha de administrador incorreta!', 'error'); } }

// ======================================================
// PERFIL, ABAS E FAVORITOS COM SUPABASE
// ======================================================
async function handleProfileUpdate(e) {
    e.preventDefault();
    const newName = document.getElementById('profileName').value;
    const { error } = await supabaseClient.from('perfis').update({ name: newName }).eq('id', currentUser.id);
    if (error) { showToast(`Erro ao atualizar perfil: ${error.message}`, 'error'); } 
    else { currentUser.name = newName; updateUI(); showToast('Perfil atualizado com sucesso!', 'success'); }
}

async function toggleWishlist(id, e) {
    e.stopPropagation();
    if (!currentUser || currentUser.isAdmin) return;
    
    let currentWishlist = currentUser.wishlist || [];
    const itemIndex = currentWishlist.indexOf(id);
    if (itemIndex > -1) { currentWishlist.splice(itemIndex, 1); } 
    else { currentWishlist.push(id); }
    
    const { error } = await supabaseClient.from('perfis').update({ wishlist: currentWishlist }).eq('id', currentUser.id);
    
    if (error) { showToast('Erro ao atualizar favoritos.', 'error'); } 
    else {
        currentUser.wishlist = currentWishlist;
        showToast(itemIndex > -1 ? 'Removido dos favoritos.' : 'Adicionado aos favoritos!', 'info');
        renderClothes();
    }
}

// ... Restante das funções (CRUD de Roupas, Carrinho, etc.)
function showProfileModal() { if (!currentUser) { showToast("Faça login para ver seu perfil.", "error"); return; } document.getElementById('profileName').value = currentUser.name; document.getElementById('profileEmail').value = currentUser.email; openTab({currentTarget: document.querySelector('.tab-link')}, 'tabDados'); showModal('profileModal'); }
function openTab(evt, tabName) { document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none'); document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active')); document.getElementById(tabName).style.display = 'block'; evt.currentTarget.classList.add('active'); if (tabName === 'tabFavoritos') renderWishlist(); if (tabName === 'tabReservas') renderMyReservations(); }
function renderWishlist() { const c = document.getElementById('profileWishlist'); c.innerHTML = ''; if (!currentUser?.wishlist?.length) { c.innerHTML = "<p>Sua lista de favoritos está vazia.</p>"; return; } const items = roupas.filter(r => currentUser.wishlist.includes(r.id)); if (items.length === 0) { c.innerHTML = "<p>Nenhum favorito encontrado.</p>"; return; } items.forEach(r => { const card = document.createElement('div'); card.className = 'roupa-card'; card.innerHTML = `<img src="${r.imagem_url}" class="roupa-image"><div class="roupa-info"><h3 class="roupa-nome">${r.nome}</h3></div>`; c.appendChild(card); }); }
function renderCart() { const c = document.getElementById('cartItems'); const t = document.getElementById('cartTotalItems'); c.innerHTML = ''; if (cart.length === 0) { c.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><h3>Seu carrinho está vazio</h3></div>`; } else { cart.forEach(i => { const item = document.createElement('div'); item.className = 'cart-item'; item.innerHTML = `<img src="${i.imagem_url}" class="cart-item-image"><div class="cart-item-info"><div class="cart-item-name">${i.nome}</div><div class="cart-item-price">R$ ${parseFloat(i.preco).toFixed(2)}</div></div><button class="btn btn-danger btn-small" onclick="removeFromCartAndUpdate(${i.id})"><i class="fas fa-trash"></i></button>`; c.appendChild(item); }); } t.textContent = cart.length; }
function openCart() { renderCart(); showModal('cartModal'); }
function updateCartCount() { document.getElementById('cartCount').textContent = cart.length; }
function clearCart() { if (cart.length === 0) return; cart = []; saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Carrinho esvaziado!', 'success'); }
function toggleReserva(id) { if (!currentUser || currentUser.isAdmin) return; const r = roupas.find(rp => rp.id === id); if (!r || r.status === 'reservado') return; const index = cart.findIndex(i => i.id === id); if (index > -1) { cart.splice(index, 1); } else { cart.push(r); } saveCart(); updateCartCount(); renderClothes(); }
function removeFromCartAndUpdate(id) { const i = cart.findIndex(item => item.id === id); if (i > -1) { cart.splice(i, 1); saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Item removido.', 'info'); } }
async function checkout() { /* Implementação futura com a tabela de reservas */ }
async function cancelReservation(resId) { /* Implementação futura com a tabela de reservas */ }
function renderMyReservations() { /* Implementação futura com a tabela de reservas */ }
async function handleRoupaSubmit(e) {e.preventDefault(); const id = document.getElementById('roupaId').value; const roupaData = { nome: document.getElementById('roupaNome').value, cor: document.getElementById('roupaCor').value, tamanho: document.getElementById('roupaTamanho').value, preco: parseFloat(document.getElementById('roupaPreco').value), imagem_url: document.getElementById('roupaImagem').value }; let res; if (id) { res = await supabaseClient.from('roupas').update(roupaData).eq('id', id); } else { res = await supabaseClient.from('roupas').insert([roupaData]); } if (res.error) { showToast("Erro ao salvar roupa.", "error"); } else { showToast('Roupa salva com sucesso!', 'success'); hideModal('roupaModal'); await loadRoupasFromDB(); renderClothes(); } }
async function deleteRoupa(roupaId) { const { error } = await supabaseClient.from('roupas').delete().eq('id', roupaId); if (error) { showToast("Erro ao excluir roupa.", "error"); } else { showToast("Roupa excluída!", "success"); await loadRoupasFromDB(); renderClothes(); } }
function confirmDelete(id) { const r = roupas.find(rp => rp.id === id); if (!r) return; document.getElementById('confirmMessage').textContent = `Tem certeza que deseja excluir "${r.nome}"?`; showModal('confirmModal'); const yesBtn = document.getElementById('confirmYes'); const newYesBtn = yesBtn.cloneNode(true); yesBtn.parentNode.replaceChild(newYesBtn, yesBtn); newYesBtn.onclick = () => { deleteRoupa(id); hideModal('confirmModal'); }; document.getElementById('confirmNo').onclick = () => hideModal('confirmModal'); }
function showAddRoupaModal() { document.getElementById('roupaModalTitle').textContent = 'Adicionar Roupa'; document.getElementById('roupaForm').reset(); document.getElementById('roupaId').value = ''; showModal('roupaModal'); }
function showEditRoupaModal(roupa) { document.getElementById('roupaModalTitle').textContent = 'Editar Roupa'; document.getElementById('roupaId').value = roupa.id; document.getElementById('roupaNome').value = roupa.nome; document.getElementById('roupaCor').value = roupa.cor; document.getElementById('roupaTamanho').value = roupa.tamanho; document.getElementById('roupaPreco').value = roupa.preco; document.getElementById('roupaImagem').value = roupa.imagem_url; showModal('roupaModal'); }
// FUNÇÕES GLOBAIS
window.openTab = openTab; window.toggleReserva = toggleReserva; window.cancelReservation = cancelReservation; window.showEditRoupaModal = showEditRoupaModal; window.removeFromCartAndUpdate = removeFromCartAndUpdate; window.confirmDelete = confirmDelete; window.toggleWishlist = toggleWishlist;
