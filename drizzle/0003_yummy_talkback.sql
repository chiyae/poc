CREATE TABLE "under_five_income" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "under_five_income_date_unique" UNIQUE("date")
);
--> statement-breakpoint
ALTER TABLE "stock_take_items" ALTER COLUMN "expiry_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stock_take_items" ALTER COLUMN "expiry_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "billings" ADD COLUMN "shift_type" varchar(20);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employee_number" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment_type" varchar(50) DEFAULT 'Full Time' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "daily_rate" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "internal_orders" ADD COLUMN "type" varchar(50) DEFAULT 'Request' NOT NULL;--> statement-breakpoint
ALTER TABLE "local_purchase_orders" ADD COLUMN "prepared_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "local_purchase_orders" ADD COLUMN "prepared_by_name" varchar(255);--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "allowance_details" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "deduction_details" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "days_worked" integer;--> statement-breakpoint
ALTER TABLE "payslips" ADD COLUMN "daily_rate" real;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "category" varchar(100) DEFAULT 'General' NOT NULL;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "reserved_stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_employee_number_unique" UNIQUE("employee_number");