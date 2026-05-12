import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authAPI } from '../api/client';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    if (loading) return; // Button throttle
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-surface-900 px-4">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl text-white font-bold">Dainik Bahi</h1>
          <p className="text-primary-300 mt-1 text-sm">Sahakari Samiti Ledger System</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-surface-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Email Address</label>
              <input
                type="email"
                autoComplete="email"
                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="admin@example.com"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-200 hover:text-surface-700 transition-colors"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-400/60 text-xs mt-6">
          © 2024 Digital Wave IT Solutions Pvt Ltd
        </p>
      </div>
    </div>
  );
}
