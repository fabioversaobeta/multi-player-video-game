import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// host: true expõe na rede local (celulares acessam pelo IP do PC)
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, fs: { allow: ['..'] } },
});
