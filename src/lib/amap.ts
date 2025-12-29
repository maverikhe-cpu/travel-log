/**
 * 高德地图 API 封装
 * 提供地图加载、POI 搜索、地理编码等功能
 */

// 高德地图配置
const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY || '';
const AMAP_SECURITY_JS_CODE = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE || '';
const AMAP_VERSION = '2.0';

// 高德地图插件列表
const PLUGINS = [
  'AMap.AutoComplete',
  'AMap.PlaceSearch',
  'AMap.Geolocation',
  'AMap.Geocoder',
  'AMap.Marker',
  'AMap.InfoWindow',
  'AMap.Polyline',
];

// 地图实例缓存
let mapLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * POI 数据结构
 */
export interface POI {
  id: string;           // 高德 POI ID
  name: string;         // 名称
  address: string;      // 地址
  district: string;     // 区县
  city: string;         // 城市
  longitude: number;    // 经度
  latitude: number;     // 纬度
  type: string;         // POI 类型
  tel?: string;         // 电话
  distance?: number;    // 距离（米）
}

/**
 * 地图配置选项
 */
export interface MapOptions {
  center?: [number, number]; // [经度, 纬度]
  zoom?: number;
  mapStyle?: string;
}

/**
 * 加载高德地图 JS API
 */
export async function loadAMap(): Promise<void> {
  if (mapLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  if (!AMAP_KEY) {
    console.error('高德地图 API Key 未配置');
    throw new Error('高德地图 API Key 未配置');
  }

  // 动态导入 AMapLoader，避免服务端渲染时出现 "window is not defined" 错误
  const { default: AMapLoader } = await import('@amap/amap-jsapi-loader');

  // 高德地图安全密钥必须通过 window._AMapSecurityConfig 全局变量设置
  // 必须在加载地图 API 之前设置，否则会导致 INVALID_USER_SCODE 错误
  if (typeof window !== 'undefined' && AMAP_SECURITY_JS_CODE) {
    (window as any)._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_JS_CODE,
    };
  }

  // 构建加载配置（不再包含 securityJsCode，因为已通过全局变量设置）
  const loadConfig: any = {
    key: AMAP_KEY,
    version: AMAP_VERSION,
    plugins: PLUGINS,
  };

  loadPromise = AMapLoader.load(loadConfig).then(() => {
    mapLoaded = true;
    // 验证 AMap 对象和插件是否正确加载
    const AMap = (window as any).AMap;
    if (AMap) {
      console.log('AMap 加载成功，插件状态:', {
        AutoComplete: !!AMap.AutoComplete,
        PlaceSearch: !!AMap.PlaceSearch,
        Geolocation: !!AMap.Geolocation,
        Geocoder: !!AMap.Geocoder,
      });
    } else {
      console.error('AMap 对象未找到');
    }
  }).catch((err) => {
    console.error('AMap 加载失败:', err);
    throw err;
  });

  return loadPromise;
}

/**
 * 初始化地图实例
 */
export async function createMap(
  container: string | HTMLElement,
  options: MapOptions = {}
): Promise<any> {
  await loadAMap();

  const AMap = (window as any).AMap;
  if (!AMap) {
    throw new Error('AMap 对象未加载，请检查网络连接');
  }

  console.log('创建地图实例，容器:', typeof container === 'string' ? container : 'HTMLElement');

  const map = new AMap.Map(container, {
    zoom: options.zoom || 12,
    center: options.center || [104.065735, 30.659462], // 默认成都
    mapStyle: options.mapStyle || 'amap://styles/normal',
    viewMode: '2D',
  });

  // 等待地图完全加载
  return new Promise((resolve, reject) => {
    // 验证地图实例
    if (!map) {
      reject(new Error('地图实例创建失败'));
      return;
    }

    // 验证地图实例是否有必要的方法
    if (typeof map.add !== 'function') {
      console.warn('地图实例缺少 add 方法，但继续尝试加载');
    }

    let resolved = false;
    const resolveOnce = (result: any) => {
      if (!resolved) {
        resolved = true;
        // 再次验证地图实例
        if (result && typeof result.add === 'function') {
          console.log('地图加载完成，实例验证通过');
          resolve(result);
        } else {
          console.error('地图实例验证失败', {
            hasMap: !!result,
            hasAddMethod: result ? typeof result.add === 'function' : false
          });
          reject(new Error('地图实例不完整'));
        }
      }
    };

    map.on('complete', () => {
      console.log('地图加载完成');
      resolveOnce(map);
    });

    // 如果地图已经加载完成，直接返回
    try {
      if (map.getStatus && map.getStatus() === 'complete') {
        console.log('地图已加载完成');
        resolveOnce(map);
        return;
      }
    } catch (e) {
      console.warn('无法获取地图状态，等待 complete 事件');
    }

    // 超时保护
    const timeoutId = setTimeout(() => {
      console.warn('地图加载超时，但将继续使用');
      // 即使超时，也验证地图实例
      if (map && typeof map.add === 'function') {
        resolveOnce(map);
      } else {
        reject(new Error('地图加载超时且实例不完整'));
      }
    }, 5000);
    
    // 清理超时（如果地图提前加载完成）
    map.on('complete', () => {
      clearTimeout(timeoutId);
    });
  });
}

/**
 * POI 搜索结果
 */
export interface SearchResult {
  pois: POI[];
  count: number;
  suggestion?: string[];
}

/**
 * 关键词搜索 POI
 */
export async function searchPOI(
  keyword: string,
  city?: string,
  limit: number = 20
): Promise<SearchResult> {
  await loadAMap();

  return new Promise((resolve, reject) => {
    try {
      const AMap = (window as any).AMap;

      if (!AMap || !AMap.PlaceSearch) {
        console.error('AMap.PlaceSearch 未加载');
        resolve({ pois: [], count: 0 });
        return;
      }

      const placeSearch = new AMap.PlaceSearch({
        city: city || '全国',
        pageSize: limit,
        pageIndex: 1,
        extensions: 'all',
      });

      placeSearch.search(keyword, (status: string, result: any) => {
        console.log('PlaceSearch result:', { status, keyword, result });

        // 处理错误状态
        if (status === 'error') {
          // 尝试多种方式获取错误信息
          const errorInfo = result?.info || result?.result || result?.message || '未知错误';
          console.error('PlaceSearch 错误:', errorInfo);
          console.error('PlaceSearch 完整错误对象:', result);
          
          // INVALID_USER_SCODE 错误提示（安全密钥错误）
          const errorStr = String(errorInfo);
          if (errorStr === 'INVALID_USER_SCODE' || errorStr.includes('INVALID_USER_SCODE')) {
            console.error('❌ 高德地图安全密钥（Security JS Code）配置错误！');
            console.error('请检查：');
            console.error('1. 登录高德控制台：https://console.amap.com/');
            console.error('2. 进入你的应用 → 找到「安全密钥」设置');
            console.error('3. 确认安全密钥与 API Key 匹配（同一个应用下）');
            console.error('4. 检查环境变量 NEXT_PUBLIC_AMAP_SECURITY_JS_CODE 是否正确');
            console.error('5. 如果未配置安全密钥，可以暂时不设置该环境变量（但推荐配置）');
            console.error('6. 如果已配置，请确保安全密钥格式正确（通常是 UUID 或随机字符串）');
          }
          // USERKEY_PLAT_NOMATCH 错误提示
          else if (errorStr === 'USERKEY_PLAT_NOMATCH' || errorStr.includes('USERKEY_PLAT_NOMATCH')) {
            console.error('❌ 高德地图 API Key 平台类型不匹配！');
            console.error('请检查：');
            console.error('1. 确保使用的是 Web 端（JS API）的 Key，不是移动端或其他平台的 Key');
            console.error('2. 在高德控制台配置安全密钥（Security JS Code）');
            console.error('3. 在高德控制台配置域名白名单（允许 localhost:3000 和你的生产域名）');
            console.error('4. 如果已配置安全密钥，请确保环境变量 NEXT_PUBLIC_AMAP_SECURITY_JS_CODE 已设置');
          }
          // 其他错误
          else {
            console.error('❌ 高德地图搜索失败:', errorInfo);
            console.error('请检查 API Key 和安全密钥配置是否正确');
          }
          
          resolve({ pois: [], count: 0 });
          return;
        }

        if (status === 'complete' && result.poiList) {
          const pois: POI[] = result.poiList.pois.map((poi: any) => ({
            id: poi.id,
            name: poi.name,
            address: poi.address || '',
            district: poi.adname || '',
            city: poi.cityname || '',
            longitude: poi.location.lng,
            latitude: poi.location.lat,
            type: poi.type || '',
            tel: poi.tel,
            distance: poi.distance,
          }));
          resolve({
            pois,
            count: result.poiList.count,
          });
        } else if (status === 'no_data') {
          resolve({ pois: [], count: 0 });
        } else {
          // 返回空数组而不是拒绝，让 UI 继续显示
          console.warn('PlaceSearch 搜索未返回有效结果:', { status, result, info: result?.info });
          resolve({ pois: [], count: 0 });
        }
      });
    } catch (error) {
      console.error('PlaceSearch 搜索异常:', error);
      resolve({ pois: [], count: 0 });
    }
  });
}

/**
 * 输入提示（自动补全）
 */
export async function getSuggestions(
  keyword: string,
  city?: string
): Promise<POI[]> {
  await loadAMap();

  return new Promise((resolve, reject) => {
    try {
      const AMap = (window as any).AMap;

      if (!AMap || !AMap.AutoComplete) {
        console.error('AMap.AutoComplete 未加载');
        reject(new Error('高德地图插件未加载完成，请重试'));
        return;
      }

      const autoOptions = {
        city: city || '全国',
      };

      const autoComplete = new AMap.AutoComplete(autoOptions);

      autoComplete.search(keyword, (status: string, result: any) => {
        console.log('AutoComplete result:', { status, result });

        // 处理错误状态
        if (status === 'error') {
          // 尝试多种方式获取错误信息
          const errorInfo = result?.info || result?.result || result?.message || '未知错误';
          console.error('AutoComplete 错误:', errorInfo);
          console.error('AutoComplete 完整错误对象:', result);
          
          // INVALID_USER_SCODE 错误提示（安全密钥错误）
          const errorStr = String(errorInfo);
          if (errorStr === 'INVALID_USER_SCODE' || errorStr.includes('INVALID_USER_SCODE')) {
            console.error('❌ 高德地图安全密钥（Security JS Code）配置错误！');
            console.error('请检查：');
            console.error('1. 登录高德控制台：https://console.amap.com/');
            console.error('2. 进入你的应用 → 找到「安全密钥」设置');
            console.error('3. 确认安全密钥与 API Key 匹配（同一个应用下）');
            console.error('4. 检查环境变量 NEXT_PUBLIC_AMAP_SECURITY_JS_CODE 是否正确');
            console.error('5. 如果未配置安全密钥，可以暂时不设置该环境变量（但推荐配置）');
            console.error('6. 如果已配置，请确保安全密钥格式正确（通常是 UUID 或随机字符串）');
          }
          // USERKEY_PLAT_NOMATCH 错误提示
          else if (errorStr === 'USERKEY_PLAT_NOMATCH' || errorStr.includes('USERKEY_PLAT_NOMATCH')) {
            console.error('❌ 高德地图 API Key 平台类型不匹配！');
            console.error('请检查：');
            console.error('1. 确保使用的是 Web 端（JS API）的 Key，不是移动端或其他平台的 Key');
            console.error('2. 在高德控制台配置安全密钥（Security JS Code）');
            console.error('3. 在高德控制台配置域名白名单（允许 localhost:3000 和你的生产域名）');
            console.error('4. 如果已配置安全密钥，请确保环境变量 NEXT_PUBLIC_AMAP_SECURITY_JS_CODE 已设置');
          }
          // 其他错误
          else {
            console.error('❌ 高德地图搜索失败:', errorInfo);
            console.error('请检查 API Key 和安全密钥配置是否正确');
          }
          
          resolve([]);
          return;
        }

        if (status === 'complete' && result.tips) {
          const pois: POI[] = result.tips
            .filter((tip: any) => tip.location && tip.id)
            .map((tip: any) => ({
              id: tip.id,
              name: tip.name,
              address: tip.address || '',
              district: tip.district || '',
              city: tip.city ? tip.city.name : '',
              longitude: tip.location.lng,
              latitude: tip.location.lat,
              type: tip.type || '',
            }));
          resolve(pois);
        } else if (status === 'no_data') {
          resolve([]);
        } else {
          // 返回空数组而不是拒绝，让 UI 继续显示
          console.warn('AutoComplete 搜索未返回有效结果:', { status, result });
          resolve([]);
        }
      });
    } catch (error) {
      console.error('AutoComplete 搜索异常:', error);
      resolve([]);
    }
  });
}

/**
 * 地理编码（地址 -> 坐标）
 */
export async function geocode(address: string, city?: string): Promise<POI | null> {
  await loadAMap();

  return new Promise((resolve, reject) => {
    const geocoder = new (window as any).AMap.Geocoder({
      city: city || '全国',
    });

    geocoder.getLocation(address, (status: string, result: any) => {
      if (status === 'complete' && result.geocodes.length > 0) {
        const geocode = result.geocodes[0];
        resolve({
          id: geocode.formatted_address,
          name: geocode.formatted_address,
          address: geocode.formatted_address,
          district: geocode.addressComponent?.district || '',
          city: geocode.addressComponent?.city || '',
          longitude: geocode.location.lng,
          latitude: geocode.location.lat,
          type: 'geocode',
        });
      } else if (status === 'no_data') {
        resolve(null);
      } else {
        reject(new Error(result.info || '地理编码失败'));
      }
    });
  });
}

/**
 * 逆地理编码（坐标 -> 地址）
 */
export async function regeocode(
  longitude: number,
  latitude: number
): Promise<{
  address: string;
  district: string;
  city: string;
  province: string;
} | null> {
  await loadAMap();

  return new Promise((resolve, reject) => {
    const geocoder = new (window as any).AMap.Geocoder();

    const lnglat = new (window as any).AMap.LngLat(longitude, latitude);

    geocoder.getAddress(lnglat, (status: string, result: any) => {
      if (status === 'complete' && result.regeocode) {
        const component = result.regeocode.addressComponent;
        resolve({
          address: result.regeocode.formattedAddress,
          district: component.district || '',
          city: component.city || '',
          province: component.province || '',
        });
      } else if (status === 'no_data') {
        resolve(null);
      } else {
        reject(new Error(result.info || '逆地理编码失败'));
      }
    });
  });
}

/**
 * 获取当前位置
 */
export async function getCurrentPosition(): Promise<{
  longitude: number;
  latitude: number;
  address?: string;
  city?: string;
}> {
  await loadAMap();

  return new Promise((resolve, reject) => {
    const geolocation = new (window as any).AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    geolocation.getCurrentPosition((status: string, result: any) => {
      if (status === 'complete') {
        resolve({
          longitude: result.position.lng,
          latitude: result.position.lat,
          address: result.formattedAddress,
          city: result.addressComponent?.city,
        });
      } else {
        reject(new Error(result.info || '获取位置失败'));
      }
    });
  });
}

/**
 * 在地图上添加标记
 */
export function addMarker(
  map: any,
  position: [number, number],
  options: {
    title?: string;
    icon?: string;
    label?: string;
    color?: string;
  } = {}
): any {
  // 首先验证 map 参数
  if (!map) {
    console.error('addMarker: map 参数为 undefined 或 null');
    return null;
  }

  // 验证 map 的类型和结构
  if (typeof map !== 'object') {
    console.error('addMarker: map 不是对象', typeof map, map);
    return null;
  }

  // 验证 map 是否有 add 方法（这是最关键的方法）
  if (typeof map.add !== 'function') {
    console.error('addMarker: map 对象没有 add 方法', {
      mapType: typeof map,
      mapKeys: map ? Object.keys(map) : [],
      map: map
    });
    return null;
  }

  const AMap = (window as any).AMap;
  if (!AMap) {
    console.error('addMarker: AMap 对象未加载');
    return null;
  }

  if (!position || position.length !== 2 || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
    console.error('addMarker: 无效的位置参数', position);
    return null;
  }

  // 验证 AMap 的必要类是否存在
  if (!AMap.LngLat || !AMap.Marker) {
    console.error('addMarker: AMap 类未完全加载', {
      hasLngLat: !!AMap.LngLat,
      hasMarker: !!AMap.Marker,
      hasIcon: !!AMap.Icon,
      hasSize: !!AMap.Size
    });
    return null;
  }

  try {
    // 再次确认 map 和 add 方法存在（双重检查）
    if (!map || typeof map.add !== 'function') {
      console.error('addMarker: 在创建标记前验证失败', {
        mapExists: !!map,
        hasAddMethod: map ? typeof map.add === 'function' : false
      });
      return null;
    }

    // 创建位置对象
    const lngLat = new AMap.LngLat(position[0], position[1]);
    
    const markerOptions: any = {
      position: lngLat,
      title: options.title || '',
    };

    // 自定义图标
    if (options.icon) {
      if (!AMap.Icon || !AMap.Size) {
        console.warn('addMarker: AMap.Icon 或 AMap.Size 未加载，跳过自定义图标');
      } else {
        markerOptions.icon = new AMap.Icon({
          image: options.icon,
          size: new AMap.Size(32, 32),
          imageSize: new AMap.Size(32, 32),
        });
      }
    }

    // 使用内置彩色图标
    if (options.color) {
      if (!AMap.Icon || !AMap.Size) {
        console.warn('addMarker: AMap.Icon 或 AMap.Size 未加载，跳过彩色图标');
      } else {
        const colorMap: Record<string, string> = {
          red: '#ef4444',
          blue: '#3b82f6',
          green: '#22c55e',
          yellow: '#eab308',
          purple: '#a855f7',
        };
        const color = colorMap[options.color] || options.color;
        markerOptions.icon = new AMap.Icon({
          image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `)}`,
          size: new AMap.Size(32, 32),
          imageSize: new AMap.Size(32, 32),
        });
      }
    }

    // 创建标记
    const marker = new AMap.Marker(markerOptions);
    
    // 在调用 add 之前再次验证
    if (!map || typeof map.add !== 'function') {
      console.error('addMarker: 在调用 add 前 map 变为无效');
      return null;
    }

    map.add(marker);
    return marker;
  } catch (error: any) {
    console.error('addMarker: 创建标记失败', {
      error: error?.message || error?.toString() || error,
      errorType: error?.constructor?.name,
      errorStack: error?.stack,
      mapType: typeof map,
      hasMap: !!map,
      hasAddMethod: map ? typeof map.add === 'function' : false,
      hasAMap: !!AMap,
      hasLngLat: !!AMap?.LngLat,
      hasMarker: !!AMap?.Marker,
      hasIcon: !!AMap?.Icon,
      hasSize: !!AMap?.Size,
      position,
      options
    });
    return null;
  }
}

/**
 * 在地图上绘制路线
 */
export function drawPolyline(
  map: any,
  path: [number, number][],
  options: {
    color?: string;
    weight?: number;
    opacity?: number;
  } = {}
): any {
  const AMap = (window as any).AMap;

  const polyline = new AMap.Polyline({
    path: path.map(p => new AMap.LngLat(p[0], p[1])),
    borderWeight: 1,
    strokeColor: options.color || '#3b82f6',
    strokeWeight: options.weight || 4,
    strokeOpacity: options.opacity || 0.8,
  });

  map.add(polyline);

  return polyline;
}

/**
 * 自动适配地图视野以包含所有标记
 */
export function fitView(map: any, markers: any[]): void {
  if (markers.length === 0) return;
  map.setFitView(markers);
}

/**
 * 创建信息窗口
 */
export function createInfoWindow(content: string | HTMLElement): any {
  const AMap = (window as any).AMap;
  return new AMap.InfoWindow({
    content: content,
    offset: new AMap.Pixel(0, -32),
  });
}

/**
 * 导出工具函数
 */
export const amapUtils = {
  loadAMap,
  createMap,
  searchPOI,
  getSuggestions,
  geocode,
  regeocode,
  getCurrentPosition,
  addMarker,
  drawPolyline,
  fitView,
  createInfoWindow,
};

export default amapUtils;
