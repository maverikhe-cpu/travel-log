-- Migration: Add expenses and expense_splits tables
-- Description: Group expense tracking and settlement functionality

-- ============================================
-- 费用表 (expenses)
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'accommodation', 'ticket', 'shopping', 'other')),
  payer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 费用分摊表 (expense_splits)
-- ============================================
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON expense_splits(user_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 策略: expenses
-- ============================================

-- 行程成员可以查看费用
CREATE POLICY "Trip members can view expenses"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- 行程成员可以创建费用
CREATE POLICY "Trip members can insert expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- 费用创建者或编辑者可以更新费用
CREATE POLICY "Creators or editors can update expenses"
  ON expenses FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

-- 费用创建者可以删除费用
CREATE POLICY "Creators can delete expenses"
  ON expenses FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role = 'owner'
    )
  );

-- ============================================
-- RLS 策略: expense_splits
-- ============================================

-- 行程成员可以查看分摊记录
CREATE POLICY "Trip members can view splits"
  ON expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      JOIN trip_members ON trip_members.trip_id = expenses.trip_id
      WHERE expenses.id = expense_splits.expense_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- 行程成员可以创建分摊记录
CREATE POLICY "Trip members can insert splits"
  ON expense_splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      JOIN trip_members ON trip_members.trip_id = expenses.trip_id
      WHERE expenses.id = expense_splits.expense_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE expenses IS '团队旅行费用记录表';
COMMENT ON COLUMN expenses.category IS '费用类别: food(餐饮), transport(交通), accommodation(住宿), ticket(门票), shopping(购物), other(其他)';
COMMENT ON COLUMN expenses.payer_id IS '垫付款人ID';
COMMENT ON COLUMN expenses.expense_date IS '消费日期';
COMMENT ON COLUMN expenses.created_by IS '创建人ID';
COMMENT ON COLUMN expenses.updated_by IS '最后修改人ID';
COMMENT ON COLUMN expenses.created_at IS '创建时间';
COMMENT ON COLUMN expenses.updated_at IS '最后修改时间';

COMMENT ON TABLE expense_splits IS '费用分摊明细表';
COMMENT ON COLUMN expense_splits.amount IS '该用户应分摊的金额';

-- ============================================
-- Triggers for updated_at
-- ============================================
-- Update updated_at timestamp on expense modification
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
