# Creato Design System

## Overview

Este é o Design System unificado do Creato, criado para manter consistência visual e de UX em todas as páginas do aplicativo.

## 🎨 Filosofia de Design

### Princípios
1. **Consistência**: Mesmos padrões visuais em toda aplicação
2. **Clareza**: Feedback visual claro para cada estado
3. **Performance**: Componentes otimizados e leves
4. **Acessibilidade**: Suporte a screen readers e navegação por teclado

### Tema
- **Background**: Preto (`#000000`)
- **Foreground**: Branco/Cinza claro
- **Accent**: Baseado em variáveis CSS do shadcn/ui
- **Dark Mode**: Sempre ativo

## 📦 Component Library

### 1. Loading States (`components/shared/loading-state.tsx`)

Componentes para indicar carregamento de conteúdo.

#### InlineSpinner
Spinner pequeno para uso inline (botões, textos).

```tsx
import { InlineSpinner } from "@/components/shared"

<InlineSpinner size="sm" />
<InlineSpinner size="md" /> // default
<InlineSpinner size="lg" />
```

**Quando usar:**
- Dentro de botões durante submit
- Ao lado de texto que está carregando
- Em espaços pequenos

#### CenteredSpinner
Spinner centralizado para seções completas.

```tsx
import { CenteredSpinner } from "@/components/shared"

<CenteredSpinner size="lg" message="Loading..." />
```

**Quando usar:**
- Carregamento de página inteira
- Carregamento de seção/card
- Durante fetch de dados

#### ProgressSpinner
Spinner com porcentagem de progresso.

```tsx
import { ProgressSpinner } from "@/components/shared"

<ProgressSpinner
  progress={75}
  message="Generating video..."
  size="md"
/>
```

**Quando usar:**
- Upload de arquivos
- Geração de vídeos/imagens
- Processamento com progresso conhecido

#### CardSkeleton
Skeleton para preview de cards enquanto carrega.

```tsx
import { CardSkeleton } from "@/components/shared"

<CardSkeleton count={3} />
```

**Quando usar:**
- Lista de produtos carregando
- Grid de imagens carregando
- Qualquer lista de cards

#### ImageSkeleton
Skeleton específico para imagens.

```tsx
import { ImageSkeleton } from "@/components/shared"

<ImageSkeleton aspectRatio="square" />
<ImageSkeleton aspectRatio="video" />
<ImageSkeleton aspectRatio="portrait" />
```

**Quando usar:**
- Placeholder de imagens
- Thumbnails carregando
- Galleries

#### ListSkeleton
Skeleton para listas.

```tsx
import { ListSkeleton } from "@/components/shared"

<ListSkeleton rows={5} showAvatar />
```

**Quando usar:**
- Listas de itens
- Comentários/feeds
- Histórico

#### TableSkeleton
Skeleton para tabelas.

```tsx
import { TableSkeleton } from "@/components/shared"

<TableSkeleton rows={10} columns={4} />
```

**Quando usar:**
- Tabelas de dados
- Grids complexos

#### FullPageLoader
Loader que cobre a página inteira.

```tsx
import { FullPageLoader } from "@/components/shared"

<FullPageLoader message="Loading..." showLogo />
```

**Quando usar:**
- Transição entre páginas
- Carregamento inicial da aplicação

#### OverlayLoader
Loader sobreposto em elemento específico.

```tsx
import { OverlayLoader } from "@/components/shared"

<div className="relative">
  {/* Content */}
  {loading && <OverlayLoader progress={50} />}
</div>
```

**Quando usar:**
- Carregamento em modal/dialog
- Overlay em formulários

---

### 2. Error States (`components/shared/error-state.tsx`)

Componentes para exibir erros de forma consistente.

#### InlineError
Erro pequeno inline (campos de formulário).

```tsx
import { InlineError } from "@/components/shared"

<InlineError message="Email is required" />
```

**Quando usar:**
- Validação de formulários
- Erros de campo específico

#### AlertError
Banner de erro com opção de dismiss.

```tsx
import { AlertError } from "@/components/shared"

<AlertError
  title="Upload Failed"
  message="File size exceeds 10MB limit"
  onDismiss={() => setError(null)}
/>
```

**Quando usar:**
- Erros no topo da página
- Alertas importantes
- Erros que precisam atenção

#### CenteredError
Erro centralizado para página/seção inteira.

```tsx
import { CenteredError } from "@/components/shared"

<CenteredError
  title="Failed to load videos"
  message="Unable to fetch videos from the server"
  details={errorDetails} // opcional, só em dev
  onRetry={() => refetch()}
  onGoBack={() => router.back()}
  onGoHome={() => router.push("/")}
/>
```

**Quando usar:**
- Erro ao carregar página
- Erro ao carregar seção principal
- Fallback de erro grave

#### CardError
Erro dentro de um card.

```tsx
import { CardError } from "@/components/shared"

<CardError
  message="Failed to load product"
  onRetry={() => refetchProduct()}
/>
```

**Quando usar:**
- Erro ao carregar card individual
- Erro em componente específico

#### ValidationError
Lista de erros de validação.

```tsx
import { ValidationError } from "@/components/shared"

<ValidationError errors={[
  "Name is required",
  "Email must be valid",
  "Password must be at least 8 characters"
]} />
```

**Quando usar:**
- Validação de formulário com múltiplos erros
- Submit de formulário

#### ApiError
Erro específico de API com status code.

```tsx
import { ApiError } from "@/components/shared"

<ApiError
  status={429}
  message="Too many requests. Please try again later."
  endpoint="/api/generate-video"
  onRetry={() => retryRequest()}
/>
```

**Quando usar:**
- Erros de API
- Problemas de request/response
- Debugging de problemas de rede

#### QuotaError
Erro específico de quota excedida.

```tsx
import { QuotaError } from "@/components/shared"

<QuotaError
  provider="Google Veo"
  message="You've exceeded your quota for today."
  fallbackMessage="You can use KIE.AI as fallback"
  onUseFallback={() => switchToKieAI()}
/>
```

**Quando usar:**
- Quota de API excedida
- Rate limiting
- Quando há fallback disponível

#### NetworkError
Erro de conectividade.

```tsx
import { NetworkError } from "@/components/shared"

<NetworkError onRetry={() => refetch()} />
```

**Quando usar:**
- Problemas de conexão
- Offline
- Timeout de rede

#### NotFoundError
Erro 404 estilizado.

```tsx
import { NotFoundError } from "@/components/shared"

<NotFoundError
  title="Video Not Found"
  message="This video doesn't exist or has been deleted."
  onGoHome={() => router.push("/")}
/>
```

**Quando usar:**
- Páginas 404
- Recursos não encontrados
- Items deletados

---

### 3. Empty States (`components/shared/empty-state.tsx`)

Componentes para quando não há conteúdo.

#### GenericEmptyState
Estado vazio customizável.

```tsx
import { GenericEmptyState } from "@/components/shared"
import { Inbox } from "lucide-react"

<GenericEmptyState
  icon={<Inbox />}
  title="No items"
  description="You don't have any items yet."
  action={{
    label: "Add Item",
    onClick: () => openAddDialog(),
    icon: <Plus className="size-4 mr-2" />
  }}
  secondaryAction={{
    label: "Learn More",
    onClick: () => openDocs()
  }}
/>
```

**Quando usar:**
- Estados vazios personalizados
- Quando outros empty states não servem

#### NoImagesEmptyState
Sem imagens.

```tsx
import { NoImagesEmptyState } from "@/components/shared"

<NoImagesEmptyState
  onGenerate={() => openGenerator()}
  onUpload={() => openUploader()}
/>
```

#### NoVideosEmptyState
Sem vídeos.

```tsx
import { NoVideosEmptyState } from "@/components/shared"

<NoVideosEmptyState onGenerate={() => openVideoGen()} />
```

#### NoProductsEmptyState
Sem produtos.

```tsx
import { NoProductsEmptyState } from "@/components/shared"

<NoProductsEmptyState onAddProduct={() => openProductForm()} />
```

#### NoSearchResultsEmptyState
Nenhum resultado de busca.

```tsx
import { NoSearchResultsEmptyState } from "@/components/shared"

<NoSearchResultsEmptyState
  query={searchQuery}
  onClearSearch={() => setQuery("")}
/>
```

#### NoHistoryEmptyState
Sem histórico.

```tsx
import { NoHistoryEmptyState } from "@/components/shared"

<NoHistoryEmptyState
  type="images"
  onGenerate={() => startGenerating()}
/>
```

#### UploadEmptyState
Estado de upload vazio.

```tsx
import { UploadEmptyState } from "@/components/shared"

<UploadEmptyState
  accept="images"
  onUpload={() => openFileDialog()}
/>
```

#### NoDataEmptyState
Sem dados genérico.

```tsx
import { NoDataEmptyState } from "@/components/shared"

<NoDataEmptyState
  title="No data"
  description="No data available"
  onRefresh={() => refetch()}
/>
```

---

### 4. Error Boundaries (`components/shared/app-error-boundary.tsx`)

Componente para capturar erros não tratados.

#### AppErrorBoundary
Error boundary com UI melhorada.

```tsx
import { AppErrorBoundary } from "@/components/shared"

// Wrapping entire page
<AppErrorBoundary>
  <YourPage />
</AppErrorBoundary>

// With custom fallback
<AppErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</AppErrorBoundary>

// With error callback
<AppErrorBoundary
  onError={(error, errorInfo) => {
    // Log to service
    logError(error, errorInfo)
  }}
>
  <YourComponent />
</AppErrorBoundary>

// With reset keys (resets when keys change)
<AppErrorBoundary resetKeys={[userId, routeId]}>
  <YourComponent />
</AppErrorBoundary>
```

#### withErrorBoundary (HOC)
Higher-Order Component para adicionar error boundary.

```tsx
import { withErrorBoundary } from "@/components/shared"

const SafeComponent = withErrorBoundary(YourComponent)

// With custom fallback
const SafeComponent = withErrorBoundary(
  YourComponent,
  <CustomErrorFallback />
)
```

---

## 🎯 Guia de Uso por Cenário

### Carregamento de Página Inteira
```tsx
{isLoading && <FullPageLoader message="Loading page..." showLogo />}
```

### Carregamento de Seção
```tsx
{isLoading ? (
  <CenteredSpinner message="Loading products..." />
) : (
  <ProductList products={data} />
)}
```

### Carregamento de Lista
```tsx
{isLoading ? (
  <CardSkeleton count={6} />
) : data.length === 0 ? (
  <NoProductsEmptyState onAddProduct={openForm} />
) : (
  <ProductGrid products={data} />
)}
```

### Erro de API
```tsx
{error && (
  <ApiError
    status={error.status}
    message={error.message}
    endpoint="/api/products"
    onRetry={refetch}
  />
)}
```

### Formulário com Validação
```tsx
{validationErrors.length > 0 && (
  <ValidationError errors={validationErrors} />
)}

<input />
{fieldError && <InlineError message={fieldError} />}
```

### Upload com Progress
```tsx
{uploading ? (
  <ProgressSpinner
    progress={uploadProgress}
    message="Uploading images..."
  />
) : (
  <UploadEmptyState onUpload={openFileDialog} />
)}
```

---

## 📏 Padrões Visuais

### Espaçamento
- **gap-2**: Entre elementos pequenos (ícone + texto)
- **gap-4**: Entre elementos médios (cards em row)
- **gap-6**: Entre seções
- **gap-8**: Entre blocos grandes

### Bordas
- **rounded-md**: Padrão para inputs, buttons
- **rounded-lg**: Cards, dialogs
- **rounded-full**: Avatars, badges

### Sombras
- Usar `shadow-sm` para elevação leve
- Usar `shadow-md` para cards
- Usar `shadow-lg` para modals

### Cores
```css
/* Background */
--background: 0 0% 0%;           /* Preto */
--foreground: 0 0% 98%;          /* Quase branco */

/* Muted */
--muted: 0 0% 15%;               /* Cinza escuro */
--muted-foreground: 0 0% 64%;    /* Cinza médio */

/* Destructive */
--destructive: 0 84% 60%;        /* Vermelho */
--destructive-foreground: 0 0% 98%;

/* Border */
--border: 0 0% 20%;              /* Cinza para bordas */
```

---

## 🔧 Integração com Páginas Existentes

### /images
```tsx
// Loading
{generating && <ProgressSpinner progress={progress} message="Generating images..." />}

// Error
{error && <AlertError message={error} onDismiss={() => setError(null)} />}

// Empty
{generations.length === 0 && (
  <NoHistoryEmptyState type="images" onGenerate={handleGenerate} />
)}
```

### /videos
```tsx
// States
{appState === "LOADING" && (
  <CenteredSpinner message="Generating video..." />
)}

{appState === "ERROR" && (
  <CenteredError
    message={error}
    onRetry={handleRetry}
    onGoBack={handleNewVideo}
  />
)}
```

### /products
```tsx
// Loading
{loading ? (
  <CardSkeleton count={6} />
) : (
  <ProductList />
)}

// Empty
{products.length === 0 && (
  <NoProductsEmptyState onAddProduct={() => setEditingProduct({})} />
)}

// Error
{error && <ApiError message={error} onRetry={fetchProducts} />}
```

### /ugc
```tsx
// Loading per video
{video.status === "pending" && (
  <InlineSpinner size="md" />
)}

// Empty
{videos.length === 0 && (
  <NoVideosEmptyState onGenerate={() => setShowDialog(true)} />
)}

// Error in card
{video.status === "error" && (
  <CardError message={video.error} onRetry={() => retryGeneration(video.id)} />
)}
```

---

## ✅ Checklist de Implementação

- [ ] Substituir spinners customizados por `InlineSpinner` ou `CenteredSpinner`
- [ ] Substituir mensagens de erro por componentes `Error*`
- [ ] Adicionar skeletons em vez de spinners para carregamento de listas
- [ ] Usar `AppErrorBoundary` em cada página
- [ ] Implementar empty states onde há listas vazias
- [ ] Padronizar mensagens de erro (usar componentes, não strings)
- [ ] Adicionar `onRetry` em todos os error states
- [ ] Usar `ProgressSpinner` para operações com progresso conhecido

---

## 🚀 Próximos Passos

1. Criar storybook com todos componentes
2. Adicionar testes unitários
3. Documentar exemplos de uso em vídeo
4. Criar guia de migração para cada página
5. Adicionar analytics para tracking de erros

---

## 📖 Referências

- shadcn/ui: https://ui.shadcn.com
- Radix UI: https://radix-ui.com
- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev
