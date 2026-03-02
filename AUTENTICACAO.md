# 🔐 Autenticação - Variável Branddi

## Como Funciona

A aplicação agora possui **autenticação obrigatória** com Supabase. Todos os usuários precisam criar uma conta ou fazer login antes de acessar o dashboard.

## Fluxo de Autenticação

### 1. **Tela de Login**
- Email e senha (mínimo 6 caracteres)
- Opção de criar nova conta
- Validações em tempo real

### 2. **Criar Conta**
- Clique em "Não tem conta?"
- Preencha email e crie uma senha forte
- Clique em "Criar Conta"

### 3. **Fazer Login**
- Informe o email e senha cadastrados
- Sistema valida as credenciais com Supabase
- Acesso ao dashboard após autenticação

### 4. **Logout**
- Botão "Sair" no canto superior direito da NavBar
- Retorna à tela de login

## Componentes Criados

### `src/hooks/useAuth.js`
Hook que gerencia toda a lógica de autenticação:
- `signUp(email, password)` - Criar nova conta
- `signIn(email, password)` - Fazer login
- `signOut()` - Logout
- `isAuthenticated` - Verifica se está autenticado
- `user` - Dados do usuário logado

### `src/components/LoginPage.jsx`
Página de login/signup com:
- Formulário elegante com design moderno
- Validações de email e senha
- Feedback visual com toasts
- Opção de alternar entre login e signup

### Modificações no `src/App.jsx`
- Integração do hook `useAuth`
- Renderização condicional (login vs dashboard)
- Proteção de rotas
- Refresh automático da sessão ao carregar

### Modificações no `src/components/NavBar.jsx`
- Exibição do email do usuário logado
- Botão de logout com ícone
- Informações de autenticação na barra

## Variáveis de Ambiente

Já configuradas no `.env.local`:

```
VITE_SUPABASE_URL=https://nwszltjpkvepnutqteko.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Deploy em Vercel

### Passo 1: Adicionar Variáveis de Ambiente
1. Acesse o dashboard do Vercel
2. Vá para "Settings" → "Environment Variables"
3. Adicione:
   - `VITE_SUPABASE_URL` 
   - `VITE_SUPABASE_ANON_KEY`

### Passo 2: Fazer Deploy
```bash
git push origin main
```

O Vercel fará o deploy automaticamente com as variáveis configuradas.

## Segurança

✅ **Senhas são criptografadas** pelo Supabase  
✅ **Sessões são gerenciadas** automaticamente  
✅ **JWT tokens** são armazenados no localStorage  
✅ **HTTPS obrigatório** em produção  

## Próximas Melhorias Possíveis

- [ ] Reset de senha por email
- [ ] Autenticação via Google/GitHub
- [ ] 2FA (Two-Factor Authentication)
- [ ] Roles de usuário (admin, user, etc)
- [ ] RLS (Row-Level Security) para dados por usuário

## Testando Localmente

```bash
npm run dev
```

A aplicação estará em `http://localhost:5173`

1. Crie uma conta de teste
2. Faça login
3. Use a aplicação normalmente
4. Clique em "Sair" para logout

---

**Última atualização:** 2 de março de 2026
