'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store/tripStore';
import { Expense, ExpenseSplit, TripWithMembers } from '@/types/models';
import ExpenseDashboard from '@/components/expenses/ExpenseDashboard';
import ExpenseList from '@/components/expenses/ExpenseList';
import ExpenseFormModal from '@/components/expenses/ExpenseFormModal';
import SettlementReport from '@/components/expenses/SettlementReport';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { expenseService } from '@/lib/expenses';
import Link from 'next/link';


interface ExpensesClientPageProps {
    trip: TripWithMembers;
    expenses: Expense[];
    splits: ExpenseSplit[];
    currentUserId: string;
}

export default function ExpensesClientPage({ trip, expenses: initialExpenses, splits: initialSplits, currentUserId }: ExpensesClientPageProps) {
    const router = useRouter();
    const { expenses, expenseSplits, setExpenses, setExpenseSplits, addExpense, updateExpense: updateExpenseStore, deleteExpense: deleteExpenseStore } = useTripStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editingExpenseSplits, setEditingExpenseSplits] = useState<string[]>([]);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 过滤掉云伴游成员（不参与费用分摊）
    const eligibleMembers = useMemo(() => {
        return (trip.members || []).filter(m => m.role !== 'companion');
    }, [trip.members]);

    // Initialize store
    useEffect(() => {
        setExpenses(initialExpenses);
        setExpenseSplits(initialSplits);
    }, [initialExpenses, initialSplits, setExpenses, setExpenseSplits]);

    const handleCreateExpense = async (data: any) => {
        setIsSubmitting(true);
        try {
            // Remove duplicates from involved_users
            const uniqueUsers = Array.from(new Set(data.involved_users as string[]));
            
            // Calculate splits using Math.round to avoid floating point precision issues
            const splitCount = uniqueUsers.length;
            const baseAmount = Math.round((data.amount / splitCount) * 100) / 100;
            const remainder = Math.round((data.amount - baseAmount * splitCount) * 100) / 100;

            const splitsPayload = uniqueUsers.map((uid, index) => ({
                user_id: uid,
                // First user gets the remainder to ensure total matches exactly
                amount: index === 0 ? Math.round((baseAmount + remainder) * 100) / 100 : baseAmount
            }));

            const payload = {
                trip_id: trip.id,
                title: data.title,
                amount: data.amount,
                category: data.category,
                payer_id: data.payer_id,
                expense_date: data.expense_date,
                created_by: currentUserId
            };

            const { expense, splits } = await expenseService.createExpense(payload, splitsPayload);

            addExpense(expense, splits);
            router.refresh();
        } catch (error) {
            console.error('Failed to create expense', error);
            alert('保存失败，请重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditExpense = async (data: any) => {
        if (!editingExpense) return;

        setIsSubmitting(true);
        let payload: any = null;
        try {
            // Remove duplicates from involved_users
            const uniqueUsers = Array.from(new Set(data.involved_users as string[]));
            
            const splitCount = uniqueUsers.length;
            // Use Math.round to avoid floating point precision issues
            const baseAmount = Math.round((data.amount / splitCount) * 100) / 100;
            const remainder = Math.round((data.amount - baseAmount * splitCount) * 100) / 100;

            const splitsPayload = uniqueUsers.map((uid, index) => ({
                user_id: uid,
                // First user gets the remainder to ensure total matches exactly
                amount: index === 0 ? Math.round((baseAmount + remainder) * 100) / 100 : baseAmount
            }));

            payload = {
                title: data.title,
                amount: data.amount,
                category: data.category,
                payer_id: data.payer_id,
                expense_date: data.expense_date,
            };


            const { expense, splits } = await expenseService.updateExpense(
                editingExpense.id,
                payload,
                splitsPayload
            );

            updateExpenseStore(editingExpense.id, payload, splits);
            router.refresh();
        } catch (error: any) {
            console.error('Failed to update expense', error);
            alert('更新失败，请重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (expense: Expense) => {
        // Get existing splits for this expense
        const rawSplits = expenseSplits
            .filter(s => s.expense_id === expense.id)
            .map(s => s.user_id);
        
        // Remove duplicates
        const existingSplits = Array.from(new Set(rawSplits));

        setEditingExpense(expense);
        setEditingExpenseSplits(existingSplits);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = async (expenseId: string) => {
        if (!confirm('确定要删除这笔费用吗？')) return;

        setIsSubmitting(true);
        try {
            await expenseService.deleteExpense(expenseId);
            deleteExpenseStore(expenseId);
            router.refresh();
        } catch (error) {
            console.error('Failed to delete expense', error);
            alert('删除失败，请重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-ink-800 pb-24 md:pb-12">
            {/* Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Header */}
            <header className="sticky top-0 z-30 glass-nav transition-all duration-300 border-b border-white/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/trips/${trip.id}`}>
                            <button className="p-2 hover:bg-white/50 rounded-full transition-colors text-ink-600 hover:text-ink-900 touch-target">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-serif font-bold text-ink-900">费用账本</h1>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-ink-600 hover:text-primary-600 gap-2"
                        onClick={() => setIsReportOpen(true)}
                        data-testid="settlement-report-button"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">结算报告</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 relative z-10">
                <ExpenseDashboard
                    expenses={expenses}
                    expenseSplits={expenseSplits}
                    currentUserId={currentUserId}
                />

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-serif font-bold text-ink-900">支出明细</h2>
                    <Button onClick={() => setIsAddModalOpen(true)} className="rounded-full shadow-lg shadow-primary-500/20" data-testid="add-expense-button">
                        <Plus className="w-4 h-4 mr-2" />
                        记一笔
                    </Button>
                </div>

                <ExpenseList
                    expenses={expenses}
                    members={eligibleMembers}
                    currentUserId={currentUserId}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                />
            </main>

            <ExpenseFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleCreateExpense}
                members={eligibleMembers}
                currentUserId={currentUserId}
            />

            <ExpenseFormModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingExpense(null);
                    setEditingExpenseSplits([]);
                }}
                onSave={handleEditExpense}
                members={eligibleMembers}
                currentUserId={currentUserId}
                editExpense={editingExpense}
                existingSplits={editingExpenseSplits}
            />

            {isReportOpen && (
                <SettlementReport
                    expenses={expenses}
                    splits={expenseSplits}
                    members={eligibleMembers}
                    onClose={() => setIsReportOpen(false)}
                    currentUserId={currentUserId}
                />
            )}

            {isSubmitting && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/50 backdrop-blur-sm cursor-wait">
                    <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                        <span className="font-medium text-ink-900">保存中...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
