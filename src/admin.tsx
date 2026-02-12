import 'virtual:uno.css';
import { render } from 'solid-js/web';
import { createSignal, Show } from 'solid-js';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

const Admin = () => {
  const [token, setToken] = createSignal(sessionStorage.getItem('admin_token') || '');

  const handleLogin = (t: string) => {
    sessionStorage.setItem('admin_token', t);
    setToken(t);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setToken('');
  };

  return (
    <div class="min-h-screen bg-[#0a0e1a] text-white font-sans">
      <Show when={token()} fallback={<AdminLogin onLogin={handleLogin} />}>
        <AdminPanel token={token()} onLogout={handleLogout} />
      </Show>
    </div>
  );
};

render(() => <Admin />, document.getElementById('root')!);
