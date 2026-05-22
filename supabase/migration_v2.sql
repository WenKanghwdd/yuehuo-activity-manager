-- 悦活云同步 v2 - 用户隔离迁移
-- 运行前确保 Supabase Auth 已启用（默认开启）

-- ====================================
-- 1. 删除旧的已开放策略
-- ====================================
DROP POLICY IF EXISTS "允许所有操作" ON activities;
DROP POLICY IF EXISTS "允许所有操作" ON elderly;
DROP POLICY IF EXISTS "允许所有操作" ON elderly_groups;
DROP POLICY IF EXISTS "允许所有操作" ON weekly_plans;
DROP POLICY IF EXISTS "允许所有操作" ON weekly_plan_cells;
DROP POLICY IF EXISTS "允许所有操作" ON activity_records;
DROP POLICY IF EXISTS "允许所有操作" ON settings;

-- ====================================
-- 2. 添加 user_id 字段
-- ====================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE elderly ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE elderly_groups ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE weekly_plans ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE weekly_plan_cells ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE activity_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- ====================================
-- 3. 用户级 RLS 策略
-- ====================================

-- 活动库
CREATE POLICY "用户只能读写自己的活动库" ON activities
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 老人信息
CREATE POLICY "用户只能读写自己的老人信息" ON elderly
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 老人分组
CREATE POLICY "用户只能读写自己的老人分组" ON elderly_groups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 周计划
CREATE POLICY "用户只能读写自己的周计划" ON weekly_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 周计划单元格
CREATE POLICY "用户只能读写自己的周计划单元格" ON weekly_plan_cells
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 活动记录
CREATE POLICY "用户只能读写自己的活动记录" ON activity_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 设置
CREATE POLICY "用户只能读写自己的设置" ON settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ====================================
-- 4. 索引（按用户查询加速）
-- ====================================
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_elderly_user ON elderly(user_id);
CREATE INDEX IF NOT EXISTS idx_elderly_groups_user ON elderly_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plan_cells_user ON weekly_plan_cells(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_records_user ON activity_records(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
