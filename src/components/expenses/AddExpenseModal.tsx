import ExpenseFormModal from './ExpenseFormModal';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: {
        title: string;
        amount: number;
        category: string;
        payer_id: string;
        expense_date: string;
        involved_users: string[];
    }) => void;
    members: any[];
    currentUserId: string;
}

export default function AddExpenseModal({ isOpen, onClose, onSave, members, currentUserId }: AddExpenseModalProps) {
    return (
        <ExpenseFormModal
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            members={members}
            currentUserId={currentUserId}
        />
    );
}
