'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Loader2, Calendar, X, Filter } from 'lucide-react';
import { createMap, addMarker, fitView, type POI } from '@/lib/amap';

// 活动数据结构
interface ActivityWithLocation {
  id: string;
  title: string;
  description?: string;
  day_date: string;
  longitude?: number | null;
  latitude?: number | null;
  location?: string;
  category?: string;
  start_time?: string;
  end_time?: string;
}

interface TripMapProps {
  activities: ActivityWithLocation[];
  startDate: string;
  endDate: string;
  height?: string;
  tripId?: string;  // 行程 ID，用于导航
  onActivityClick?: (activity: ActivityWithLocation) => void;
  className?: string;
}

// 日期颜色映射（按日期分配不同颜色）
const DATE_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

function getDateColor(dateStr: string, index: number): string {
  // 使用日期字符串作为哈希来分配颜色
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DATE_COLORS[Math.abs(hash) % DATE_COLORS.length];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
}

export default function TripMap({
  activities,
  startDate,
  endDate,
  height = '400px',
  tripId,
  onActivityClick,
  className = '',
}: TripMapProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // 获取有位置信息的活动
  const activitiesWithLocation = activities.filter(
    (a) => a.longitude && a.latitude
  );

  // 按日期分组
  const activitiesByDate = activitiesWithLocation.reduce((acc, activity) => {
    if (!acc[activity.day_date]) {
      acc[activity.day_date] = [];
    }
    acc[activity.day_date].push(activity);
    return acc;
  }, {} as Record<string, ActivityWithLocation[]>);

  const sortedDates = Object.keys(activitiesByDate).sort();

  // 根据筛选条件过滤活动
  const filteredActivities = selectedDateFilter
    ? activitiesWithLocation.filter(a => a.day_date === selectedDateFilter)
    : activitiesWithLocation;

  // 根据筛选的活动重新分组
  const filteredActivitiesByDate = filteredActivities.reduce((acc, activity) => {
    if (!acc[activity.day_date]) {
      acc[activity.day_date] = [];
    }
    acc[activity.day_date].push(activity);
    return acc;
  }, {} as Record<string, ActivityWithLocation[]>);

  const filteredSortedDates = Object.keys(filteredActivitiesByDate).sort();

  // 清除日期筛选
  const clearDateFilter = () => {
    setSelectedDateFilter(null);
  };

  // 初始化地图
  useEffect(() => {
    // 如果 mapRef 还没有准备好，等待 DOM 渲染完成
    if (!mapRef.current) {
      // 使用 requestAnimationFrame 等待下一个渲染周期
      // 最多等待 10 次（约 160ms），避免无限等待
      let retryCount = 0;
      const maxRetries = 10;
      const checkRef = () => {
        if (mapRef.current) {
          initializeMap();
        } else if (retryCount < maxRetries) {
          retryCount++;
          requestAnimationFrame(checkRef);
        } else {
          setError('地图容器未准备好，请刷新重试');
          setLoading(false);
        }
      };
      requestAnimationFrame(checkRef);
      return;
    }
    
    // 定义初始化函数
    function initializeMap() {
      if (!mapRef.current) {
        return;
      }

      setLoading(true);
      setError(null);

      // 清理之前的地图实例
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }

      // 设置超时，防止一直加载
      let timeoutTriggered = false;
      const timeoutId = setTimeout(() => {
        timeoutTriggered = true;
        console.error('地图加载超时');
        setError('地图加载超时，请刷新重试');
        setLoading(false);
      }, 15000); // 15秒超时

      // 创建新地图
      createMap(mapRef.current)
        .then((map) => {
          if (timeoutTriggered) {
            console.warn('地图加载完成，但已触发超时');
            return;
          }
          
          clearTimeout(timeoutId);
          
          // 验证地图实例
          if (!map) {
            console.error('地图实例为 undefined');
            setError('地图创建失败，请刷新重试');
            setLoading(false);
            return;
          }

          // 验证地图实例是否有必要的方法
          if (typeof map.add !== 'function') {
            console.error('地图实例缺少 add 方法', {
              mapType: typeof map,
              mapKeys: Object.keys(map || {}),
            });
            setError('地图实例不完整，请刷新重试');
            setLoading(false);
            return;
          }

          mapInstanceRef.current = map;

          // 如果有活动，添加标记
          if (filteredActivities.length > 0) {
            // 检查 AMap 对象是否已加载
            const AMap = (window as any).AMap;
            if (!AMap) {
              console.error('AMap 对象未加载，无法添加标记');
              setError('地图 API 未加载完成，请刷新重试');
              setLoading(false);
              return;
            }

            // 添加标记
            const newMarkers: any[] = [];

            filteredSortedDates.forEach((dateStr) => {
              const dayActivities = filteredActivitiesByDate[dateStr];
              const color = getDateColor(dateStr, sortedDates.indexOf(dateStr));

              dayActivities.forEach((activity) => {
                try {
                  // 检查活动的经纬度是否存在
                  if (!activity.longitude || !activity.latitude) {
                    console.warn(`活动 "${activity.title}" 缺少位置信息，跳过标记`);
                    return;
                  }

                  // 使用 mapInstanceRef 中的地图实例，确保使用最新的引用
                  const currentMap = mapInstanceRef.current || map;
                  
                  // 在调用前再次验证 map
                  if (!currentMap || typeof currentMap.add !== 'function') {
                    console.error('在添加标记时 map 无效', {
                      hasMap: !!currentMap,
                      hasAddMethod: currentMap ? typeof currentMap.add === 'function' : false,
                      activity: activity.title,
                      usingRef: currentMap === mapInstanceRef.current,
                      refHasMap: !!mapInstanceRef.current
                    });
                    return;
                  }

                  const marker = addMarker(currentMap, [activity.longitude, activity.latitude], {
                    title: activity.title,
                    color: color, // 直接使用完整颜色值
                  });

                  if (!marker) {
                    console.warn(`活动 "${activity.title}" 标记创建失败`);
                    return;
                  }

                  // 创建信息窗口
                  if (!AMap.InfoWindow || !AMap.Pixel) {
                    console.warn(`活动 "${activity.title}" InfoWindow 类未加载，跳过信息窗口`);
                    newMarkers.push(marker);
                    return;
                  }
                  
                  const infoWindow = new AMap.InfoWindow({
                    content: `
                      <div style="padding: 8px; min-width: 150px;">
                        <div style="font-weight: bold; margin-bottom: 4px;">${activity.title}</div>
                        <div style="font-size: 12px; color: #666;">
                          <span style="display: inline-block; padding: 2px 6px; background: ${color}; color: white; border-radius: 4px; margin-right: 4px;">
                            ${formatDate(activity.day_date)}
                          </span>
                          ${activity.start_time || ''} ${activity.end_time ? '- ' + activity.end_time : ''}
                        </div>
                        ${activity.location ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">📍 ${activity.location}</div>` : ''}
                      </div>
                    `,
                    offset: new AMap.Pixel(0, -32),
                  });

                  marker.on('click', () => {
                    infoWindow.open(currentMap, marker.getPosition());
                    if (onActivityClick) {
                      onActivityClick(activity);
                    }
                  });

                  newMarkers.push(marker);
                } catch (markerErr: any) {
                  console.error('添加标记失败:', activity.title, markerErr);
                }
              });
            });

            markersRef.current = newMarkers;

            // 适配视野
            if (newMarkers.length > 0) {
              fitView(map, newMarkers);
            }
          }

          setLoading(false);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          console.error('地图加载失败:', err);
          setError(`地图加载失败: ${err.message || '未知错误'}`);
          setLoading(false);
        });
    }

    // 调用初始化函数
    initializeMap();

    // 清理函数
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {
          // 忽略清理错误
        }
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activitiesWithLocation.length, tripId, selectedDateFilter]);

  // 空状态
  if (activitiesWithLocation.length === 0) {
    return (
      <div
        className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无地理位置信息</p>
          <p className="text-sm">请在活动详情中添加地点</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div
        className={`bg-gray-100 rounded-xl flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row gap-4 ${className}`}>
      {/* 地图区域 */}
      <div className="flex-1 relative">
        {/* 地图容器 - 必须始终渲染，即使 loading 也要渲染，这样 mapRef 才能被设置 */}
        <div
          ref={mapRef}
          className="w-full rounded-xl overflow-hidden shadow-sm border border-gray-200"
          style={{ height }}
        />
        {/* 加载遮罩层 - 覆盖在地图容器上方 */}
        {loading && (
          <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary-500 animate-spin" />
              <p className="text-gray-500">加载地图中...</p>
            </div>
          </div>
        )}
      </div>

      {/* 侧边栏 - 活动列表 */}
      <div className="w-full md:w-64 overflow-y-auto" style={{ maxHeight: height }}>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              按日期分组
            </h3>
            {selectedDateFilter && (
              <button
                onClick={clearDateFilter}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                清除筛选
              </button>
            )}
          </div>

          {/* 日期筛选器 */}
          {sortedDates.length > 1 && (
            <div className="mb-4 pb-3 border-b border-gray-100">
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                筛选日期
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearDateFilter}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    !selectedDateFilter
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {sortedDates.map((dateStr) => (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDateFilter(dateStr)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      selectedDateFilter === dateStr
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {formatDate(dateStr)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 活动列表 */}
          <div className="space-y-3">
            {filteredSortedDates.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                该日期暂无活动
              </div>
            ) : (
              filteredSortedDates.map((dateStr) => {
                const dayActivities = filteredActivitiesByDate[dateStr];
                const color = getDateColor(dateStr, sortedDates.indexOf(dateStr));

                return (
                  <div key={dateStr} className="space-y-2">
                    <div
                      className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer hover:text-primary-600"
                      onClick={() => setSelectedDateFilter(dateStr)}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>{formatFullDate(dateStr)}</span>
                      <span className="text-xs text-gray-400">({dayActivities.length})</span>
                    </div>

                    <div className="space-y-1 ml-5">
                      {dayActivities.map((activity) => (
                        <button
                          key={activity.id}
                          onClick={() => {
                            if (onActivityClick) {
                              onActivityClick(activity);
                            } else if (tripId) {
                              router.push(`/trips/${tripId}/activities/${activity.id}`);
                            }
                          }}
                          className="w-full text-left text-sm text-gray-600 hover:text-primary-600 truncate py-1 px-2 rounded hover:bg-gray-50 transition-colors"
                        >
                          {activity.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {selectedDateFilter
                ? `${formatFullDate(selectedDateFilter)}: ${filteredActivities.length} 个地点`
                : `共 ${activitiesWithLocation.length} 个地点`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
