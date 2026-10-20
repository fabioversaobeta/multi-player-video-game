import { Controller } from './screens/Controller';
import { Tv } from './screens/Tv';

// "/" = TV (cria a sala); "/j/CODIGO" = celular (controle)
export function App() {
  const m = location.pathname.match(/^\/j\/([A-Za-z]+)/);
  return m ? <Controller code={m[1].toUpperCase()} /> : <Tv />;
}
