import { pgTable, check, uuid, varchar, timestamp, jsonb, real, boolean, foreignKey, integer, unique, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const billings = pgTable("billings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	patientName: varchar("patient_name", { length: 255 }).notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	billType: varchar("bill_type", { length: 50 }).notNull(),
	prescriptionNumber: varchar("prescription_number", { length: 255 }),
	receiptNumber: varchar("receipt_number", { length: 255 }),
	items: jsonb().default([]).notNull(),
	subtotal: real().default(0).notNull(),
	discount: real(),
	grandTotal: real("grand_total").default(0).notNull(),
	paymentDetails: jsonb("payment_details").notNull(),
	dispensingLocationId: varchar("dispensing_location_id", { length: 100 }).notNull(),
	isDispensed: boolean("is_dispensed").default(false).notNull(),
}, (table) => [
	check("billings_id_not_null", sql`NOT NULL id`),
	check("billings_patient_name_not_null", sql`NOT NULL patient_name`),
	check("billings_date_not_null", sql`NOT NULL date`),
	check("billings_bill_type_not_null", sql`NOT NULL bill_type`),
	check("billings_items_not_null", sql`NOT NULL items`),
	check("billings_subtotal_not_null", sql`NOT NULL subtotal`),
	check("billings_grand_total_not_null", sql`NOT NULL grand_total`),
	check("billings_payment_details_not_null", sql`NOT NULL payment_details`),
	check("billings_dispensing_location_id_not_null", sql`NOT NULL dispensing_location_id`),
	check("billings_is_dispensed_not_null", sql`NOT NULL is_dispensed`),
]);

export const internalOrders = pgTable("internal_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	requestingLocationId: varchar("requesting_location_id", { length: 100 }).notNull(),
	items: jsonb().default([]).notNull(),
	status: varchar({ length: 50 }).default('Pending').notNull(),
}, (table) => [
	check("internal_orders_id_not_null", sql`NOT NULL id`),
	check("internal_orders_date_not_null", sql`NOT NULL date`),
	check("internal_orders_requesting_location_id_not_null", sql`NOT NULL requesting_location_id`),
	check("internal_orders_items_not_null", sql`NOT NULL items`),
	check("internal_orders_status_not_null", sql`NOT NULL status`),
]);

export const stockTakeSessions = pgTable("stock_take_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	locationId: varchar("location_id", { length: 100 }).notNull(),
	status: varchar({ length: 50 }).default('Ongoing').notNull(),
}, (table) => [
	check("stock_take_sessions_id_not_null", sql`NOT NULL id`),
	check("stock_take_sessions_date_not_null", sql`NOT NULL date`),
	check("stock_take_sessions_location_id_not_null", sql`NOT NULL location_id`),
	check("stock_take_sessions_status_not_null", sql`NOT NULL status`),
]);

export const localPurchaseOrders = pgTable("local_purchase_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	lpoNumber: varchar("lpo_number", { length: 255 }).notNull(),
	vendorId: uuid("vendor_id").notNull(),
	vendorName: varchar("vendor_name", { length: 255 }).notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	items: jsonb().default([]).notNull(),
	grandTotal: real("grand_total").default(0).notNull(),
	status: varchar({ length: 50 }).default('Draft').notNull(),
}, (table) => [
	check("local_purchase_orders_id_not_null", sql`NOT NULL id`),
	check("local_purchase_orders_lpo_number_not_null", sql`NOT NULL lpo_number`),
	check("local_purchase_orders_vendor_id_not_null", sql`NOT NULL vendor_id`),
	check("local_purchase_orders_vendor_name_not_null", sql`NOT NULL vendor_name`),
	check("local_purchase_orders_date_not_null", sql`NOT NULL date`),
	check("local_purchase_orders_items_not_null", sql`NOT NULL items`),
	check("local_purchase_orders_grand_total_not_null", sql`NOT NULL grand_total`),
	check("local_purchase_orders_status_not_null", sql`NOT NULL status`),
]);

export const logs = pgTable("logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	userDisplayName: varchar("user_display_name", { length: 255 }).notNull(),
	action: varchar({ length: 255 }).notNull(),
	details: jsonb().default({}).notNull(),
}, (table) => [
	check("logs_id_not_null", sql`NOT NULL id`),
	check("logs_timestamp_not_null", sql`NOT NULL "timestamp"`),
	check("logs_user_id_not_null", sql`NOT NULL user_id`),
	check("logs_user_display_name_not_null", sql`NOT NULL user_display_name`),
	check("logs_action_not_null", sql`NOT NULL action`),
	check("logs_details_not_null", sql`NOT NULL details`),
]);

export const procurementSessions = pgTable("procurement_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	status: varchar({ length: 50 }).default('Draft').notNull(),
	procurementList: jsonb("procurement_list").default([]).notNull(),
	vendorQuotes: jsonb("vendor_quotes").default({}).notNull(),
	lpoQuantities: jsonb("lpo_quantities").default({}).notNull(),
}, (table) => [
	check("procurement_sessions_id_not_null", sql`NOT NULL id`),
	check("procurement_sessions_created_at_not_null", sql`NOT NULL created_at`),
	check("procurement_sessions_status_not_null", sql`NOT NULL status`),
	check("procurement_sessions_procurement_list_not_null", sql`NOT NULL procurement_list`),
	check("procurement_sessions_vendor_quotes_not_null", sql`NOT NULL vendor_quotes`),
	check("procurement_sessions_lpo_quantities_not_null", sql`NOT NULL lpo_quantities`),
]);

export const services = pgTable("services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	fee: real().default(0).notNull(),
}, (table) => [
	check("services_id_not_null", sql`NOT NULL id`),
	check("services_name_not_null", sql`NOT NULL name`),
	check("services_fee_not_null", sql`NOT NULL fee`),
]);

export const settings = pgTable("settings", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	value: jsonb().default({}).notNull(),
}, (table) => [
	check("settings_id_not_null", sql`NOT NULL id`),
	check("settings_value_not_null", sql`NOT NULL value`),
]);

export const stocks = pgTable("stocks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	itemId: uuid("item_id").notNull(),
	batchId: varchar("batch_id", { length: 255 }).notNull(),
	locationId: varchar("location_id", { length: 100 }).notNull(),
	currentStockQuantity: integer("current_stock_quantity").default(0).notNull(),
	expiryDate: timestamp("expiry_date", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
		columns: [table.itemId],
		foreignColumns: [items.id],
		name: "stocks_item_id_items_id_fk"
	}).onDelete("cascade"),
	check("stocks_id_not_null", sql`NOT NULL id`),
	check("stocks_item_id_not_null", sql`NOT NULL item_id`),
	check("stocks_batch_id_not_null", sql`NOT NULL batch_id`),
	check("stocks_location_id_not_null", sql`NOT NULL location_id`),
	check("stocks_current_stock_quantity_not_null", sql`NOT NULL current_stock_quantity`),
]);

export const items = pgTable("items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	itemCode: varchar("item_code", { length: 100 }).notNull(),
	genericName: varchar("generic_name", { length: 255 }).notNull(),
	brandName: varchar("brand_name", { length: 255 }),
	formulation: varchar({ length: 100 }).notNull(),
	strengthValue: real("strength_value"),
	strengthUnit: varchar("strength_unit", { length: 50 }),
	concentrationValue: real("concentration_value"),
	concentrationUnit: varchar("concentration_unit", { length: 50 }),
	packageSizeValue: real("package_size_value"),
	packageSizeUnit: varchar("package_size_unit", { length: 50 }),
	category: varchar({ length: 100 }).notNull(),
	unitOfMeasure: varchar("unit_of_measure", { length: 100 }).notNull(),
	dispensaryReorderLevel: integer("dispensary_reorder_level").default(0).notNull(),
	bulkStoreReorderLevel: integer("bulk_store_reorder_level").default(0).notNull(),
	unitCost: real("unit_cost").default(0).notNull(),
	sellingPrice: real("selling_price").default(0).notNull(),
}, (table) => [
	unique("items_item_code_unique").on(table.itemCode),
	check("items_id_not_null", sql`NOT NULL id`),
	check("items_item_code_not_null", sql`NOT NULL item_code`),
	check("items_generic_name_not_null", sql`NOT NULL generic_name`),
	check("items_formulation_not_null", sql`NOT NULL formulation`),
	check("items_category_not_null", sql`NOT NULL category`),
	check("items_unit_of_measure_not_null", sql`NOT NULL unit_of_measure`),
	check("items_dispensary_reorder_level_not_null", sql`NOT NULL dispensary_reorder_level`),
	check("items_bulk_store_reorder_level_not_null", sql`NOT NULL bulk_store_reorder_level`),
	check("items_unit_cost_not_null", sql`NOT NULL unit_cost`),
	check("items_selling_price_not_null", sql`NOT NULL selling_price`),
]);

export const stockTakeItems = pgTable("stock_take_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	itemId: uuid("item_id").notNull(),
	itemName: varchar("item_name", { length: 255 }).notNull(),
	batchId: varchar("batch_id", { length: 255 }).notNull(),
	expiryDate: varchar("expiry_date", { length: 255 }).notNull(),
	systemQty: integer("system_qty").default(0).notNull(),
	physicalQty: integer("physical_qty").default(0).notNull(),
	variance: integer().default(0).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.sessionId],
		foreignColumns: [stockTakeSessions.id],
		name: "stock_take_items_session_id_stock_take_sessions_id_fk"
	}).onDelete("cascade"),
	check("stock_take_items_id_not_null", sql`NOT NULL id`),
	check("stock_take_items_session_id_not_null", sql`NOT NULL session_id`),
	check("stock_take_items_item_id_not_null", sql`NOT NULL item_id`),
	check("stock_take_items_item_name_not_null", sql`NOT NULL item_name`),
	check("stock_take_items_batch_id_not_null", sql`NOT NULL batch_id`),
	check("stock_take_items_expiry_date_not_null", sql`NOT NULL expiry_date`),
	check("stock_take_items_system_qty_not_null", sql`NOT NULL system_qty`),
	check("stock_take_items_physical_qty_not_null", sql`NOT NULL physical_qty`),
	check("stock_take_items_variance_not_null", sql`NOT NULL variance`),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: varchar({ length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	role: varchar({ length: 50 }).default('cashier').notNull(),
	locationId: varchar("location_id", { length: 100 }).default('all').notNull(),
	disabled: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	check("users_id_not_null", sql`NOT NULL id`),
	check("users_username_not_null", sql`NOT NULL username`),
	check("users_display_name_not_null", sql`NOT NULL display_name`),
	check("users_password_hash_not_null", sql`NOT NULL password_hash`),
	check("users_role_not_null", sql`NOT NULL role`),
	check("users_location_id_not_null", sql`NOT NULL location_id`),
	check("users_disabled_not_null", sql`NOT NULL disabled`),
	check("users_created_at_not_null", sql`NOT NULL created_at`),
]);

export const vendors = pgTable("vendors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	contactPerson: varchar("contact_person", { length: 255 }),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }),
}, (table) => [
	check("vendors_id_not_null", sql`NOT NULL id`),
	check("vendors_name_not_null", sql`NOT NULL name`),
	check("vendors_email_not_null", sql`NOT NULL email`),
]);

export const priceHistory = pgTable("price_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	itemId: uuid("item_id").notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	type: varchar({ length: 50 }).notNull(),
	price: real().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.itemId],
		foreignColumns: [items.id],
		name: "price_history_item_id_items_id_fk"
	}).onDelete("cascade"),
	check("price_history_id_not_null", sql`NOT NULL id`),
	check("price_history_item_id_not_null", sql`NOT NULL item_id`),
	check("price_history_date_not_null", sql`NOT NULL date`),
	check("price_history_type_not_null", sql`NOT NULL type`),
	check("price_history_price_not_null", sql`NOT NULL price`),
]);

export const patients = pgTable("patients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	patientNumber: varchar("patient_number", { length: 50 }).notNull(),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	dateOfBirth: timestamp("date_of_birth", { withTimezone: true, mode: 'string' }).notNull(),
	gender: varchar({ length: 20 }).notNull(),
	phone: varchar({ length: 50 }),
	address: text(),
	loyaltyPoints: integer("loyalty_points").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("patients_patient_number_unique").on(table.patientNumber),
	check("patients_id_not_null", sql`NOT NULL id`),
	check("patients_patient_number_not_null", sql`NOT NULL patient_number`),
	check("patients_first_name_not_null", sql`NOT NULL first_name`),
	check("patients_last_name_not_null", sql`NOT NULL last_name`),
	check("patients_date_of_birth_not_null", sql`NOT NULL date_of_birth`),
	check("patients_gender_not_null", sql`NOT NULL gender`),
	check("patients_created_at_not_null", sql`NOT NULL created_at`),
]);
