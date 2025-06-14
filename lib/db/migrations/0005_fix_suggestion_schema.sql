-- Drop the problematic foreign key constraint
ALTER TABLE "Suggestion" DROP CONSTRAINT IF EXISTS "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f";

-- Add a simple foreign key that only references the document id
ALTER TABLE "Suggestion"
ADD CONSTRAINT "Suggestion_documentId_Document_id_fk"
FOREIGN KEY ("documentId")
REFERENCES "Document"("id") ON DELETE CASCADE;
