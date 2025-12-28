import { create } from 'zustand';
import { Activity, Trip, TripMember, TravelLog, TripImage } from '@/types/models';

interface TripState {
  // 当前行程
  currentTrip: Trip | null;
  members: TripMember[];
  activities: Activity[];
  travelLogs: TravelLog[];
  images: TripImage[];

  // 加载状态
  isLoading: boolean;

  // Actions
  setCurrentTrip: (trip: Trip | null) => void;
  setMembers: (members: TripMember[]) => void;
  setActivities: (activities: Activity[]) => void;
  setTravelLogs: (logs: TravelLog[]) => void;
  setImages: (images: TripImage[]) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  members: [],
  activities: [],
  travelLogs: [],
  images: [],
  isLoading: false,

  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setMembers: (members) => set({ members }),
  setActivities: (activities) => set({ activities }),
  setTravelLogs: (logs) => set({ travelLogs: logs }),
  setImages: (images) => set({ images }),

  addActivity: (activity) =>
    set((state) => ({ activities: [...state.activities, activity] })),

  updateActivity: (id, updates) =>
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  deleteActivity: (id) =>
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      currentTrip: null,
      members: [],
      activities: [],
      travelLogs: [],
      images: [],
      isLoading: false,
    }),
}));
