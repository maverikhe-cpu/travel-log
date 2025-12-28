'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Navigation, Loader2, X } from 'lucide-react';
import { searchPOI, getSuggestions, type POI } from '@/lib/amap';

interface POISearchProps {
  city?: string;           // 默认搜索城市
  onSelect: (poi: POI) => void;  // 选中 POI 回调
  placeholder?: string;
  defaultValue?: string;
  excludedCategories?: string[];  // 排除的类别
}

// POI 类别图标映射
const CATEGORY_ICONS: Record<string, string> = {
  '风景名胜': '🏞️',
  '旅游景点': '🏛️',
  '餐饮服务': '🍜',
  '美食': '🍜',
  '住宿服务': '🏨',
  '购物服务': '🛍️',
  '交通设施': '🚇',
  '医疗保健': '🏥',
  '科教文化': '📚',
  '休闲健身': '⚽',
  '政府机构': '🏢',
  '商务住宅': '🏠',
  '公司企业': '🏢',
};

// 获取类别图标
function getCategoryIcon(type: string): string {
  for (const [category, icon] of Object.entries(CATEGORY_ICONS)) {
    if (type.includes(category)) {
      return icon;
    }
  }
  return '📍';
}

export default function POISearch({
  city = '全国',
  onSelect,
  placeholder = '搜索地点，如：成都宽窄巷子',
  defaultValue = '',
  excludedCategories = [],
}: POISearchProps) {
  const [keyword, setKeyword] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<POI[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 获取用户位置
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.longitude, pos.coords.latitude]);
        },
        () => {
          // 忽略定位错误
        }
      );
    }
  }, []);

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 搜索 POI
  async function performSearch(query: string) {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);

    try {
      // 优先使用自动补全（更快）
      const results = await getSuggestions(query, city || undefined);

      if (results.length > 0) {
        // 排除不需要的类别
        const filtered = results.filter(poi => {
          if (excludedCategories.length === 0) return true;
          return !excludedCategories.some(cat => poi.type.includes(cat));
        });

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        // 如果自动补全没有结果，使用完整搜索
        try {
          const searchResult = await searchPOI(query, city, 10);
          const filtered = searchResult.pois.filter(poi => {
            if (excludedCategories.length === 0) return true;
            return !excludedCategories.some(cat => poi.type.includes(cat));
          });

          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        } catch (fallbackError) {
          console.error('POI 完整搜索也失败:', fallbackError);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    } catch (error) {
      console.error('POI 搜索失败:', error);
      // 显示错误提示给用户
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }

  // 输入防抖搜索
  const handleInputChange = (value: string) => {
    setKeyword(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // 选择 POI
  const handleSelect = (poi: POI) => {
    setKeyword(poi.name);
    setShowSuggestions(false);
    onSelect(poi);
  };

  // 使用当前位置
  const handleUseCurrentLocation = async () => {
    if (userLocation) {
      const poi: POI = {
        id: 'current',
        name: '当前位置',
        address: '我的位置',
        district: '',
        city: '',
        longitude: userLocation[0],
        latitude: userLocation[1],
        type: 'location',
      };
      handleSelect(poi);
    }
  };

  // 清除输入
  const handleClear = () => {
    setKeyword('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* 搜索输入框 */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {keyword && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 建议列表 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {/* 定位按钮 */}
          {userLocation && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 text-left"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Navigation className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">使用当前位置</div>
                <div className="text-sm text-gray-500">
                  {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                </div>
              </div>
            </button>
          )}

          {/* POI 列表 */}
          {suggestions.map((poi) => (
            <button
              type="button"
              key={poi.id}
              onClick={() => handleSelect(poi)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                {getCategoryIcon(poi.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{poi.name}</div>
                <div className="text-sm text-gray-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {poi.address || poi.district || poi.city}
                </div>
                {poi.distance && (
                  <div className="text-xs text-gray-400 mt-1">
                    距离约 {Math.round(poi.distance)}m
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* 无结果提示 */}
          {suggestions.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>未找到相关地点</p>
              <p className="text-sm">请尝试其他关键词</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 导出类型
export type { POI };
