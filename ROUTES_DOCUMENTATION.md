# Documentação de Rotas - Convergy AI

## 📋 Auditoria Completa de Rotas

### ✅ Rotas Públicas (Sem Autenticação)

| Rota | Componente | Sidebar | Descrição | Status |
|------|-----------|---------|-----------|--------|
| `/` | Index | ✅ Sim (Início) | Página inicial/landing page | ✅ Acessível |
| `/auth` | Auth | ❌ Não | Página de login e registro | ✅ Acessível |
| `/r/:slug` | RestaurantPublic | ❌ Não (Público) | Visualização pública do menu | ✅ Acessível |
| `/r/:slug.json` | RestaurantJSON | ❌ Não (API) | Dados do menu em JSON | ✅ Acessível |

### 🔒 Rotas Protegidas (Requer Autenticação)

#### Principal
| Rota | Componente | Sidebar | Descrição | Status |
|------|-----------|---------|-----------|--------|
| `/dashboard` | Dashboard | ✅ Sim | Overview com estatísticas | ✅ Linkada |

#### Restaurantes
| Rota | Componente | Sidebar | Descrição | Status |
|------|-----------|---------|-----------|--------|
| `/restaurant/new` | RestaurantForm | ✅ Sim | Criar novo restaurante | ✅ Linkada |
| `/restaurant/:id` | RestaurantForm | ⚠️ Dinâmica | Editar restaurante existente | ⚠️ Via cards |
| `/restaurant/manage` | RestaurantManagement | ✅ Sim | Gerenciar todos os restaurantes | ✅ Linkada |

#### Negócio
| Rota | Componente | Sidebar | Descrição | Status |
|------|-----------|---------|-----------|--------|
| `/conversations` | Conversations | ✅ Sim | Central de conversas com clientes | ✅ Linkada |
| `/orders` | Orders | ✅ Sim | Central de pedidos | ✅ Linkada |
| `/analytics` | Analytics | ✅ Sim | Dashboard executivo com métricas | ✅ Linkada |

#### Configuração
| Rota | Componente | Sidebar | Descrição | Status |
|------|-----------|---------|-----------|--------|
| `/agent` | Agent | ✅ Sim | Configuração do agente IA | ✅ Linkada |
| `/settings` | Settings | ✅ Sim | Configurações gerais | ✅ Linkada |

### 👑 Rotas Admin (Requer Role Admin)

| Rota | Componente | Sidebar | Descrição | Status |
|------|-----------|---------|-----------|--------|
| `/admin` | Admin | ✅ Sim (Condicional) | Painel administrativo | ✅ Linkada |

### 🚫 Rotas de Erro

| Rota | Componente | Sidebar | Descrição | Status |
|------|-----------|---------|-----------|--------|
| `*` | NotFound | ❌ Não | Página 404 | ✅ Catch-all |

---

## 🔐 Níveis de Proteção

### 1. **Rotas Públicas** (4 rotas)
- Acessíveis sem login
- `/`, `/auth`, `/r/:slug`, `/r/:slug.json`

### 2. **Rotas Protegidas** (`<ProtectedRoute>`) (10 rotas)
- Requer autenticação básica
- Redirecionam para `/auth` se não autenticado
- Dashboard, Restaurantes, Conversas, Pedidos, Analytics, Agente, Configurações

### 3. **Rotas Admin** (`<ProtectedAdminRoute>`) (1 rota)
- Requer autenticação + role "admin"
- Redirecionam para `/` se não for admin
- `/admin`

---

## 🧭 Navegação e Acessibilidade

### ✅ Todas as rotas principais estão acessíveis via:

1. **Sidebar** (AppSidebar.tsx)
   - Seção "Principal": Início, Dashboard
   - Seção "Restaurantes": Novo Restaurante, Meus Restaurantes
   - Seção "Negócio": Central Conversas, Central Pedidos, Dashboard Executivo
   - Seção "Configuração": Agente IA, Configurações
   - Seção "Administração": Painel Admin (apenas para admins)

2. **Links Contextuais**
   - Cards de restaurantes linkam para `/restaurant/:id` (editar)
   - Botões "Ver" abrem `/r/:slug` em nova aba
   - Botões "Novo Restaurante" em várias páginas

3. **Navegação Programática**
   - Redirecionamentos automáticos após login
   - Redirecionamentos de proteção de rotas

### ⚠️ Rotas Dinâmicas (Sem Link Direto no Sidebar)

- `/restaurant/:id` - Acessada via cards de restaurantes
- `/r/:slug` - Página pública (não precisa estar no sidebar)
- `/r/:slug.json` - Endpoint API (não precisa estar no sidebar)

---

## 🔄 Fluxo de Usuário

### Novo Usuário (Não Autenticado)
```
/ (Index) 
  → Click "Entrar" → /auth
  → Login → /dashboard
```

### Usuário Autenticado
```
/dashboard (Overview)
  → Ver estatísticas
  → Quick actions para outras páginas
  
/restaurant/manage (Gestão Detalhada)
  → Filtrar, buscar, ordenar
  → Editar (/restaurant/:id)
  → Ver pública (/r/:slug)
  → Duplicar, ativar/desativar
```

### Administrador
```
Tem acesso a tudo acima +
/admin
  → Gerenciar usuários
  → Gerenciar todos os restaurantes
  → Analytics globais
  → Configurações do sistema
```

---

## 📊 Resumo

- **Total de Rotas**: 15
- **Rotas Públicas**: 4
- **Rotas Protegidas**: 10
- **Rotas Admin**: 1
- **Rotas com Link no Sidebar**: 11
- **Rotas Dinâmicas/Contextuais**: 4
- **Taxa de Acessibilidade**: 100% ✅

---

## ✅ Status Final

✅ **Todas as rotas têm caminho de acesso**  
✅ **Sidebar cobre 100% das funcionalidades principais**  
✅ **Rotas dinâmicas acessíveis via contexto**  
✅ **Proteção de rotas implementada corretamente**  
✅ **Separação clara público/protegido/admin**  

---

## 🚀 Próximas Melhorias Recomendadas

1. ✅ **Breadcrumbs** - Implementar navegação hierárquica
2. ⏳ **Meta tags SEO** - Títulos e descrições por página
3. ⏳ **Analytics tracking** - Rastrear navegação entre páginas
4. ⏳ **Deep linking** - Suporte a links diretos em todas as funcionalidades
