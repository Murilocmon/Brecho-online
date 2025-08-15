// ======================================================
// CONFIGURAÇÕES GLOBAIS E ESTADO
// ======================================================
const CONFIG = {
    // Suas chaves e URL foram inseridas aqui
    SUPABASE_URL: 'https://hamqyanzgfzcxnxnqzev.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXF5YW56Z2Z6Y3hueG5xemV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mjg2NDAsImV4cCI6MjA2MzQwNDY0MH0.6l3dW3OXC8M_CX2TrejJR8EY5xgZvsIcKzTIXQ14rTs',
    ADMIN_PASSWORD: '1907'
};

// --- CORREÇÃO CRÍTICA AQUI ---
// Inicializa o cliente do Supabase
const supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// Variáveis de estado
let currentUser = null;
let roupas = [];
let users = [];
let cart = [];
let reservations = [];

// ======================================================
// INICIALIZAÇÃO
// ======================================================
document.addEventListener('DOMContentLoaded', async () => {
    // A inicialização agora é assíncrona para esperar os dados do banco
    await loadDataFromDB();
    setupEventListeners();
    updateUI();
    renderClothes();
});

// ======================================================
// CARREGAMENTO E SALVAMENTO DE DADOS
// ======================================================
async function loadDataFromDB() {
    showToast("Carregando achadinhos...", "info");
    
    // SELECT * FROM roupas (o nome da sua tabela no Supabase)
    const { data, error } = await supabase
        .from('roupas') // Certifique-se que o nome da sua tabela é 'roupas'
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao buscar roupas do Supabase:", error);
        showToast("Erro ao carregar produtos.", "error");
        roupas = [];
    } else {
        roupas = data;
        showToast("Achadinhos carregados!", "success");
    }

    // Carrega dados locais (sessão do usuário, carrinho, etc.)
    currentUser = JSON.parse(localStorage.getItem('achadinhos_user')) || null;
    cart = JSON.parse(localStorage.getItem('achadinhos_cart')) || [];
    users = JSON.parse(localStorage.getItem('achadinhos_users')) || [];
    reservations = JSON.parse(localStorage.getItem('achadinhos_reservations')) || [];
}

function saveCart() { localStorage.setItem('achadinhos_cart', JSON.stringify(cart)); }
function saveReservations() { localStorage.setItem('achadinhos_reservations', JSON.stringify(reservations)); }
function saveUsers() { localStorage.setItem('achadinhos_users', JSON.stringify(users)); }

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

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(modal.id); });
    });
    
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

function renderClothes() {
    const container = document.getElementById('clothesContainer');
    container.innerHTML = '';
    if (!roupas || roupas.length === 0) {
        container.innerHTML = '<p>Nenhuma roupa cadastrada na loja.</p>';
        return;
    }
    
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
            adminButtonsHtml = `<button class="btn btn-primary btn-small" onclick='showEditRoupaModal(${JSON.stringify(roupa)})'><i class="fas fa-edit"></i> Editar</button>
                                <button class="btn btn-danger btn-small" onclick='confirmDelete(${roupa.id})'><i class="fas fa-trash"></i> Excluir</button>`;
        }
        
        let wishlistButtonHtml = '';
        if (currentUser && !currentUser.isAdmin) {
            wishlistButtonHtml = `<button class="wishlist-btn ${itemInWishlist ? 'active' : ''}" onclick="toggleWishlist(${roupa.id}, event)"><i class="fas fa-heart"></i></button>`;
        }
        
        card.innerHTML = `
            <img src="${roupa.imagem_url}" class="roupa-image" alt="${roupa.nome}">
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

// ======================================================
// AUTENTICAÇÃO E ADMIN
// ======================================================
function handleLogoClick() { if (currentUser && !currentUser.isAdmin) { showModal('loginModal'); } else if (!currentUser) { showToast("Faça login como cliente para solicitar acesso de admin.", "info"); } }
function handleAdminLogin(e) { e.preventDefault(); const password = document.getElementById('loginPassword').value; if (password === CONFIG.ADMIN_PASSWORD) { const userEmail = currentUser.email; const userReservations = reservations.filter(res => res.userEmail === userEmail); if (userReservations.length > 0) { const reservedIds = userReservations.map(res => res.roupa.id); roupas.forEach(roupa => { if (reservedIds.includes(roupa.id)) { roupa.status = 'disponivel'; } }); reservations = reservations.filter(res => res.userEmail !== userEmail); showToast("Suas reservas pessoais foram canceladas ao se tornar admin.", "info"); } currentUser.isAdmin = true; localStorage.setItem('achadinhos_user', JSON.stringify(currentUser)); /*saveRoupas();*/ saveReservations(); hideModal('loginModal'); updateAndRenderAll(); showToast(`Privilégios de admin concedidos!`, 'success'); } else { showToast('Senha de administrador incorreta!', 'error'); } }
function handleClientLogin(e) { e.preventDefault(); const email = document.getElementById('clientLoginEmail').value; const password = document.getElementById('clientLoginPassword').value; const currentUsers = JSON.parse(localStorage.getItem('achadinhos_users')) || []; const foundUser = currentUsers.find(user => user.email === email && user.password === password); if (foundUser) { currentUser = foundUser; localStorage.setItem('achadinhos_user', JSON.stringify(currentUser)); hideModal('clientLoginModal'); updateAndRenderAll(); showToast(`Bem-vindo(a) de volta, ${currentUser.name}!`, 'success'); } else { showToast('Email ou senha incorretos!', 'error'); } }
function handleRegister(e) { e.preventDefault(); const name = document.getElementById('registerName').value; const email = document.getElementById('registerEmail').value; const password = document.getElementById('registerPassword').value; const currentUsers = JSON.parse(localStorage.getItem('achadinhos_users')) || []; if (currentUsers.some(u => u.email === email)) { showToast('Este email já está cadastrado.', 'error'); return; } const newUser = { name, email, password, isAdmin: false, wishlist: [] }; currentUsers.push(newUser); users = currentUsers; saveUsers(); currentUser = newUser; localStorage.setItem('achadinhos_user', JSON.stringify(currentUser)); hideModal('registerModal'); updateAndRenderAll(); showToast('Cadastro realizado com sucesso!', 'success'); }
function logout() { currentUser = null; localStorage.removeItem('achadinhos_user'); updateAndRenderAll(); showToast('Você saiu da sua conta.', 'info'); }
function showAddRoupaModal() { document.getElementById('roupaModalTitle').textContent = 'Adicionar Roupa'; document.getElementById('roupaForm').reset(); document.getElementById('roupaId').value = ''; showModal('roupaModal'); }
function showEditRoupaModal(roupa) { document.getElementById('roupaModalTitle').textContent = 'Editar Roupa'; document.getElementById('roupaId').value = roupa.id; document.getElementById('roupaNome').value = roupa.nome; document.getElementById('roupaDescricao').value = roupa.descricao; document.getElementById('roupaTamanho').value = roupa.tamanho; document.getElementById('roupaPreco').value = roupa.preco; document.getElementById('roupaCategoria').value = roupa.categoria; document.getElementById('roupaImagem').value = roupa.imagem_url; showModal('roupaModal'); }
function handleRoupaSubmit(e) { e.preventDefault(); /* Lógica para salvar no Supabase será adicionada depois */ }
function confirmDelete(id) { /* Lógica para deletar do Supabase será adicionada depois */ }

// ======================================================
// PERFIL, ABAS E FAVORITOS
// ======================================================
function showProfileModal() { if (!currentUser) { showToast("Faça login para ver seu perfil.", "error"); return; } document.getElementById('profileName').value = currentUser.name; document.getElementById('profileEmail').value = currentUser.email; openTab({currentTarget: document.querySelector('.tab-link')}, 'tabDados'); showModal('profileModal'); }
function handleProfileUpdate(e) { e.preventDefault(); const name = document.getElementById('profileName').value; const userDb = users.find(u => u.email === currentUser.email); if(userDb) { userDb.name = name; currentUser.name = name; saveUsers(); localStorage.setItem('achadinhos_user', JSON.stringify(currentUser)); updateUI(); } showToast('Perfil atualizado!', 'success'); }
function openTab(evt, tabName) { document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none'); document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active')); document.getElementById(tabName).style.display = 'block'; evt.currentTarget.classList.add('active'); if (tabName === 'tabFavoritos') renderWishlist(); if (tabName === 'tabReservas') renderMyReservations(); }
function renderWishlist() { const c = document.getElementById('profileWishlist'); c.innerHTML = ''; if (!currentUser?.wishlist?.length) { c.innerHTML = "<p>Sua lista de favoritos está vazia.</p>"; return; } const items = roupas.filter(r => currentUser.wishlist.includes(r.id)); if (items.length === 0) { c.innerHTML = "<p>Nenhum favorito encontrado.</p>"; return; } items.forEach(r => { const card = document.createElement('div'); card.className = 'roupa-card'; card.innerHTML = `<img src="${r.imagem_url}" class="roupa-image"><div class="roupa-info"><h3 class="roupa-nome">${r.nome}</h3></div>`; c.appendChild(card); }); }
function toggleWishlist(id, e) { e.stopPropagation(); if (!currentUser || currentUser.isAdmin) return; const user = users.find(u => u.email === currentUser.email); if (!user) return; if (!user.wishlist) user.wishlist = []; const index = user.wishlist.indexOf(id); if (index > -1) { user.wishlist.splice(index, 1); showToast("Removido dos favoritos.", "info"); } else { user.wishlist.push(id); showToast("Adicionado aos favoritos!", "success"); } currentUser.wishlist = user.wishlist; localStorage.setItem('achadinhos_user', JSON.stringify(currentUser)); saveUsers(); renderClothes(); }

// ======================================================
// CARRINHO E RESERVAS
// ======================================================
function renderCart() { const c = document.getElementById('cartItems'); const t = document.getElementById('cartTotalItems'); c.innerHTML = ''; if (cart.length === 0) { c.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><h3>Seu carrinho está vazio</h3></div>`; } else { cart.forEach(i => { const item = document.createElement('div'); item.className = 'cart-item'; item.innerHTML = `<img src="${i.imagem_url}" class="cart-item-image"><div class="cart-item-info"><div class="cart-item-name">${i.nome}</div><div class="cart-item-price">R$ ${parseFloat(i.preco).toFixed(2)}</div></div><button class="btn btn-danger btn-small" onclick="removeFromCartAndUpdate(${i.id})"><i class="fas fa-trash"></i></button>`; c.appendChild(item); }); } t.textContent = cart.length; }
function openCart() { renderCart(); showModal('cartModal'); }
function updateCartCount() { document.getElementById('cartCount').textContent = cart.length; }
function clearCart() { if (cart.length === 0) return; cart = []; saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Carrinho esvaziado!', 'success'); }
function toggleReserva(id) { if (!currentUser || currentUser.isAdmin) return; const r = roupas.find(rp => rp.id === id); if (!r || r.status === 'reservado') return; const index = cart.findIndex(i => i.id === id); if (index > -1) { cart.splice(index, 1); } else { cart.push(r); } saveCart(); updateCartCount(); renderClothes(); }
function removeFromCartAndUpdate(id) { const i = cart.findIndex(item => item.id === id); if (i > -1) { cart.splice(i, 1); saveCart(); updateCartCount(); renderClothes(); renderCart(); showToast('Item removido.', 'info'); } }
function checkout() { /* Lógica para salvar no Supabase será adicionada depois */ }
function cancelReservation(resId) { /* Lógica para atualizar no Supabase será adicionada depois */ }
function renderMyReservations() { const c = document.getElementById('profileReservations'); c.innerHTML = ''; if (!currentUser) return; const myRes = reservations.filter(r => r.userEmail === currentUser.email); if (myRes.length === 0) { c.innerHTML = '<p>Você não tem reservas ativas.</p>'; return; } myRes.forEach(r => { const i = document.createElement('div'); i.className = 'reservation-item'; const d = new Date(r.reservedAt).toLocaleDateString('pt-BR'); i.innerHTML = `<img src="${r.roupa.imagem_url}" class="reservation-item-image"><div class="reservation-item-info"><div class="reservation-item-name">${r.roupa.nome}</div><div class="reservation-item-date">Reservado em: ${d}</div></div><button class="btn btn-danger btn-small" onclick="cancelReservation(${r.id})"><i class="fas fa-times"></i></button>`; c.appendChild(i); }); }

// ======================================================
// FUNÇÕES GLOBAIS (PARA ONCLICK NO HTML)
// ======================================================
window.openTab = openTab; window.toggleReserva = toggleReserva; window.cancelReservation = cancelReservation; window.showEditRoupaModal = showEditRoupaModal; window.removeFromCartAndUpdate = removeFromCartAndUpdate; window.confirmDelete = confirmDelete; window.toggleWishlist = toggleWishlist;
