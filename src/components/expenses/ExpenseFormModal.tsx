import { useState, useEffect, useRef } from 'react';
import { TripMember, ExpenseCategory, Expense } from '@/types/models';
import { X, Check, Calendar, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
    { value: 'food', label: '餐饮' },
    { value: 'transport', label: '交通' },
    { value: 'accommodation', label: '住宿' },
    { value: 'ticket', label: '门票' },
    { value: 'shopping', label: '购物' },
    { value: 'other', label: '其他' },
];

interface ExpenseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: {
        title: string;
        amount: number;
        category: ExpenseCategory;
        payer_id: string;
        expense_date: string;
        involved_users: string[];
    }) => void;
    members: TripMember[];
    currentUserId: string;
    editExpense?: Expense | null;
    existingSplits?: string[]; // user_ids that are involved in the expense
}

export default function ExpenseFormModal({
    isOpen,
    onClose,
    onSave,
    members,
    currentUserId,
    editExpense,
    existingSplits = [],
}: ExpenseFormModalProps) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('food');
    const [payerId, setPayerId] = useState(currentUserId);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [involvedUsers, setInvolvedUsers] = useState<string[]>([]);

    // Track the last edited expense to detect changes
    const lastEditExpenseId = useRef<string | null>(null);

    useEffect(() => {
        const isExpenseChanged = editExpense?.id !== lastEditExpenseId.current;

        if (isOpen) {
            if (editExpense && isExpenseChanged) {
                // Edit mode: populate with existing data
                setTitle(editExpense.title);
                setAmount(editExpense.amount.toString());
                setCategory(editExpense.category);
                setPayerId(editExpense.payer_id);
                setDate(editExpense.expense_date);
                setInvolvedUsers(existingSplits.length > 0 ? existingSplits : members.map(m => m.user_id));
                lastEditExpenseId.current = editExpense.id;
            } else if (!editExpense) {
                // Add mode: reset to defaults
                setTitle('');
                setAmount('');
                setCategory('food');
                setPayerId(currentUserId);
                setDate(new Date().toISOString().split('T')[0]);
                setInvolvedUsers(members.map(m => m.user_id));
                lastEditExpenseId.current = null;
            }
        } else {
            // Reset tracking when modal closes
            lastEditExpenseId.current = null;
        }
    }, [isOpen, editExpense?.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !amount || involvedUsers.length === 0) return;

        onSave({
            title,
            amount: parseFloat(amount),
            category,
            payer_id: payerId,
            expense_date: date,
            involved_users: involvedUsers,
        });
        onClose();
    };

    const toggleUser = (userId: string) => {
        if (involvedUsers.includes(userId)) {
            if (involvedUsers.length > 1) {
                setInvolvedUsers(involvedUsers.filter(id => id !== userId));
            }
        } else {
            setInvolvedUsers([...involvedUsers, userId]);
        }
    };

    const getMemberName = (userId: string) => {
        const member = members.find((m) => m.user_id === userId);
        const profile = member?.profile || member?.profiles;

        if (profile) {
            return profile.full_name || profile.username || profile.email?.split('@')[0] || 'Unknown';
        }

        const testUserMap: Record<string, string> = {
            'a0000000-0000-0000-0000-000000000001': 'Alice',
            'b0000000-0000-0000-0000-000000000002': 'Bob',
            'c0000000-0000-0000-0000-000000000003': 'Charlie',
            'd0000000-0000-0000-0000-000000000004': 'Diana',
            'e0000000-0000-0000-0000-000000000005': 'Eve',
        };

        if (testUserMap[userId]) {
            return testUserMap[userId];
        }

        const firstChar = userId.charAt(0).toLowerCase();
        if (firstChar >= 'a' && firstChar <= 'z') {
            return `用户${firstChar.toUpperCase()}`;
        }

        return '未知用户';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 border border-white/50">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full text-ink-400 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-serif font-bold text-ink-900 mb-6">
                    {editExpense ? '编辑费用' : '记一笔'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount */}
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 text-2xl font-serif">
                            ¥
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-white/50 border border-ink-100 rounded-xl py-4 pl-12 pr-4 text-3xl font-bold text-ink-900 placeholder:text-ink-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-mono"
                            autoFocus
                        />
                    </div>

                    {/* Title & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">消费内容</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="例如：午餐"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white/50 border border-ink-100 rounded-lg py-2 pl-9 pr-3 text-sm text-ink-900 focus:outline-none focus:border-primary-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">分类</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                                className="w-full bg-white/50 border border-ink-100 rounded-lg py-2 px-3 text-sm text-ink-900 focus:outline-none focus:border-primary-500 transition-colors appearance-none"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Payer & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">谁付的钱</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <select
                                    value={payerId}
                                    onChange={(e) => setPayerId(e.target.value)}
                                    className="w-full bg-white/50 border border-ink-100 rounded-lg py-2 pl-9 px-3 text-sm text-ink-900 focus:outline-none focus:border-primary-500 transition-colors appearance-none"
                                >
                                    {members.map(m => (
                                        <option key={m.user_id} value={m.user_id}>
                                            {m.user_id === currentUserId ? '我' : getMemberName(m.user_id)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">日期</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-white/50 border border-ink-100 rounded-lg py-2 pl-9 pr-3 text-sm text-ink-900 focus:outline-none focus:border-primary-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Split */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-ink-500 uppercase tracking-wider">分摊给谁</label>
                            <span className="text-xs text-ink-400">
                                {involvedUsers.length} 人平分 · 每人 ¥{amount ? (parseFloat(amount) / involvedUsers.length).toFixed(2) : '0.00'}
                            </span>
                        </div>

                        {/* 快捷选择 */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setInvolvedUsers([currentUserId])}
                                className="text-xs px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 font-medium transition-colors"
                            >
                                仅自己
                            </button>
                            <button
                                type="button"
                                onClick={() => setInvolvedUsers(members.map(m => m.user_id))}
                                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                            >
                                全选
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {members.map(member => {
                                const isSelected = involvedUsers.includes(member.user_id);
                                return (
                                    <button
                                        key={member.user_id}
                                        type="button"
                                        onClick={() => toggleUser(member.user_id)}
                                        className={`
                                            flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                                            ${isSelected
                                                ? 'bg-primary-500 text-white shadow-md transform scale-105'
                                                : 'bg-white/50 text-ink-500 hover:bg-white border border-transparent hover:border-ink-100'
                                            }
                                        `}
                                    >
                                        {isSelected && <Check className="w-3 h-3" />}
                                        <span>{member.user_id === currentUserId ? '我' : getMemberName(member.user_id)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 text-base mt-4 bg-ink-900 hover:bg-ink-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                        disabled={!title || !amount || involvedUsers.length === 0}
                    >
                        {editExpense ? '更新' : '保存'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
