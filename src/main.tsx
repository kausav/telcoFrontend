import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
import './index.css';

// The addresses live under the deployment prefix: Vite's base ("/source/" in a build, "/" in development).
const basename = import.meta.env.BASE_URL.replace(/\/+$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <App />
    <ToastContainer position="top-right" autoClose={4000} limit={4} newestOnTop pauseOnFocusLoss={false} theme="dark" />
  </BrowserRouter>,
);
