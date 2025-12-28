import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 背景色 - 暖白/纸张感
        background: '#FFFCF5', 
        paper: '#FFFFFF',
        
        // 主色 - 丹霞橙/朱砂红 (Softened ver.)
        primary: {
          50: '#FFF5F5',
          100: '#FFE3E3',
          200: '#FFC9C9',
          300: '#FFA8A8',
          400: '#FF8787',
          500: '#FA5252', // 朱红 - 更有活力的红
          600: '#E03131',
          700: '#C92A2A',
          800: '#A61E4D',
          900: '#821D3F',
        },
        // 辅助色 - 竹青/苔绿
        secondary: {
          50: '#F2FBF9',
          100: '#C6F6D5',
          200: '#9AE6B4',
          300: '#68D391',
          400: '#48BB78',
          500: '#38A169', // 竹青
          600: '#2F855A',
          700: '#276749',
          800: '#22543D',
          900: '#1C4532',
        },
        // 文字色 - 水墨灰
        ink: {
          900: '#1A1B1E', // 极浓
          800: '#343A40',
          600: '#868E96', // 次要
          400: '#CED4DA', // 边框
          100: '#F8F9FA',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'SimSun', 'STSong', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
        'float': '0 20px 40px -10px rgba(250, 82, 82, 0.15)',
      },
      backgroundImage: {
        'noise': "url('/noise.png')", 
        'gradient-warm': 'linear-gradient(135deg, #FFFCF5 0%, #FFF5F5 100%)',
      }
    },
  },
  plugins: [],
};
export default config;
