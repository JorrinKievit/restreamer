import { ColorModeScript } from '@chakra-ui/react';
import { createRoot } from 'react-dom/client';
import extendedTheme from './styles/theme';
import App from './App';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(
  <>
    <ColorModeScript initialColorMode={extendedTheme.config.initialColorMode} />
    <App />
  </>
);
