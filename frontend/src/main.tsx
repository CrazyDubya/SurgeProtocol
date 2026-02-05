import { render } from 'preact';
import { App } from './App';
import { registerServiceWorker } from './utils/serviceWorker';
import '@styles/tokens/base.css';
import '@styles/themes/neon-decay.css';
import '@styles/themes/terminal-noir.css';
import '@styles/themes/algorithm-vision.css';
import '@styles/themes/brutalist-cargo.css';
import '@styles/themes/worn-chrome.css';
import '@styles/themes/blood-circuit.css';
import '@styles/themes/ghost-protocol.css';
import './index.css';

// Mount the app
render(<App />, document.getElementById('app')!);

// Register service worker for PWA support
registerServiceWorker({
  onSuccess: () => {
    console.log('App ready for offline use');
  },
  onUpdate: () => {
    console.log('New version available - refresh to update');
  },
  onOffline: () => {
    console.log('App is offline');
  },
  onOnline: () => {
    console.log('App is back online');
  },
});
