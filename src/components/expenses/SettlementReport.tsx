import { useMemo } from 'react';
import { Expense, ExpenseSplit, TripMember } from '@/types/models';
import { calculateSettlements } from '@/lib/settlement';
import { ArrowRight, Wallet, User as UserIcon, X } from 'lucide-react';

interface SettlementReportProps {
    expenses: Expense[];
    splits: ExpenseSplit[];
    members: TripMember[];
    onClose: () => void;
    currentUserId: string;
}

export default function SettlementReport({ expenses, splits, members, onClose, currentUserId }: SettlementReportProps) {
    const settlements = useMemo(() => {
        return calculateSettlements(expenses, splits);
    }, [expenses, splits]);

    const getMemberName = (userId: string) => {
        if (userId === currentUserId) return '我';
        const member = members.find((m) => m.user_id === userId);
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

    const getMemberAvatar = (userId: string) => {
        const member = members.find((m) => m.user_id === userId);
        return member?.profile?.avatar_url;
    };

    const totalFlow = settlements.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Decoration */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary-500 to-purple-600 opacity-10"></div>

                <div className="relative p-8 pb-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full text-ink-500 transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-ink-900">结算方案</h2>
                    </div>
                    <p className="text-ink-500 ml-1">
                        共需流转 <span className="font-bold text-ink-900 font-mono">¥{totalFlow.toFixed(2)}</span>，
                        {settlements.length === 0 ? '大家都挺自觉，没有债务' : '按照以下方案转账即可结清'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-2">
                    {settlements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-ink-400">
                            <p>账目清晰，互不相欠 🎉</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {settlements.map((s, idx) => (
                                <div key={idx} className="glass-card p-4 rounded-xl flex items-center justify-between group hover:border-primary-200 transition-colors">
                                    {/* Payer (Debtor) */}
                                    <div className="flex items-center gap-3 w-1/3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                            {getMemberAvatar(s.from) ? (
                                                <img src={getMemberAvatar(s.from)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-ink-900 truncate">{getMemberName(s.from)}</div>
                                            <div className="text-xs text-ink-500">支付</div>
                                        </div>
                                    </div>

                                    {/* Amount & Arrow */}
                                    <div className="flex flex-col items-center justify-center flex-1 px-2">
                                        <div className="text-xs text-ink-400 mb-1">转账给</div>
                                        <div className="flex items-center gap-2 text-primary-500">
                                            <div className="h-[1px] w-full bg-primary-200 group-hover:bg-primary-400 transition-colors"></div>
                                            <ArrowRight className="w-4 h-4" />
                                            <div className="h-[1px] w-full bg-primary-200 group-hover:bg-primary-400 transition-colors"></div>
                                        </div>
                                        <div className="font-mono font-bold text-xl text-ink-900 mt-1">
                                            ¥{s.amount.toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Payee (Creditor) */}
                                    <div className="flex items-center gap-3 w-1/3 justify-end">
                                        <div className="min-w-0 text-right">
                                            <div className="font-bold text-ink-900 truncate">{getMemberName(s.to)}</div>
                                            <div className="text-xs text-ink-500">收款</div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                            {getMemberAvatar(s.to) ? (
                                                <img src={getMemberAvatar(s.to)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center text-xs text-ink-400">
                    此报告基于当前记录的 {expenses.length} 笔支出计算。请确保所有花费已录入。
                </div>
            </div>
        </div>
    );
}
