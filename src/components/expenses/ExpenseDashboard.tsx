import { Expense, ExpenseSplit } from '@/types/models';
import { useMemo } from 'react';
import { Wallet, TrendingUp, CreditCard } from 'lucide-react';

interface ExpenseDashboardProps {
    expenses: Expense[];
    expenseSplits: ExpenseSplit[];
    currentUserId: string;
}

export default function ExpenseDashboard({ expenses, expenseSplits, currentUserId }: ExpenseDashboardProps) {
    const stats = useMemo(() => {
        let totalSpend = 0;
        let mySpend = 0;
        let myAdvanced = 0;

        expenses.forEach((e) => {
            totalSpend += e.amount;
            if (e.payer_id === currentUserId) {
                myAdvanced += e.amount;
            }
        });

        // Group splits by expense_id and user_id to handle duplicates
        // If there are duplicate splits for the same expense_id and user_id, sum them
        const splitsByExpenseAndUser = new Map<string, number>();
        expenseSplits.forEach((s) => {
            const key = `${s.expense_id}_${s.user_id}`;
            splitsByExpenseAndUser.set(key, (splitsByExpenseAndUser.get(key) || 0) + s.amount);
        });

        // Calculate mySpend from deduplicated splits
        // Only process each expense once for the current user
        // If splits don't match expense amount, recalculate based on expense amount and participants
        const processedExpenses = new Set<string>();
        splitsByExpenseAndUser.forEach((totalAmount, key) => {
            const [expenseId, userId] = key.split('_');
            if (userId === currentUserId && !processedExpenses.has(expenseId)) {
                const expense = expenses.find(e => e.id === expenseId);
                if (expense) {
                    // Get all participants for this expense
                    const participants = Array.from(
                        new Set(
                            expenseSplits
                                .filter(s => s.expense_id === expenseId)
                                .map(s => s.user_id)
                        )
                    );
                    
                    // Calculate total splits for this expense
                    const expenseSplitsTotal = expenseSplits
                        .filter(s => s.expense_id === expenseId)
                        .reduce((sum, s) => sum + s.amount, 0);
                    
                    // If splits don't match expense amount, recalculate
                    if (Math.abs(expenseSplitsTotal - expense.amount) > 0.01 && participants.length > 0) {
                        const correctAmount = parseFloat((expense.amount / participants.length).toFixed(2));
                        const remainder = expense.amount - (correctAmount * participants.length);
                        // Add remainder to first participant
                        const firstParticipantId = participants[0];
                        const userAmount = currentUserId === firstParticipantId
                            ? correctAmount + remainder
                            : correctAmount;
                        mySpend += userAmount;
                    } else {
                        // Use the deduplicated amount
                        mySpend += totalAmount;
                    }
                } else {
                    // Fallback: use the deduplicated amount
                    mySpend += totalAmount;
                }
                processedExpenses.add(expenseId);
            }
        });

        return { totalSpend, mySpend, myAdvanced };
    }, [expenses, expenseSplits, currentUserId]);

    const formatMoney = (amount: number) => {
        return '¥' + amount.toFixed(2);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300" data-testid="dashboard-total-expense">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100/50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-medium text-ink-500">行程总支出</h3>
                    </div>
                    <p className="text-2xl font-serif font-bold text-ink-900 mt-2" data-testid="dashboard-total-amount">
                        {formatMoney(stats.totalSpend)}
                    </p>
                </div>
            </div>

            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300" data-testid="dashboard-my-expense">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-medium text-ink-500">我的消费</h3>
                    </div>
                    <p className="text-2xl font-serif font-bold text-ink-900 mt-2" data-testid="dashboard-my-expense-amount">
                        {formatMoney(stats.mySpend)}
                    </p>
                </div>
            </div>

            <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300" data-testid="dashboard-my-advance">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-medium text-ink-500">我的垫付</h3>
                    </div>
                    <p className="text-2xl font-serif font-bold text-ink-900 mt-2" data-testid="dashboard-my-advance-amount">
                        {formatMoney(stats.myAdvanced)}
                    </p>
                </div>
            </div>
        </div>
    );
}
