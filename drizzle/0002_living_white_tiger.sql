CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"position" varchar(255),
	"base_salary" real DEFAULT 0 NOT NULL,
	"hire_date" timestamp with time zone DEFAULT now() NOT NULL,
	"phone" varchar(50),
	"email" varchar(255),
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"payment_method" varchar(50) DEFAULT 'Cash' NOT NULL,
	"reference" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"base_salary" real NOT NULL,
	"allowances" real DEFAULT 0 NOT NULL,
	"deductions" real DEFAULT 0 NOT NULL,
	"net_pay" real NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"payment_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"shift_type" varchar(20) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"cashier_id" uuid,
	"expected_income" real DEFAULT 0 NOT NULL,
	"actual_cash_in_hand" real DEFAULT 0 NOT NULL,
	"variance" real DEFAULT 0 NOT NULL,
	"notes" text,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_records" ADD CONSTRAINT "shift_records_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;