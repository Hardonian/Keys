-- Pattern 4: Role-Based RLS
-- Access control based on user roles (admin, member, viewer)

-- Example: Projects table with role-based access
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user role for project
CREATE OR REPLACE FUNCTION get_user_project_role(project_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM project_members
    WHERE project_id = project_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for projects table
CREATE POLICY "Users can view projects they're members of"
  ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Project creator becomes owner via trigger

CREATE POLICY "Owners and admins can update projects"
  ON projects
  FOR UPDATE
  USING (
    get_user_project_role(id) IN ('owner', 'admin')
  )
  WITH CHECK (
    get_user_project_role(id) IN ('owner', 'admin')
  );

CREATE POLICY "Owners can delete projects"
  ON projects
  FOR DELETE
  USING (
    get_user_project_role(id) = 'owner'
  );

-- Policies for project_members table
CREATE POLICY "Users can view project members"
  ON project_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can manage members"
  ON project_members
  FOR ALL
  USING (
    get_user_project_role(project_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    get_user_project_role(project_id) IN ('owner', 'admin')
  );
