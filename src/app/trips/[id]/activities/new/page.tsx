'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Clock, Save, ChevronDown, Search, Navigation } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ACTIVITY_CATEGORIES, PRESET_LOCATIONS, CITIES } from '@/lib/constants';
import POISearch, { type POI } from '@/components/map/poi-search';
import type { ActivityCategory } from '@/types/models';

// 常用时间预设
const TIME_PRESETS = [
  { label: '早晨', time: '08:00' },
  { label: '上午', time: '10:00' },
  { label: '中午', time: '12:00' },
  { label: '下午', time: '14:00' },
  { label: '傍晚', time: '17:00' },
  { label: '晚上', time: '19:00' },
  { label: '深夜', time: '22:00' },
];

export default function NewActivityPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('attraction');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 地理位置相关状态
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [poiId, setPoiId] = useState<string | null>(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationDistrict, setLocationDistrict] = useState('');
  const [useMapSearch, setUseMapSearch] = useState(false);

  // 预置地点筛选
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [searchPreset, setSearchPreset] = useState('');

  // 时间选择器状态
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
      setDate(dateParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!title) {
      setError('请输入活动标题');
      setLoading(false);
      return;
    }

    if (!date) {
      setError('请选择日期');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from('activities').insert({
        trip_id: tripId,
        day_date: date,
        title,
        location: location || null,
        description: description || null,
        category,
        start_time: startTime || null,
        end_time: endTime || null,
        // 地理位置字段
        longitude,
        latitude,
        poi_id: poiId,
        address: locationAddress || null,
        city: locationCity || null,
        district: locationDistrict || null,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push(`/trips/${tripId}/calendar?date=${date}`);
      }
    } catch {
      setError('创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理 POI 选择
  const handlePOISelect = (poi: POI) => {
    setTitle(poi.name);
    setLocation(poi.address || poi.name);
    setLongitude(poi.longitude);
    setLatitude(poi.latitude);
    setPoiId(poi.id);
    setLocationAddress(poi.address);
    setLocationCity(poi.city);
    setLocationDistrict(poi.district);
    setUseMapSearch(false);
  };

  // 处理预置地点选择
  const handleSelectPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setTitle(preset.name);
    setLocation(preset.city ? `${preset.city} - ${preset.name}` : preset.name);
    if (preset.category) {
      setCategory(preset.category);
    }
    // 如果预置地点有坐标，使用预置坐标
    if (preset.longitude && preset.latitude) {
      setLongitude(preset.longitude);
      setLatitude(preset.latitude);
      setPoiId(preset.id);
      setLocationCity(preset.city || '');
    } else {
      setLongitude(null);
      setLatitude(null);
      setPoiId(null);
      setLocationCity('');
    }
    setLocationAddress('');
    setLocationDistrict('');
    setShowPresetDropdown(false);
  };

  // 切换到地图搜索
  const handleToggleMapSearch = () => {
    setUseMapSearch(!useMapSearch);
  };

  // 清除地理位置
  const handleClearLocation = () => {
    setLongitude(null);
    setLatitude(null);
    setPoiId(null);
    setLocationAddress('');
    setLocationCity('');
    setLocationDistrict('');
  };

  // 获取筛选后的预置地点
  const getFilteredPresets = () => {
    let filtered = PRESET_LOCATIONS.filter(loc => loc.category === 'attraction' || loc.category === 'food');

    if (selectedCity !== 'all') {
      filtered = filtered.filter(loc => loc.city === selectedCity);
    }

    if (searchPreset) {
      filtered = filtered.filter(loc =>
        loc.name.toLowerCase().includes(searchPreset.toLowerCase()) ||
        loc.city?.toLowerCase().includes(searchPreset.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredPresets = getFilteredPresets();
  const categoryConfig = ACTIVITY_CATEGORIES[category];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/trips/${tripId}/calendar${date ? `?date=${date}` : ''}`}>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-target">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold">添加活动</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 日期选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 活动标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活动标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：参观宽窄巷子"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 预置地点选择器 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              快速选择川渝热门地点
            </label>

            {/* 搜索模式切换 */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setUseMapSearch(false); setLongitude(null); setLatitude(null); }}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                  !useMapSearch
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Search className="w-4 h-4" />
                预置地点
              </button>
              <button
                type="button"
                onClick={() => { setUseMapSearch(true); }}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                  useMapSearch
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Navigation className="w-4 h-4" />
                地图搜索
              </button>
            </div>

            {/* 城市筛选 */}
            {!useMapSearch && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedCity('all')}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedCity === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                      selectedCity === city
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}

            {/* 地点搜索和下拉 / 地图搜索 */}
            {!useMapSearch ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
                >
                  <span className="text-gray-500 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    {selectedCity === 'all' ? '搜索地点...' : `搜索${selectedCity}地点...`}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {showPresetDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    {/* 搜索框 */}
                    <div className="p-3 border-b border-gray-100">
                      <input
                        type="text"
                        value={searchPreset}
                        onChange={(e) => setSearchPreset(e.target.value)}
                        placeholder="搜索景点名称..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        autoFocus
                      />
                    </div>

                    {/* 地点列表 */}
                    <div className="overflow-y-auto max-h-60">
                      {filteredPresets.length > 0 ? (
                        filteredPresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{preset.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                  {preset.city && <span>{preset.city}</span>}
                                  {preset.description && <span>·</span>}
                                  {preset.description && <span className="truncate max-w-xs">{preset.description}</span>}
                                </div>
                              </div>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {preset.category === 'attraction' ? '景点' : '美食'}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          没有找到匹配的地点
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <POISearch
                  city={selectedCity !== 'all' ? selectedCity : undefined}
                  onSelect={handlePOISelect}
                  placeholder="搜索地点，如：宽窄巷子、春熙路..."
                  defaultValue={location}
                />
                {longitude && latitude && (
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {locationCity && <span>{locationCity}</span>}
                      {locationDistrict && <span> · {locationDistrict}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      清除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 活动类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活动类型
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ACTIVITY_CATEGORIES).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as ActivityCategory)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    category === key
                      ? `${config.bgColor} ${config.color} border-current`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* 地点 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              地点
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如：成都市青羊区宽窄巷子"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 时间选择 - 改进版 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 开始时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始时间
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStartDropdown(!showStartDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
                >
                  <span className={startTime ? 'text-gray-900' : 'text-gray-400'}>
                    {startTime || '选择时间'}
                  </span>
                  <Clock className="w-4 h-4 text-gray-400" />
                </button>

                {showStartDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {/* 时间预设 */}
                    <div className="p-2 grid grid-cols-3 gap-1">
                      {TIME_PRESETS.map((preset) => (
                        <button
                          key={preset.time}
                          type="button"
                          onClick={() => {
                            setStartTime(preset.time);
                            setShowStartDropdown(false);
                          }}
                          className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 p-2">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          setShowStartDropdown(false);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 结束时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束时间
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEndDropdown(!showEndDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
                >
                  <span className={endTime ? 'text-gray-900' : 'text-gray-400'}>
                    {endTime || '选择时间'}
                  </span>
                  <Clock className="w-4 h-4 text-gray-400" />
                </button>

                {showEndDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 grid grid-cols-3 gap-1">
                      {TIME_PRESETS.map((preset) => (
                        <button
                          key={preset.time}
                          type="button"
                          onClick={() => {
                            setEndTime(preset.time);
                            setShowEndDropdown(false);
                          }}
                          className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 p-2">
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          setShowEndDropdown(false);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活动描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加一些备注..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <Link
              href={`/trips/${tripId}/calendar${date ? `?date=${date}` : ''}`}
              className="flex-1"
            >
              <Button type="button" variant="outline" className="w-full">
                取消
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={loading || !title || !date}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
