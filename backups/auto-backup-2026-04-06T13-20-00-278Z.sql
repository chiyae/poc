--
-- PostgreSQL database dump
--

\restrict 9KqkJWdaVAlGaKDuuPRqtnV3z1fW1fN91R2eszRkf8DrsNWx06ug4DhoxnlGLDb

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
405cb17b-3671-486f-9d9b-bd784ef5b446	ITM-0001	Acepar	\N	Tablet	600	mg	\N	\N	\N	\N	Medicine	Tablet	2	7	1900	4000	0
77cfaf47-e8df-4779-a0b7-6d981f50243b	ITM-0002	Acetaminophen	Gacet	supository	125	mg	\N	\N	\N	\N	Medicine	tablet	5	5	250	500	0
8e07ab4f-0a0a-4c06-8b03-1d845c637309	ITM-0003	Acetaminophen	Gacet	supository	250	mg	\N	\N	\N	\N	Medicine	Tablet	5	5	300	600	0
a138f023-1df6-4f91-8313-ec0a40fd3743	ITM-0004	Aciclovir	\N	Cream	5	%	\N	\N	10	gm	Medicine	Tube	3	5	1500	3000	0
7819592c-e6f8-4801-9cae-790c323e5277	ITM-0005	Aminophyline	\N	Tablet	100	mg	\N	\N	\N	\N	Medicine	Tablet	200	0	33	50	0
e30ea412-8933-4d93-b037-5e8b12e69253	ITM-0006	Aminophyline	\N	Vial	\N	\N	250	mg/10ml	10	ml	Medicine	Vial	5	10	1000	5000	0
e7d2abf3-3c81-4699-9438-96fa57cb1e47	ITM-0007	Amitryptyline	\N	tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	49	100	0
94e3fdc1-dc5f-4289-aa44-cca2d3aaa53c	ITM-0008	Amlodipine	\N	Tablet	10	mg	\N	\N	\N	\N	Medicine	Tablet	20	100	50	100	0
74228168-d06c-48aa-a5c2-a5ee0f8e6680	ITM-0009	Amlodipine	\N	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	20	100	50	100	0
5ac5602b-024f-469d-9402-73efc1e5311d	ITM-0010	Amoxclav	\N	Syrup	\N	\N	228.5	mg/5ml	100	ml	Medicine	Bottle	1	3	6950	12500	0
8db3dad0-67e0-469e-b74d-7b625bf6ee61	ITM-0011	Amoxclav	\N	Tablet	625	mg	\N	\N	\N	\N	Medicine	10 Tablets	2	5	5900	12000	0
6a714147-c3ae-4293-9529-6ca0ac20fba7	ITM-0012	Amoxicillin	\N	Capsule	500	mg	\N	\N	\N	\N	Medicine	capsule	100	500	75	200	0
596286db-e2fb-4f19-90bd-70a35ff0b668	ITM-0013	Amoxicillin	\N	Capsule	250	mg	\N	\N	\N	\N	Medicine	capsule	250	1000	75	200	0
cf627fb6-00ec-4a6c-9354-0050e4e0edc1	ITM-0014	Amoxicillin	\N	Syrup	\N	\N	125	mg/5ml	100	ml	Medicine	Bottle	2	5	1900	4000	0
17e0a5d8-57de-40c9-87ac-0530121b8225	ITM-0015	Ampicillin	\N	Tablet	250	mg	\N	\N	\N	\N	Medicine	capsule	30	100	150	300	0
d926ce5b-2e7c-4b26-85f5-47793fd77d7e	ITM-0016	Ampicillin	\N	Capsule	250	mg	\N	\N	\N	\N	Medicine	capsule	30	100	75	300	0
8f75b1e7-08c9-4fc3-bfaf-b8da2162d404	ITM-0017	Ampicillin	\N	Syrup	\N	\N	125	mg/5ml	100	ml	Medicine	Bottle	2	5	2250	5000	0
9ef6c44f-4bf3-4679-a84c-2e30b4036897	ITM-0018	Ampicillin Injection	\N	Ampule	\N	\N	500	mg/10ml	10	ml	Medicine	Ampule	3	5	7000	14000	0
7f812460-0b2f-4d4e-a87b-cd9213b889a5	ITM-0019	Antagit-DS	\N	Syrup	\N	\N	450	mg/5ml	100	ml	Medicine	Bottle	2	5	2950	6000	0
5a996979-8539-4b5e-b007-653fa31d862a	ITM-0020	Artemether	\N	Ampule	\N	\N	80	mg/ml	1	ml	Medicine	Ampule	3	6	950	3500	0
99c8f29c-46c9-4383-8549-980c7d3e20e7	ITM-0021	Artesunate	\N	Vial	\N	\N	30	mg/5ml	5	ml	Medicine	Vial	3	5	4500	7000	0
82663aad-717f-42de-913d-6a276fe39624	ITM-0022	Artesunate	\N	Vial	\N	\N	60	mg/5ml	5	ml	Medicine	Vial	3	5	5000	10000	0
4d7584f3-d2bd-4dd1-b902-0c043b07997d	ITM-0023	Artesunate	\N	Vial	\N	\N	120	mg/10ml	10	ml	Medicine	Vial	3	5	8000	15000	0
6472dce9-1652-425b-a23e-94dfe956812a	ITM-0024	Atenolol	\N	Tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	20	100	20	40	0
c34dc20c-aad8-4537-a455-6fcce74cd782	ITM-0025	Atorvastatin	\N	Tablet	20	mg	\N	\N	\N	\N	Medicine	Tablet	20	100	120	250	0
595dbfcc-732a-4433-b5ce-af126ed7a72f	ITM-0026	Atropine	\N	Ampule	\N	\N	0.6	mg/ml	1	ml	Medicine	Ampule	2	5	1000	3000	0
55bf1f05-383b-4b2f-a884-4dc5c0aad45d	ITM-0027	Azintromycin	\N	Syrup	\N	\N	40	mg/ml	15	ml	Medicine	Bottle	2	5	1500	5000	0
8c06953f-25cb-489f-89bf-fc60f1f10533	ITM-0028	Azithromycin	\N	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	9	5	2000	5000	0
856cd4bf-0dc8-44d1-b85d-0fa1d8cf70cb	ITM-0029	Beclem	\N	Cream	2	%	\N	\N	15	gm	Medicine	Tube	3	5	2000	5000	0
6aa7bbb5-4eff-49f5-b28c-d55caefa68ec	ITM-0030	Beclomin	\N	Cream	3	%	\N	\N	15	gm	Medicine	Tube	3	5	1500	3000	0
66fae89b-13bf-4e38-898b-ddb5103031dc	ITM-0031	Benzathin	\N	Ampule	\N	\N	2.4	mu/10ml	10	ml	Medicine	Ampule	2	10	1999	3000	0
9b1eb515-815b-4ed1-897c-b2f0cf12b37f	ITM-0032	Betamethasone	Dawavate	Cream	0.1	%	\N	\N	15	gm	Medicine	Tube	3	5	1650	3500	0
76e4ccdf-d4fa-4945-9613-bd28fea4a85f	ITM-0033	Bisacodyl	\N	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	50	100	0
d893a9e3-6352-4926-83d6-e0c551992709	ITM-0034	Broxol Jnr	\N	Syrup	\N	\N	210	mg/5ml	100	ml	Medicine	Bottle	2	5	2599	5000	0
8599dee2-5df8-4061-b816-9ebe931cc1df	ITM-0035	Captopril	\N	Tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	20	100	50	1000	0
065c7f6f-27cf-4480-9d79-71b36e77c43a	ITM-0036	Cefexime	\N	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	1	0	4000	8000	0
d2807dbf-eec7-45d1-a54f-67cd17e8b5c2	ITM-0037	cefexime	Cebay	Syrup	\N	\N	50	mg/5ml	100	ml	Medicine	Bottle	2	5	5950	12000	0
e342bc08-4eba-448b-bef4-1822a6ce8a0a	ITM-0038	Cefuroxime	\N	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	1	0	4000	8000	0
e229208f-b7d3-4a4f-b137-80d8be712f8c	ITM-0039	Cetirizine	\N	Tablet	10	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	30	100	0
b2e2a880-5126-483a-aaa3-a6a5be1d9d84	ITM-0040	Cetirizine	Rinacet	Syrup	\N	\N	5	mg/5ml	60	ml	Medicine	Bottle	2	5	1500	3500	0
6958b1fc-5c5c-42a3-bcaf-7fbb0f13eafa	ITM-0041	Chefron	\N	Syrup	\N	\N	54	mg/5ml	100	ml	Medicine	Bottle	2	5	2850	6000	0
21694a85-334d-4fe7-b4c5-7197208a0ce6	ITM-0042	Chloramphenicol	\N	Syrup	\N	\N	125	mg/5ml	100	ml	Medicine	Bottle	2	5	3500	7000	0
e5e75ead-1e0c-4143-aad0-ff5545523ae4	ITM-0043	Chloramphenicol	ABCHOR	Solution	0.5	%	\N	\N	5	ml	Medicine	Bottle	3	5	1500	3000	0
675570f9-d8e7-4b50-b128-0148d835a268	ITM-0044	Cialis	\N	Tablet	20	mg	\N	\N	\N	\N	Medicine	Tablet	2	0	2000	4000	0
960c7db3-0ec8-44a0-996d-4406743b84fd	ITM-0045	Ciprofloxacin	\N	Tablet	250	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	200	400	0
6e8f5409-4a41-49c0-8596-d1a6916fd6f9	ITM-0046	Ciprofloxacin	\N	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	400	800	0
436bafd9-fc9e-4340-bd90-1531709370c8	ITM-0047	Ciprofloxacin	CIPROCIN	Solution	0.4	%	\N	\N	5	ml	Medicine	Bottle	3	5	1500	3000	0
831bfc06-8f3f-4a3c-8c3e-bdafb2aedb3a	ITM-0048	Ciprofloxacin/Tinidazole	CIPROFINA	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	30	0	1500	5000	0
8494989c-d0d8-4646-a3c3-c0f799976d32	ITM-0049	Clomiphene	\N	Tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	10	0	1000	2000	0
83490da2-08c6-4486-b02f-d8f26be606ef	ITM-0050	Clotrimazole	\N	Syrup	\N	\N	1	mg/ml	15	ml	Medicine	Bottle	2	5	1650	3500	0
891a07bb-261b-415b-9034-3bcceb8668c0	ITM-0051	Clotrimazole	Dazole	Cream	1	%	\N	\N	20	gm	Medicine	Tube	3	5	1500	3500	0
680de9bb-84fc-4342-a78b-c598c5d262b6	ITM-0052	Cloxacillin	\N	Capsule	250	mg	\N	\N	\N	\N	Medicine	capsule	30	100	75	300	0
4db4c69f-30d5-41ef-aefa-d01e69e74e3d	ITM-0053	Cloxacillin	\N	Syrup	\N	\N	125	mg/5ml	100	ml	Medicine	Bottle	2	5	2250	5000	0
5b4be79b-4451-4090-bcfd-1ddfe2a3196f	ITM-0054	Cold Tab	\N	Tablet	537	mg	\N	\N	\N	\N	Medicine	Tablet	3	10	1000	2000	0
2baa1875-aea1-4018-b7df-aa0cf8a80f5e	ITM-0055	Colicspam	\N	Syrup	\N	\N	50	mg/5ml	60	ml	Medicine	Bottle	2	5	2000	5000	0
e1891850-0f30-4893-a932-4e47afe113fa	ITM-0056	Dartep	\N	Tablet	540	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	6000	12000	0
17332055-5a48-4119-97c7-8f9fd70b9490	ITM-0057	DCN	\N	Tablet	100	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	90	300	0
eca383a6-1ae9-4636-926f-b3871cb661f7	ITM-0058	Depo	\N	Ampule	\N	\N	150	mg/ml	1	ml	Medicine	Ampule	2	0	1500	4500	0
af3ff992-d260-4f21-9040-f9aa7bec7a16	ITM-0059	Dexamethasone	Xsome	Solution	0.2	%	\N	\N	5	ml	Medicine	Bottle	3	5	1300	3000	0
65156c42-d860-45e3-bd44-85179b1b8690	ITM-0060	Diazepam	\N	Ampule	\N	\N	5	mg/ml	2	ml	Medicine	Ampule	2	5	600	2500	0
a80b1a97-eb92-43e0-8caf-9bbbd756a018	ITM-0061	Diclofenac	\N	tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	200	0	50	100	0
117c9c47-a25f-4c45-8494-40da130db4a8	ITM-0062	Diclofenac	\N	Ampule	\N	\N	75	mg/3ml	3	ml	Medicine	Ampule	5	20	400	2000	0
850e5ef4-47b4-4b18-9bfe-901eaf7decb9	ITM-0063	Diclofenac	\N	Supository	100	mg	\N	\N	\N	\N	Medicine	Supository	5	0	650	1200	0
57bbb615-bbdb-4185-86dd-b3fce667f5d6	ITM-0064	Diclofenac	Rheumac	Gell	1	%	\N	\N	20	gm	Medicine	Tube	2	5	2500	5000	0
363c8ae9-b965-446e-a5fe-512668402659	ITM-0065	Diclofenac/Panado	Lofnac P	Tablet	600	mg	\N	\N	\N	\N	Medicine	Tablet	3	20	650	3500	0
0d833038-0722-4f66-be5d-f242f0075552	ITM-0066	Elcuf	\N	Syrup	\N	\N	182.5	mg/5ml	100	ml	Medicine	Bottle	2	5	2500	5500	0
95a4b334-38f9-4c3c-9c11-46ef46bc5ca3	ITM-0067	Emergency Contraceptive	\N	Tablet	1.5	mg	\N	\N	\N	\N	Medicine	Tablet	3	12	1999	4000	0
a2d4a18b-d604-40b8-aaa9-148a5dbbe7dd	ITM-0068	Enalapril	\N	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	41	100	0
c9cb0c47-87b5-4d34-9064-2b1579933d7a	ITM-0069	Enalapril	\N	Tablet	10	mg	\N	\N	\N	\N	Medicine	Tablet	20	100	50	1000	0
35fdfa5b-e3ec-48b8-9507-1cc4e2b7361d	ITM-0070	Enalapril	\N	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	20	100	50	1000	0
4e6c1b2f-e51e-4f4a-bbf1-4730787d004e	ITM-0071	Epiderm	\N	Cream	2	%	\N	\N	15	gm	Medicine	Tube	3	5	750	3000	0
49e9b706-1cb9-47e6-8361-dea37451e718	ITM-0072	Erythromycin	\N	Syrup	\N	\N	125	mg/5ml	100	ml	Medicine	Ampule	2	5	2900	6000	0
da5d7a7e-50e3-42c6-82c3-eceb0a06a1b3	ITM-0073	Fansidar	\N	Tablet	525	mg	\N	\N	\N	\N	Medicine	Tablet	3	0	1500	3000	0
b1d8983b-8efb-44f7-a37a-7e569ed2ec55	ITM-0074	Fexoleb	\N	Tablet	180	mg	\N	\N	\N	\N	Medicine	Tablet	3	0	2500	5000	0
4ea4d1d3-8765-4d97-893c-cd043b112c82	ITM-0075	Finmol	\N	Capsule	555	mg	\N	\N	\N	\N	Medicine	capsule	3	0	1400	3000	0
1ec3661f-80eb-473d-90c6-ab0e3fc7ab6d	ITM-0076	Flucloxacillin	\N	Capsule	250	mg	\N	\N	\N	\N	Medicine	capsule	30	100	150	450	0
0a318d42-3677-41e3-9dbd-63211f0109c9	ITM-0077	Flucloxacillin	\N	Syrup	\N	\N	125	mg/5ml	100	ml	Medicine	Bottle	2	5	3000	6000	0
7aa23312-c11d-4b11-aa31-ef6c6a2eabf8	ITM-0078	Flucloxacillin/Amoxicillin	moxaforte	Syrup	\N	\N	250	mg/5ml	100	ml	Medicine	Bottle	2	5	6999	12000	0
6cc9b83d-22a1-43fd-a452-4812aa46bcfe	ITM-0079	Funbact	\N	Cream	2	%	\N	\N	30	gm	Medicine	Tube	3	5	1500	3000	0
3cebbcb7-e751-4cf2-a077-33b420218944	ITM-0080	Furosimide	\N	Ampule	\N	\N	10	mg/ml	2	ml	Medicine	Ampule	3	5	500	2000	0
dd6e9f3b-ce4e-46ec-a1b1-06daf8f07a3a	ITM-0081	Furosimide	\N	Tablet	40	mg	\N	\N	\N	\N	Medicine	Tablet	300	0	20	40	0
b5740aa0-dc05-4617-9c79-c79f6f26c218	ITM-0082	Gabapenitine	\N	Tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	30	0	700	1400	0
d2a8c50a-cb15-4901-9a2e-af04b1a22788	ITM-0083	Gacet	\N	Supository	125	mg	\N	\N	\N	\N	Medicine	Tablet	5	0	450	1000	0
d385f414-8c3e-4387-91cb-a69dbbe3f126	ITM-0084	Gentamycin	\N	Ampule	\N	\N	80	mg/2ml	2	ml	Medicine	Ampule	6	20	500	2300	0
20850bb4-4b02-41a8-a7eb-354ac07bca3e	ITM-0085	Gentamycin	ABGENTA	Solution	0.4	%	\N	\N	5	ml	Medicine	Bottle	3	5	1700	3000	0
3254f953-2300-4420-94d4-40df94b521a3	ITM-0086	Glibenclamide	\N	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	250	0	11.95	30	0
2106a54d-78de-4cf0-afb1-3a2672baa73f	ITM-0087	Glycodex	\N	Syrup	\N	\N	12.1	mg/5ml	100	ml	Medicine	Bottle	2	5	2200	5000	0
2c568964-81e7-4cab-9d27-39de426f46f0	ITM-0088	Glycodex-C	\N	Syrup	\N	\N	81	mg/5ml	100	ml	Medicine	Bottle	2	5	2200	5000	0
3ffed32f-22c7-4692-9273-12ad6832fb1d	ITM-0089	HCTZ	\N	tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	13.5	30	0
c38e2535-9efd-4604-9019-cb9701ed7d55	ITM-0090	Hydrocortisone	Hycorum	Cream	1	%	\N	\N	15	gm	Medicine	Tube	3	5	1500	4000	0
e81b36d1-bc57-475f-a226-840422d1e1bc	ITM-0091	Hydrocortisone	\N	Vial	\N	\N	100	mg/2ml	2	ml	Medicine	Vial	2	5	1000	3000	0
06a06065-ad44-439b-b25d-7fe2e594bf4b	ITM-0092	Ibuplus	\N	Syrup	\N	\N	225	mg/5ml	100	ml	Medicine	Bottle	2	5	2500	5500	0
3003176f-c221-4306-99dc-0ec9e6caed13	ITM-0093	Indomethacin	\N	Tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	300	0	50	100	0
440fa19a-678c-4a1a-b1f3-d6078069be07	ITM-0094	Iron	\N	Syrup	\N	\N	50	mg/5ml	100	ml	Medicine	Bottle	2	5	2500	5000	0
909eaa73-822e-4d44-8483-bae46274401b	ITM-0095	Jnr Aspirin	\N	Tablet	75	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	0	50	0
e70376de-9bb7-4e86-a148-94acabecb296	ITM-0096	Kelvin-P	\N	Syrup	\N	\N	127.5	mg/5ml	100	ml	Medicine	Bottle	2	5	2950	6000	0
16f9b231-b8b1-4638-8996-d69e010fff5a	ITM-0097	Ketaconazole	Ketacor	Cream	2	%	\N	\N	30	gm	Medicine	Tube	3	5	2000	4000	0
b2abc950-941f-4ca6-b8de-b2447efabdfb	ITM-0098	Libitus	\N	Syrup	\N	\N	55	mg/5ml	100	ml	Medicine	Bottle	2	5	3500	7000	0
20fefa21-28a8-4efc-add3-0c4a3f6af4e7	ITM-0099	Lofnac MR	\N	Tablet	625	mg	\N	\N	\N	\N	Medicine	Tablet	1	0	1750	4000	0
29d0d0db-9042-448a-b64e-4edae3ff1200	ITM-0100	Lofnac-100	\N	Tablet	100	mg	\N	\N	\N	\N	Medicine	Tablet	5	20	475	3000	0
c2013c12-a69b-451b-ade8-79d9c7a505ec	ITM-0101	Lofnnac AP	\N	Tablet	600	mg	\N	\N	\N	\N	Medicine	Tablet	1	0	1850	4000	0
b020bb73-470c-43f8-b3b4-dbe2c277391e	ITM-0102	Magnesium Tricilicate	\N	Tablet	370	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	50	100	0
1869535e-1d1d-49b9-9260-e993d20645f9	ITM-0103	Mefanemic Acid	Fenamex 500	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	5	10	1950	4000	0
c1f3f704-958d-46ca-ad90-e99c50cabbc3	ITM-0104	Mefenamic Acid	\N	Syrup	\N	\N	100	mg/5ml	60	ml	Medicine	Bottle	2	5	2500	5000	0
5a254f69-ee96-47e4-907f-01b75bd3ea6c	ITM-0105	Mepyramine	\N	Cream	2	%	\N	\N	15	gm	Medicine	Tube	3	5	2500	5000	0
e1cd564a-c434-4449-a88c-c84db8cde2ff	ITM-0106	Metformin	\N	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	55	100	0
a66c1eef-014e-4347-be03-381504cb0027	ITM-0107	Metronodazole	\N	Tablet	200	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	100	200	0
bfe10c45-c3ba-47ed-b05e-63f783c4e401	ITM-0108	Metronodazole	\N	Syrup	\N	\N	200	mg/5ml	100	ml	Medicine	Bottle	2	5	2250	5000	0
8252dd33-3dc5-4d1b-84a8-00378b3fab67	ITM-0109	Miconazole	Micor	Cream	2	%	\N	\N	20	gm	Medicine	Tube	3	5	2500	5000	0
04ce9438-7adc-43be-8e46-0d9d615d88b8	ITM-0110	Moleben	\N	Tablet	15	mg	\N	\N	\N	\N	Medicine	Tablet	5	0	118	250	0
fe33b94c-dcde-4d9f-bcfe-32f19fd52a7d	ITM-0111	Multivitamin	\N	Tablet	16	mg	\N	\N	\N	\N	Medicine	Tablet	30	0	25	50	0
a3a5ad0b-87a0-415d-817b-9aea175a666c	ITM-0112	Multivitamin	\N	Syrup	\N	\N	37	mg/5ml	100	ml	Medicine	Bottle	2	5	2212	4500	0
3edbb66f-2c01-4417-8905-c636f9bd9977	ITM-0113	Neodex	WW-NEODEX	Solution	4.5	%	\N	\N	5	ml	Medicine	Bottle	3	5	1200	3000	0
58001290-2296-46f9-aa50-d8c34dd609de	ITM-0114	Norethesterone	\N	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	20	0	500	1000	0
29b450e8-5cad-445b-ba71-821180ebc5a7	ITM-0115	Omeprazole	\N	Capsule	25	mg	\N	\N	\N	\N	Medicine	capsule	20	200	50	150	0
5948077a-ed7d-4d43-8353-dcfb65f9f1e2	ITM-0116	Omeprazole	\N	Tablet	20	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	44.5	100	0
abc54a3a-5a6a-4706-a32f-ae548f0ff4e1	ITM-0117	Osagel	\N	Syrup	\N	\N	550	mg/5ml	100	ml	Medicine	Bottle	2	5	2600	5500	0
5d9b65ab-e567-47f6-b911-fdf25c6c51b9	ITM-0118	Pamagin-C	\N	Tablet	527	mg	\N	\N	\N	\N	Medicine	Tablet	2	0	3500	7000	0
13de44d1-483a-46d3-877b-54946cfa9453	ITM-0119	Panadol	Curamol	Syrup	\N	\N	120	mg/5ml	100	ml	Medicine	Bottle	5	10	1250	3000	0
7108036c-05c7-4cc6-a29b-4e4fe1d414af	ITM-0120	Paracetamol	\N	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	250	1000	28	55.5	0
26181f65-6f05-4216-89c3-22da447c9414	ITM-0121	Phenobarbital	\N	Ampule	\N	\N	200	mg/ml	1	ml	Medicine	Ampule	3	10	30	100	0
ad2624a6-59f0-4174-a9f4-1f8685644eb8	ITM-0122	Phenobarbitone	\N	Tablet	30	mg	\N	\N	\N	\N	Medicine	Tablet	200	1000	50	100	0
ec3aaa57-1e76-47ad-9cc0-35f6a1ddec0f	ITM-0123	Piritoin	\N	Syrup	\N	\N	2	mg/5ml	60	ml	Medicine	Bottle	2	5	1150	3000	0
ab7a0c96-38e9-4ad1-beca-4a4132dd6a28	ITM-0124	Piroxicam	\N	Capsule	20	mg	\N	\N	\N	\N	Medicine	capsule	30	100	250	500	0
b97beec0-6af6-4c23-8fb1-5044ea25c696	ITM-0125	Plencoxib	\N	Capsule	200	mg	\N	\N	\N	\N	Medicine	capsule	30	100	250	500	0
36b6a03a-85e1-4034-8b07-e5813abc9e41	ITM-0126	Prednisolone	\N	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	200	0	50	100	0
3ee01568-3f36-4e02-8ec9-deaae218fc10	ITM-0127	Pregabaline	\N	Tablet	75	mg	\N	\N	\N	\N	Medicine	Tablet	12	0	700	1500	0
a5bfd630-7de0-4c31-bcde-02137664730e	ITM-0128	Promethazine	\N	Ampule	\N	\N	50	mg/2ml	2	ml	Medicine	Ampule	5	10	200	1500	0
f2f9bb2a-601a-4752-93f7-770a31b6de58	ITM-0129	Propranol	\N	tablet	40	mg	\N	\N	\N	\N	Medicine	Tablet	100	0	20	40	0
4afa4bce-c61f-45b7-8f34-e7f4d43dbeb5	ITM-0130	Pyridoxine	\N	tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	20	40	0
88a7f019-e57a-4218-a14b-e36c28188a50	ITM-0131	Pyridoxine	\N	Tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	300	0	10	20	0
1150b30b-b721-4acf-bddd-8a531bc1381b	ITM-0132	Quadragel	\N	Gell	4	%	\N	\N	15	mg	Medicine	Tube	2	3	3000	6000	0
c70d49b3-8b65-4c90-96f8-8f935e150257	ITM-0133	Rihaee	\N	Tablet	600	mg	\N	\N	\N	\N	Medicine	Dose	2	7	1900	4000	0
50abc93f-a932-4c5e-82be-a6aef9f7832c	ITM-0134	Salbutamol	\N	tablet	4	mg	\N	\N	\N	\N	Medicine	Tablet	200	0	16.5	40	0
be76c502-6454-42ec-9405-984ffc1d4679	ITM-0135	Salbutamol	\N	syrup	\N	\N	2	mg/5ml	100	ml	Medicine	Bottle	2	5	1600	4000	0
bdd36b3d-4453-447e-abfd-f8875acf2b76	ITM-0136	Salbutamol	\N	Solution	\N	\N	\N	\N	\N	\N	Medicine	Bottle	1	5	2000	7500	0
5702acfc-0fd3-4a26-a2b4-30674bc24721	ITM-0137	Salbutamol Inhaler	\N	inhaler	\N	\N	\N	\N	\N	\N	Medicine	Bottle	2	3	5000	12000	0
f701e450-8ad6-4ded-a261-0e1d1424b9b9	ITM-0138	Sayana	\N	Vial	\N	\N	104	mg/0.65ml	0.65	ml	Medicine	Tube	10	20	0	2000	0
42ec8d3e-3abf-4e96-b4e5-bf77572fc58e	ITM-0139	Sidenafil Ciltrate 100mg	\N	Tablet	100	mg	\N	\N	\N	\N	Medicine	Tablet	2	0	1500	4000	0
8d5d0b78-180d-40a5-90dc-05e2ecfa354d	ITM-0140	Sidenafil Citrate 50mg	\N	Tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	2	0	1400	4000	0
58b6c145-1c1c-467c-811d-b16fad9bde57	ITM-0141	Silver Sulfadiazine	Dermazine	Cream	1	%	\N	\N	15	gm	Medicine	Tube	3	5	2000	4000	0
2381d3e1-85d4-498d-b5cc-34b7d389fa41	ITM-0142	Sinurhon	\N	Tablet	537	mg	\N	\N	\N	\N	Medicine	Tablet	100	0	40	100	0
9be153dd-7f03-4e3b-85f1-b893c8e5a013	ITM-0143	Spinolactone	\N	Tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	20	0	200	300	0
d13ccba4-363b-40a4-8493-fc0ad1f43761	ITM-0144	Stopcold	\N	Syrup	\N	\N	132	mg/5ml	100	ml	Medicine	Bottle	2	5	2650	5500	0
38a42cdb-5340-4f2b-b469-f9c34988b59e	ITM-0145	Tramacetal	\N	Tablet	342	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	1100	6000	0
5209492c-d12d-4090-8d60-c8e92443ee67	ITM-0146	Vifex	\N	Syrup	\N	\N	53	mg/5ml	100	ml	Medicine	Bottle	2	5	4850	9000	0
3ddc1c1b-1e8d-479f-927b-3a72cd0c195d	ITM-0147	Vit B Co	\N	tablet	12	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	20	50	0
30dd511c-d3fd-4b71-a6cd-19097539af55	ITM-0148	Whitfield's	\N	Ointment	9	%	\N	\N	20	gm	Medicine	Tube	2	3	2000	4000	0
e9ddd8f0-f2ab-4cb6-a5ef-0eda7153b152	ITM-0149	Xpen	\N	Vial	\N	\N	5e+06	IU/10ml	10	ml	Medicine	Vial	2	10	1999	3000	0
f18accdc-5821-45a5-9c28-b00aa650c3e7	ITM-0150	Zinc	\N	Tablet	20	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	42	100	0
ac878d4d-1a38-4252-ae1d-9cedb82c7077	ITM-0151	Albendazole	\N	Tablet	400	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	500	1500	0
44aede59-424e-41bc-ae75-c666dd7af336	ITM-0152	Sinurhon	\N	Syrup	\N	\N	50	mg/5ml	60	ml	Medicine	Bottle	2	5	1950	4000	0
0f5df919-c419-4e3e-95e2-7d98cb0da173	ITM-0153	Moxaforte	\N	Syrup	\N	\N	250	mg/5ml	100	ml	Medicine	Bottle	2	0	6400	13000	0
dd43f92a-1991-48bc-9234-0cef881e9c72	ITM-0154	Amlodipine	Amlodawa	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	1	2	60	120	0
ee042854-dc9e-4572-b338-f49c5ec9839e	ITM-0155	Amlodipine	Amlodawa	Tablet	10	mg	\N	\N	\N	\N	Medicine	Tablet	1	2	68	140	0
76aa6155-cb6a-4237-b6d6-0b69ceb11ff8	ITM-0156	Moxaforte	\N	Capsule	500	mg	\N	\N	\N	\N	Medicine	Tablet	1	0	320	750	0
0a221b62-68d4-4bfb-bcfe-b50bdd67e006	ITM-0157	LA 6	\N	Tablet	140	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	486	1500	0
45a0011c-9060-4e15-b5ce-2c1bb119179e	ITM-0158	LA 12	\N	Tablet	140	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	972	2400	0
0818d9f4-fed6-462b-8cc6-a5afb8913cdf	ITM-0159	LA 18	\N	Tablet	140	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	1450	3600	0
bf3bd724-b9d2-4ec2-86a2-fc4690f55e0e	ITM-0160	LA 24	\N	Tablet	140	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	1950	4800	0
f0bfcb43-5322-45e9-8a1b-0c87a9811a9d	ITM-0161	P-Alaxin 3	\N	Tablet	360	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	2000	4000	0
2aef01f7-5de3-4abe-8a33-b5b8002f694a	ITM-0162	P-Alaxin 6	\N	Tablet	360	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	3000	6000	0
b7e1fade-9a59-43e6-a46e-28ab15e7874d	ITM-0163	P-Alaxin 9	\N	Tablet	360	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	4000	9000	0
460808d8-45ed-4d40-bb54-7e6aad002f02	ITM-0164	P-Alaxin TS	\N	Tablet	780	mg	\N	\N	\N	\N	Medicine	Dose	2	5	6000	10000	0
0f580a61-64d9-405d-8466-e1b9d2c94862	ITM-0165	Sinurhon	\N	Syrup	\N	\N	50	mg/ml	100	ml	Medicine	Bottle	2	5	2650	6000	0
cb62b039-09cd-4711-b74b-0cff68082872	ITM-0166	PCM+Cafein	\N	Tablet	520	mg	\N	\N	\N	\N	Medicine	Tablet	30	0	38	50	0
f2393152-4a71-40a5-8dc8-69b67313a1fb	ITM-0167	Cophydrex	\N	Syrup	\N	\N	50	mg/5ml	100	ml	Medicine	Bottle	2	5	2500	5000	0
aaf25cfa-2e04-4992-b504-97badc8fd7ff	ITM-0168	Pamagin-C	\N	Syrup	\N	\N	50	mg/5ml	60	ml	Medicine	Bottle	2	5	2200	5000	0
64c0e773-4c23-4cc6-bdb8-512ab24c5748	ITM-0169	Loperamide	\N	Capsule	2	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	55	120	0
775224a4-6b91-49c2-97e5-f1f6edcae430	ITM-0170	Beclomin	\N	Cream	\N	\N	3	%	30	gm	Medicine	Tube	2	5	2400	5000	0
4c224ad6-1541-420e-84fd-cb00fd424094	ITM-0171	Aciclovir	\N	Tablet	400	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	500	1000	0
32d0b980-58f3-4a2c-acb6-e7101bc8375f	ITM-0172	Nefidipine	\N	Tablet	20	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	82	150	0
c7f22b87-cc6b-4596-a32f-99079df1314a	ITM-0173	Ceftriaxone	\N	Vial	\N	\N	1	g/10ml	10	ml	Medicine	Vial	4	20	1900	4000	0
41a16650-aae9-4c8f-bae9-8fc2157c0990	ITM-0174	DREP Wax	\N	Solution	2	%	\N	\N	5	ml	Medicine	Bottle	2	2	4000	8000	0
f38a21d7-d6d1-4ad9-8578-fe8d5f491e3e	ITM-0175	DREP EAR	\N	Solution	5	%	\N	\N	5	ml	Medicine	Bottle	2	2	4500	9000	0
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
e8e707df-e238-4833-b4d6-4551108aaf80	MPC-2026-003	1941-10-12 00:00:00+02	Male		Chitedze	2026-03-31 18:41:55.182595+02	Bashir 	Kazembe	0
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
98ea4bb4-6d4e-4634-b2dc-9cc1e80ca119	362f0e2b-3f9d-4b78-bef8-cbab87e38f39	d55d567a-2bf1-4828-9d4c-638106836c52	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0	127.0.0.1	2026-03-31 18:47:25.4+02	2026-04-06 22:13:21.845+02	2026-03-30 22:13:21.870591+02
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
362f0e2b-3f9d-4b78-bef8-cbab87e38f39	admin	System Administrator	scrypt:417449f9c460921aba2617f5e122f0a5:98defca47eac38c6358b317a1de1d79c3cd611c1c092a8b098d803370ea829872b28b1a28d4c78756968ee5d08acdd37ffaa3b8a10fd546c00daace939125877	admin	all	f	2026-02-18 23:01:52.73264+02
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

\unrestrict 9KqkJWdaVAlGaKDuuPRqtnV3z1fW1fN91R2eszRkf8DrsNWx06ug4DhoxnlGLDb

