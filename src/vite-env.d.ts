/// <reference types="vite/client" />

declare module '*.svg?url' {
  const src: string;
  export default src;
}

declare module 'stockfish/bin/stockfish-18-lite-single.js?url' {
  const src: string;
  export default src;
}
