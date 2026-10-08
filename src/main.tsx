import {createRoot} from 'react-dom/client';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <ToastContainer position="bottom-right" autoClose={4000} limit={4} newestOnTop pauseOnFocusLoss={false} theme="dark" />
  </>,
);
