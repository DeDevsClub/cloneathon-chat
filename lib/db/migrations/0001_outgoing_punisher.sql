DROP TABLE "Vote";--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "systemPrompt" text DEFAULT 'You are a helpful AI assistant. Your goal is to provide accurate, clear, and concise responses to queries. 
If you do not know the answer to a question, it is better to state that you do not know rather than providing potentially incorrect information. 
Be polite and respectful in all your interactions.' NOT NULL;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "model" varchar(100) DEFAULT 'chat-model' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_projectId_idx" ON "Message" USING btree ("projectId");