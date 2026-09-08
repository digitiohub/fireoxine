/**
 * The design system, shared by the storefront and the back office.
 *
 * Both apps import `@fireoxine/ui/globals.css`, so the wedge, the newsprint
 * texture, the stencil labels and the type scale stay identical across two
 * separately deployed front ends. Anything here must work in both.
 */
export { ThemeProvider } from './ThemeProvider';
export { ThemeToggle } from './ThemeToggle';
export { cn } from './cn';
export { mediaUrl, MEDIA_BASE } from './media';
