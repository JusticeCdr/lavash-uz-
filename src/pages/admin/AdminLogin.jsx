import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (password === adminPassword) {
      localStorage.setItem('adminAuth', 'true');
      navigate('/admin');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
          <p className="text-gray-500 mt-2">Enter the admin password to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Password"
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-brand-red focus:ring-brand-red' : 'border-gray-300 focus:ring-brand-green'} focus:outline-none focus:ring-2 transition-colors`}
            />
            {error && <p className="text-brand-red text-sm mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Login
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
