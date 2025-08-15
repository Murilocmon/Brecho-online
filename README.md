# 🛍️ Achadinhos - Site do Brechó

Site completo para o app Achadinhos com funcionalidades CRUD para administradores e sistema de reservas para clientes.

## ✨ Funcionalidades

### 👥 Para Clientes
- **Visualização de roupas**: Grid responsivo com todas as peças disponíveis
- **Sistema de reservas**: Clientes podem reservar e cancelar reservas de roupas
- **Pesquisa avançada**: Busca por nome, descrição, categoria e tamanho
- **Cadastro de usuário**: Sistema de registro simples e rápido
- **Login de cliente**: Acesso com email e senha cadastrados
- **Perfil personalizado**: Editar nome e senha
- **Proteção de reservas**: Apenas usuários logados podem reservar
- **Carrinho inteligente**: Roupas reservadas são movidas automaticamente

### 🔐 Para Administradores
- **Login administrativo**: Acesso com credenciais hardcoded
- **CRUD completo**: Adicionar, editar, visualizar e deletar roupas
- **Painel administrativo**: Interface dedicada para gestão
- **Gestão de estoque**: Controle total sobre o catálogo

## 🎨 Design

O site utiliza a mesma paleta de cores do app Android:
- **Primária**: `#7A3E2E` (Marrom terroso)
- **Secundária**: `#D6A77A` (Dourado claro)
- **Fundo**: `#FFF8F0` (Creme suave)
- **Texto**: `#3A2A20` (Marrom escuro)

## 🚀 Como Usar

### 1. Acesso ao Site
- Abra o arquivo `index.html` em qualquer navegador moderno
- Ou faça deploy no GitHub + Vercel (instruções abaixo)

### 1.1. Sistema de Autenticação
- **Usuários não logados**: Veem botões de "Login Admin", "Login Cliente" e "Cadastro"
- **Usuários clientes logados**: Veem "Olá, [Nome]", botão "Perfil" e "Sair"
- **Administradores logados**: Veem painel administrativo e botão "Logout"
- **Carrinho**: Só fica visível para usuários logados

### 2. Login Administrativo
**Credenciais padrão:**
- **Email**: `murilo@admin.com`
- **Senha**: `1907`

### 3. Funcionalidades Admin
- Clique em "Login Admin" e use as credenciais
- Após o login, o painel administrativo aparecerá
- Use "Adicionar Roupa" para criar novas peças
- Clique no ícone de edição para modificar roupas existentes
- Use o ícone de lixeira para deletar peças

### 4. Sistema de Reservas
- **Proteção de reservas**: Apenas usuários logados podem reservar roupas
- **Login automático**: Modal de login aparece automaticamente ao tentar reservar sem conta
- **Cadastro rápido**: Usuários podem se cadastrar diretamente do modal de login
- **Perfil personalizado**: Clientes logados veem "Olá, [Nome]" no header
- **Carrinho funcional**: Roupas reservadas vão para o carrinho com contador visual
- **Gestão de reservas**: Clientes podem remover itens, limpar carrinho ou finalizar reservas

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Design responsivo com Flexbox e Grid
- **JavaScript ES6+**: Lógica de aplicação
- **LocalStorage**: Persistência de dados local
- **Font Awesome**: Ícones modernos

## 📱 Responsividade

O site é totalmente responsivo e funciona perfeitamente em:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🚀 Deploy no GitHub + Vercel

### Passo 1: Criar Repositório no GitHub
1. Acesse [github.com](https://github.com)
2. Clique em "New repository"
3. Nome: `achadinhos-site`
4. Descrição: "Site do brechó Achadinhos"
5. Público ou privado (sua escolha)
6. Clique em "Create repository"

### Passo 2: Fazer Upload dos Arquivos
```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/achadinhos-site.git

# Entre na pasta
cd achadinhos-site

# Copie os arquivos do site
# - index.html
# - styles.css
# - script.js

# Adicione ao git
git add .
git commit -m "Primeira versão do site Achadinhos"
git push origin main
```

### Passo 3: Deploy no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "New Project"
4. Selecione o repositório `achadinhos-site`
5. Clique em "Deploy"
6. Aguarde o deploy (geralmente 1-2 minutos)

### Passo 4: Configuração Personalizada (Opcional)
- **Domínio personalizado**: Configure em Settings > Domains
- **Variáveis de ambiente**: Se necessário no futuro
- **Analytics**: Integre com Google Analytics ou similar

## 🔧 Personalização

### Alterar Credenciais Admin
No arquivo `script.js`, linha 2-5:
```javascript
const CONFIG = {
    ADMIN_EMAIL: 'seu-email@exemplo.com',
    ADMIN_PASSWORD: 'sua-senha-segura',
    STORAGE_KEY: 'achadinhos_data'
};
```

### Adicionar Novas Categorias
No arquivo `index.html`, dentro do select `roupaCategoria`:
```html
<option value="Nova Categoria">Nova Categoria</option>
```

### Modificar Cores
No arquivo `styles.css`, altere as variáveis CSS:
```css
:root {
    --color-primary: #7A3E2E;
    --color-secondary: #D6A77A;
    --color-background: #FFF8F0;
}
```

## 📊 Estrutura de Dados

### Roupa
```javascript
{
    id: Number,
    nome: String,
    descricao: String,
    tamanho: String,
    preco: Number,
    categoria: String,
    imagem: String (URL),
    reservada: Boolean
}
```

### Usuário
```javascript
{
    name: String,
    email: String,
    password: String,
    isAdmin: Boolean
}
```

## 🔒 Segurança

**⚠️ IMPORTANTE**: Este é um projeto de demonstração com:
- Credenciais hardcoded no frontend
- Dados armazenados no localStorage
- Sem criptografia de senhas

**Para produção, considere:**
- Backend com autenticação JWT
- Banco de dados real (PostgreSQL, MongoDB)
- Criptografia de senhas (bcrypt)
- HTTPS obrigatório
- Validação de entrada no servidor

## 🐛 Solução de Problemas

### Site não carrega
- Verifique se todos os arquivos estão na mesma pasta
- Abra o console do navegador (F12) para ver erros
- Certifique-se de que o JavaScript está habilitado

### Login não funciona
- Verifique as credenciais no arquivo `script.js`
- Limpe o localStorage do navegador
- Recarregue a página

### Roupas não aparecem
- Verifique se há dados no localStorage
- Use o console para debugar: `console.log(roupas)`
- Recarregue a página

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Abra uma issue no GitHub
3. Consulte a documentação das tecnologias utilizadas

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais.

---

**Desenvolvido com ❤️ para o Brechó Achadinhos**