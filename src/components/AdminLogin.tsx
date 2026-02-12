import { createSignal } from 'solid-js';

interface Props {
  onLogin: (token: string) => void;
}

const AdminLogin = (props: Props) => {
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      props.onLogin(data.token);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} class="w-full max-w-sm flex flex-col gap-6">
        <div class="text-center">
          <h1 class="text-3xl font-light tracking-wide">FLOAT CAPITAL</h1>
          <p class="text-white/40 mt-2 text-sm">Admin Panel</p>
        </div>

        <div class="flex flex-col gap-1">
          <input
            type="password"
            placeholder="Password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            class="bg-transparent border-0 border-b border-b-solid border-b-white/20 px-0 py-3 text-white text-base outline-none focus:border-b-orange-500 transition-colors placeholder:text-white/30"
            autofocus
          />
          {error() && <span class="text-red-400 text-xs mt-1">{error()}</span>}
        </div>

        <button
          type="submit"
          disabled={loading()}
          class="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-md text-sm font-medium transition-colors border-0 cursor-pointer"
        >
          {loading() ? 'Verifying...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
