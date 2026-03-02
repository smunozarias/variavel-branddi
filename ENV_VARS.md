# 🔑 Variáveis de Ambiente - Autenticação Supabase

## ✅ Status Atual

As credenciais do Supabase **já estão configuradas** no seu projeto em:
```
.env.local (arquivo local)
```

---

## 📝 Variáveis Necessárias

### Local (Desenvolvimento)
```env
# Já está em .env.local
VITE_SUPABASE_URL=https://nwszltjpkvepnutqteko.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53c3psdGpwa3ZlcG51dHF0ZWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODExMDIsImV4cCI6MjA4NjA1NzEwMn0.obCTdEn0ZsmtGfaA9a54QMIgMAYUceesXCUiFrwKzCI
```

### Vercel (Produção)
Precisa adicionar em **Settings → Environment Variables**:

```
Nome: VITE_SUPABASE_URL
Valor: https://nwszltjpkvepnutqteko.supabase.co

Nome: VITE_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53c3psdGpwa3ZlcG51dHF0ZWtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0ODExMDIsImV4cCI6MjA4NjA1NzEwMn0.obCTdEn0ZsmtGfaA9a54QMIgMAYUceesXCUiFrwKzCI
```

---

## 🧪 Testar Localmente

### 1. Confirmar Variáveis
```bash
# Verifica se as variáveis estão carregadas
npm run dev

# Abre browser em http://localhost:5173
# Veja no console do browser: "✓ Cliente Supabase criado"
```

### 2. Criar Conta de Teste
```
Email: teste@teste.com
Senha: teste123
```

### 3. Fazer Login
Use as mesmas credenciais

---

## 🚀 Deploy em Vercel

### Passo 1: Acessar Vercel Dashboard
```
https://vercel.com/dashboard
```

### Passo 2: Selecionar Projeto
```
Clique em "variavel-branddi"
```

### Passo 3: Ir para Settings
```
Settings → Environment Variables
```

### Passo 4: Adicionar Variáveis
```
1. Clique em "Add"
2. Nome: VITE_SUPABASE_URL
   Valor: https://nwszltjpkvepnutqteko.supabase.co
3. Clique em "Save"

4. Clique em "Add" novamente
5. Nome: VITE_SUPABASE_ANON_KEY
   Valor: [cola a chave acima]
6. Clique em "Save"
```

### Passo 5: Fazer Push
```bash
git add .
git commit -m "feat: adicionar auth"
git push origin main
```

Vercel vai fazer deploy automaticamente! ✅

---

## ✅ Checklist - Antes de Deploy

- [ ] Arquivo `.env.local` existe
- [ ] Contém `VITE_SUPABASE_URL`
- [ ] Contém `VITE_SUPABASE_ANON_KEY`
- [ ] `npm run dev` funciona
- [ ] Login funciona localmente
- [ ] `npm run build` não tem erros
- [ ] Vercel env vars configuradas
- [ ] Git repo atualizado

---

## 🔒 Segurança

### ⚠️ O QUE NÃO FAZER
```
❌ NÃO commit .env.local em repositório público
❌ NÃO compartilhe as chaves via Slack/email
❌ NÃO use em repositórios privados sem cuidado
```

### ✅ O QUE FAZER
```
✅ Adicionar .env.local no .gitignore
✅ Usar .env.local.example como template
✅ Adicionar env vars direto em Vercel
✅ Rotar chaves periodicamente
```

---

## 🐛 Troubleshooting

### "Variáveis não carregadas"
```bash
# Solução
npm install
npm run dev

# Verificar no console do browser
# Deve aparecer: "✓ Cliente Supabase criado"
```

### "Login não funciona"
```bash
# 1. Verificar se .env.local existe
cat .env.local

# 2. Confirmar chaves corretas
# VITE_SUPABASE_URL deve ter valor
# VITE_SUPABASE_ANON_KEY deve ter valor

# 3. Reiniciar dev server
npm run dev
```

### "Deploy em Vercel falhou"
```
1. Verificar que env vars estão em Vercel Settings
2. Fazer redeploy manualmente
3. Verificar build logs em Deployments
```

---

## 📞 Referências

### Supabase
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Usuários: https://app.supabase.com/project/nwszltjpkvepnutqteko/auth/users

### Vercel
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Env Vars: https://vercel.com/docs/concepts/projects/environment-variables

---

## 📋 Resumo de Variáveis

| Variável | Valor | Ambiente |
|----------|-------|----------|
| VITE_SUPABASE_URL | https://nwszltjpkvepnutqteko.supabase.co | Dev + Prod |
| VITE_SUPABASE_ANON_KEY | [token acima] | Dev + Prod |

---

**Nota:** Essas variáveis são públicas (ANON_KEY é segura de compartilhar). Para operações que precisam de privilégios maiores, use a SERVICE_KEY apenas no backend.

**Última atualização:** 2 de março de 2026
