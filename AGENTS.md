<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Package manager

Prefer `bun` for all tasks (install, run, build, test). Fall back to `node`/`npm` only if `bun` is unavailable or fails.

# UI components

Use shadcn/ui. Add components via:

```bash
bunx --bun shadcn@latest add <component>
```

Import from `@/components/ui/<component>`. Already initialized — no need to re-run `init`.