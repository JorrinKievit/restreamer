import { ColorModeScript } from '@chakra-ui/react';
import { createRoot } from 'react-dom/client';
import App from './App';
import extendedTheme from './styles/theme';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <>
    <ColorModeScript initialColorMode={extendedTheme.config.initialColorMode} />
    <App />
  </>
);
