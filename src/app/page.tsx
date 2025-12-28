import Link from "next/link";
import { MapPin, Users, Calendar, Image as ImageIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b border-red-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900">川渝行迹</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors touch-target"
            >
              注册
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            团队旅行，协同记录
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            为川渝地区团体旅行提供简单、直观的行程规划与记录工具
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-primary-500 text-white text-lg rounded-lg hover:bg-primary-600 transition-colors touch-target"
          >
            开始使用
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={Calendar}
            title="行程规划"
            description="创建每日行程安排，设置活动时间和地点"
          />
          <FeatureCard
            icon={Users}
            title="团队协作"
            description="邀请好友加入，一起规划和完善行程"
          />
          <FeatureCard
            icon={ImageIcon}
            title="照片记录"
            description="上传旅行照片，按日期整理分享"
          />
          <FeatureCard
            icon={MapPin}
            title="川渝指南"
            description="预置热门景点和美食推荐"
          />
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white rounded-2xl p-8 shadow-lg border border-red-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            准备好开始你的川渝之旅了吗？
          </h3>
          <p className="text-gray-600 mb-6">
            注册账号，创建行程，邀请好友一起记录美好时光
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-primary-500 text-white text-lg rounded-lg hover:bg-primary-600 transition-colors touch-target"
          >
            免费注册
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-red-100 bg-white/80 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2025 川渝行迹 - 让旅行记录更简单</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-primary-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
