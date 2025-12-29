-- Migration: Fix expense_splits RLS so edits can correctly update participants
-- Description: Allow authorized trip members to delete (and update) expense_splits rows

-- ============================================
-- Clean up existing policies if needed
-- ============================================

DROP POLICY IF EXISTS "Trip members can view splits" ON expense_splits;
DROP POLICY IF EXISTS "Trip members can insert splits" ON expense_splits;

-- ============================================
-- Recreate SELECT / INSERT policies (unchanged behaviour)
-- ============================================

-- Trip members can view splits
CREATE POLICY "Trip members can view splits"
  ON expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM expenses
      JOIN trip_members ON trip_members.trip_id = expenses.trip_id
      WHERE expenses.id = expense_splits.expense_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- Trip members can insert splits
CREATE POLICY "Trip members can insert splits"
  ON expense_splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM expenses
      JOIN trip_members ON trip_members.trip_id = expenses.trip_id
      WHERE expenses.id = expense_splits.expense_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- ============================================
-- NEW: UPDATE / DELETE policies for splits
-- ============================================

-- Trip owners / editors or expense creators can update splits
CREATE POLICY "Editors can update splits"
  ON expense_splits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM expenses
      JOIN trip_members ON trip_members.trip_id = expenses.trip_id
      WHERE expenses.id = expense_splits.expense_id
        AND (
          expenses.created_by = auth.uid()
          OR (
            trip_members.user_id = auth.uid()
            AND trip_members.role IN ('owner', 'editor')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM expenses
      JOIN trip_members ON trip_members.trip_id = expenses.trip_id
      WHERE expenses.id = expense_splits.expense_id
        AND (
          expenses.created_by = auth.uid()
          OR (
            trip_members.user_id = auth.uid()
            AND trip_members.role IN ('owner', 'editor')
          )
        )
    )
  );

-- Trip owners / editors or expense creators can delete splits
CREATE POLICY "Editors can delete splits"
  ON expense_splits FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM expenses
      JOIN trip_members ON trip_members.trip_id = expenses.trip_id
      WHERE expenses.id = expense_splits.expense_id
        AND (
          expenses.created_by = auth.uid()
          OR (
            trip_members.user_id = auth.uid()
            AND trip_members.role IN ('owner', 'editor')
          )
        )
    )
  );


