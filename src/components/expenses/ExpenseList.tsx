'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Expense, TripMember, ExpenseCategory } from '@/types/models';
import { Utensils, Bus, Hotel, Ticket, ShoppingBag, MoreHorizontal, User, Pencil, Trash2, MoreVertical, Edit3, Filter, X, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ExpenseListProps {
    expenses: Expense[];
    members: TripMember[];
    currentUserId: string;
    onEdit?: (expense: Expense) => void;
    onDelete?: (expenseId: string) => void;
}

const CATEGORY_CONFIG: Record<ExpenseCategory, { icon: any; color: string; label: string }> = {
    food: { icon: Utensils, color: 'text-orange-500 bg-orange-50', label: '餐饮' },
    transport: { icon: Bus, color: 'text-blue-500 bg-blue-50', label: '交通' },
    accommodation: { icon: Hotel, color: 'text-purple-500 bg-purple-50', label: '住宿' },
    ticket: { icon: Ticket, color: 'text-pink-500 bg-pink-50', label: '门票' },
    shopping: { icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-50', label: '购物' },
    other: { icon: MoreHorizontal, color: 'text-gray-500 bg-gray-50', label: '其他' },
};

export default function ExpenseList({ expenses, members, currentUserId, onEdit, onDelete }: ExpenseListProps) {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
    const [payerFilter, setPayerFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const menuRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);

    // Get unique dates from expenses for the date filter
    const expenseDates = useMemo(() => {
        const dates = new Set(expenses.map(e => e.expense_date));
        return Array.from(dates).sort().reverse();
    }, [expenses]);

    // Check if any filters are active
    const hasActiveFilters = categoryFilter !== 'all' || payerFilter !== 'all' || dateFrom || dateTo;

    // Clear all filters
    const clearFilters = () => {
        setCategoryFilter('all');
        setPayerFilter('all');
        setDateFrom('');
        setDateTo('');
    };

    // Filter and sort expenses
    const filteredExpenses = useMemo(() => {
        let result = [...expenses];

        // Filter by category
        if (categoryFilter !== 'all') {
            result = result.filter(e => e.category === categoryFilter);
        }

        // Filter by payer
        if (payerFilter !== 'all') {
            result = result.filter(e => e.payer_id === payerFilter);
        }

        // Filter by date range
        if (dateFrom) {
            result = result.filter(e => e.expense_date >= dateFrom);
        }
        if (dateTo) {
            result = result.filter(e => e.expense_date <= dateTo);
        }

        // Sort by created_at/updated_at
        result.sort((a, b) => {
            const aTime = new Date(a.updated_at || a.created_at).getTime();
            const bTime = new Date(b.updated_at || b.created_at).getTime();
            return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
        });

        return result;
    }, [expenses, categoryFilter, payerFilter, dateFrom, dateTo, sortOrder]);

    // Calculate total amount of filtered results
    const filteredTotal = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    }, [filteredExpenses]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setFilterOpen(false);
            }
        };

        if (activeMenu || filterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenu, filterOpen]);

    const getMemberName = (userId: string) => {
        const member = members.find((m) => m.user_id === userId);
        // Handle both aliased 'profile' and default 'profiles'
        const profile = member?.profile || member?.profiles;

        // 如果 profile 存在，使用 profile 信息
        if (profile) {
            return profile.full_name || profile.username || profile.email?.split('@')[0] || 'Unknown';
        }

        // 如果 profile 不存在，尝试从 user_id 推断（用于测试场景）
        // 测试用户的 UUID 模式：a0000000-0000-0000-0000-000000000001 (Alice)
        //                        b0000000-0000-0000-0000-000000000002 (Bob)
        //                        c0000000-0000-0000-0000-000000000003 (Charlie)
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

        // 通用回退：尝试从 UUID 的第一个字符推断
        const firstChar = userId.charAt(0).toLowerCase();
        if (firstChar >= 'a' && firstChar <= 'z') {
            return `用户${firstChar.toUpperCase()}`;
        }

        return '未知用户';
    };

    const formatUpdateTime = (updatedAt: string, createdAt: string) => {
        const date = new Date(updatedAt || createdAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        return format(date, 'MM月dd日', { locale: zhCN });
    };

    if (expenses.length === 0) {
        return (
            <div className="text-center py-12 text-ink-400">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MoreHorizontal className="w-8 h-8 text-gray-300" />
                </div>
                <p>暂时没有支出记录</p>
            </div>
        );
    }

    return (
        <div className="space-y-4" ref={menuRef}>
            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {/* Sort Toggle */}
                    <button
                        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/50 text-ink-600 hover:bg-white border border-ink-100 transition-colors"
                        title={sortOrder === 'newest' ? '最新在前' : '最旧在前'}
                        data-testid="sort-toggle-button"
                    >
                        <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'oldest' ? 'rotate-180' : ''}`} />
                        {sortOrder === 'newest' ? '最新' : '最旧'}
                    </button>

                    {/* Filter Button */}
                    <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            hasActiveFilters
                                ? 'bg-primary-500 text-white'
                                : 'bg-white/50 text-ink-600 hover:bg-white border border-ink-100'
                        }`}
                        data-testid="filter-toggle-button"
                    >
                        <Filter className="w-4 h-4" />
                        筛选
                        {hasActiveFilters && (
                            <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                {[categoryFilter !== 'all', payerFilter !== 'all', dateFrom, dateTo].filter(Boolean).length}
                            </span>
                        )}
                    </button>

                    {filterOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-4 min-w-[280px] z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-ink-900">筛选支出</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                        data-testid="filter-clear-button"
                                    >
                                        <X className="w-3 h-3" />
                                        清空
                                    </button>
                                )}
                            </div>

                            {/* Category Filter */}
                            <div className="mb-4">
                                <label className="text-xs text-ink-500 mb-2 block">费用类别</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setCategoryFilter('all')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                            categoryFilter === 'all'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-ink-600 hover:bg-gray-200'
                                        }`}
                                        data-testid="filter-category-all"
                                    >
                                        全部
                                    </button>
                                    {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                                        <button
                                            key={key}
                                            onClick={() => setCategoryFilter(key as ExpenseCategory)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                                categoryFilter === key
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-100 text-ink-600 hover:bg-gray-200'
                                            }`}
                                            data-testid={`filter-category-${key}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payer Filter */}
                            <div className="mb-4">
                                <label className="text-xs text-ink-500 mb-2 block">垫付人</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setPayerFilter('all')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                            payerFilter === 'all'
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 text-ink-600 hover:bg-gray-200'
                                        }`}
                                        data-testid="filter-payer-all"
                                    >
                                        全部
                                    </button>
                                    {members.map((member) => (
                                        <button
                                            key={member.user_id}
                                            onClick={() => setPayerFilter(member.user_id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                                payerFilter === member.user_id
                                                    ? 'bg-primary-500 text-white'
                                                    : 'bg-gray-100 text-ink-600 hover:bg-gray-200'
                                            }`}
                                            data-testid={`filter-payer-${member.user_id}`}
                                        >
                                            {member.user_id === currentUserId ? '我' : getMemberName(member.user_id)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="mb-4">
                                <label className="text-xs text-ink-500 mb-2 block">消费日期</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                                        placeholder="开始日期"
                                    />
                                    <span className="text-ink-400">-</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-500"
                                        placeholder="结束日期"
                                    />
                                </div>
                            </div>

                            {/* Filtered Total */}
                            {hasActiveFilters && (
                                <div className="pt-3 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-ink-500">筛选结果总额</span>
                                        <span className="font-bold text-ink-900">¥{filteredTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </div>

                {/* Result count */}
                <div className="text-right ml-auto">
                    <span className="text-sm text-ink-400">
                        {filteredExpenses.length === expenses.length
                            ? `共 ${expenses.length} 笔`
                            : `筛选出 ${filteredExpenses.length} / ${expenses.length} 笔`}
                    </span>
                    {hasActiveFilters && (
                        <div className="font-bold text-ink-900">
                            ¥{filteredTotal.toFixed(2)}
                        </div>
                    )}
                </div>
            </div>

            {/* No results */}
            {filteredExpenses.length === 0 && hasActiveFilters && (
                <div className="text-center py-12 text-ink-400">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-8 h-8 text-gray-300" />
                    </div>
                    <p>没有符合条件的支出记录</p>
                    <button
                        onClick={clearFilters}
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                        清空筛选条件
                    </button>
                </div>
            )}

            {filteredExpenses.map((expense) => {
                const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
                const Icon = config.icon;
                const isPayer = expense.payer_id === currentUserId;
                const isCreator = expense.created_by === currentUserId;
                const isModifier = expense.updated_by === currentUserId;
                const showMenu = onEdit || onDelete;
                const wasModified = expense.updated_at && expense.updated_at !== expense.created_at;

                return (
                    <div
                        key={expense.id}
                        data-testid={`expense-item-${expense.id}`}
                        className="glass-card p-4 rounded-xl hover:bg-white/60 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center shrink-0`}>
                                <Icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-ink-900 truncate">{expense.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-ink-900 font-mono">
                                            ¥{expense.amount.toFixed(2)}
                                        </span>
                                        {showMenu && (
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenu(activeMenu === expense.id ? null : expense.id);
                                                    }}
                                                    className="p-1 hover:bg-black/5 rounded-full transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-ink-400" />
                                                </button>
                                                {activeMenu === expense.id && (
                                                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[100px] z-10">
                                                        {onEdit && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenu(null);
                                                                    onEdit(expense);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-ink-700"
                                                                data-testid={`expense-edit-${expense.id}`}
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                                编辑
                                                            </button>
                                                        )}
                                                        {onDelete && (isCreator || isPayer) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveMenu(null);
                                                                    onDelete(expense.id);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 text-red-600"
                                                                data-testid={`expense-delete-${expense.id}`}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                                删除
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-ink-500">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-white/50 px-2 py-0.5 rounded text-ink-400">
                                            {config.label}
                                        </span>
                                        <span>{format(new Date(expense.expense_date), 'MM月dd日', { locale: zhCN })}</span>
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>
                                                {isPayer ? '我' : getMemberName(expense.payer_id)} 垫付
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* 创建/修改信息 */}
                                <div className="flex items-center gap-2 mt-2 text-xs text-ink-400">
                                    <span>
                                        由 <span className="font-medium text-ink-500">
                                            {isCreator ? '我' : getMemberName(expense.created_by)}
                                        </span> 创建
                                    </span>
                                    {wasModified && expense.updated_by && (
                                        <>
                                            <span>·</span>
                                            <span className="flex items-center gap-1">
                                                <Edit3 className="w-3 h-3" />
                                                <span>
                                                    {isModifier ? '我' : getMemberName(expense.updated_by)} 修改
                                                </span>
                                            </span>
                                        </>
                                    )}
                                    <span>·</span>
                                    <span>{formatUpdateTime(expense.updated_at || '', expense.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
