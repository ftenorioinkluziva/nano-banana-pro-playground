# Guia de Migração para o Design System Unificado

## Objetivo

Migrar todas as páginas para usar os componentes unificados do design system, garantindo consistência visual sem alterar os workflows existentes.

## Componentes Criados

```
components/shared/
├── loading-state.tsx    # 9 componentes de loading
├── error-state.tsx      # 9 componentes de erro
├── empty-state.tsx      # 8 componentes de estados vazios
├── app-error-boundary.tsx # Error boundary melhorado
└── index.ts             # Export centralizado
```

## Migração por Página

### 1. /images - Image Generator

#### Antes
```tsx
// Loading inline
{generating && <Loader2 className="animate-spin" />}

// Loading full
{generating && (
  <div className="flex items-center justify-center">
    <Loader2 className="animate-spin size-8" />
    <p>Generating...</p>
  </div>
)}

// Error
{error && (
  <div className="text-red-500">
    <AlertCircle />
    {error}
  </div>
)}

// Empty history
{generations.length === 0 && (
  <div>No generations yet</div>
)}
```

#### Depois
```tsx
import {
  InlineSpinner,
  CenteredSpinner,
  AlertError,
  NoHistoryEmptyState,
  AppErrorBoundary
} from "@/components/shared"

// Loading inline
{generating && <InlineSpinner />}

// Loading full
{generating && (
  <CenteredSpinner message="Generating images..." />
)}

// Error
{error && (
  <AlertError
    message={error}
    onDismiss={() => setError(null)}
  />
)}

// Empty history
{generations.length === 0 && (
  <NoHistoryEmptyState
    type="images"
    onGenerate={() => promptTextareaRef.current?.focus()}
  />
)}

// Wrap page
export default function ImagesPage() {
  return (
    <AppErrorBoundary>
      <ImageCombiner />
    </AppErrorBoundary>
  )
}
```

### 2. /videos - Video Generator

#### Antes
```tsx
// Loading state
{appState === AppStateEnum.LOADING && (
  <div className="flex flex-col items-center gap-4">
    <Loader2 className="animate-spin size-12" />
    <p>Generating video... {progress}%</p>
  </div>
)}

// Error state
{appState === AppStateEnum.ERROR && (
  <div className="text-center">
    <AlertCircle className="size-12 text-red-500" />
    <h3>Failed to generate video</h3>
    <p>{error}</p>
    <button onClick={handleRetry}>Try Again</button>
  </div>
)}
```

#### Depois
```tsx
import {
  ProgressSpinner,
  CenteredError,
  AppErrorBoundary
} from "@/components/shared"

// Loading state
{appState === AppStateEnum.LOADING && (
  <ProgressSpinner
    progress={progress}
    message="Generating video... This may take several minutes."
  />
)}

// Error state
{appState === AppStateEnum.ERROR && (
  <CenteredError
    title="Failed to generate video"
    message={error || "An unexpected error occurred"}
    onRetry={handleRetry}
    onGoBack={handleNewVideo}
  />
)}

// Wrap page
export default function VideosPage() {
  return (
    <AppErrorBoundary>
      <div>...</div>
    </AppErrorBoundary>
  )
}
```

### 3. /products - Product Management

#### Antes
```tsx
// Loading list
{loading && (
  <div>Loading products...</div>
)}

// Empty list
{products.length === 0 && (
  <div>No products found</div>
)}

// Error
{error && (
  <div className="text-red-500">{error}</div>
)}
```

#### Depois
```tsx
import {
  CardSkeleton,
  NoProductsEmptyState,
  ApiError,
  NoSearchResultsEmptyState,
  AppErrorBoundary
} from "@/components/shared"

// Loading list
{loading && <CardSkeleton count={6} />}

// Empty list (no search)
{!loading && products.length === 0 && !searchQuery && (
  <NoProductsEmptyState
    onAddProduct={() => {
      setEditingProduct({})
      window.scrollTo({ top: 0, behavior: "smooth" })
    }}
  />
)}

// Empty search results
{!loading && products.length === 0 && searchQuery && (
  <NoSearchResultsEmptyState
    query={searchQuery}
    onClearSearch={() => setSearchQuery("")}
  />
)}

// Error
{error && (
  <ApiError
    message={error}
    onRetry={fetchProducts}
  />
)}

// Wrap page
export default function ProductsPage() {
  return (
    <AppErrorBoundary>
      <div>...</div>
    </AppErrorBoundary>
  )
}
```

### 4. /ugc - UGC Generator

#### Antes
```tsx
// Loading product list
{loading && <p>Loading products...</p>}

// No products
{products.length === 0 && <p>No products</p>}

// Pending video
{video.status === "pending" && (
  <Loader2 className="animate-spin" />
)}

// Failed video
{video.status === "failed" && (
  <div>Generation failed</div>
)}
```

#### Depois
```tsx
import {
  ListSkeleton,
  NoProductsEmptyState,
  InlineSpinner,
  CardError,
  NoHistoryEmptyState,
  AppErrorBoundary
} from "@/components/shared"

// Loading product list
{loading && <ListSkeleton rows={5} />}

// No products
{!loading && products.length === 0 && (
  <NoProductsEmptyState
    onAddProduct={() => router.push("/products")}
  />
)}

// Pending video
{video.status === "pending" && (
  <InlineSpinner size="md" />
)}

// Failed video
{video.status === "failed" && (
  <CardError
    message={video.error_message || "Failed to generate video"}
    onRetry={() => retryGeneration(video.id)}
  />
)}

// Empty history (all tabs)
{videos.length === 0 && (
  <NoHistoryEmptyState
    type="videos"
    onGenerate={() => setShowDialog(true)}
  />
)}

// Wrap page
export default function UGCPage() {
  return (
    <AppErrorBoundary>
      <div>...</div>
    </AppErrorBoundary>
  )
}
```

## Padrões Comuns

### 1. Loading → Content → Empty → Error

```tsx
function MyComponent() {
  const { data, loading, error } = useData()

  if (loading) {
    return <CenteredSpinner message="Loading..." />
  }

  if (error) {
    return <ApiError message={error} onRetry={refetch} />
  }

  if (!data || data.length === 0) {
    return <NoDataEmptyState onRefresh={refetch} />
  }

  return <ContentDisplay data={data} />
}
```

### 2. Inline Loading + Error

```tsx
<Button disabled={loading}>
  {loading && <InlineSpinner size="sm" className="mr-2" />}
  Submit
</Button>

{fieldError && <InlineError message={fieldError} />}
```

### 3. Progress com Estados

```tsx
{uploading && (
  <ProgressSpinner
    progress={progress}
    message={`Uploading ${currentFile} of ${totalFiles}...`}
  />
)}
```

### 4. Error Boundary por Seção

```tsx
<AppErrorBoundary
  fallback={
    <CenteredError
      title="Section Failed"
      message="This section failed to load"
      onRetry={() => window.location.reload()}
    />
  }
>
  <ComplexComponent />
</AppErrorBoundary>
```

## Checklist de Migração

Para cada página, verificar:

- [ ] **Loading States**
  - [ ] Substituir spinners customizados por `InlineSpinner` ou `CenteredSpinner`
  - [ ] Usar `ProgressSpinner` para operações com progresso
  - [ ] Usar skeletons apropriados (`CardSkeleton`, `ListSkeleton`, etc)
  - [ ] Adicionar mensagens descritivas em loaders

- [ ] **Error States**
  - [ ] Substituir mensagens de erro por componentes apropriados
  - [ ] Adicionar `onRetry` onde faz sentido
  - [ ] Usar `ApiError` para erros de API
  - [ ] Usar `QuotaError` para erros de quota
  - [ ] Adicionar detalhes técnicos apenas em dev mode

- [ ] **Empty States**
  - [ ] Adicionar empty states onde há listas/grids vazios
  - [ ] Incluir call-to-action (botão para criar/adicionar)
  - [ ] Diferenciar "vazio" de "sem resultados de busca"

- [ ] **Error Boundaries**
  - [ ] Adicionar `AppErrorBoundary` no root da página
  - [ ] Considerar boundaries para seções críticas

- [ ] **Consistência**
  - [ ] Usar mesmas cores/tamanhos em toda página
  - [ ] Manter espaçamento consistente (gap-4, gap-6, etc)
  - [ ] Usar mesmos ícones (Lucide React)

## Testes Após Migração

1. **Loading States**
   - [ ] Spinner aparece ao carregar
   - [ ] Progress é atualizado corretamente
   - [ ] Skeleton aparece antes do conteúdo

2. **Error States**
   - [ ] Erro aparece quando API falha
   - [ ] Botão "Retry" funciona
   - [ ] Erro desaparece após sucesso
   - [ ] Detalhes técnicos aparecem só em dev

3. **Empty States**
   - [ ] Aparece quando lista está vazia
   - [ ] Call-to-action funciona
   - [ ] Mensagem é clara e útil

4. **Error Boundaries**
   - [ ] Captura erros não tratados
   - [ ] Mostra UI de fallback
   - [ ] Permite retry/reload
   - [ ] Não quebra aplicação inteira

## Exemplo Completo

```tsx
"use client"

import { useState } from "react"
import {
  AppErrorBoundary,
  CenteredSpinner,
  ApiError,
  NoProductsEmptyState,
  CardSkeleton,
  InlineSpinner,
  InlineError,
  AlertError,
} from "@/components/shared"

export default function ExamplePage() {
  return (
    <AppErrorBoundary>
      <ExampleContent />
    </AppErrorBoundary>
  )
}

function ExampleContent() {
  const { data, loading, error, refetch } = useData()
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Page-level error
  if (error) {
    return (
      <ApiError
        message={error}
        onRetry={refetch}
      />
    )
  }

  // Page-level loading
  if (loading) {
    return <CenteredSpinner message="Loading products..." />
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <NoProductsEmptyState
        onAddProduct={() => openForm()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Banner error */}
      {formError && (
        <AlertError
          message={formError}
          onDismiss={() => setFormError(null)}
        />
      )}

      {/* Inline loading */}
      <button disabled={submitting}>
        {submitting && <InlineSpinner size="sm" className="mr-2" />}
        Submit
      </button>

      {/* Inline error */}
      {fieldError && <InlineError message={fieldError} />}

      {/* Content */}
      <ProductList products={data} />
    </div>
  )
}
```

## Próximos Passos

1. Migrar `/images` primeiro (mais complexa)
2. Migrar `/videos` (tem states bem definidos)
3. Migrar `/products` (mais simples)
4. Migrar `/ugc` (real-time)
5. Testar tudo em conjunto
6. Documentar casos edge encontrados
