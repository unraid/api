/// <reference types="vite/client" />

declare module '*.css?inline' {
  const content: string;
  export default content;
}

declare module '@/assets/main.css?inline' {
  const content: string;
  export default content;
}

declare module '~/assets/main.css?inline' {
  const content: string;
  export default content;
}
