import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import WelcomeShader from '../components/WelcomeShader';

interface LoginResponse {
  access_token: string;
}

async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedEmail'));

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      navigate('/fleet');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-y-auto bg-gray-900 p-4 text-white">
      <div className="mx-4 h-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/80 shadow-2xl backdrop-blur-sm md:h-[600px]">
        <div className="grid h-full md:grid-cols-2">
          <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden bg-linear-to-br from-gray-900/70 to-gray-800/70 p-12">
            <WelcomeShader />

            <div className="relative z-10 space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/30 backdrop-blur-sm">
                <svg className="h-8 w-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-light text-white drop-shadow-lg">Welcome Back</h1>
              <p className="max-w-sm text-lg leading-relaxed text-gray-200 drop-shadow-md">
                Sign in to your account to continue your journey with us.
              </p>
              <div className="flex items-center justify-center space-x-2 rounded-full bg-black/20 px-4 py-2 text-sm text-gray-300 backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span>Secure Connection</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-linear-to-br from-slate-900 to-gray-900 p-12">
            <div className="mx-auto w-full max-w-sm space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-light text-gray-100">Sign In</h2>
                <p className="text-sm text-gray-400">Enter your credentials to access your account</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-light text-gray-300" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-white placeholder-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-light text-gray-300" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-white placeholder-gray-400 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="font-light">Remember me</span>
                  </label>
                  <span className="cursor-default font-light text-blue-400">Forgot password?</span>
                </div>

                {loginMutation.isError && (
                  <p className="text-sm text-red-400">Invalid credentials. Please try again.</p>
                )}

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full rounded-lg bg-blue-500 px-4 py-3 font-light text-white transition-all hover:bg-blue-600 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none disabled:opacity-50"
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="text-center text-sm text-gray-400">
                Don&apos;t have an account?{' '}
                <span className="cursor-default font-light text-blue-400">Sign up</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
