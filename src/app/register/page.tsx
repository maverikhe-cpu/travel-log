'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Mail, Lock, User, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const inviteCode = searchParams.get('invite');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 验证密码
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: username || email.split('@')[0],
          },
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccess(true);
        setTimeout(() => {
          if (inviteCode) {
            // 有邀请码，跳转到加入页面
            router.push(`/join/${inviteCode}`);
          } else {
            router.push('/dashboard');
          }
          router.refresh();
        }, 1500);
      }
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background text-ink-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-3xl p-10 text-center">
            <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle className="w-10 h-10 text-secondary-600" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-ink-900 mb-2">注册成功！</h2>
            <p className="text-ink-500">
              {inviteCode ? '正在加入邀请的行程...' : '正在跳转到仪表盘...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-ink-800 flex items-center justify-center p-4">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-float transform group-hover:rotate-6 transition-transform">
              <span className="font-serif italic font-bold text-xl">W</span>
            </div>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-ink-900 mb-2">
            {inviteCode ? '注册并加入行程' : '开启旅程'}
          </h1>
          <p className="text-ink-500">
            {inviteCode ? '注册后自动加入邀请的行程' : '开始记录你的每一次难忘经历'}
          </p>
        </div>

        {/* 邀请提示 */}
        {inviteCode && (
          <div className="mb-6 bg-primary-50 border border-primary-100/50 rounded-2xl p-4 flex items-start gap-3">
            <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary-900 font-medium">你被邀请加入一个行程</p>
              <p className="text-sm text-primary-600 mt-1">注册后即可自动加入</p>
            </div>
          </div>
        )}

        {/* Register Form */}
        <div className="glass-card rounded-3xl p-8 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-ink-700 mb-1.5">
                昵称（可选）
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="怎么称呼你？"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-ink-300"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1.5">
                邮箱
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-ink-300"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-700 mb-1.5">
                密码
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6个字符"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-ink-300"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-700 mb-1.5">
                确认密码
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-ink-300"
                />
              </div>
            </div>

            <Button type="submit" className="w-full rounded-full shadow-lg hover:shadow-xl transition-all" size="lg" disabled={loading}>
              {loading ? '注册中...' : '创建账号'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-ink-500">已有账号？</span>
            <Link
              href={inviteCode ? `/login?invite=${inviteCode}` : '/login'}
              className="ml-1 text-primary-600 hover:text-primary-700 font-bold"
            >
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
