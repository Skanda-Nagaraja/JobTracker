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

// pdfjs
declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: any;
  export const getDocument: any;
}
declare module "pdfjs-dist/build/pdf.worker.min.mjs?url" {
  const src: string;
  export default src;
}

// MUI fallback stubs (for lint when types not resolved)
declare module "@mui/material/*" {
  const Component: any;
  export default Component;
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

declare module "react-router-dom" {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Navigate: any;
  export const Link: any;
  export const useNavigate: any;
  export const useLocation: any;
}

declare module "recharts" {
  export const BarChart: any;
  export const Bar: any;
  export const XAxis: any;
  export const YAxis: any;
  export const Tooltip: any;
  export const ResponsiveContainer: any;
  export const PieChart: any;
  export const Pie: any;
  export const Cell: any;
  export const CartesianGrid: any;
  export const Legend: any;
  export const Sankey: any;
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


