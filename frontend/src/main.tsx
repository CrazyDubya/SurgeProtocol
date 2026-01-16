import { render } from 'preact';
import { App } from './App';
import '@styles/tokens/base.css';
import '@styles/themes/neon-decay.css';
import '@styles/themes/terminal-noir.css';
import '@styles/themes/algorithm-vision.css';
import '@styles/themes/brutalist-cargo.css';
import '@styles/themes/worn-chrome.css';
import './index.css';

render(<App />, document.getElementById('app')!);
