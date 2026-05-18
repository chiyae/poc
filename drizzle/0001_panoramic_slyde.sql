CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"user_agent" text,
	"ip_address" varchar(50),
	"last_active" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "items" RENAME COLUMN "unit_cost" TO "buying_price";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_id_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_patient_name_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_date_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_bill_type_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_items_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_subtotal_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_grand_total_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_payment_details_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_dispensing_location_id_not_null";--> statement-breakpoint
ALTER TABLE "billings" DROP CONSTRAINT "billings_is_dispensed_not_null";--> statement-breakpoint
ALTER TABLE "internal_orders" DROP CONSTRAINT "internal_orders_id_not_null";--> statement-breakpoint
ALTER TABLE "internal_orders" DROP CONSTRAINT "internal_orders_date_not_null";--> statement-breakpoint
ALTER TABLE "internal_orders" DROP CONSTRAINT "internal_orders_requesting_location_id_not_null";--> statement-breakpoint
ALTER TABLE "internal_orders" DROP CONSTRAINT "internal_orders_items_not_null";--> statement-breakpoint
ALTER TABLE "internal_orders" DROP CONSTRAINT "internal_orders_status_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_sessions" DROP CONSTRAINT "stock_take_sessions_id_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_sessions" DROP CONSTRAINT "stock_take_sessions_date_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_sessions" DROP CONSTRAINT "stock_take_sessions_location_id_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_sessions" DROP CONSTRAINT "stock_take_sessions_status_not_null";--> statement-breakpoint
ALTER TABLE "local_purchase_orders" DROP CONSTRAINT "local_purchase_orders_id_not_null";--> statement-breakpoint
ALTER TABLE "local_purchase_orders" DROP CONSTRAINT "local_purchase_orders_lpo_number_not_null";--> statement-breakpoint
ALTER TABLE "local_purchase_orders" DROP CONSTRAINT "local_purchase_orders_vendor_id_not_null";--> statement-breakpoint
ALTER TABLE "local_purchase_orders" DROP CONSTRAINT "local_purchase_orders_vendor_name_not_null";--> statement-breakpoint
ALTER TABLE "local_purchase_orders" DROP CONSTRAINT "local_purchase_orders_date_not_null";--> statement-breakpoint
ALTER TABLE "local_purchase_orders" DROP CONSTRAINT "local_purchase_orders_items_not_null";--> statement-breakpoint
ALTER TABLE "local_purchase_orders" DROP CONSTRAINT "local_purchase_orders_grand_total_not_null";--> statement-breakpoint
ALTER TABLE "local_purchase_orders" DROP CONSTRAINT "local_purchase_orders_status_not_null";--> statement-breakpoint
ALTER TABLE "logs" DROP CONSTRAINT "logs_id_not_null";--> statement-breakpoint
ALTER TABLE "logs" DROP CONSTRAINT "logs_timestamp_not_null";--> statement-breakpoint
ALTER TABLE "logs" DROP CONSTRAINT "logs_user_id_not_null";--> statement-breakpoint
ALTER TABLE "logs" DROP CONSTRAINT "logs_user_display_name_not_null";--> statement-breakpoint
ALTER TABLE "logs" DROP CONSTRAINT "logs_action_not_null";--> statement-breakpoint
ALTER TABLE "logs" DROP CONSTRAINT "logs_details_not_null";--> statement-breakpoint
ALTER TABLE "procurement_sessions" DROP CONSTRAINT "procurement_sessions_id_not_null";--> statement-breakpoint
ALTER TABLE "procurement_sessions" DROP CONSTRAINT "procurement_sessions_created_at_not_null";--> statement-breakpoint
ALTER TABLE "procurement_sessions" DROP CONSTRAINT "procurement_sessions_status_not_null";--> statement-breakpoint
ALTER TABLE "procurement_sessions" DROP CONSTRAINT "procurement_sessions_procurement_list_not_null";--> statement-breakpoint
ALTER TABLE "procurement_sessions" DROP CONSTRAINT "procurement_sessions_vendor_quotes_not_null";--> statement-breakpoint
ALTER TABLE "procurement_sessions" DROP CONSTRAINT "procurement_sessions_lpo_quantities_not_null";--> statement-breakpoint
ALTER TABLE "services" DROP CONSTRAINT "services_id_not_null";--> statement-breakpoint
ALTER TABLE "services" DROP CONSTRAINT "services_name_not_null";--> statement-breakpoint
ALTER TABLE "services" DROP CONSTRAINT "services_fee_not_null";--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "settings_id_not_null";--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "settings_value_not_null";--> statement-breakpoint
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_id_not_null";--> statement-breakpoint
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_item_id_not_null";--> statement-breakpoint
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_batch_id_not_null";--> statement-breakpoint
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_location_id_not_null";--> statement-breakpoint
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_current_stock_quantity_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_id_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_item_code_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_generic_name_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_formulation_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_category_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_unit_of_measure_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_dispensary_reorder_level_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_bulk_store_reorder_level_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_unit_cost_not_null";--> statement-breakpoint
ALTER TABLE "items" DROP CONSTRAINT "items_selling_price_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_id_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_session_id_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_item_id_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_item_name_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_batch_id_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_expiry_date_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_system_qty_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_physical_qty_not_null";--> statement-breakpoint
ALTER TABLE "stock_take_items" DROP CONSTRAINT "stock_take_items_variance_not_null";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_id_not_null";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_not_null";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_display_name_not_null";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_password_hash_not_null";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_role_not_null";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_location_id_not_null";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_disabled_not_null";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_created_at_not_null";--> statement-breakpoint
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_id_not_null";--> statement-breakpoint
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_name_not_null";--> statement-breakpoint
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_email_not_null";--> statement-breakpoint
ALTER TABLE "price_history" DROP CONSTRAINT "price_history_id_not_null";--> statement-breakpoint
ALTER TABLE "price_history" DROP CONSTRAINT "price_history_item_id_not_null";--> statement-breakpoint
ALTER TABLE "price_history" DROP CONSTRAINT "price_history_date_not_null";--> statement-breakpoint
ALTER TABLE "price_history" DROP CONSTRAINT "price_history_type_not_null";--> statement-breakpoint
ALTER TABLE "price_history" DROP CONSTRAINT "price_history_price_not_null";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_id_not_null";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_patient_number_not_null";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_name_not_null";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_date_of_birth_not_null";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_gender_not_null";--> statement-breakpoint
ALTER TABLE "patients" DROP CONSTRAINT "patients_created_at_not_null";--> statement-breakpoint
ALTER TABLE "billings" ADD COLUMN "patient_id" uuid;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "consultation_price" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "first_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "last_name" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "loyalty_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billings" ADD CONSTRAINT "billings_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" DROP COLUMN "name";