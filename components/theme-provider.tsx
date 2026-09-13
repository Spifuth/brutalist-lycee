'use client'

// A three-line pass-through around the provider from next-themes.
//
// This is the *client boundary wrapper* pattern: a file you own, carrying
// "use client", that re-exports a component from a package so a server
// component can render it. You will need it for any npm provider that ships
// without the directive -- and this one does not need it, because next-themes
// already declares "use client" in its own build. Check before you write the
// wrapper: `grep -l "use client" node_modules/<package>/dist/*` answers it in
// a second. Kept here because it is where app/layout.tsx imports from, and
// because it is the obvious place to put a default if this project ever wants
// one.

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
