-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "billings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"bill_type" varchar(50) NOT NULL,
	"prescription_number" varchar(255),
	"receipt_number" varchar(255),
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" real DEFAULT 0 NOT NULL,
	"discount" real,
	"grand_total" real DEFAULT 0 NOT NULL,
	"payment_details" jsonb NOT NULL,
	"dispensing_location_id" varchar(100) NOT NULL,
	"is_dispensed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "billings_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "billings_patient_name_not_null" CHECK (NOT NULL patient_name),
	CONSTRAINT "billings_date_not_null" CHECK (NOT NULL date),
	CONSTRAINT "billings_bill_type_not_null" CHECK (NOT NULL bill_type),
	CONSTRAINT "billings_items_not_null" CHECK (NOT NULL items),
	CONSTRAINT "billings_subtotal_not_null" CHECK (NOT NULL subtotal),
	CONSTRAINT "billings_grand_total_not_null" CHECK (NOT NULL grand_total),
	CONSTRAINT "billings_payment_details_not_null" CHECK (NOT NULL payment_details),
	CONSTRAINT "billings_dispensing_location_id_not_null" CHECK (NOT NULL dispensing_location_id),
	CONSTRAINT "billings_is_dispensed_not_null" CHECK (NOT NULL is_dispensed)
);
--> statement-breakpoint
CREATE TABLE "internal_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"requesting_location_id" varchar(100) NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'Pending' NOT NULL,
	CONSTRAINT "internal_orders_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "internal_orders_date_not_null" CHECK (NOT NULL date),
	CONSTRAINT "internal_orders_requesting_location_id_not_null" CHECK (NOT NULL requesting_location_id),
	CONSTRAINT "internal_orders_items_not_null" CHECK (NOT NULL items),
	CONSTRAINT "internal_orders_status_not_null" CHECK (NOT NULL status)
);
--> statement-breakpoint
CREATE TABLE "stock_take_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"location_id" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'Ongoing' NOT NULL,
	CONSTRAINT "stock_take_sessions_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "stock_take_sessions_date_not_null" CHECK (NOT NULL date),
	CONSTRAINT "stock_take_sessions_location_id_not_null" CHECK (NOT NULL location_id),
	CONSTRAINT "stock_take_sessions_status_not_null" CHECK (NOT NULL status)
);
--> statement-breakpoint
CREATE TABLE "local_purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lpo_number" varchar(255) NOT NULL,
	"vendor_id" uuid NOT NULL,
	"vendor_name" varchar(255) NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grand_total" real DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	CONSTRAINT "local_purchase_orders_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "local_purchase_orders_lpo_number_not_null" CHECK (NOT NULL lpo_number),
	CONSTRAINT "local_purchase_orders_vendor_id_not_null" CHECK (NOT NULL vendor_id),
	CONSTRAINT "local_purchase_orders_vendor_name_not_null" CHECK (NOT NULL vendor_name),
	CONSTRAINT "local_purchase_orders_date_not_null" CHECK (NOT NULL date),
	CONSTRAINT "local_purchase_orders_items_not_null" CHECK (NOT NULL items),
	CONSTRAINT "local_purchase_orders_grand_total_not_null" CHECK (NOT NULL grand_total),
	CONSTRAINT "local_purchase_orders_status_not_null" CHECK (NOT NULL status)
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"user_display_name" varchar(255) NOT NULL,
	"action" varchar(255) NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "logs_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "logs_timestamp_not_null" CHECK (NOT NULL "timestamp"),
	CONSTRAINT "logs_user_id_not_null" CHECK (NOT NULL user_id),
	CONSTRAINT "logs_user_display_name_not_null" CHECK (NOT NULL user_display_name),
	CONSTRAINT "logs_action_not_null" CHECK (NOT NULL action),
	CONSTRAINT "logs_details_not_null" CHECK (NOT NULL details)
);
--> statement-breakpoint
CREATE TABLE "procurement_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'Draft' NOT NULL,
	"procurement_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"vendor_quotes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"lpo_quantities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "procurement_sessions_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "procurement_sessions_created_at_not_null" CHECK (NOT NULL created_at),
	CONSTRAINT "procurement_sessions_status_not_null" CHECK (NOT NULL status),
	CONSTRAINT "procurement_sessions_procurement_list_not_null" CHECK (NOT NULL procurement_list),
	CONSTRAINT "procurement_sessions_vendor_quotes_not_null" CHECK (NOT NULL vendor_quotes),
	CONSTRAINT "procurement_sessions_lpo_quantities_not_null" CHECK (NOT NULL lpo_quantities)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"fee" real DEFAULT 0 NOT NULL,
	CONSTRAINT "services_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "services_name_not_null" CHECK (NOT NULL name),
	CONSTRAINT "services_fee_not_null" CHECK (NOT NULL fee)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "settings_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "settings_value_not_null" CHECK (NOT NULL value)
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"batch_id" varchar(255) NOT NULL,
	"location_id" varchar(100) NOT NULL,
	"current_stock_quantity" integer DEFAULT 0 NOT NULL,
	"expiry_date" timestamp with time zone,
	CONSTRAINT "stocks_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "stocks_item_id_not_null" CHECK (NOT NULL item_id),
	CONSTRAINT "stocks_batch_id_not_null" CHECK (NOT NULL batch_id),
	CONSTRAINT "stocks_location_id_not_null" CHECK (NOT NULL location_id),
	CONSTRAINT "stocks_current_stock_quantity_not_null" CHECK (NOT NULL current_stock_quantity)
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_code" varchar(100) NOT NULL,
	"generic_name" varchar(255) NOT NULL,
	"brand_name" varchar(255),
	"formulation" varchar(100) NOT NULL,
	"strength_value" real,
	"strength_unit" varchar(50),
	"concentration_value" real,
	"concentration_unit" varchar(50),
	"package_size_value" real,
	"package_size_unit" varchar(50),
	"category" varchar(100) NOT NULL,
	"unit_of_measure" varchar(100) NOT NULL,
	"dispensary_reorder_level" integer DEFAULT 0 NOT NULL,
	"bulk_store_reorder_level" integer DEFAULT 0 NOT NULL,
	"unit_cost" real DEFAULT 0 NOT NULL,
	"selling_price" real DEFAULT 0 NOT NULL,
	CONSTRAINT "items_item_code_unique" UNIQUE("item_code"),
	CONSTRAINT "items_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "items_item_code_not_null" CHECK (NOT NULL item_code),
	CONSTRAINT "items_generic_name_not_null" CHECK (NOT NULL generic_name),
	CONSTRAINT "items_formulation_not_null" CHECK (NOT NULL formulation),
	CONSTRAINT "items_category_not_null" CHECK (NOT NULL category),
	CONSTRAINT "items_unit_of_measure_not_null" CHECK (NOT NULL unit_of_measure),
	CONSTRAINT "items_dispensary_reorder_level_not_null" CHECK (NOT NULL dispensary_reorder_level),
	CONSTRAINT "items_bulk_store_reorder_level_not_null" CHECK (NOT NULL bulk_store_reorder_level),
	CONSTRAINT "items_unit_cost_not_null" CHECK (NOT NULL unit_cost),
	CONSTRAINT "items_selling_price_not_null" CHECK (NOT NULL selling_price)
);
--> statement-breakpoint
CREATE TABLE "stock_take_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"batch_id" varchar(255) NOT NULL,
	"expiry_date" varchar(255) NOT NULL,
	"system_qty" integer DEFAULT 0 NOT NULL,
	"physical_qty" integer DEFAULT 0 NOT NULL,
	"variance" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stock_take_items_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "stock_take_items_session_id_not_null" CHECK (NOT NULL session_id),
	CONSTRAINT "stock_take_items_item_id_not_null" CHECK (NOT NULL item_id),
	CONSTRAINT "stock_take_items_item_name_not_null" CHECK (NOT NULL item_name),
	CONSTRAINT "stock_take_items_batch_id_not_null" CHECK (NOT NULL batch_id),
	CONSTRAINT "stock_take_items_expiry_date_not_null" CHECK (NOT NULL expiry_date),
	CONSTRAINT "stock_take_items_system_qty_not_null" CHECK (NOT NULL system_qty),
	CONSTRAINT "stock_take_items_physical_qty_not_null" CHECK (NOT NULL physical_qty),
	CONSTRAINT "stock_take_items_variance_not_null" CHECK (NOT NULL variance)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'cashier' NOT NULL,
	"location_id" varchar(100) DEFAULT 'all' NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "users_username_not_null" CHECK (NOT NULL username),
	CONSTRAINT "users_display_name_not_null" CHECK (NOT NULL display_name),
	CONSTRAINT "users_password_hash_not_null" CHECK (NOT NULL password_hash),
	CONSTRAINT "users_role_not_null" CHECK (NOT NULL role),
	CONSTRAINT "users_location_id_not_null" CHECK (NOT NULL location_id),
	CONSTRAINT "users_disabled_not_null" CHECK (NOT NULL disabled),
	CONSTRAINT "users_created_at_not_null" CHECK (NOT NULL created_at)
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	CONSTRAINT "vendors_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "vendors_name_not_null" CHECK (NOT NULL name),
	CONSTRAINT "vendors_email_not_null" CHECK (NOT NULL email)
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"type" varchar(50) NOT NULL,
	"price" real NOT NULL,
	CONSTRAINT "price_history_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "price_history_item_id_not_null" CHECK (NOT NULL item_id),
	CONSTRAINT "price_history_date_not_null" CHECK (NOT NULL date),
	CONSTRAINT "price_history_type_not_null" CHECK (NOT NULL type),
	CONSTRAINT "price_history_price_not_null" CHECK (NOT NULL price)
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"date_of_birth" timestamp with time zone NOT NULL,
	"gender" varchar(20) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patients_patient_number_unique" UNIQUE("patient_number"),
	CONSTRAINT "patients_id_not_null" CHECK (NOT NULL id),
	CONSTRAINT "patients_patient_number_not_null" CHECK (NOT NULL patient_number),
	CONSTRAINT "patients_name_not_null" CHECK (NOT NULL name),
	CONSTRAINT "patients_date_of_birth_not_null" CHECK (NOT NULL date_of_birth),
	CONSTRAINT "patients_gender_not_null" CHECK (NOT NULL gender),
	CONSTRAINT "patients_created_at_not_null" CHECK (NOT NULL created_at)
);
--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_take_items" ADD CONSTRAINT "stock_take_items_session_id_stock_take_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."stock_take_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
*/