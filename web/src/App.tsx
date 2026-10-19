import { Controller } from './Controller';
import { Tv } from './Tv';

// "/" = TV (cria a sala); "/j/CODIGO" = celular (controle)
export function App() {
  const m = location.pathname.match(/^\/j\/([A-Za-z]+)/);
  return m ? <Controller code={m[1].toUpperCase()} /> : <Tv />;
}
