/**
 * 高德地图 API 封装
 * 提供地图加载、POI 搜索、地理编码等功能
 */

import AMapLoader from '@amap/amap-jsapi-loader';

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

  loadPromise = AMapLoader.load({
    key: AMAP_KEY,
    version: AMAP_VERSION,
    plugins: PLUGINS,
  }).then(() => {
    mapLoaded = true;
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

  const map = new (window as any).AMap.Map(container, {
    zoom: options.zoom || 12,
    center: options.center || [104.065735, 30.659462], // 默认成都
    mapStyle: options.mapStyle || 'amap://styles/normal',
    viewMode: '2D',
  });

  return map;
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
    const placeSearch = new (window as any).AMap.PlaceSearch({
      city: city || '全国',
      pageSize: limit,
      pageIndex: 1,
      extensions: 'all',
    });

    placeSearch.search(keyword, (status: string, result: any) => {
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
        reject(new Error(result.info || '搜索失败'));
      }
    });
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
    const autoOptions = {
      city: city || '全国',
      input: keyword,
    };

    const autoComplete = new (window as any).AMap.AutoComplete(autoOptions);

    autoComplete.search(keyword, (status: string, result: any) => {
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
        reject(new Error(result.info || '获取提示失败'));
      }
    });
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
  const AMap = (window as any).AMap;

  const markerOptions: any = {
    position: new AMap.LngLat(position[0], position[1]),
    title: options.title || '',
  };

  // 自定义图标
  if (options.icon) {
    markerOptions.icon = new AMap.Icon({
      image: options.icon,
      size: new AMap.Size(32, 32),
      imageSize: new AMap.Size(32, 32),
    });
  }

  // 使用内置彩色图标
  if (options.color) {
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

  const marker = new AMap.Marker(markerOptions);
  map.add(marker);

  return marker;
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
