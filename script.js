// ======================================================
// CONFIGURAÇÕES E INICIALIZAÇÃO DO SUPABASE
// ======================================================
const SUPABASE_URL = 'https://hamqyanzgfzcxnxnqzev.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXF5YW56Z2Z6Y3hueG5xemV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4Mjg2NDAsImV4cCI6MjA2MzQwNDY0MH0.6l3dW3OXC8M_CX2TrejJR8EY5xgZvsIcKzTIXQ14rTs';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variáveis de estado
let currentUser = null;
let authUI = null; // Para guardar a instância do componente de UI

// ======================================================
// INICIALIZAÇÃO DO SITE
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeAuthComponent();
    listenToAuthState();
    checkUserSession(); 
});


// ======================================================
// AUTENTICAÇÃO COM O COMPONENTE SUPABASE UI
// ======================================================
function initializeAuthComponent() {
    const { Auth } = supabaseAuthUI; // Pega o componente da biblioteca global
    authUI = new Auth(supabase, {
        container: '#supabaseAuthContainer', // Onde o formulário vai aparecer
        providers: [], // Deixe vazio para usar apenas email/senha
        view: 'sign_in',
        localization: {
            variables: {
                sign_in: { email_label: 'Seu email', password_label: 'Sua senha', button_label: 'Entrar', link_text: 'Já tem uma conta? Entre' },
                sign_up: { email_label: 'Seu email', password_label: 'Crie uma senha', button_label: 'Cadastrar', link_text: 'Não tem uma conta? Cadastre-se' },
                forgotten_password: { email_label: 'Seu email', button_label: 'Enviar instruções', link_text: 'Esqueceu sua senha?' }
            }
        }
    });
}

function listenToAuthState() {
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN') {
            await checkUserSession();
            updateUI();
            hideModal('authModal');
            showToast(`Login realizado com sucesso!`, 'success');
        }
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUI();
            showToast('Você saiu da sua conta.', 'info');
        }
    });
}

async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
        const { data: profile } = await supabase.from('perfis').select('name').eq('id', session.user.id).single();
        if (profile) {
            currentUser = {
                id: session.user.id,
                email: session.user.email,
                name: profile.name
            };
        }
    } else {
        currentUser = null;
    }
    updateUI();
}

async function logout() {
    await supabase.auth.signOut();
}

// ======================================================
// EVENT LISTENERS E UI
// ======================================================
function setupEventListeners() {
    document.getElementById('authBtn').addEventListener('click', () => showModal('authModal'));
    document.getElementById('closeAuthModal').addEventListener('click', () => hideModal('authModal'));
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.querySelector('.modal').addEventListener('click', (e) => {
        if (e.target.id === 'authModal') hideModal('authModal');
    });
}

function showModal(modalId) { document.getElementById(modalId).classList.remove('hidden'); }
function hideModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }

function updateUI() {
    const userSection = document.getElementById('userSection');
    const authBtn = document.getElementById('authBtn');
    const welcomeMessage = document.getElementById('welcomeMessage');

    if (currentUser) {
        userSection.classList.remove('hidden');
        authBtn.classList.add('hidden');
        document.getElementById('userGreeting').textContent = `Olá, ${currentUser.name}`;
        welcomeMessage.classList.remove('hidden');
    } else {
        userSection.classList.add('hidden');
        authBtn.classList.remove('hidden');
        welcomeMessage.classList.add('hidden');
    }
}

function renderClothes() {
    // Por enquanto, vamos deixar a vitrine simples
    document.getElementById('clothesContainer').innerHTML = "<p>Faça login para ver os achadinhos.</p>";
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
