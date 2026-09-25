# BixFind Design System

## Brand Colors

| Token       | Hex       | Usage                          |
|------------|-----------|--------------------------------|
| Primary    | `#001A4D` | Headers, nav, primary buttons  |
| Secondary  | `#FF1E75` | CTAs, highlights, badges       |
| Accent     | `#00D84F` | Success states, positive CTAs   |
| Cyan       | `#00D9FF` | Info banners, links, gradients  |

### Gradients
- **Text**: `linear-gradient(135deg, #FF1E75, #00D9FF, #00D84F)` — applied via `.gradient-text` class
- **Hero**: `from-[#001A4D] via-[#001A4D] to-[#FF1E75]/20`

## Typography

- **Font Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif`
- **Body**: `text-gray-700` on `bg-gray-50`
- **Headings**: Primary color (`#001A4D`), semibold
- **Antialiasing**: `-webkit-font-smoothing: antialiased`

## Spacing

- Base unit: `4px` increments (Tailwind defaults)
- Section padding: `py-16` (desktop), `py-10` (mobile)
- Card padding: `p-6`

## Components

### Buttons
- `.btn-primary`: `bg-[#001A4D] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-all`
- `.btn-secondary`: `bg-[#FF1E75] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-all`

### Cards
- Background: `white`
- Border: `border border-gray-200/50` or `shadow-lg`
- Border radius: `rounded-xl` or `rounded-2xl`
- Hover: `hover:shadow-xl transition-shadow duration-300`

### Search Input
- Background: `bg-white/10` (hero) or `bg-white` (page)
- Border: `border border-white/20` or `border-gray-300`
- Focus ring: `ring-2 ring-secondary/50`

### Navigation
- Desktop: horizontal links, transparent bg, white text on hero
- Mobile: hamburger with animated dropdown, full-width links
- Active: `text-secondary`

## Responsive Breakpoints

| Breakpoint | Width    | Behavior                         |
|-----------|----------|----------------------------------|
| xs        | 480px+   | Minor adjustments                |
| sm        | 640px+   | Tablet portrait                  |
| md        | 768px+   | Tablet landscape                 |
| lg        | 1024px+  | Desktop                          |
| xl        | 1280px+  | Wide desktop                     |

## Animations

- `pulse-slow`: 3s pulse for subtle attention
- `float`: 6s ease-in-out infinite vertical float (hero elements)
- `scroll-behavior: smooth` on html
- All interactive elements: `transition-all` or `transition-[property] duration-300`

## Shadows

- Cards: `shadow-lg` (`0 10px 15px -3px rgb(0 0 0 / 0.1)`)
- Hover: `shadow-xl`
- Navigation: `shadow-md` on scroll

## Icons

- Use `lucide-react` icons consistently
- Size: `w-5 h-5` for inline, `w-8 h-8` for feature icons
- Color: inherit or `text-secondary` for accent

## Best Practices

1. Use Tailwind utility classes over custom CSS when possible
2. Custom utility classes go in `globals.css` under `@layer components`
3. All interactive elements need `transition` for hover/focus states
4. Mobile-first: build for mobile, extend for desktop
5. Gradient text uses `background-clip: text` with `text-fill-color: transparent`
6. Forms use `react-hook-form` with `zod` validation
7. Toasts via `sonner` (`<Toaster>` in root layout)
8. State management via Zustand stores
