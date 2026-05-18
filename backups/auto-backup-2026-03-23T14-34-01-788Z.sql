--
-- PostgreSQL database dump
--

\restrict XNRXWm96Afulq1Iw6Bju4XuhhCHa8iLIJfsmmhpcmEOz0QIjvdbglYmu43YGgMm

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: billings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.billings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_name character varying(255) NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    bill_type character varying(50) NOT NULL,
    prescription_number character varying(255),
    receipt_number character varying(255),
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    subtotal real DEFAULT 0 NOT NULL,
    discount real,
    grand_total real DEFAULT 0 NOT NULL,
    payment_details jsonb NOT NULL,
    dispensing_location_id character varying(100) NOT NULL,
    is_dispensed boolean DEFAULT false NOT NULL,
    patient_id uuid,
    shift_type character varying(20)
);


ALTER TABLE public.billings OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    "position" character varying(255),
    base_salary real DEFAULT 0 NOT NULL,
    hire_date timestamp with time zone DEFAULT now() NOT NULL,
    phone character varying(50),
    email character varying(255),
    active boolean DEFAULT true NOT NULL,
    employee_number character varying(50) NOT NULL
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    category character varying(100) NOT NULL,
    description text NOT NULL,
    amount real NOT NULL,
    payment_method character varying(50) DEFAULT 'Cash'::character varying NOT NULL,
    reference character varying(255)
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: internal_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.internal_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    requesting_location_id character varying(100) NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL
);


ALTER TABLE public.internal_orders OWNER TO postgres;

--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_code character varying(100) NOT NULL,
    generic_name character varying(255) NOT NULL,
    brand_name character varying(255),
    formulation character varying(100) NOT NULL,
    strength_value real,
    strength_unit character varying(50),
    concentration_value real,
    concentration_unit character varying(50),
    package_size_value real,
    package_size_unit character varying(50),
    category character varying(100) NOT NULL,
    unit_of_measure character varying(100) NOT NULL,
    dispensary_reorder_level integer DEFAULT 0 NOT NULL,
    bulk_store_reorder_level integer DEFAULT 0 NOT NULL,
    buying_price real DEFAULT 0 CONSTRAINT items_unit_cost_not_null NOT NULL,
    selling_price real DEFAULT 0 NOT NULL,
    consultation_price real DEFAULT 0 NOT NULL
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: local_purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.local_purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lpo_number character varying(255) NOT NULL,
    vendor_id uuid NOT NULL,
    vendor_name character varying(255) NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    grand_total real DEFAULT 0 NOT NULL,
    status character varying(50) DEFAULT 'Draft'::character varying NOT NULL
);


ALTER TABLE public.local_purchase_orders OWNER TO postgres;

--
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    user_id character varying(255) NOT NULL,
    user_display_name character varying(255) NOT NULL,
    action character varying(255) NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_number character varying(50) NOT NULL,
    date_of_birth timestamp with time zone NOT NULL,
    gender character varying(20) NOT NULL,
    phone character varying(50),
    address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    loyalty_points integer DEFAULT 0 NOT NULL,
    CONSTRAINT patients_first_name_not_null CHECK ((first_name IS NOT NULL)),
    CONSTRAINT patients_last_name_not_null CHECK ((last_name IS NOT NULL))
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: payslips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    base_salary real NOT NULL,
    allowances real DEFAULT 0 NOT NULL,
    deductions real DEFAULT 0 NOT NULL,
    net_pay real NOT NULL,
    status character varying(50) DEFAULT 'Draft'::character varying NOT NULL,
    payment_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    allowance_details jsonb DEFAULT '[]'::jsonb NOT NULL,
    deduction_details jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.payslips OWNER TO postgres;

--
-- Name: price_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    type character varying(50) NOT NULL,
    price real NOT NULL
);


ALTER TABLE public.price_history OWNER TO postgres;

--
-- Name: procurement_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.procurement_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(50) DEFAULT 'Draft'::character varying NOT NULL,
    procurement_list jsonb DEFAULT '[]'::jsonb NOT NULL,
    vendor_quotes jsonb DEFAULT '{}'::jsonb NOT NULL,
    lpo_quantities jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.procurement_sessions OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    fee real DEFAULT 0 NOT NULL,
    category character varying(100) DEFAULT 'General'::character varying NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    user_agent text,
    ip_address character varying(50),
    last_active timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id character varying(255) NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: shift_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    shift_type character varying(20) NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    cashier_id uuid,
    expected_income real DEFAULT 0 NOT NULL,
    actual_cash_in_hand real DEFAULT 0 NOT NULL,
    variance real DEFAULT 0 NOT NULL,
    notes text,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL
);


ALTER TABLE public.shift_records OWNER TO postgres;

--
-- Name: stock_take_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_take_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    item_id uuid NOT NULL,
    item_name character varying(255) NOT NULL,
    batch_id character varying(255) NOT NULL,
    expiry_date character varying(255) NOT NULL,
    system_qty integer DEFAULT 0 NOT NULL,
    physical_qty integer DEFAULT 0 NOT NULL,
    variance integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.stock_take_items OWNER TO postgres;

--
-- Name: stock_take_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_take_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    location_id character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'Ongoing'::character varying NOT NULL
);


ALTER TABLE public.stock_take_sessions OWNER TO postgres;

--
-- Name: stocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    batch_id character varying(255) NOT NULL,
    location_id character varying(100) NOT NULL,
    current_stock_quantity integer DEFAULT 0 NOT NULL,
    expiry_date timestamp with time zone
);


ALTER TABLE public.stocks OWNER TO postgres;

--
-- Name: under_five_income; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.under_five_income (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date timestamp with time zone NOT NULL,
    amount real DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.under_five_income OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(50) DEFAULT 'cashier'::character varying NOT NULL,
    location_id character varying(100) DEFAULT 'all'::character varying NOT NULL,
    disabled boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vendors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    contact_person character varying(255),
    email character varying(255) NOT NULL,
    phone character varying(50)
);


ALTER TABLE public.vendors OWNER TO postgres;

--
-- Data for Name: billings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.billings (id, patient_name, date, bill_type, prescription_number, receipt_number, items, subtotal, discount, grand_total, payment_details, dispensing_location_id, is_dispensed, patient_id, shift_type) FROM stdin;
ed06b83e-65ba-4b23-b2c3-9743e470617b	elen Mascal	2026-02-19 07:47:56.345329+02	Walk-in	\N	RCPT-1771480075642	[{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "quantity": 1, "unitCost": 0, "unitPrice": 7000}]	7000	0	7000	{"change": 2000, "method": "Cash", "status": "Paid", "amountTendered": 9000}	dispensary	t	\N	\N
b86b7cec-acf3-4c3a-918a-0dcb08f39ca5	Josiya Basikolo	2026-02-19 08:19:32.099065+02	Walk-in	\N	RCPT-1771481971593	[{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 7000}]	7000	0	7000	{"change": 3000, "method": "Cash", "status": "Paid", "amountTendered": 10000}	dispensary	f	\N	\N
cd43e9a3-5c7d-4fe7-82f3-a206999169c3	Josiya Basikolo	2026-02-19 11:57:38.364063+02	OPD	34512	RCPT-1771495381695	[{"total": 15000, "itemId": "0bc5422f-7adc-4fb6-80ab-0cbf3aa0d354", "itemName": "implant Insertion ", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 15000}]	15000	0	15000	{"change": 5000, "method": "Cash", "status": "Paid", "amountTendered": 20000}	dispensary	f	f387b3a6-5b4b-4b40-86ca-0bb990025460	\N
6a2776df-6b9a-49a2-999b-b6cff0f986e3	john black	2026-02-27 17:35:29.313764+02	Walk-in	\N	RCPT-1772206528812	[{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 7000}]	7000	0	7000	{"change": 0, "method": "Cash", "status": "Paid", "amountTendered": 7000}	dispensary	f	\N	\N
aa72b1ab-f408-43df-9e86-215089f7ab63	Jesica Simpson	2026-02-27 17:48:10.623045+02	Walk-in	\N	RCPT-1772207290455	[{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 7000}]	7000	0	7000	{"change": 0, "method": "Cash", "status": "Paid", "amountTendered": 7000}	dispensary	f	\N	\N
feb4ec7c-7afe-41dc-8ea2-b9d315e61d7f	Josiya Basikolo	2026-02-27 18:26:20.309016+02	OPD	23566	RCPT-0001	[{"total": 15000, "itemId": "0bc5422f-7adc-4fb6-80ab-0cbf3aa0d354", "itemName": "implant Insertion ", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 15000}]	15000	0	15000	{"change": 0, "method": "Invoice", "status": "Paid", "invoiceNumber": "RCPT-1772209579756", "amountTendered": 15000}	dispensary	f	f387b3a6-5b4b-4b40-86ca-0bb990025460	\N
dc7442d3-8afc-48e9-9880-654073209037	Josiya Basikolo	2026-03-04 16:09:19.147239+02	OPD	4345	RCPT-0002	[{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "buyingPrice": 0, "sellingPrice": 7000}]	7000	0	7000	{"change": 3000, "method": "Cash", "status": "Paid", "invoiceNumber": null, "amountTendered": 10000}	dispensary	f	f387b3a6-5b4b-4b40-86ca-0bb990025460	Day
9030f27f-029d-4d39-b612-f6b54adfc87a	Josiya Basikolo	2026-03-04 16:12:05.413795+02	Walk-in	\N	RCPT-0003	[{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "buyingPrice": 0, "sellingPrice": 7000}]	7000	0	7000	{"change": 0, "method": "Cash", "status": "Paid", "invoiceNumber": null, "amountTendered": 7000}	dispensary	f	f387b3a6-5b4b-4b40-86ca-0bb990025460	Day
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, first_name, last_name, "position", base_salary, hire_date, phone, email, active, employee_number) FROM stdin;
c9fe336d-add6-47a4-b499-6cb27c5995a3	John Grey	Lackson	Nurse	300000	2026-03-04 08:55:20.773303+02	099999	ttambala@gmail.com	t	EMP0001
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, date, category, description, amount, payment_method, reference) FROM stdin;
292ac675-0634-4e43-98a2-69546a6b335d	2026-03-04 02:00:00+02	Medicines	WORLD WIDE 	200000	Bank	123234
\.


--
-- Data for Name: internal_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.internal_orders (id, date, requesting_location_id, items, status) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, item_code, generic_name, brand_name, formulation, strength_value, strength_unit, concentration_value, concentration_unit, package_size_value, package_size_unit, category, unit_of_measure, dispensary_reorder_level, bulk_store_reorder_level, buying_price, selling_price, consultation_price) FROM stdin;
ec85a5a0-f403-4c43-9a9d-64709f80815f	PAR3661	Paracetamol	PCM	Tablet	500	mg	0		0		Medicine	tablet	200	0	5	50	0
071d5576-4923-4412-a056-5756ecb6b35e	AMO2264	Amoxicillin		Capsule	500	mg	0		0		Medicine	capsule	100	500	12.5	25	0
04a176f3-bed8-4ad1-9e62-eae38f597929	AMO3394	Amoxclav 	Bactoclav	Tablet	625	mg	0		0		Medicine	Tablet	2	3	5000	12000	0
69060445-aad1-4128-8c8d-625042670a6f	AMP1938	Ampicillin	Ampecin	Syrup	125		0	/5ml	100	ml	Medicine	Bottle 	2	5	2250	5000	0
\.


--
-- Data for Name: local_purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.local_purchase_orders (id, lpo_number, vendor_id, vendor_name, date, items, grand_total, status) FROM stdin;
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (id, "timestamp", user_id, user_display_name, action, details) FROM stdin;
b78f6b69-fe4c-4b95-835d-821dba0c4e59	2026-02-19 07:47:56.366+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Create Bill	{"bill": {"id": "ed06b83e-65ba-4b23-b2c3-9743e470617b", "date": "2026-02-19T05:47:56.345Z", "items": [{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "quantity": 1, "unitCost": 0, "unitPrice": 7000}], "billType": "Walk-in", "discount": 0, "subtotal": 7000, "patientId": null, "grandTotal": 7000, "isDispensed": false, "patientName": "elen Mascal", "receiptNumber": "RCPT-1771480075642", "paymentDetails": {"change": 2000, "method": "Cash", "status": "Paid", "amountTendered": 9000}, "prescriptionNumber": null, "dispensingLocationId": "dispensary"}}
1d2bb450-46a3-467f-83e8-729325ee1f68	2026-02-19 08:19:32.119+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Create Bill	{"bill": {"id": "b86b7cec-acf3-4c3a-918a-0dcb08f39ca5", "date": "2026-02-19T06:19:32.099Z", "items": [{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 7000}], "billType": "Walk-in", "discount": 0, "subtotal": 7000, "patientId": null, "grandTotal": 7000, "isDispensed": false, "patientName": "Josiya Basikolo", "receiptNumber": "RCPT-1771481971593", "paymentDetails": {"change": 3000, "method": "Cash", "status": "Paid", "amountTendered": 10000}, "prescriptionNumber": null, "dispensingLocationId": "dispensary"}}
269822ce-d536-4515-a212-895e09f5730c	2026-02-19 11:57:38.372+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Create Bill	{"bill": {"id": "cd43e9a3-5c7d-4fe7-82f3-a206999169c3", "date": "2026-02-19T09:57:38.364Z", "items": [{"total": 15000, "itemId": "0bc5422f-7adc-4fb6-80ab-0cbf3aa0d354", "itemName": "implant Insertion ", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 15000}], "billType": "OPD", "discount": 0, "subtotal": 15000, "patientId": "f387b3a6-5b4b-4b40-86ca-0bb990025460", "grandTotal": 15000, "isDispensed": false, "patientName": "Josiya Basikolo", "receiptNumber": "RCPT-1771495381695", "paymentDetails": {"change": 5000, "method": "Cash", "status": "Paid", "amountTendered": 20000}, "prescriptionNumber": "34512", "dispensingLocationId": "dispensary"}}
83b651a5-0fb5-4226-988c-8dd6e50b0232	2026-02-27 17:35:29.317+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Create Bill	{"bill": {"id": "6a2776df-6b9a-49a2-999b-b6cff0f986e3", "date": "2026-02-27T15:35:29.313Z", "items": [{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 7000}], "billType": "Walk-in", "discount": 0, "subtotal": 7000, "patientId": null, "grandTotal": 7000, "isDispensed": false, "patientName": "john black", "receiptNumber": "RCPT-1772206528812", "paymentDetails": {"change": 0, "method": "Cash", "status": "Paid", "amountTendered": 7000}, "prescriptionNumber": null, "dispensingLocationId": "dispensary"}}
a10382e7-890c-4268-b3a4-ab956bded6b6	2026-02-27 17:48:10.637+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Create Bill	{"bill": {"id": "aa72b1ab-f408-43df-9e86-215089f7ab63", "date": "2026-02-27T15:48:10.623Z", "items": [{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 7000}], "billType": "Walk-in", "discount": 0, "subtotal": 7000, "patientId": null, "grandTotal": 7000, "isDispensed": false, "patientName": "Jesica Simpson", "receiptNumber": "RCPT-1772207290455", "paymentDetails": {"change": 0, "method": "Cash", "status": "Paid", "amountTendered": 7000}, "prescriptionNumber": null, "dispensingLocationId": "dispensary"}}
fb6ce1c9-9f22-41f2-bd30-1bdd501d5caa	2026-02-27 18:26:20.316+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Create Bill	{"bill": {"id": "feb4ec7c-7afe-41dc-8ea2-b9d315e61d7f", "date": "2026-02-27T16:26:20.309Z", "items": [{"total": 15000, "itemId": "0bc5422f-7adc-4fb6-80ab-0cbf3aa0d354", "itemName": "implant Insertion ", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 15000}], "billType": "OPD", "discount": 0, "subtotal": 15000, "patientId": "f387b3a6-5b4b-4b40-86ca-0bb990025460", "grandTotal": 15000, "isDispensed": false, "patientName": "Josiya Basikolo", "receiptNumber": "RCPT-1772209579756", "paymentDetails": {"change": 0, "method": "Invoice", "status": "Unpaid", "amountTendered": 15000}, "prescriptionNumber": "23566", "dispensingLocationId": "dispensary"}}
b9649096-7872-4b5f-8193-969cd99cbeb4	2026-02-27 19:19:44.175+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Update Bill	{"after": {"id": "feb4ec7c-7afe-41dc-8ea2-b9d315e61d7f", "date": "2026-02-27T16:26:20.309Z", "items": [{"total": 15000, "itemId": "0bc5422f-7adc-4fb6-80ab-0cbf3aa0d354", "itemName": "implant Insertion ", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 15000}], "billType": "OPD", "discount": 0, "subtotal": 15000, "patientId": "f387b3a6-5b4b-4b40-86ca-0bb990025460", "grandTotal": 15000, "isDispensed": false, "patientName": "Josiya Basikolo", "receiptNumber": "RCPT-0001", "paymentDetails": {"change": 0, "method": "Invoice", "status": "Paid", "invoiceNumber": "RCPT-1772209579756", "amountTendered": 15000}, "prescriptionNumber": "23566", "dispensingLocationId": "dispensary"}, "before": {"id": "feb4ec7c-7afe-41dc-8ea2-b9d315e61d7f", "date": "2026-02-27T16:26:20.309Z", "items": [{"total": 15000, "itemId": "0bc5422f-7adc-4fb6-80ab-0cbf3aa0d354", "itemName": "implant Insertion ", "itemType": "service", "quantity": 1, "unitCost": 0, "unitPrice": 15000}], "billType": "OPD", "discount": 0, "subtotal": 15000, "patientId": "f387b3a6-5b4b-4b40-86ca-0bb990025460", "grandTotal": 15000, "isDispensed": false, "patientName": "Josiya Basikolo", "receiptNumber": "RCPT-1772209579756", "paymentDetails": {"change": 0, "method": "Invoice", "status": "Unpaid", "amountTendered": 15000}, "prescriptionNumber": "23566", "dispensingLocationId": "dispensary"}}
f020be12-a291-487e-8455-c53b9da6c0c6	2026-03-04 16:09:19.172+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Create Bill	{"bill": {"id": "dc7442d3-8afc-48e9-9880-654073209037", "date": "2026-03-04T14:09:19.147Z", "items": [{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "buyingPrice": 0, "sellingPrice": 7000}], "billType": "OPD", "discount": 0, "subtotal": 7000, "patientId": "f387b3a6-5b4b-4b40-86ca-0bb990025460", "shiftType": "Day", "grandTotal": 7000, "isDispensed": false, "patientName": "Josiya Basikolo", "receiptNumber": "RCPT-0002", "paymentDetails": {"change": 3000, "method": "Cash", "status": "Paid", "invoiceNumber": null, "amountTendered": 10000}, "prescriptionNumber": "4345", "dispensingLocationId": "dispensary"}}
26c3eadc-e4d4-4161-9df7-a7f6e3c2f9d8	2026-03-04 16:12:05.419+02	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	System Administrator	Create Bill	{"bill": {"id": "9030f27f-029d-4d39-b612-f6b54adfc87a", "date": "2026-03-04T14:12:05.413Z", "items": [{"total": 7000, "itemId": "a18dc621-dc88-461e-ba67-a973d70ec1c4", "itemName": "Implant Removal", "itemType": "service", "quantity": 1, "buyingPrice": 0, "sellingPrice": 7000}], "billType": "Walk-in", "discount": 0, "subtotal": 7000, "patientId": "f387b3a6-5b4b-4b40-86ca-0bb990025460", "shiftType": "Day", "grandTotal": 7000, "isDispensed": false, "patientName": "Josiya Basikolo", "receiptNumber": "RCPT-0003", "paymentDetails": {"change": 0, "method": "Cash", "status": "Paid", "invoiceNumber": null, "amountTendered": 7000}, "prescriptionNumber": null, "dispensingLocationId": "dispensary"}}
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, patient_number, date_of_birth, gender, phone, address, created_at, first_name, last_name, loyalty_points) FROM stdin;
f387b3a6-5b4b-4b40-86ca-0bb990025460	MPC-2026-001	1990-12-12 00:00:00+02	Male	0999234343	Mpingu	2026-02-19 08:56:35.659315+02	Josiya	Basikolo	0
5e678469-9a24-4897-b0d8-17d3935fa795	MPC-2026-002	1989-09-13 00:00:00+02	Male	099897343	Kadziyo	2026-02-19 11:55:27.970629+02	Lindako	Duwe	0
\.


--
-- Data for Name: payslips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payslips (id, employee_id, month, year, base_salary, allowances, deductions, net_pay, status, payment_date, created_at, allowance_details, deduction_details) FROM stdin;
6b47e058-6cc8-4a37-8cfc-447b3ae54475	c9fe336d-add6-47a4-b499-6cb27c5995a3	3	2026	300000	0	10000	290000	Paid	2026-03-04 09:06:43.579+02	2026-03-04 09:06:45.439805+02	[]	[]
fd95a66e-72e5-4250-bb2e-ee5eeec32fb7	c9fe336d-add6-47a4-b499-6cb27c5995a3	1	2026	300000	0	20000	280000	Paid	2026-03-04 10:15:31.554+02	2026-03-04 10:15:33.809459+02	[{"amount": 0, "description": ""}]	[{"amount": 15000, "description": "pension Contribution 10%"}, {"amount": 5000, "description": "social welfare"}, {"amount": 0, "description": ""}]
\.


--
-- Data for Name: price_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_history (id, item_id, date, type, price) FROM stdin;
\.


--
-- Data for Name: procurement_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.procurement_sessions (id, created_at, status, procurement_list, vendor_quotes, lpo_quantities) FROM stdin;
b533149c-c633-4218-a744-1d5016df1c8a	2026-02-19 01:53:06.967046+02	Draft	[]	{}	{}
ff92c9b0-3f8c-42a3-8531-2a3645b3a32d	2026-02-28 17:49:29.256829+02	Draft	["071d5576-4923-4412-a056-5756ecb6b35e", "69060445-aad1-4128-8c8d-625042670a6f", "04a176f3-bed8-4ad1-9e62-eae38f597929"]	{"04a176f3-bed8-4ad1-9e62-eae38f597929": {"29fb0334-6f62-4076-864c-20cc1cb829ce": 12345, "5fc881c2-4897-4bf2-9e81-50d502cf6d6e": 1234, "a31c71f2-4ea5-4148-9cf2-c755335fa44d": 5677}, "071d5576-4923-4412-a056-5756ecb6b35e": {"29fb0334-6f62-4076-864c-20cc1cb829ce": 2333, "5fc881c2-4897-4bf2-9e81-50d502cf6d6e": 2134, "a31c71f2-4ea5-4148-9cf2-c755335fa44d": 1234}, "69060445-aad1-4128-8c8d-625042670a6f": {"29fb0334-6f62-4076-864c-20cc1cb829ce": 1000, "5fc881c2-4897-4bf2-9e81-50d502cf6d6e": 5677, "a31c71f2-4ea5-4148-9cf2-c755335fa44d": 1234}}	{"071d5576-4923-4412-a056-5756ecb6b35e": 6}
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, fee, category) FROM stdin;
5cac2716-94cb-4019-8cbd-74bed327be94	Male Circumcision	50000	General
808e5a97-a530-491a-9a5e-5e72117f6b2a	Consultation 	2500	General
a18dc621-dc88-461e-ba67-a973d70ec1c4	Implant Removal	7000	General
0bc5422f-7adc-4fb6-80ab-0cbf3aa0d354	implant Insertion 	15000	General
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token, user_agent, ip_address, last_active, expires_at, created_at) FROM stdin;
88cc76f7-0f50-468f-849f-e9ce67d1457c	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	d2a2c959-4305-401f-b6bc-5ebf89b1817e	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36 EdgA/144.0.0.0	10.118.21.145	2026-02-19 11:59:34.307+02	2026-02-26 11:56:12.1+02	2026-02-19 11:56:12.104102+02
f3829b9b-02f7-480f-84c1-87983b4fdeea	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	3b91be45-20fe-4482-ac42-214763004853	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	127.0.0.1	2026-02-28 12:32:32.061+02	2026-03-07 12:32:11.258+02	2026-02-28 12:32:11.267098+02
ce54fa17-87d0-4b67-9662-dfc3cbfaefac	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	c8b96279-c9a1-412a-a372-b9f73a935738	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	::ffff:192.168.1.166	2026-03-04 16:19:25.138+02	2026-03-11 16:05:38.365+02	2026-03-04 16:05:38.369874+02
0fcdff34-5b9f-496e-a0e8-665cea5dc3fb	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	04e34d38-a2ff-4e65-a9d8-0fe2a83f7251	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36	10.118.21.96	2026-02-19 14:27:29.588+02	2026-02-26 14:07:46.376+02	2026-02-19 14:07:46.380813+02
345b4002-bfcb-4082-bb67-fc6bbd634129	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	2e49d50e-5d09-48ca-9e73-fdd77bd5feda	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	127.0.0.1	2026-02-28 12:36:30.916+02	2026-03-07 11:58:11.656+02	2026-02-28 11:58:11.6612+02
e7fb0d7d-32b5-4a3c-b353-5c21554bf689	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	0d7d5f38-5862-4160-a2c5-711f09ba2016	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	127.0.0.1	2026-03-04 15:33:51.495+02	2026-03-11 14:14:03.828+02	2026-03-04 14:14:03.831882+02
2000b4a8-989c-4a55-9cff-63c1a4929c55	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	ff15c9ae-2302-48b4-8dda-ec1e93d9add3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	127.0.0.1	2026-03-04 15:13:56.49+02	2026-03-11 13:57:31.011+02	2026-03-04 13:57:31.02014+02
41c52f62-96ab-4def-9f3c-348ee0e3d148	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	39695c2a-a946-44c8-928e-0c862e43ba42	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	127.0.0.1	2026-03-12 12:59:42.536+02	2026-03-19 12:59:16.82+02	2026-03-12 12:59:16.824004+02
614acced-c2e0-4b75-8d46-73495b914dff	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	cf2911cc-ff58-403f-8c0e-eb238c2ef852	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	127.0.0.1	2026-03-04 14:08:53.214+02	2026-03-10 22:46:53.828+02	2026-03-03 22:46:53.838768+02
b018032d-e2b0-4378-a770-baa801d0db70	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	25a87e6f-70a7-41ea-9bdb-3f798430dc90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	::ffff:192.168.1.106	2026-03-04 16:16:04.712+02	2026-03-11 16:11:10.02+02	2026-03-04 16:11:10.022734+02
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, value) FROM stdin;
clinic	{"currency": "MWK", "clinicName": "Mpingu Medical Clinic ", "clinicPhone": "0999411352", "clinicAddress": "Mpingu Trading Centre, along Lilongwe Mchinji Road ", "sessionTimeout": 30, "patientIdPrefix": "MPC", "nextInvoiceNumber": 1, "nextReceiptNumber": 4}
\.


--
-- Data for Name: shift_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift_records (id, date, shift_type, start_time, end_time, cashier_id, expected_income, actual_cash_in_hand, variance, notes, status) FROM stdin;
\.


--
-- Data for Name: stock_take_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_take_items (id, session_id, item_id, item_name, batch_id, expiry_date, system_qty, physical_qty, variance) FROM stdin;
\.


--
-- Data for Name: stock_take_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_take_sessions (id, date, location_id, status) FROM stdin;
\.


--
-- Data for Name: stocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stocks (id, item_id, batch_id, location_id, current_stock_quantity, expiry_date) FROM stdin;
\.


--
-- Data for Name: under_five_income; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.under_five_income (id, date, amount, created_at) FROM stdin;
4dbf7051-d249-4a76-8989-cc6f18945b39	2026-03-04 00:00:00+02	8000	2026-03-04 11:52:12.107214+02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, display_name, password_hash, role, location_id, disabled, created_at) FROM stdin;
362f0e2b-3f9d-4b78-bef8-cbab87e38f39	admin	System Administrator	240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9	admin	all	f	2026-02-18 23:01:52.73264+02
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, name, contact_person, email, phone) FROM stdin;
29fb0334-6f62-4076-864c-20cc1cb829ce	Worldwide 	JOHN SEFU	chiyae@gmail.com	0999411352
a31c71f2-4ea5-4148-9cf2-c755335fa44d	Pharmavet	Violet Magalasi	vmah@pharmavet.com	099098765
5fc881c2-4897-4bf2-9e81-50d502cf6d6e	ICON 	JGHT PRASHAKR	JGHT@icon.mw	0989876545
\.


--
-- Name: billings billings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_number_unique UNIQUE (employee_number);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: internal_orders internal_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internal_orders
    ADD CONSTRAINT internal_orders_pkey PRIMARY KEY (id);


--
-- Name: items items_item_code_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_item_code_unique UNIQUE (item_code);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: local_purchase_orders local_purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_purchase_orders
    ADD CONSTRAINT local_purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: patients patients_patient_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_patient_number_unique UNIQUE (patient_number);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: price_history price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (id);


--
-- Name: procurement_sessions procurement_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.procurement_sessions
    ADD CONSTRAINT procurement_sessions_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_unique UNIQUE (token);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: shift_records shift_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_records
    ADD CONSTRAINT shift_records_pkey PRIMARY KEY (id);


--
-- Name: stock_take_items stock_take_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_take_items
    ADD CONSTRAINT stock_take_items_pkey PRIMARY KEY (id);


--
-- Name: stock_take_sessions stock_take_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_take_sessions
    ADD CONSTRAINT stock_take_sessions_pkey PRIMARY KEY (id);


--
-- Name: stocks stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_pkey PRIMARY KEY (id);


--
-- Name: under_five_income under_five_income_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.under_five_income
    ADD CONSTRAINT under_five_income_date_key UNIQUE (date);


--
-- Name: under_five_income under_five_income_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.under_five_income
    ADD CONSTRAINT under_five_income_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: billings billings_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);


--
-- Name: payslips payslips_employee_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_employee_id_employees_id_fk FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: price_history price_history_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_item_id_items_id_fk FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: shift_records shift_records_cashier_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_records
    ADD CONSTRAINT shift_records_cashier_id_users_id_fk FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: stock_take_items stock_take_items_session_id_stock_take_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_take_items
    ADD CONSTRAINT stock_take_items_session_id_stock_take_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.stock_take_sessions(id) ON DELETE CASCADE;


--
-- Name: stocks stocks_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stocks
    ADD CONSTRAINT stocks_item_id_items_id_fk FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict XNRXWm96Afulq1Iw6Bju4XuhhCHa8iLIJfsmmhpcmEOz0QIjvdbglYmu43YGgMm

