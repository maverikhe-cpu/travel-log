import { createClient } from '@/lib/supabase/client';
import { Expense, ExpenseSplit } from '@/types/models';

export const expenseService = {
    async fetchExpenses(tripId: string) {
        const supabase = createClient();

        // Fetch expenses
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('trip_id', tripId);

        if (expensesError) throw expensesError;
        if (!expenses || expenses.length === 0) return { expenses: [], splits: [] };

        // Fetch splits
        const expenseIds = expenses.map(e => e.id);
        const { data: splits, error: splitsError } = await supabase
            .from('expense_splits')
            .select('*')
            .in('expense_id', expenseIds);

        if (splitsError) throw splitsError;

        return { expenses: expenses as Expense[], splits: splits as ExpenseSplit[] };
    },

    async createExpense(
        expense: Omit<Expense, 'id' | 'created_at'>,
        splits: Omit<ExpenseSplit, 'id' | 'expense_id'>[]
    ) {
        const supabase = createClient();

        // 1. Insert Expense
        const { data: newExpense, error: expenseError } = await supabase
            .from('expenses')
            .insert(expense)
            .select()
            .single();

        if (expenseError) throw expenseError;

        // 2. Insert Splits
        const splitsWithId = splits.map(s => ({
            ...s,
            expense_id: newExpense.id
        }));

        const { data: newSplits, error: splitsError } = await supabase
            .from('expense_splits')
            .insert(splitsWithId)
            .select();

        if (splitsError) {
            // Rollback expense if splits fail? 
            // For simplicity in this demo, we'll assume success or just throw.
            // Ideally we'd delete the expense here.
            await supabase.from('expenses').delete().eq('id', newExpense.id);
            throw splitsError;
        }

        return { expense: newExpense as Expense, splits: newSplits as ExpenseSplit[] };
    },

    async updateExpense(
        expenseId: string,
        expense: Partial<Omit<Expense, 'id' | 'created_at' | 'trip_id' | 'created_by'>>,
        splits?: { user_id: string; amount: number }[]
    ) {
        const supabase = createClient();

        // Get current user to track who made the update
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;


        // 1. Update Expense (include updated_by to track modifier)
        const { data: updatedExpense, error: expenseError } = await supabase
            .from('expenses')
            .update({ ...expense, updated_by: currentUserId })
            .eq('id', expenseId)
            .select()
            .maybeSingle();


        if (expenseError) throw expenseError;
        
        // 如果更新返回 0 行，可能是 RLS 策略阻止了更新
        if (!updatedExpense) {
            throw new Error('更新失败：没有找到要更新的费用记录，可能是权限不足');
        }

        // 2. Update Splits if provided
        let updatedSplits: ExpenseSplit[] = [];
        if (splits) {

            // Delete existing splits
            const { error: deleteError } = await supabase
                .from('expense_splits')
                .delete()
                .eq('expense_id', expenseId);


            if (deleteError) throw deleteError;

            // Insert new splits
            const splitsWithId = splits.map(s => ({
                ...s,
                expense_id: expenseId
            }));

            const { data: newSplits, error: splitsError } = await supabase
                .from('expense_splits')
                .insert(splitsWithId)
                .select();


            if (splitsError) throw splitsError;
            updatedSplits = newSplits as ExpenseSplit[];
        }

        return { expense: updatedExpense as Expense, splits: updatedSplits };
    },

    async deleteExpense(expenseId: string) {
        const supabase = createClient();
        const { data, error, count } = await supabase
            .from('expenses')
            .delete({ count: 'exact' })
            .eq('id', expenseId);

        if (error) throw error;

        // 如果删除了 0 行，说明可能是权限问题
        if (count === 0) {
            throw new Error('删除失败：没有找到要删除的费用记录，可能是权限不足或记录已被删除');
        }
    }
};
