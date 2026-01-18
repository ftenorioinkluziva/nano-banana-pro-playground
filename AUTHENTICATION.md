# Sistema de Autenticação e Controle de Acesso

Este documento descreve o sistema de autenticação implementado usando **Better Auth** e os padrões de segurança aplicados na aplicação.

## Visão Geral

O sistema utiliza:
- **Better Auth** como framework de autenticação
- **Drizzle ORM** para gerenciamento de schema do banco
- **PostgreSQL (Neon)** como banco de dados
- **Cookie-based sessions** para gerenciamento de sessões
- **Multi-tenancy** com isolamento de dados por usuário

## Tecnologias Utilizadas

- [Better Auth](https://www.better-auth.com/docs/introduction) - Framework de autenticação TypeScript
- Drizzle ORM - Adaptador de banco de dados
- Next.js 16 App Router - Com proxy pattern para proteção de rotas
- Neon PostgreSQL - Banco de dados serverless

## Estrutura de Arquivos

```
lib/
├── auth.ts           # Configuração do Better Auth (server-side)
├── auth-client.ts    # Cliente Better Auth (client-side)
├── auth-session.ts   # Helpers para verificação de sessão
└── db.ts            # Cliente Neon PostgreSQL

db/
├── schema.ts        # Schema Drizzle com tabelas de autenticação
└── migrations/
    ├── 010_create_auth_tables.sql     # Tabelas de autenticação
    └── 011_add_user_id_to_tables.sql  # Foreign keys para multi-tenancy

app/
├── login/page.tsx   # Página de login
├── signup/page.tsx  # Página de cadastro
└── api/
    └── auth/[...all]/route.ts  # Endpoints Better Auth

proxy.ts             # Proteção de rotas (Next.js 16)
components/
└── navigation-bar.tsx  # UI com dropdown de autenticação
```

## Schema do Banco de Dados

### Tabelas de Autenticação

#### `user`
```sql
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  emailVerified BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  role user_role NOT NULL DEFAULT 'creator',  -- admin | creator | viewer
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `session`
```sql
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  expiresAt TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `account`
```sql
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  password TEXT,  -- Hashed password para email/password auth
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Multi-tenancy

Todas as tabelas de dados do usuário têm uma coluna `user_id`:

```sql
-- Exemplo: tabela products
ALTER TABLE products
ADD COLUMN user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE;

-- Exemplo: tabela generations
ALTER TABLE generations
ADD COLUMN user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE;
```

## Implementação

### 1. Configuração do Better Auth

**lib/auth.ts** (server-side):
```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { neon } from "@neondatabase/serverless"
import * as schema from "@/db/schema"

export const auth = betterAuth({
  database: drizzleAdapter(neon(process.env.DATABASE_URL!), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
})
```

**lib/auth-client.ts** (client-side):
```typescript
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
})

export const { useSession, signIn, signOut, signUp } = authClient
```

### 2. Helpers de Sessão

**lib/auth-session.ts**:
```typescript
import { auth } from "./auth"
import { cookies } from "next/headers"

export async function getSession() {
  const sessionToken = (await cookies()).get("better-auth.session_token")
  if (!sessionToken) return null
  return auth.api.getSession({ headers: await headers() })
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")
  return session
}

export async function requireRole(allowedRoles: User["role"][]) {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.user.role as User["role"])) {
    throw new Error("Forbidden: Insufficient permissions")
  }
  return session
}
```

### 3. Proteção de Rotas

**proxy.ts** (Next.js 16):
```typescript
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/", "/api/auth", "/api/check-api-key"]
const AUTH_ROUTES = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get("better-auth.session_token")

  // Redireciona para login se não autenticado
  if (!sessionToken && !isPublicRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redireciona para home se já autenticado
  if (sessionToken && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}
```

### 4. Padrão de API Routes

Todas as rotas de API protegidas seguem este padrão:

```typescript
import { requireAuth } from "@/lib/auth-session"
import { getNeonClient } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const session = await requireAuth()
    const userId = session.user.id

    // 2. Consultar apenas dados do usuário
    const sql = getNeonClient()
    const results = await sql`
      SELECT * FROM table_name
      WHERE user_id = ${userId}
    `

    return NextResponse.json({ data: results })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Handle other errors...
  }
}
```

## Rotas Migradas

### ✅ Rotas com Autenticação e Multi-tenancy

- **Products**
  - `GET /api/products` - Lista produtos do usuário
  - `POST /api/products` - Cria produto com user_id
  - `GET /api/products/[id]` - Verifica ownership
  - `PUT /api/products/[id]` - Verifica ownership antes de atualizar
  - `DELETE /api/products/[id]` - Verifica ownership antes de deletar

- **Generations**
  - `GET /api/get-generations` - Lista gerações do usuário
  - `POST /api/save-generation` - Salva geração com user_id
  - `DELETE /api/delete-generation` - Verifica ownership antes de deletar

- **Videos**
  - `GET /api/videos` - Lista vídeos do usuário
  - `POST /api/save-video` - Salva vídeo com user_id
  - `DELETE /api/delete-video` - Verifica ownership antes de deletar

- **Brands**
  - `GET /api/brands` - Lista marcas do usuário
  - `POST /api/brands` - Cria marca com user_id

- **Scripts**
  - `GET /api/scripts` - Lista roteiros do usuário (com filtro por product_id)

### ⚠️ Rotas Públicas (sem autenticação)

- `GET /` - Página inicial
- `POST /api/auth/*` - Endpoints de autenticação
- `GET /api/check-api-key` - Validação de API key

## Níveis de Permissão (Roles)

O sistema suporta 3 níveis de acesso:

```typescript
type UserRole = "admin" | "creator" | "viewer"
```

- **admin**: Acesso total (futuro: gerenciar usuários, ver todos os dados)
- **creator** (padrão): Pode criar e gerenciar seus próprios recursos
- **viewer**: Apenas visualização (implementação futura)

### Verificação de Roles

```typescript
import { requireRole } from "@/lib/auth-session"

// Exemplo: apenas admins podem acessar
export async function GET(request: NextRequest) {
  const session = await requireRole(["admin"])
  // ...
}
```

## UI de Autenticação

### NavigationBar

O componente `NavigationBar` mostra:
- **Não autenticado**: Botão "Entrar"
- **Autenticado**: Avatar + dropdown com nome do usuário e "Sair"

### Páginas de Auth

- `/login` - Login com email/password
- `/signup` - Cadastro com nome, email, password

Após login/signup bem-sucedido, redireciona para `/` (home).

## Segurança

### 1. Proteção de Rotas
- Middleware verifica sessão em todas as rotas não-públicas
- Redireciona para `/login` se não autenticado

### 2. Multi-tenancy
- Todas as queries filtram por `user_id`
- Usuários só veem seus próprios dados
- DELETE/UPDATE verificam ownership antes de executar

### 3. Validação de Ownership
```typescript
// Exemplo: Deletar produto
const result = await sql`
  DELETE FROM products
  WHERE id = ${productId}
  AND user_id = ${userId}  -- ← Verifica ownership
  RETURNING id
`

if (result.length === 0) {
  return NextResponse.json(
    { error: "Product not found or you don't have permission" },
    { status: 404 }
  )
}
```

### 4. Sessões Seguras
- Cookies HTTP-only
- Sessões com expiração automática
- Token único por sessão

## Variáveis de Ambiente

Adicione ao `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here

# Client-side
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

## Scripts de Migração

Execute as migrations na ordem:

```bash
# 1. Criar tabelas de autenticação
node scripts/run-migration.js

# 2. Adicionar user_id às tabelas existentes
node scripts/add-user-id-columns.js

# 3. (Se necessário) Verificar estrutura
node scripts/check-auth-tables.js
```

## Próximos Passos

Rotas que ainda podem ser migradas (opcionais):

- `POST /api/generate-image` - Associar gerações com user_id
- `POST /api/generate-video` - Associar vídeos com user_id
- `POST /api/enhance-prompt` - Logs por usuário
- `GET /api/capabilities` - Admin only

## Troubleshooting

### Erro: "Unauthorized" em rotas protegidas
- Verifique se está logado (`/login`)
- Verifique cookie `better-auth.session_token` no navegador

### Erro: "column user_id does not exist"
- Execute a migration: `node scripts/add-user-id-columns.js`

### Erro: "The field 'token' does not exist"
- Execute: `node scripts/add-token-field.js`

### Usuário não consegue fazer signup
- Verifique se o email já existe
- Execute: `node scripts/clean-orphan-user.js` se necessário

## Recursos

- [Better Auth Docs](https://www.better-auth.com/docs/introduction)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Next.js 16 Authentication](https://nextjs.org/docs/app/building-your-application/routing/middleware)
