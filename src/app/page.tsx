import Link from "next/link";
import { MapPin, Users, Calendar, Image as ImageIcon, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-ink-800 transition-colors duration-300">
      {/* Texture Overlay (Optional, using CSS pattern instead of image for now) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300 glass-nav">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-float transform rotate-3">
              <span className="font-serif text-xl italic font-bold">W</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-ink-900 tracking-tight">漫行记</h1>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/login"
              className="px-6 py-2.5 text-sm font-medium text-ink-600 hover:text-primary-600 transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-ink-900 text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl hover:bg-black transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              注册
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative">
        <div className="max-w-4xl mx-auto text-center mb-24 relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-50 text-primary-600 text-xs font-bold tracking-wide uppercase mb-6 border border-primary-100/50">
            Team Travel Reimagined
          </span>
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-ink-900 mb-8 leading-[1.1]">
            漫行山水间，
            <br />
            <span className="text-gradient align-middle">记录时光里</span>
          </h2>
          <p className="text-lg md:text-xl text-ink-600 mb-10 max-w-2xl mx-auto font-sans leading-relaxed">
            告别繁琐的攻略文档。用一种更优雅的方式，规划你们的每一次旅程。
            <br className="hidden md:block" />
            让每一次相聚，都成为值得珍藏的独家记忆。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="group px-8 py-4 bg-primary-500 text-white text-lg font-medium rounded-full shadow-float hover:bg-primary-600 transition-all flex items-center gap-2"
            >
              开始规划行程
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white text-ink-600 text-lg font-medium rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              了解更多
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <FeatureCard
            icon={Calendar}
            title="灵感拼图"
            description="像拼图一样拖拽规划行程，可视化的日程管理，让时间安排变得井井有条又不失弹性。"
          />
          <FeatureCard
            icon={Users}
            title="亲密协作"
            description="生成专属邀请码，邀请挚友共同编辑。每个人都是旅行的设计师，实时同步彼此的想法。"
          />
          <FeatureCard
            icon={ImageIcon}
            title="胶片记忆"
            description="不仅仅是照片库。按时间线自动整理的旅行画册，支持原图保存，留住每一个光影瞬间。"
          />
          <FeatureCard
            icon={MapPin}
            title="地道风物"
            description="避开游客陷阱。精选本地人推荐的小众景点与地道美食，体验最纯粹的当地生活。"
          />
        </div>

        {/* Emotional CTA Section */}
        <div className="mt-32 relative rounded-3xl overflow-hidden glass-card p-12 text-center border-none ring-1 ring-black/5">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-300"></div>
          <h3 className="text-3xl font-serif font-bold text-ink-900 mb-6 relative z-10">
            准备好出发了吗？
          </h3>
          <p className="text-ink-600 mb-8 max-w-lg mx-auto relative z-10">
            从第一杯茶颜悦色，到最后一张合影。WanderLog 陪你记录全程。
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-3.5 bg-ink-900 text-white text-lg font-medium rounded-full shadow-xl hover:bg-black transition-all relative z-10"
          >
            免费开启旅程
          </Link>

          {/* Decorative circles */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-ink-400 text-sm bg-white/50 border-t border-gray-100 sticky top-[100vh]">
        <p>© 2025 WanderLog. Crafted with ❤️ for travelers.</p>
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
    <div className="glass-card rounded-2xl p-8 hover:-translate-y-1 hover:shadow-float transition-all duration-300 group">
      <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-7 h-7 text-primary-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-serif font-bold text-ink-900 mb-3">{title}</h3>
      <p className="text-ink-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
