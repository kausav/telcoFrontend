import {createRoot} from 'react-dom/client';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
// The fonts (Mona Sans, DM Mono) are declared in index.css and bundled with the app: no external font service.
import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <ToastContainer position="top-right" autoClose={4000} limit={4} newestOnTop pauseOnFocusLoss={false} theme="dark" />
  </>,
);
