-- Drop the problematic foreign key constraint
ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f";

-- Drop the documentCreatedAt column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'Suggestion' AND column_name = 'documentCreatedAt') THEN
    ALTER TABLE "Suggestion" DROP COLUMN "documentCreatedAt";
  END IF;
END $$;

-- Update the schema.ts file to remove the documentCreatedAt references
-- This is done outside of this SQL file, in the TypeScript code
