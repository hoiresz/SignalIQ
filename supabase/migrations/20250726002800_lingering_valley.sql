/*
# Add Lead Table Type and Default Columns

1. Schema Changes
   - Add `table_type` column to lead_tables (companies, people, custom)
   - Add `default_columns` jsonb column to store column definitions
   - Update existing tables to have 'companies' as default type

2. Default Column Structures
   - Companies: name, website, description, industry, location
   - People: name, job_title, company, linkedin, email
   - Custom: name, description, url

3. Sample Data
   - Create sample lead tables for each type
   - Add corresponding columns and sample lead data
   - Demonstrate the flexible schema system
*/

-- Add new columns to lead_tables
ALTER TABLE lead_tables 
ADD COLUMN IF NOT EXISTS table_type text DEFAULT 'companies' CHECK (table_type IN ('companies', 'people', 'custom')),
ADD COLUMN IF NOT EXISTS default_columns jsonb DEFAULT '[]'::jsonb;

-- Update existing tables to have companies type
UPDATE lead_tables SET table_type = 'companies' WHERE table_type IS NULL;

-- Create index for table_type
CREATE INDEX IF NOT EXISTS idx_lead_tables_type ON lead_tables(table_type);

-- Insert sample lead tables for demonstration
DO $$
DECLARE
    user_uuid uuid;
    companies_table_id uuid;
    people_table_id uuid;
    custom_table_id uuid;
    name_col_id uuid;
    website_col_id uuid;
    description_col_id uuid;
    industry_col_id uuid;
    location_col_id uuid;
    job_title_col_id uuid;
    company_col_id uuid;
    linkedin_col_id uuid;
    email_col_id uuid;
    url_col_id uuid;
    row1_id uuid;
    row2_id uuid;
    row3_id uuid;
BEGIN
    -- Get the first user (you can replace this with a specific user_id)
    SELECT id INTO user_uuid FROM users LIMIT 1;
    
    IF user_uuid IS NOT NULL THEN
        -- Create Companies Lead Table
        INSERT INTO lead_tables (id, user_id, name, description, table_type, default_columns)
        VALUES (
            gen_random_uuid(),
            user_uuid,
            'SaaS Companies',
            'B2B SaaS companies for outreach',
            'companies',
            '[
                {"name": "Name", "type": "text", "required": true},
                {"name": "Website", "type": "url", "required": false},
                {"name": "Description", "type": "text", "required": false},
                {"name": "Industry", "type": "text", "required": false},
                {"name": "Location", "type": "text", "required": false}
            ]'::jsonb
        ) RETURNING id INTO companies_table_id;

        -- Create columns for companies table
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), companies_table_id, 'Name', 'text', 0) RETURNING id INTO name_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), companies_table_id, 'Website', 'url', 1) RETURNING id INTO website_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), companies_table_id, 'Description', 'text', 2) RETURNING id INTO description_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), companies_table_id, 'Industry', 'text', 3) RETURNING id INTO industry_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), companies_table_id, 'Location', 'text', 4) RETURNING id INTO location_col_id;

        -- Add sample company data
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), companies_table_id, 'company') RETURNING id INTO row1_id;
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), companies_table_id, 'company') RETURNING id INTO row2_id;
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), companies_table_id, 'company') RETURNING id INTO row3_id;

        -- Company 1: TechFlow Solutions
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row1_id, name_col_id, '"TechFlow Solutions"'),
        (row1_id, website_col_id, '"https://techflow.io"'),
        (row1_id, description_col_id, '"AI-powered workflow automation platform for enterprises"'),
        (row1_id, industry_col_id, '"Enterprise Software"'),
        (row1_id, location_col_id, '"San Francisco, CA"');

        -- Company 2: DataSync Pro
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row2_id, name_col_id, '"DataSync Pro"'),
        (row2_id, website_col_id, '"https://datasync.pro"'),
        (row2_id, description_col_id, '"Real-time data integration and analytics platform"'),
        (row2_id, industry_col_id, '"Data Analytics"'),
        (row2_id, location_col_id, '"Austin, TX"');

        -- Company 3: CloudScale Systems
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row3_id, name_col_id, '"CloudScale Systems"'),
        (row3_id, website_col_id, '"https://cloudscale.com"'),
        (row3_id, description_col_id, '"Kubernetes infrastructure management and scaling solutions"'),
        (row3_id, industry_col_id, '"Cloud Infrastructure"'),
        (row3_id, location_col_id, '"Seattle, WA"');

        -- Create People Lead Table
        INSERT INTO lead_tables (id, user_id, name, description, table_type, default_columns)
        VALUES (
            gen_random_uuid(),
            user_uuid,
            'Tech Executives',
            'CTOs and VPs of Engineering at SaaS companies',
            'people',
            '[
                {"name": "Name", "type": "text", "required": true},
                {"name": "Job Title", "type": "text", "required": false},
                {"name": "Company", "type": "text", "required": false},
                {"name": "LinkedIn", "type": "url", "required": false},
                {"name": "Email", "type": "email", "required": false}
            ]'::jsonb
        ) RETURNING id INTO people_table_id;

        -- Create columns for people table
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), people_table_id, 'Name', 'text', 0) RETURNING id INTO name_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), people_table_id, 'Job Title', 'text', 1) RETURNING id INTO job_title_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), people_table_id, 'Company', 'text', 2) RETURNING id INTO company_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), people_table_id, 'LinkedIn', 'url', 3) RETURNING id INTO linkedin_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), people_table_id, 'Email', 'email', 4) RETURNING id INTO email_col_id;

        -- Add sample people data
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), people_table_id, 'person') RETURNING id INTO row1_id;
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), people_table_id, 'person') RETURNING id INTO row2_id;
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), people_table_id, 'person') RETURNING id INTO row3_id;

        -- Person 1: Sarah Chen
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row1_id, name_col_id, '"Sarah Chen"'),
        (row1_id, job_title_col_id, '"CTO"'),
        (row1_id, company_col_id, '"TechFlow Solutions"'),
        (row1_id, linkedin_col_id, '"https://linkedin.com/in/sarahchen-cto"'),
        (row1_id, email_col_id, '"sarah.chen@techflow.io"');

        -- Person 2: Marcus Rodriguez
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row2_id, name_col_id, '"Marcus Rodriguez"'),
        (row2_id, job_title_col_id, '"VP of Engineering"'),
        (row2_id, company_col_id, '"DataSync Pro"'),
        (row2_id, linkedin_col_id, '"https://linkedin.com/in/marcusrodriguez"'),
        (row2_id, email_col_id, '"marcus@datasync.pro"');

        -- Person 3: Emily Watson
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row3_id, name_col_id, '"Emily Watson"'),
        (row3_id, job_title_col_id, '"Head of Infrastructure"'),
        (row3_id, company_col_id, '"CloudScale Systems"'),
        (row3_id, linkedin_col_id, '"https://linkedin.com/in/emilywatson-infra"'),
        (row3_id, email_col_id, '"emily.watson@cloudscale.com"');

        -- Create Custom Lead Table
        INSERT INTO lead_tables (id, user_id, name, description, table_type, default_columns)
        VALUES (
            gen_random_uuid(),
            user_uuid,
            'Industry Resources',
            'Useful tools and resources for our industry',
            'custom',
            '[
                {"name": "Name", "type": "text", "required": true},
                {"name": "Description", "type": "text", "required": false},
                {"name": "URL", "type": "url", "required": false}
            ]'::jsonb
        ) RETURNING id INTO custom_table_id;

        -- Create columns for custom table
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), custom_table_id, 'Name', 'text', 0) RETURNING id INTO name_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), custom_table_id, 'Description', 'text', 1) RETURNING id INTO description_col_id;
        INSERT INTO lead_columns (id, lead_table_id, name, column_type, display_order) VALUES
        (gen_random_uuid(), custom_table_id, 'URL', 'url', 2) RETURNING id INTO url_col_id;

        -- Add sample custom data
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), custom_table_id, 'company') RETURNING id INTO row1_id;
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), custom_table_id, 'company') RETURNING id INTO row2_id;
        INSERT INTO lead_rows (id, lead_table_id, entity_type) VALUES
        (gen_random_uuid(), custom_table_id, 'company') RETURNING id INTO row3_id;

        -- Resource 1: Product Hunt
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row1_id, name_col_id, '"Product Hunt"'),
        (row1_id, description_col_id, '"Platform for discovering new products and startups"'),
        (row1_id, url_col_id, '"https://producthunt.com"');

        -- Resource 2: Hacker News
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row2_id, name_col_id, '"Hacker News"'),
        (row2_id, description_col_id, '"Tech news and startup community discussions"'),
        (row2_id, url_col_id, '"https://news.ycombinator.com"');

        -- Resource 3: AngelList
        INSERT INTO lead_cells (row_id, column_id, value) VALUES
        (row3_id, name_col_id, '"AngelList"'),
        (row3_id, description_col_id, '"Startup funding and job platform"'),
        (row3_id, url_col_id, '"https://angel.co"');

    END IF;
END $$;