-- Add pricing fields to workspace_booking table
ALTER TABLE "workspace_booking" ADD COLUMN "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "workspace_booking" ADD COLUMN "totalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
