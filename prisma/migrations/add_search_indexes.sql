-- Add indexes for better search performance

-- Project search indexes
CREATE INDEX IF NOT EXISTS "Project_name_idx" ON "Project" USING gin(to_tsvector('english', "name"));
CREATE INDEX IF NOT EXISTS "Project_projectId_idx" ON "Project" USING gin(to_tsvector('english', "projectId"));
CREATE INDEX IF NOT EXISTS "Project_description_idx" ON "Project" USING gin(to_tsvector('english', "description"));

-- Document search indexes
CREATE INDEX IF NOT EXISTS "Document_name_idx" ON "Document" USING gin(to_tsvector('english', "name"));
CREATE INDEX IF NOT EXISTS "Document_fileName_idx" ON "Document" USING gin(to_tsvector('english', "fileName"));

-- User search indexes
CREATE INDEX IF NOT EXISTS "User_name_idx" ON "User" USING gin(to_tsvector('english', "name"));
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "User_department_idx" ON "User" USING gin(to_tsvector('english', "department"));

-- Red flag search indexes
CREATE INDEX IF NOT EXISTS "RedFlag_title_idx" ON "RedFlag" USING gin(to_tsvector('english', "title"));
CREATE INDEX IF NOT EXISTS "RedFlag_description_idx" ON "RedFlag" USING gin(to_tsvector('english', "description"));

-- Comment search indexes
CREATE INDEX IF NOT EXISTS "Comment_content_idx" ON "Comment" USING gin(to_tsvector('english', "content"));

-- General performance indexes
CREATE INDEX IF NOT EXISTS "Project_updatedAt_idx" ON "Project" ("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "Document_createdAt_idx" ON "Document" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "RedFlag_createdAt_idx" ON "RedFlag" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Comment_createdAt_idx" ON "Comment" ("createdAt" DESC);