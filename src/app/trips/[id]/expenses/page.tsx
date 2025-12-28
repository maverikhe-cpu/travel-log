import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ExpensesClientPage from './client-page';

export default async function ExpensesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const supabase = await createClient();
    const { id } = await params;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get Trip Details & Members
    const { data: trip } = await supabase
        .from('trips')
        .select(`
      *,
      trip_members(
        role,
        user_id,
        profile:profiles(*)
      )
    `)
        .eq('id', id)
        .single();

    if (!trip) {
        redirect('/dashboard');
    }

    // Check Access
    const isMember = trip.trip_members?.some((m: any) => m.user_id === user.id);
    if (!isMember) {
        redirect('/dashboard');
    }

    // Fetch Expenses
    const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', id);

    // Fetch Splits
    let splits: any[] = [];
    if (expenses && expenses.length > 0) {
        const expenseIds = expenses.map((e: any) => e.id);
        const { data: splitsData } = await supabase
            .from('expense_splits')
            .select('*')
            .in('expense_id', expenseIds);

        if (splitsData) splits = splitsData;
    }

    // Transform members to match TripMember interface correctly if needed
    // The query `trip_members(..., profile:profiles(*))` returns profile as a single object which matches the optional `profile` in TripMember.
    const tripWithMembers = {
        ...trip,
        members: trip.trip_members?.map((m: any) => ({
            ...m,
            profile: m.profile || null,
        })) || []
    };

    return (
        <ExpensesClientPage
            trip={tripWithMembers}
            expenses={expenses || []}
            splits={splits}
            currentUserId={user.id}
        />
    );
}
