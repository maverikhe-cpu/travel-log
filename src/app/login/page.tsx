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
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <MapPin className="w-10 h-10 text-primary-500" />
            <span className="text-2xl font-bold text-gray-900">川渝行迹</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">
            {inviteCode ? '登录以加入行程' : '登录账号'}
          </h1>
          <p className="text-gray-600 mt-2">
            {inviteCode ? '登录后自动加入邀请的行程' : '欢迎回来，继续你的旅行记录'}
          </p>
        </div>

        {/* 邀请提示 */}
        {inviteCode && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">你被邀请加入一个行程</p>
              <p className="text-sm text-blue-600 mt-1">登录后即可自动加入</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                <span className="text-sm text-gray-600">记住我</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                忘记密码？
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-600">还没有账号？</span>
            <Link
              href={inviteCode ? `/register?invite=${inviteCode}` : '/register'}
              className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
