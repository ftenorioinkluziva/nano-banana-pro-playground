# Padrões Visuais da Página /images

Este documento define os padrões visuais extraídos da página `/images` que devem ser seguidos em todas as outras páginas.

## 🎨 Paleta de Cores

### Backgrounds
```css
--background-primary: #000000      /* Preto absoluto */
--background-card: rgba(0,0,0,0.8) /* Cards com transparência */
--background-overlay: rgba(0,0,0,0.9) /* Overlays/modals */
```

### Buttons
```tsx
// Button Primary (Main actions)
className="w-full h-10 md:h-12 text-sm md:base font-semibold bg-white text-black hover:bg-gray-200"

// Button Secondary (Outline)
className="bg-transparent border-gray-600 text-white hover:bg-gray-700"

// Button Icon (Small actions)
className="text-xs h-7 px-2 md:px-3 bg-black/80 backdrop-blur-sm"
```

### Text Colors
```css
--text-primary: white              /* Texto principal */
--text-secondary: #a1a1a1          /* Texto secundário */
--text-muted: #666666              /* Texto menos importante */
```

### Borders
```css
--border-color: #333333            /* Bordas padrão */
--border-hover: #555555            /* Bordas em hover */
```

## 📐 Layout & Spacing

### Container
```tsx
className="min-h-screen bg-black"  /* Full height, fundo preto */
```

### Spacing System
- **gap-2**: 0.5rem (8px) - Entre ícone e texto
- **gap-4**: 1rem (16px) - Entre elementos relacionados
- **gap-6**: 1.5rem (24px) - Entre seções
- **gap-8**: 2rem (32px) - Entre blocos principais

### Padding
- **p-4**: Padding interno de cards/sections
- **px-4**: Padding horizontal de containers
- **py-6 ou py-8**: Padding vertical de sections

### Border Radius
- **rounded-md**: 0.375rem (6px) - Inputs, small buttons
- **rounded-lg**: 0.5rem (8px) - Cards, panels
- **rounded-full**: Círculo completo - Avatars, badges

## 🔤 Tipografia

### Font Weights
```tsx
font-normal      // 400 - Texto regular
font-medium      // 500 - Labels, subtítulos
font-semibold    // 600 - Buttons, títulos
font-bold        // 700 - Headings principais
```

### Font Sizes
```tsx
text-xs          // 0.75rem (12px) - Small labels
text-sm          // 0.875rem (14px) - Body text
text-base        // 1rem (16px) - Regular text
text-lg          // 1.125rem (18px) - Subtítulos
text-xl          // 1.25rem (20px) - Títulos
text-2xl         // 1.5rem (24px) - Main headings
```

## 🎭 Componentes Padrão

### 1. Buttons

#### Primary Button
```tsx
<Button className="w-full h-10 md:h-12 text-sm md:base font-semibold bg-white text-black hover:bg-gray-200">
  Generate
</Button>
```

#### Secondary Button
```tsx
<Button
  variant="outline"
  className="bg-transparent border-gray-600 text-white hover:bg-gray-700"
>
  Cancel
</Button>
```

#### Icon Button
```tsx
<Button
  size="sm"
  className="text-xs h-7 px-2 md:px-3 bg-black/80 backdrop-blur-sm"
>
  <Icon className="w-3 h-3" />
  <span className="hidden sm:inline">Action</span>
</Button>
```

### 2. Input Fields

#### Textarea (Prompt)
```tsx
<textarea
  ref={promptTextareaRef}
  value={prompt}
  onChange={(e) => setPrompt(e.target.value)}
  placeholder="Describe what you want to create..."
  className="w-full min-h-[100px] p-4 bg-black border border-gray-800 rounded-lg text-white resize-none focus:outline-none focus:border-gray-600"
  style={{ height: 'auto' }}
  onInput={(e) => {
    e.currentTarget.style.height = 'auto'
    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'
  }}
/>
```

#### Select Dropdown
```tsx
<Select value={selectedModel} onValueChange={setSelectedModel}>
  <SelectTrigger className="w-full bg-black border-gray-800 text-white">
    <SelectValue />
  </SelectTrigger>
  <SelectContent className="bg-black border-gray-800">
    {options.map(option => (
      <SelectItem key={option.value} value={option.value}>
        <div className="flex flex-col">
          <span className="font-medium">{option.label}</span>
          <span className="text-xs text-gray-500">{option.description}</span>
        </div>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 3. Cards

#### Basic Card
```tsx
<div className="rounded-lg border border-gray-800 bg-black/50 p-4">
  {/* Content */}
</div>
```

#### Interactive Card (hover effect)
```tsx
<div className="rounded-lg border border-gray-800 bg-black/50 p-4 hover:border-gray-600 transition-colors cursor-pointer">
  {/* Content */}
</div>
```

### 4. Loading States

#### Skeleton
```tsx
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-4 w-3/4 bg-gray-800" />
<Skeleton className="h-20 w-full bg-gray-800" />
```

#### Spinner
```tsx
<div className="flex items-center justify-center">
  <Loader2 className="size-8 animate-spin text-white" />
</div>
```

#### Progress Bar
```tsx
<div className="w-full bg-gray-800 rounded-full h-2">
  <div
    className="bg-white h-2 rounded-full transition-all duration-300"
    style={{ width: `${progress}%` }}
  />
</div>
```

### 5. Toast Notifications

```tsx
// Success
toast.success("Image generated successfully!", {
  style: {
    background: '#000',
    color: '#fff',
    border: '1px solid #333',
  },
})

// Error
toast.error("Failed to generate image", {
  style: {
    background: '#000',
    color: '#fff',
    border: '1px solid #ef4444',
  },
})
```

### 6. Image Display

#### Image Container
```tsx
<div className="relative rounded-lg overflow-hidden border border-gray-800 aspect-square">
  <img
    src={imageUrl}
    alt="Generated"
    className="w-full h-full object-cover"
    onLoad={() => setImageLoaded(true)}
  />

  {!imageLoaded && (
    <Skeleton className="absolute inset-0 bg-gray-800" />
  )}
</div>
```

#### Image with Overlay Actions
```tsx
<div className="group relative rounded-lg overflow-hidden border border-gray-800">
  <img src={imageUrl} className="w-full h-full object-cover" />

  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
    <Button size="sm">Download</Button>
    <Button size="sm">Copy</Button>
  </div>
</div>
```

## 🎬 Animações & Transições

### Hover Transitions
```tsx
className="transition-colors duration-200"      // Cor
className="transition-all duration-300"         // Múltiplas props
className="transition-opacity duration-200"     // Opacidade
```

### Loading Animations
```tsx
className="animate-spin"         // Spinner rotation
className="animate-pulse"        // Pulsing effect (skeleton)
className="animate-fade-in"      // Fade in (custom)
```

### Interactive States
```tsx
// Hover
hover:bg-gray-700
hover:border-gray-600
hover:opacity-80

// Active
active:scale-95
active:opacity-90

// Disabled
disabled:opacity-50
disabled:cursor-not-allowed
```

## 📱 Responsividade

### Breakpoints
```tsx
// Mobile first approach
className="text-sm md:text-base"      // Responsive text
className="h-10 md:h-12"              // Responsive height
className="gap-2 md:gap-4"            // Responsive spacing
className="hidden md:block"           // Show on desktop
className="block md:hidden"           // Show on mobile
```

### Grid System
```tsx
// 2 columns on mobile, 4 on desktop
className="grid grid-cols-2 md:grid-cols-4 gap-4"

// 1 column on mobile, 3 on desktop
className="grid grid-cols-1 md:grid-cols-3 gap-6"
```

## 🎯 Padrões de Interação

### 1. Keyboard Shortcuts
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + Enter to generate
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleGenerate()
    }

    // Escape to close
    if (e.key === 'Escape') {
      closeDialog()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### 2. Drag & Drop
```tsx
<div
  onDragOver={(e) => {
    e.preventDefault()
    setIsDragging(true)
  }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={(e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }}
  className={cn(
    "border-2 border-dashed rounded-lg p-6",
    isDragging ? "border-white bg-white/5" : "border-gray-800"
  )}
>
  Drop files here
</div>
```

### 3. Toast Feedback
Sempre mostrar feedback visual para ações do usuário:
- ✅ Success: "Image generated successfully"
- ❌ Error: "Failed to generate: [reason]"
- ⚠️ Warning: "Large file detected, converting..."
- ℹ️ Info: "Image copied to clipboard"

## 📋 Checklist de Implementação

Ao criar/atualizar uma página, seguir:

### Visual
- [ ] Background preto (#000000)
- [ ] Buttons brancos com texto preto (primary)
- [ ] Buttons outline cinza (secondary)
- [ ] Border color #333333
- [ ] Text branco/cinza conforme hierarquia
- [ ] Rounded-lg para cards
- [ ] Gap-4 entre elementos relacionados

### Componentes
- [ ] Usar shadcn/ui components
- [ ] Skeleton loading states
- [ ] Toast notifications (sonner)
- [ ] Progress bars para operações longas
- [ ] Icons from lucide-react

### Interatividade
- [ ] Hover effects em elementos clicáveis
- [ ] Disabled states visualmente claros
- [ ] Keyboard shortcuts documentados
- [ ] Feedback visual para todas ações

### Responsividade
- [ ] Mobile first approach
- [ ] Text sizes responsivos (sm/md)
- [ ] Button heights responsivos (h-10/h-12)
- [ ] Hidden/visible em breakpoints corretos

### Acessibilidade
- [ ] ARIA labels em buttons icon
- [ ] Focus states visíveis
- [ ] Keyboard navigation funcional
- [ ] Alt text em imagens

## 🔄 Diferenças por Página

Enquanto os padrões visuais são os mesmos, cada página pode ter:

### /images
- ✅ Resizable split view
- ✅ Global drag & drop
- ✅ Fullscreen viewer
- ✅ Dithering shader

### /videos (aplicar padrões)
- Keep: State machine workflow
- Add: Mesmos buttons, spacing, colors
- Add: Toast notifications
- Add: Skeleton loading

### /products (aplicar padrões)
- Keep: CRUD workflow
- Add: Mesmos buttons, spacing, colors
- Add: Skeleton para lista
- Add: Toast notifications

### /ugc (aplicar padrões)
- Keep: SSE real-time
- Add: Mesmos buttons, spacing, colors
- Add: Skeleton para cards
- Add: Toast notifications
