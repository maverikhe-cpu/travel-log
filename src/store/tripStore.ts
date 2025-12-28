import { create } from 'zustand';
import { Activity, Trip, TripMember, TravelLog, TripImage, Expense, ExpenseSplit } from '@/types/models';


interface TripState {
  // 当前行程
  currentTrip: Trip | null;
  members: TripMember[];
  activities: Activity[];
  travelLogs: TravelLog[];
  images: TripImage[];
  expenses: Expense[];
  expenseSplits: ExpenseSplit[];

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

  // Expense Actions
  setExpenses: (expenses: Expense[]) => void;
  setExpenseSplits: (splits: ExpenseSplit[]) => void;
  addExpense: (expense: Expense, splits: ExpenseSplit[]) => void;
  updateExpense: (id: string, updates: Partial<Expense>, newSplits?: ExpenseSplit[]) => void;
  deleteExpense: (id: string) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  members: [],
  activities: [],
  travelLogs: [],
  images: [],
  expenses: [],
  expenseSplits: [],
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

  setExpenses: (expenses) => set({ expenses }),
  setExpenseSplits: (splits) => set({ expenseSplits: splits }),

  addExpense: (expense, splits) =>
    set((state) => ({
      expenses: [...state.expenses, expense],
      expenseSplits: [...state.expenseSplits, ...splits],
    })),

  updateExpense: (id, updates, newSplits) =>
    set((state) => {
      const updatedExpenses = state.expenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );

      let updatedSplits = state.expenseSplits;
      if (newSplits) {
        updatedSplits = state.expenseSplits.filter(s => s.expense_id !== id).concat(newSplits);
      }

      return {
        expenses: updatedExpenses,
        expenseSplits: updatedSplits,
      };
    }),

  deleteExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
      expenseSplits: state.expenseSplits.filter((s) => s.expense_id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      currentTrip: null,
      members: [],
      activities: [],
      travelLogs: [],
      images: [],
      expenses: [],
      expenseSplits: [],
      isLoading: false,
    }),
}));
