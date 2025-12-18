/// <reference types="vite/client" />

declare const __VITE_PARSE_APP_ID__: string | undefined;
declare const __VITE_PARSE_JS_KEY__: string | undefined;
declare const __VITE_PARSE_REST_KEY__: string | undefined;
declare const __VITE_API_KEY__: string | undefined;

interface ImportMetaEnv {
  readonly VITE_PARSE_APP_ID: string
  readonly VITE_PARSE_REST_KEY: string
  readonly VITE_PARSE_JS_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global variables defined in vite.config.ts
declare const __VITE_PARSE_APP_ID__: string;
declare const __VITE_PARSE_REST_KEY__: string;
declare const __VITE_PARSE_JS_KEY__: string;
