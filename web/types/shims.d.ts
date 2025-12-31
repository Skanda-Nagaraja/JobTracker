// Minimal ambient type shims so the project typechecks before npm install.
// These should be removed once node_modules are installed locally.

declare module "next/link" {
  import * as React from "react";
  interface LinkProps { href: string; [key: string]: any }
  const Link: React.FC<LinkProps>;
  export default Link;
}

declare module "next/server" {
  export const NextResponse: any;
}

declare module "next" {
  export type Metadata = any;
}

declare module "next/navigation" {
  export const useRouter: any;
  export const useSearchParams: any;
  export const usePathname: any;
}

declare module "react" {
  export = React;
  namespace React {
    type FC<P = {}> = (props: P & { children?: any }) => any;
    type ReactNode = any;
    type Key = string | number;
    function Suspense(props: any): any;
    function useState<T = any>(initial?: T): [T, (v: T) => void];
    function useEffect(fn: () => any, deps?: any[]): void;
    function useMemo<T = any>(fn: () => T, deps?: any[]): T;
    function useCallback<T extends (...args: any[]) => any>(fn: T, deps?: any[]): T;
    const StrictMode: any;
  }
}

declare module "react-dom" {
  const x: any;
  export = x;
}

declare module "clsx" {
  export default function clsx(...args: any[]): string;
}

declare module "@supabase/supabase-js" {
  export function createClient(url: string, key: string, opts?: any): any;
}

// Vite shims
declare module "vite" {
  export const defineConfig: any;
}
declare module "@vitejs/plugin-react" {
  const plugin: any;
  export default plugin;
}
declare module "@tailwindcss/vite" {
  const plugin: any;
  export default plugin;
}

interface ImportMetaEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}
interface ImportMeta {
  env: ImportMetaEnv;
}

declare module "tailwindcss" {
  const x: any;
  export = x;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// Minimal Node env shim
declare const process: {
  env: Record<string, string | undefined>;
};


