import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── USERS ───────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('cashier'), // admin | cashier | pharmacy
  locationId: varchar('location_id', { length: 100 }).notNull().default('all'),
  disabled: boolean('disabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── ITEMS (Master Data) ─────────────────────────────────
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemCode: varchar('item_code', { length: 100 }).notNull().unique(),
  genericName: varchar('generic_name', { length: 255 }).notNull(),
  brandName: varchar('brand_name', { length: 255 }),
  formulation: varchar('formulation', { length: 100 }).notNull(),
  strengthValue: real('strength_value'),
  strengthUnit: varchar('strength_unit', { length: 50 }),
  concentrationValue: real('concentration_value'),
  concentrationUnit: varchar('concentration_unit', { length: 50 }),
  packageSizeValue: real('package_size_value'),
  packageSizeUnit: varchar('package_size_unit', { length: 50 }),
  category: varchar('category', { length: 100 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 100 }).notNull(),
  dispensaryReorderLevel: integer('dispensary_reorder_level').notNull().default(0),
  bulkStoreReorderLevel: integer('bulk_store_reorder_level').notNull().default(0),
  buyingPrice: real('buying_price').notNull().default(0),
  sellingPrice: real('selling_price').notNull().default(0),
  consultationPrice: real('consultation_price').notNull().default(0),
});

// ─── PRICE HISTORY (sub-data of items) ───────────────────
export const priceHistory = pgTable('price_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'buyingPrice' | 'sellingPrice'
  price: real('price').notNull(),
});

// ─── STOCKS ──────────────────────────────────────────────
export const stocks = pgTable('stocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  batchId: varchar('batch_id', { length: 255 }).notNull(),
  locationId: varchar('location_id', { length: 100 }).notNull(),
  currentStockQuantity: integer('current_stock_quantity').notNull().default(0),
  reservedStock: integer('reserved_stock').notNull().default(0),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
});

// ─── VENDORS ─────────────────────────────────────────────
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
});

// ─── SERVICES ────────────────────────────────────────────
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  fee: real('fee').notNull().default(0),
  category: varchar('category', { length: 100 }).notNull().default('General'), // Laboratory | Consultation | Procedure | etc.
});

// ─── PATIENTS ────────────────────────────────────────────
export const patients = pgTable('patients', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientNumber: varchar('patient_number', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true }).notNull(),
  gender: varchar('gender', { length: 20 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── BILLINGS ────────────────────────────────────────────
export const billings = pgTable('billings', {
  id: uuid('id').defaultRandom().primaryKey(),
  patientId: uuid('patient_id').references(() => patients.id),
  patientName: varchar('patient_name', { length: 255 }).notNull(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  billType: varchar('bill_type', { length: 50 }).notNull(), // 'Walk-in' | 'OPD'
  prescriptionNumber: varchar('prescription_number', { length: 255 }),
  receiptNumber: varchar('receipt_number', { length: 255 }),
  items: jsonb('items').notNull().default([]),          // BillItem[]
  subtotal: real('subtotal').notNull().default(0),
  discount: real('discount'),
  grandTotal: real('grand_total').notNull().default(0),
  paymentDetails: jsonb('payment_details').notNull(),   // PaymentDetails
  dispensingLocationId: varchar('dispensing_location_id', { length: 100 }).notNull(),
  isDispensed: boolean('is_dispensed').notNull().default(false),
  shiftType: varchar('shift_type', { length: 20 }), // Day | Night
});

// ─── INTERNAL ORDERS ─────────────────────────────────────
export const internalOrders = pgTable('internal_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  requestingLocationId: varchar('requesting_location_id', { length: 100 }).notNull(),
  items: jsonb('items').notNull().default([]),          // InternalOrderItem[]
  status: varchar('status', { length: 50 }).notNull().default('Pending'),
  type: varchar('type', { length: 50 }).notNull().default('Request'), // Request | Return
});

// ─── STOCK TAKE SESSIONS ─────────────────────────────────
export const stockTakeSessions = pgTable('stock_take_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  locationId: varchar('location_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Ongoing'),
});

// ─── STOCK TAKE ITEMS (child of sessions) ────────────────
export const stockTakeItems = pgTable('stock_take_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => stockTakeSessions.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  batchId: varchar('batch_id', { length: 255 }).notNull(),
  expiryDate: varchar('expiry_date', { length: 255 }).notNull(),
  systemQty: integer('system_qty').notNull().default(0),
  physicalQty: integer('physical_qty').notNull().default(0),
  variance: integer('variance').notNull().default(0),
});

// ─── PROCUREMENT SESSIONS ────────────────────────────────
export const procurementSessions = pgTable('procurement_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Draft'),
  procurementList: jsonb('procurement_list').notNull().default([]),       // string[]
  vendorQuotes: jsonb('vendor_quotes').notNull().default({}),             // Record<string, Record<string, number>>
  lpoQuantities: jsonb('lpo_quantities').notNull().default({}),           // Record<string, number>
});

// ─── LOCAL PURCHASE ORDERS ───────────────────────────────
export const localPurchaseOrders = pgTable('local_purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  lpoNumber: varchar('lpo_number', { length: 255 }).notNull(),
  vendorId: uuid('vendor_id').notNull(),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  items: jsonb('items').notNull().default([]),   // LocalPurchaseOrderItem[]
  grandTotal: real('grand_total').notNull().default(0),
  status: varchar('status', { length: 50 }).notNull().default('Draft'),
  preparedByUserId: uuid('prepared_by_user_id'),
  preparedByName: varchar('prepared_by_name', { length: 255 }),
});

// ─── AUDIT LOGS ──────────────────────────────────────────
export const logs = pgTable('logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  userDisplayName: varchar('user_display_name', { length: 255 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  details: jsonb('details').notNull().default({}),
});

// ─── SETTINGS ────────────────────────────────────────────
export const settings = pgTable('settings', {
  id: varchar('id', { length: 255 }).primaryKey(), // e.g. 'currency', 'general'
  value: jsonb('value').notNull().default({}),
});
// ─── SESSIONS ────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 50 }),
  lastActive: timestamp('last_active', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── EMPLOYEES ───────────────────────────────────────────
export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeNumber: varchar('employee_number', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  position: varchar('position', { length: 255 }),
  baseSalary: real('base_salary').notNull().default(0),
  hireDate: timestamp('hire_date', { withTimezone: true }).defaultNow().notNull(),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  active: boolean('active').notNull().default(true),
});

// ─── EXPENSES ────────────────────────────────────────────
export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  category: varchar('category', { length: 100 }).notNull(), // Salaries | Transport | Medicines | Maintenance | Utilities | etc.
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('Cash'),
  reference: varchar('reference', { length: 255 }),
});

// ─── PAYSLIPS ────────────────────────────────────────────
export const payslips = pgTable('payslips', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  baseSalary: real('base_salary').notNull(),
  allowances: real('allowances').notNull().default(0),
  allowanceDetails: jsonb('allowance_details').notNull().default([]),
  deductions: real('deductions').notNull().default(0),
  deductionDetails: jsonb('deduction_details').notNull().default([]),
  netPay: real('net_pay').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('Draft'), // Draft | Paid
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── SHIFT RECORDS ───────────────────────────────────────
export const shiftRecords = pgTable('shift_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
  shiftType: varchar('shift_type', { length: 20 }).notNull(), // Day | Night
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  cashierId: uuid('cashier_id').references(() => users.id),
  expectedIncome: real('expected_income').notNull().default(0),
  actualCashInHand: real('actual_cash_in_hand').notNull().default(0),
  variance: real('variance').notNull().default(0),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).notNull().default('Pending'), // Pending | Reconciled
});

// ─── UNDER FIVE INCOME ───────────────────────────────────
export const underFiveIncome = pgTable('under_five_income', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: timestamp('date', { withTimezone: true }).notNull().unique(),
  amount: real('amount').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
