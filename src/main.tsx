import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { TerrainMapProvider } from './app/context/TerrainMapContext.tsx';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <TerrainMapProvider>
    <App />
  </TerrainMapProvider>,
);
  