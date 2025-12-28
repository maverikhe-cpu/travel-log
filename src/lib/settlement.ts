import { Expense, ExpenseSplit } from '@/types/models';

export interface Settlement {
    from: string;
    to: string;
    amount: number;
}

export function calculateSettlements(expenses: Expense[], splits: ExpenseSplit[]): Settlement[] {

    const balances: Record<string, number> = {};

    // Add what items people paid for (Credits)
    expenses.forEach(e => {
        balances[e.payer_id] = (balances[e.payer_id] || 0) + e.amount;
    });


    // Process splits with deduplication and validation
    // Group splits by expense_id and user_id to handle duplicates
    const splitsByExpenseAndUser = new Map<string, number>();
    splits.forEach((s) => {
        const key = `${s.expense_id}_${s.user_id}`;
        splitsByExpenseAndUser.set(key, (splitsByExpenseAndUser.get(key) || 0) + s.amount);
    });

    // For each expense, validate and correct splits if needed
    const correctedSplits: Array<{ expense_id: string; user_id: string; amount: number }> = [];
    const processedExpenses = new Set<string>();

    expenses.forEach(expense => {
        if (processedExpenses.has(expense.id)) return;
        processedExpenses.add(expense.id);

        // Get all participants for this expense
        const participants = Array.from(
            new Set(
                splits
                    .filter(s => s.expense_id === expense.id)
                    .map(s => s.user_id)
            )
        );

        // Calculate total splits for this expense
        const expenseSplitsTotal = splits
            .filter(s => s.expense_id === expense.id)
            .reduce((sum, s) => sum + s.amount, 0);

        // If splits don't match expense amount, recalculate
        if (Math.abs(expenseSplitsTotal - expense.amount) > 0.01 && participants.length > 0) {
            const correctAmount = parseFloat((expense.amount / participants.length).toFixed(2));
            const remainder = expense.amount - (correctAmount * participants.length);
            // Add remainder to first participant
            const firstParticipantId = participants[0];
            participants.forEach((userId, index) => {
                const userAmount = userId === firstParticipantId
                    ? correctAmount + remainder
                    : correctAmount;
                correctedSplits.push({
                    expense_id: expense.id,
                    user_id: userId,
                    amount: userAmount,
                });
            });
        } else {
            // Use deduplicated splits
            participants.forEach(userId => {
                const key = `${expense.id}_${userId}`;
                const totalAmount = splitsByExpenseAndUser.get(key) || 0;
                if (totalAmount > 0) {
                    correctedSplits.push({
                        expense_id: expense.id,
                        user_id: userId,
                        amount: totalAmount,
                    });
                }
            });
        }
    });


    // Subtract what people consumed (Debts) using corrected splits
    correctedSplits.forEach(s => {
        balances[s.user_id] = (balances[s.user_id] || 0) - s.amount;
    });



    const debtors: { id: string, amount: number }[] = [];
    const creditors: { id: string, amount: number }[] = [];

    Object.entries(balances).forEach(([id, amount]) => {
        const rounded = Math.round(amount * 100) / 100;
        if (rounded < -0.01) debtors.push({ id, amount: rounded });
        if (rounded > 0.01) creditors.push({ id, amount: rounded });
    });



    // Sort to optimize number of transactions (greedy approach)
    debtors.sort((a, b) => a.amount - b.amount); // Most negative first
    creditors.sort((a, b) => b.amount - a.amount); // Most positive first

    const settlements: Settlement[] = [];
    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const debt = Math.abs(debtor.amount);
        const credit = creditor.amount;

        // Amount to transfer is the minimum of what debtor owes and what creditor is owed
        const amount = Math.min(debt, credit);

        // Push settlement
        if (amount > 0.01) {
            settlements.push({ from: debtor.id, to: creditor.id, amount });
        }

        // Update remaining amounts
        debtor.amount += amount; // increasing towards 0
        creditor.amount -= amount; // decreasing towards 0

        // Move indices if settled
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (Math.abs(creditor.amount) < 0.01) j++;
    }


    return settlements;
}
