import {createRoot} from 'react-dom/client';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
// Fonts are bundled with the app (no external font service).
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <ToastContainer position="top-right" autoClose={4000} limit={4} newestOnTop pauseOnFocusLoss={false} theme="dark" />
  </>,
);
