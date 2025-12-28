'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Mail, Lock, AlertCircle, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const inviteCode = searchParams.get('invite');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // 登录成功后的处理
        if (inviteCode) {
          // 有邀请码，跳转到加入页面
          sessionStorage.setItem('inviteCode', inviteCode);
          router.push(`/join/${inviteCode}`);
        } else {
          // 没有邀请码，检查是否有保存的跳转地址
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectUrl || '/dashboard');
        }
        router.refresh();
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

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
            {inviteCode ? '登录以加入行程' : '欢迎回来'}
          </h1>
          <p className="text-ink-500">
            {inviteCode ? '登录后自动加入邀请的行程' : '漫行山水间，记录时光里'}
          </p>
        </div>

        {/* 邀请提示 */}
        {inviteCode && (
          <div className="mb-6 bg-primary-50 border border-primary-100/50 rounded-2xl p-4 flex items-start gap-3">
            <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-primary-900 font-medium">你被邀请加入一个行程</p>
              <p className="text-sm text-primary-600 mt-1">登录后即可自动加入</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="glass-card rounded-3xl p-8 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-ink-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                <span className="text-sm text-ink-500 group-hover:text-ink-800 transition-colors">记住我</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                忘记密码？
              </Link>
            </div>

            <Button type="submit" className="w-full rounded-full shadow-lg hover:shadow-xl transition-all" size="lg" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-ink-500">还没有账号？</span>
            <Link
              href={inviteCode ? `/register?invite=${inviteCode}` : '/register'}
              className="ml-1 text-primary-600 hover:text-primary-700 font-bold"
            >
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
