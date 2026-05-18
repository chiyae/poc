--
-- PostgreSQL database dump
--

\restrict vBgXucVd7xGBcLobAmGAchvmgYE9baAjTql9c60akK2Egpu3bbUNhu439ykXcus

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
    patient_id uuid,
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
    shift_type character varying(20)
);


ALTER TABLE public.billings OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_number character varying(50) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    "position" character varying(255),
    base_salary real DEFAULT 0 NOT NULL,
    hire_date timestamp with time zone DEFAULT now() NOT NULL,
    phone character varying(50),
    email character varying(255),
    active boolean DEFAULT true NOT NULL
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
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    type character varying(50) DEFAULT 'Request'::character varying NOT NULL
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
    buying_price real DEFAULT 0 NOT NULL,
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
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    date_of_birth timestamp with time zone NOT NULL,
    gender character varying(20) NOT NULL,
    phone character varying(50),
    address text,
    loyalty_points integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
    allowance_details jsonb DEFAULT '[]'::jsonb NOT NULL,
    deductions real DEFAULT 0 NOT NULL,
    deduction_details jsonb DEFAULT '[]'::jsonb NOT NULL,
    net_pay real NOT NULL,
    status character varying(50) DEFAULT 'Draft'::character varying NOT NULL,
    payment_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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

COPY public.billings (id, patient_id, patient_name, date, bill_type, prescription_number, receipt_number, items, subtotal, discount, grand_total, payment_details, dispensing_location_id, is_dispensed, shift_type) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, employee_number, first_name, last_name, "position", base_salary, hire_date, phone, email, active) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, date, category, description, amount, payment_method, reference) FROM stdin;
\.


--
-- Data for Name: internal_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.internal_orders (id, date, requesting_location_id, items, status, type) FROM stdin;
4f4e9aaa-e74b-4655-bb6e-e282c0c34fe0	2026-03-13 11:38:58.592117+02	dispensary	[{"itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "itemName": "Stopcold Syrup", "quantity": 5, "bulkStoreQty": 15}]	Rejected	Request
3902938b-43a3-44ac-a681-0f89b89ddfbb	2026-03-13 13:00:20.376215+02	dispensary	[{"itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "itemName": "Stopcold Syrup", "quantity": 5, "bulkStoreQty": 15}]	Issued	Request
fefc9a41-cbb0-4be6-ba8c-da16055d0a71	2026-03-13 13:31:23.88592+02	bulk-store	[{"itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "itemName": "Stopcold Syrup", "quantity": 2, "dispensaryQty": 5}]	Issued	Return
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, item_code, generic_name, brand_name, formulation, strength_value, strength_unit, concentration_value, concentration_unit, package_size_value, package_size_unit, category, unit_of_measure, dispensary_reorder_level, bulk_store_reorder_level, buying_price, selling_price, consultation_price) FROM stdin;
ce2bda74-c3d7-4b23-a375-01df779df191	ACE8639	Acepar		Tablet	600	mg 	\N	\N	\N	\N	Medicine	Tablet	2	7	1900	4000	4000
59e8f139-fd95-48c2-b769-390d6d576e79	ACE1788	Acetaminophen	Gacet	Tablet	250	mg	\N	\N	\N	\N	Medicine	Tablet	5	5	300	700	600
b6d223a8-8515-4241-8f31-6c57faf52c65	ACI9228	Aciclovir		Cream	5	%	\N	\N	\N	\N	Medicine	Tube	3	5	1500	3500	3000
9f32540a-7f65-491e-8408-2c1c7a7d67ab	AMI3002	Aminophyline		Tablet	100	mg	\N	\N	\N	\N	Medicine	Tablet	200	0	33	50	50
03dac438-8b31-4002-9478-349976259c83	AMI4321	Aminophyline		Injection	0		\N	\N	\N	\N	Medicine	Vial	5	10	1000	5000	5000
0582c768-21d2-4de0-ad37-91a63a09eb0d	AMI6863	Amitryptyline		Tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	49	100	100
f61c0f13-bce8-402d-8a22-c7decbfc3671	AML2259	Amlodipine		Tablet	10	mg 	\N	\N	\N	\N	Medicine	Tablet	20	100	50	100	100
f74cfe41-9628-4dde-b72e-ae0af1168305	AML6145	Amlodipine		Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	20	100	50	100	100
af88211a-2041-41d9-9890-f02d767c681a	AMO4692	Amoxclav		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	1	3	6950	13000	12500
f38d57d7-c055-449c-9bc6-31688184c00c	AMO2232	Amoxclav		Tablet	625	mg	\N	\N	\N	\N	Medicine	10 Tablets	2	5	5900	13000	12000
a10f540d-ced1-4421-8e72-347c594f106b	AMO9871	Amoxicillin		Capsule	500	mg	\N	\N	\N	\N	Medicine	capsule	100	500	75	250	200
89202677-5d26-4e5b-ade1-72ac031df5c0	AMO4731	Amoxicillin		Capsule	250	mg	\N	\N	\N	\N	Medicine	capsule	250	1000	75	250	200
782f2bd1-c5d8-44e8-ada1-8770a81fa936	AMO4184	Amoxicillin		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	1900	4000	4000
ea9c617d-5dee-4b84-ae86-ba5acae36298	AMP2318	Ampicillin		Tablet	250	mg	\N	\N	\N	\N	Medicine	capsule	30	100	150	300	300
6a705dfc-116a-4913-8ff7-9ecdb4d370ee	AMP9485	Ampicillin 		Capsule	250	mg	\N	\N	\N	\N	Medicine	capsule	30	100	75	300	300
beaa519d-4908-4968-929d-7beeebb100e1	AMP4966	Ampicillin 		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2250	5000	5000
26fd212f-af44-4271-a464-266b668d377c	AMP9285	Ampicillin Injection		Injection	0		\N	\N	\N	\N	Medicine	Ampule	3	5	7000	14000	14000
c50463dd-9a68-4380-a53f-07d1374a7910	ANT1660	Antagit-DS		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2950	6000	6000
05857163-9033-43db-9021-89f792e68939	ART5604	Artemether		Injection	0		\N	\N	\N	\N	Medicine	Ampule	3	6	950	3500	3500
7c715080-4c1c-41ae-8732-887d95794ec6	ART8408	Artesunate		Injection	0		\N	\N	\N	\N	Medicine	Vial	3	5	4500	7000	7000
dec8387a-c782-4900-b07e-302e91a94b1c	ART4972	Artesunate		Injection	0		\N	\N	\N	\N	Medicine	Vial	3	5	5000	10000	10000
31f7765f-0045-4972-b5ff-e148c59b4665	ART3765	Artesunate		Injection	0		\N	\N	\N	\N	Medicine	Vial	3	5	8000	15000	15000
2362da61-0f84-415c-b4f2-9b499d2cafdf	ATE7241	Atenolol		Tablet	50	mg 	\N	\N	\N	\N	Medicine	Tablet	20	100	20	40	40
3f285e7f-6da2-4e30-b70d-5384fb97cb2d	ATO4884	Atorvastatin		Tablet	20	mg 	\N	\N	\N	\N	Medicine	Tablet	20	100	120	250	250
94e9c7da-b357-4123-95b8-84002977fbba	ATR2043	Atropine		Injection	0		\N	\N	\N	\N	Medicine	Ampule	2	5	1000	3000	3000
ea187d32-64d3-49c4-b6bb-5ac1115b3c2b	AZI5343	Azintromycin		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	1500	5000	5000
2b598da8-768d-409f-b740-a3fb34ebc7b4	AZI2801	Azithromycin		Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	9	5	2000	5000	5000
708c1b43-83cd-4fbc-80f7-d7c265a19b80	BEC2833	Beclem		Cream	2	%	\N	\N	\N	\N	Medicine	Tube	3	5	2000	5000	5000
87a32440-5197-4e5d-be78-3e460350d737	BEC3012	Beclomin		Cream	3	%	\N	\N	\N	\N	Medicine	Tube	3	5	1500	3000	3000
1adce1c2-5436-45f2-8f2d-e173724acbde	BEN8271	Benzathin		Injection	0		\N	\N	\N	\N	Medicine	Ampule	2	10	1999	3000	3000
275264d5-4979-408a-ad52-1e47faac6037	BET2162	Betamethasone	Dawavate	Cream	0.1	%	\N	\N	\N	\N	Medicine	Tube	3	5	1650	3500	3500
450aefcc-36fc-430b-a45f-19e7955ce21c	BRO8477	Broxol Jnr		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2599	5000	5000
05b1bbb5-6ac4-425a-8cdb-40d4c7d73fe9	CEF1997	Cefexime		Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	1	0	4000	8000	8000
53882254-73b0-4406-9953-4db2c0f08120	CEF3603	Cefuroxime		Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	1	0	4000	8000	8000
06da1e0b-924e-47ed-81a1-5c2240a217c8	CET2766	Cetirizine 		Tablet	10	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	30	100	100
9d3d704e-9707-4a63-b1de-e40b6020aedd	CHL4663	Chloramphenicol 		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	3500	7000	7000
c5911b52-b5f8-422d-8dc2-38856723f4c6	CHL7306	Chloramphenicol 	ABCHOR	Solution	0.5	%	\N	\N	\N	\N	Medicine	Bottle	3	5	1500	3000	3000
ba3064d9-f36a-40f5-b637-ea03217737b8	CIA2018	Cialis		Tablet	20	mg	\N	\N	\N	\N	Medicine	Tablet	2	0	2000	4000	4000
4a3385a5-1f9f-4d20-86f7-2d1529ecf71c	CIP9687	Ciprofloxacin		Tablet	250	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	200	400	400
ab43ffb3-99a6-4765-8240-b6ca57737735	CIP2229	Ciprofloxacin		Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	400	800	800
97390cdb-c403-4ce4-9150-d31027ec21be	CIP9076	Ciprofloxacin	CIPROCIN	Solution	0.4	%	\N	\N	\N	\N	Medicine	Bottle	3	5	1500	3000	3000
fa18e0ce-03a5-45fb-adbb-d9b488f1d471	CIP9398	Ciprofloxacin/Tinidazole 	CIPROFINA	Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	30	0	1500	5000	5000
655f0c8a-7b6b-4bb8-98f0-a3615bab08b2	CLO2612	Clomiphene		Tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	10	0	1000	2000	2000
7dbfd1d1-e75d-406a-b272-51a5457abc6d	CLO2582	Clotrimazole	Dazole	Cream	1	%	\N	\N	\N	\N	Medicine	Tube	3	5	1500	3500	3500
6c9c3602-751d-4216-8b5f-b4d9143b4fa8	CLO6182	Cloxacillin		Capsule	250	mg	\N	\N	\N	\N	Medicine	capsule	30	100	75	300	300
68062408-a884-4c89-bba4-a343d8721fa7	COL3659	Cold Tab		Tablet	537	mg 	\N	\N	\N	\N	Medicine	Tablet	3	10	1000	2000	2000
970bd2f8-169b-466e-8c69-3b683fd1f827	COL4108	Colicspam		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2000	5000	5000
ecc1e006-77ea-495d-b6eb-0ba1f1537cfe	DAR8101	Dartep		Tablet	540	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	6000	12000	12000
8a41fa4c-27c2-47c2-908a-deac29df3c48	DCN6338	DCN		Tablet	100	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	90	300	300
b8197c91-47d4-4815-936b-c5b02cb1cc94	DEP8486	Depo		Injection	0		\N	\N	\N	\N	Medicine	Ampule	2	0	1500	4500	4500
7e8525b8-ab36-4c3f-93b8-4de2c6ce165e	DEX5077	Dexamethasone	Xsome	Solution	0.2	%	\N	\N	\N	\N	Medicine	Bottle	3	5	1300	3000	3000
cea7c252-d4e2-4eba-8480-819c1dfdce20	DIA8116	Diazepam		Injection	0		\N	\N	\N	\N	Medicine	Ampule	2	5	600	2500	2500
44b87d3b-e01d-4092-a15f-44ef6ee68f18	DIC3471	Diclofenac		Injection	0		\N	\N	\N	\N	Medicine	Ampule	5	20	400	2000	2000
b522048b-3430-4df5-a7ab-166a58cca294	CEF1360	cefexime	Cebay	Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	5950	12000	12000
b2a4fefb-e4dd-432b-a64e-22c5c3bd99df	CLO7480	Cloxacillin		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2250	5000	5000
c34d8a49-4115-42f4-9584-918a06e73e8d	CET8220	Cetirizine 	Rinacet	Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	1500	3500	3500
4015f9e1-61ff-4c00-9106-553ccbf78cce	CLO5328	Cotrimoxazole	Trimoxol	Syrup	0		240	mg/5ml	100	ml	Medicine	Bottle	2	5	1650	3500	3500
73fb8c99-44ef-49aa-ba53-21c367840bca	CHE7638	Chefron		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2850	6000	6000
34e0f914-4ef4-45f6-baa8-230b44fccc68	BIS3785	Bisacodyl		Tablet	5	mg 	\N	\N	\N	\N	Medicine	Tablet	30	100	50	100	100
fe4b22c6-a3d1-4794-a7e1-a34f12433abb	DIC9107	Diclofenac		Tablet	100	mg	\N	\N	\N	\N	Medicine	Supository	5	0	650	2500	2500
1c9da8d1-3214-4fef-b225-89dd50a162ad	CAP5722	Captopril		Tablet	25	mg 	\N	\N	\N	\N	Medicine	Tablet	20	100	50	100	100
3bb7db91-f009-4999-931f-810ca1dcce29	DIC3168	Diclofenac	LOFNAC 50	Tablet	50	mg	0		0		Medicine	Tablet	200	0	50	2000	2000
5aa52556-4bfd-456e-bcea-9d984116f463	DIC4004	Diclofenac 	Rheumac	Cream	1	%	\N	\N	\N	\N	Medicine	Tube	2	5	2500	5000	5000
b8a09879-f13e-49f2-9206-7df3cbad6894	ENA3070	Enalapril		Tablet	5	mg 	\N	\N	\N	\N	Medicine	Tablet	30	100	41	100	100
efa58ca2-9c42-4c3b-aa32-aa3f0f74859a	ENA6386	Enalapril		Tablet	5	mg 	\N	\N	\N	\N	Medicine	Tablet	20	100	50	1000	1000
b3831ae8-d73f-47fa-9642-7053fd1163d3	FEX1357	Fexoleb 		Tablet	180	mg 	\N	\N	\N	\N	Medicine	Tablet	3	0	2500	5000	5000
e98f0eb7-9e7a-41b2-ad48-ebbb0a4e9e98	FLU4665	Flucloxacillin		Capsule	250	mg	\N	\N	\N	\N	Medicine	capsule	30	100	150	450	450
d086da8d-6949-442a-b3dd-7d82692ed96e	FLU8155	Flucloxacillin/Amoxicillin 	moxaforte	Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	6999	12000	12000
b49ed5ed-837c-4731-a736-db086b4b49a4	FUR8724	Furosimide		Injection	0		\N	\N	\N	\N	Medicine	Ampule	3	5	500	2000	2000
86c12a3d-f74a-4b92-8e62-e3568b22909c	GAB9371	Gabapenitine 		Tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	30	0	700	1400	1400
4b6d31b1-b73c-4181-a961-c743d6e8cf4a	GLI1939	Glibenclamide 		Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	250	0	11.95	30	30
4a0a666e-4e48-47bb-b1b3-7c5021eda39a	HYD6727	Hydrocortisone	Hycorum	Cream	1	%	\N	\N	\N	\N	Medicine	Tube	3	5	1500	4000	4000
1f55909a-60a2-4834-9d3b-cc487548ae2d	IRO1379	Iron		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2500	5000	5000
58aa36e3-5dae-47ae-9a79-b63fa7d72a78	LOF9176	Lofnac-100		Tablet	100	mg 	\N	\N	\N	\N	Medicine	Tablet	5	20	475	3000	3000
f35257d9-6867-4208-8f12-322a1c469042	MAG5576	Magnesium Tricilicate		Tablet	370	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	50	100	100
152ce255-786d-420f-b78d-54b2b7050896	MET8116	Metformin		Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	55	100	100
3e547e79-2482-43a0-952f-5d5a44e830f0	MOL8836	Moleben		Tablet	15	mg 	\N	\N	\N	\N	Medicine	Tablet	5	0	118	250	250
d24515c2-1861-4f51-93d6-27d4a8e5e50f	MUL9745	Multivitamin		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2212	4500	4500
8fffc712-92e0-4170-bd4b-4cbc4625e785	NOR3009	Norethesterone		Tablet	5	mg 	\N	\N	\N	\N	Medicine	Tablet	20	0	500	1000	1000
4c599433-3275-4a38-9d06-ce6b8548b3ed	OME2907	Omeprazole		Tablet	20	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	44.5	100	100
46ec861c-a3eb-481a-80b6-2bc8bbca9a1e	PAM7217	Pamagin-C		Tablet	527	mg 	\N	\N	\N	\N	Medicine	Tablet	2	0	3500	7000	7000
7a0eaf15-8396-4f24-86f7-58714ac7fe42	PAR8881	Paracetamol		Tablet	500	mg	\N	\N	\N	\N	Medicine	Tablet	250	1000	28	55.5	55.5
2cc4629c-291d-48ee-b730-200254872a0f	PHE4182	Phenobarbitone 		Tablet	30	mg	\N	\N	\N	\N	Medicine	Tablet	200	1000	50	100	100
600e91f9-b3f7-457e-8a80-a93f5f7b4f10	PIR7876	Piroxicam		Capsule	20	mg 	\N	\N	\N	\N	Medicine	capsule	30	100	250	500	500
046d5771-2eee-4d5b-b1a2-796fb8123d34	PRE3539	Prednisolone		Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	200	0	50	100	100
5aa68064-3bdf-48af-9f63-dc071c7523fd	PYR6200	Pyridoxine		Tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	20	40	40
ce965432-f893-4bda-83c4-5a0db057faaf	QUA4707	Quadragel		Cream	4	%	\N	\N	\N	\N	Medicine	Tube	2	3	3000	6000	6000
85ece40c-0f71-49d8-96e7-43178684c403	SAL2399	Salbutamol		Tablet	4	mg	\N	\N	\N	\N	Medicine	Tablet	200	0	16.5	40	40
5b59e356-be4e-41fb-8a4c-027cd8a2bc9e	SAL1242	Salbutamol 		Solution	0		\N	\N	\N	\N	Medicine	Bottle	1	5	2000	7500	7500
88d15c81-2ae9-4337-94d0-bcb2a91bee60	SAY2540	Sayana		Injection	0		\N	\N	\N	\N	Medicine	Tube	10	20	0	2000	2000
e1763bad-fc51-4678-b9b6-2a297845c6f2	SID4568	Sidenafil Citrate 50mg		Tablet	50	mg	\N	\N	\N	\N	Medicine	Tablet	2	0	1400	4000	4000
5714d399-8013-46cf-b138-01b383244e9c	SIN2174	Sinurhon		Tablet	537	mg	\N	\N	\N	\N	Medicine	Tablet	100	0	40	100	100
8d42fae5-de52-4603-9920-75e7d1f86f09	WHI2604	Whitfield's		Cream	9	%	\N	\N	\N	\N	Medicine	Tube	2	3	2000	4000	4000
7c0c28fd-35b0-437e-af86-117bb0298e57	ZIN2052	Zinc		Tablet	20	mg 	\N	\N	\N	\N	Medicine	Tablet	30	100	42	100	100
08e14db3-66c2-483a-b800-bf9e63936bd3	SIN5309	Sinurhon		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	1950	4000	4000
5332f489-75e3-4254-a33b-d68c3afa4077	AML3896	Amlodipine	Amlodawa	Tablet	5	mg	\N	\N	\N	\N	Medicine	Tablet	1	2	60	120	120
3ba48743-d232-4e69-a306-f2679e9dcded	MOX4276	Moxaforte		Capsule	500	mg	\N	\N	\N	\N	Medicine	Tablet	1	0	320	750	750
3535a5d4-8f59-40af-95e4-68526ddda4dd	LA 7875	LA 12		Tablet	140	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	972	2400	2400
82a8c72b-fe20-4c17-8bc3-ae93ae0a46b8	LA 7327	LA 24		Tablet	140	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	1950	4800	4800
547b1f19-54a6-4244-9680-4ac5a4338724	P-A5136	P-Alaxin 6		Tablet	360	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	3000	6000	6000
01b0e44b-703e-43e4-bb30-7cd785df28f4	P-A1306	P-Alaxin TS		Tablet	780	mg	\N	\N	\N	\N	Medicine	Dose	2	5	6000	10000	10000
935370f1-0ab6-4943-ad07-045e60bd181e	PCM7566	PCM+Cafein		Tablet	520	mg	\N	\N	\N	\N	Medicine	Tablet	30	0	38	50	50
5187088d-3642-4aa1-a8b6-0fc4c286d74b	PAM4776	Pamagin-C		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2200	5000	5000
4c4357d7-d775-4726-94f7-91a07b63a876	BEC4467	Beclomin		Cream	0		\N	\N	\N	\N	Medicine	Tube	2	5	2400	5000	5000
92321791-015c-463b-bc1b-3811f4fac8ca	NEF5416	Nefidipine		Tablet	20	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	82	150	150
b56ee97b-3910-406e-9802-a94c791317ec	DRE4252	DREP Wax		Solution	2	%	\N	\N	\N	\N	Medicine	Bottle	2	2	4000	8000	8000
ef4d3cb3-89dc-451e-9b36-d0d9a97e63d7	GEN4261	Gentamycin		Injection	0		\N	\N	\N	\N	Medicine	Ampule	6	20	500	2300	2300
1047c602-67a3-4b45-9cde-c6595de01070	KEL1159	Kelvin-P		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2950	6000	6000
8a81a72a-c548-4981-9729-8fe268b2e498	MEF3418	Mefenamic Acid		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2500	5000	5000
871312b9-6f67-4799-a5e5-64bb5edf6ac5	IBU8974	Ibuplus		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2500	5500	5500
e8acac0d-316b-42c3-afc7-f8672e3423eb	ERY3354	Erythromycin		Syrup	0		\N	\N	\N	\N	Medicine	Ampule	2	5	2900	6000	6000
439fc161-fb49-4818-953e-5692f3d7c676	MET3754	Metronodazole		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2250	5000	5000
8afdfd5b-8061-4b1f-8b6f-cf191f544172	VIF8114	Vifex		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	4850	9000	9000
0b9ea44d-591c-47ff-9591-d07057888779	ELC6949	Elcuf		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2500	5500	5500
55cafa62-3e9d-49fa-8784-030caa101cc4	LIB7709	Libitus		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	3500	7000	7000
17ed5d07-41f1-4849-98de-d49c9e2177be	GLY1249	Glycodex-C		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2200	5000	5000
3c454d74-ba5b-4f2a-a5a1-41f7bfb310a7	PRO8492	Promethazine		Injection	0		\N	\N	\N	\N	Medicine	Ampule	5	10	200	1500	1500
f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50	STO2492	Stopcold		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2650	5500	5500
d76b45ec-aa64-48fc-8eb3-5c255b350283	DIC8447	Diclofenac/Panado	Lofnac P	Tablet	600	mg	\N	\N	\N	\N	Medicine	Tablet	3	20	650	3500	3500
87ed4c2b-0190-4c48-8ce1-b9f05a02994c	EME6285	Emergency Contraceptive		Tablet	1.5	mg	\N	\N	\N	\N	Medicine	Tablet	3	12	1999	4000	4000
e0e0ef8e-5ade-429e-902f-31fa5d09666c	EPI9839	Epiderm		Cream	2	%	\N	\N	\N	\N	Medicine	Tube	3	5	750	3000	3000
3b06fd22-f49c-4d04-bfa3-101598ae4dd2	FAN3015	Fansidar		Tablet	525	mg	\N	\N	\N	\N	Medicine	Tablet	3	0	1500	3000	3000
920c23d9-1c72-45c9-8f21-3511bc4f811c	FIN2269	Finmol		Capsule	555	mg 	\N	\N	\N	\N	Medicine	capsule	3	0	1400	3000	3000
7a6136cc-1549-411c-abb3-888adaa0c310	FLU1903	Flucloxacillin		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	3000	6000	6000
273d59ea-f3f8-4755-8821-7e83791fa6fc	FUN7637	Funbact		Cream	2	%	\N	\N	\N	\N	Medicine	Tube	3	5	1500	3000	3000
38c8bf4c-ffa5-49a6-93e4-83245e822c75	FUR8538	Furosimide		Tablet	40	mg	\N	\N	\N	\N	Medicine	Tablet	300	0	20	40	40
328542fa-c267-4440-999e-bad98176c187	GAC1118	Gacet		Tablet	125	mg	\N	\N	\N	\N	Medicine	Tablet	5	0	450	1000	1000
2b1d214a-84c1-412a-9ddf-390147fab2c9	GEN8952	Gentamycin	ABGENTA	Solution	0.4	%	\N	\N	\N	\N	Medicine	Bottle	3	5	1700	3000	3000
22f01c8c-3eb3-4022-a9c3-7834a2592d47	HCT3692	HCTZ		Tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	13.5	30	30
fc0b6657-412b-4168-8bec-dfe0528fbbd9	HYD8722	Hydrocortisone		Injection	0		\N	\N	\N	\N	Medicine	Vial	2	5	1000	3000	3000
b8e01c8d-bfac-49f1-ae59-ce58f11a6e6c	IND6173	Indomethacin		Tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	300	0	50	100	100
6877fd21-1a4f-4a4d-b5ec-834325058a6c	JNR3944	Jnr Aspirin		Tablet	75	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	0	50	50
52742e2d-3262-467c-81da-77e746e10829	KET8406	Ketaconazole	Ketacor	Cream	2	%	\N	\N	\N	\N	Medicine	Tube	3	5	2000	4000	4000
84390ca0-e4ad-4396-9a22-42f260fc7b66	LOF9187	Lofnac MR		Tablet	625	mg 	\N	\N	\N	\N	Medicine	Tablet	1	0	1750	4000	4000
8777bf40-7a92-4fbb-85df-edbb7f8bd9de	LOF8341	Lofnnac AP		Tablet	600	mg 	\N	\N	\N	\N	Medicine	Tablet	1	0	1850	4000	4000
5ee0bd66-dfc8-469b-ab29-05ac8c9edf95	MEF7862	Mefanemic Acid	Fenamex 500	Tablet	500	mg 	\N	\N	\N	\N	Medicine	Tablet	5	10	1950	4000	4000
30d0cb6b-e0ef-49af-95e0-596ebcd1cff9	MEP9969	Mepyramine		Cream	2	%	\N	\N	\N	\N	Medicine	Tube	3	5	2500	5000	5000
148cdba7-f733-4d92-8453-65f3781d9078	MET7964	Metronodazole		Tablet	200	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	100	200	200
2451d561-9414-4c57-8e7c-a315e5dd3743	MIC4645	Miconazole	Micor	Cream	2	%	\N	\N	\N	\N	Medicine	Tube	3	5	2500	5000	5000
78a1d989-3d56-48db-a7cb-b813de10b7a0	MUL2558	Multivitamin		Tablet	16	mg	\N	\N	\N	\N	Medicine	Tablet	30	0	25	50	50
ce78c8d7-6c61-40de-8893-659fd872bd9f	NEO3692	Neodex	WW-NEODEX	Solution	4.5	%	\N	\N	\N	\N	Medicine	Bottle	3	5	1200	3000	3000
15dcee21-69f3-4094-8f25-a4cf2a941277	OME8452	Omeprazole		Capsule	25	mg	\N	\N	\N	\N	Medicine	capsule	20	200	50	150	150
e7ebf39b-dad3-4c6c-9c1f-dfac9243ea4b	OSA8217	Osagel		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2600	5500	5500
edbb9cb9-f728-4805-97b6-dbd235d934ec	PHE5317	Phenobarbital		Injection	0		\N	\N	\N	\N	Medicine	Ampule	3	10	30	100	100
a2a26b61-7e39-402a-b0b1-6e8395f9044d	PLE2176	Plencoxib		Capsule	200	mg 	\N	\N	\N	\N	Medicine	capsule	30	100	250	500	500
6b6f26cd-7e1a-44c0-8451-fe4508319003	PRE5734	Pregabaline		Tablet	75	mg	\N	\N	\N	\N	Medicine	Tablet	12	0	700	1500	1500
f644a0ec-8bb4-421e-9108-e18992b47cd4	PRO1953	Propranol		Tablet	40	mg	\N	\N	\N	\N	Medicine	Tablet	100	0	20	40	40
072b6e3d-bbbc-4d8e-bda5-ee39d90a1cd0	PYR8550	Pyridoxine		Tablet	25	mg	\N	\N	\N	\N	Medicine	Tablet	300	0	10	20	20
cd19707b-5373-4132-b496-602a49c46215	RIH5859	Rihaee		Tablet	600	mg 	\N	\N	\N	\N	Medicine	Dose	2	7	1900	4000	4000
c1e8531e-1781-48aa-81dd-9465cc545817	SAL4489	Salbutamol		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	1600	4000	4000
51c3f021-4deb-4cfd-ba54-61fd8cc10a3a	SAL5119	Salbutamol Inhaler		Solution	0		\N	\N	\N	\N	Medicine	Bottle	2	3	5000	12000	12000
0342b45e-6468-4402-bcd8-29c088c24816	SID6349	Sidenafil Ciltrate 100mg 		Tablet	100	mg	\N	\N	\N	\N	Medicine	Tablet	2	0	1500	4000	4000
cfe95260-668e-4b22-b9ab-69d28472a198	SIL6839	Silver Sulfadiazine	Dermazine	Cream	1	%	\N	\N	\N	\N	Medicine	Tube	3	5	2000	4000	4000
7ac5acaa-82db-4e02-83b0-eefacb340802	SPI2452	Spinolactone		Tablet	25	mg 	\N	\N	\N	\N	Medicine	Tablet	20	0	200	300	300
3c31ff83-2a1c-4e39-b9d2-0a0e8bc5591f	TRA1816	Tramacetal		Tablet	342	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	1100	6000	6000
91086469-0409-412c-809d-1684a7991221	VIT4083	Vit B Co		Tablet	12	mg	\N	\N	\N	\N	Medicine	Tablet	300	1000	20	50	50
69ac23f1-fe1c-453d-b996-54df3c8f95ee	XPE3600	Xpen		Injection	0		\N	\N	\N	\N	Medicine	Vial	2	10	1999	3000	3000
d34b703f-2315-4ef7-bcfb-82174cfc1d7b	ALB8904	Albendazole		Tablet	400	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	500	1500	1500
07e5e700-61bf-465a-bfdd-1bc4e5807ea4	AML5563	Amlodipine	Amlodawa	Tablet	10	mg	\N	\N	\N	\N	Medicine	Tablet	1	2	68	140	140
8f5d1107-9cd5-4d5b-b7aa-4a3e05c65b03	LA 6310	LA 6		Tablet	140	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	486	1500	1500
e37f27c5-0970-4f9a-b57d-9f232831b4bd	LA 7482	LA 18		Tablet	140	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	1450	3600	3600
74e93eb9-52c9-42dd-83ce-fc3cf07f5897	P-A5934	P-Alaxin 3		Tablet	360	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	2000	4000	4000
670fadba-d3e0-4623-830a-42f5ea7336a5	P-A6221	P-Alaxin 9		Tablet	360	mg	\N	\N	\N	\N	Medicine	Tablet	2	5	4000	9000	9000
dbfd8046-cf61-425d-a7f8-012ac8bf3d57	SIN3894	Sinurhon 		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2650	6000	6000
c298bb0e-fe77-476b-9ce5-b9b8acb88cde	COP2816	Cophydrex		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2500	5000	5000
00a3d874-e33f-4166-8083-5c8a98b983e8	LOP3796	Loperamide		Capsule	2	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	55	120	120
223a3fec-87f8-4a2b-b20a-9aa849c07c61	ACI9495	Aciclovir		Tablet	400	mg	\N	\N	\N	\N	Medicine	Tablet	30	100	500	1000	1000
01b6c3b5-a732-4635-8c10-360faa410fbe	CEF5496	Ceftriaxone		Injection	0		\N	\N	\N	\N	Medicine	Vial	4	20	1900	4000	4000
75972565-3010-4c94-9590-b7d788605dc7	DRE6699	DREP EAR		Solution	5	%	\N	\N	\N	\N	Medicine	Bottle	2	2	4500	9000	9000
9331fe26-4fb3-447c-9262-66a93972af0a	ACE9442	Acetaminophen	Gacet	Cream	125	mg	\N	\N	\N	\N	Medicine	tablet	5	5	300	600	500
d19a7695-5173-4d5e-8f5f-68ef11e911f7	PAN9299	Panadol	Curamol	Syrup	0		\N	\N	\N	\N	Medicine	Bottle	5	10	1250	3000	3000
7aa40760-fd34-4dc3-aaff-3b06b7a715b9	MOX5113	Moxaforte		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	0	6400	13000	13000
a4dc677a-74ba-4674-91cc-74509266768f	PIR3675	Piritoin		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	1150	3000	3000
8cafe3b0-441f-4dc6-8b5f-d86ad75339a1	GLY8547	Glycodex		Syrup	0		\N	\N	\N	\N	Medicine	Bottle	2	5	2200	5000	5000
e39c5fd6-da0b-4ceb-926a-ae1b915167f5	AMO3455	Amoxicillin 	Moxacil	Syrup	0		125	mg/5ml	100	ml	Medicine	Bottle 	3	5	2200	5000	4500
fc96df90-4671-4cd8-9d16-1c3e04383053	AMO3413	Amoxclav	Moxileb-CV	Syrup	0		228.5	mg/5ml	100	ml	Medicine	Bottle 	1	2	6900	12000	12000
4fbf82a6-1530-4a75-b88b-089b496a759f	NYA4514	Nyastatin 		Syrup	0		100000	IU/ml	20	ml	Medicine	Bottle 	2	5	1300	4000	3600
2708fceb-7a5d-4e44-8903-10b61402194b	ENA3183	Enalapril		Tablet	10	mg 	\N	\N	\N	\N	Medicine	Tablet	20	100	50	100	100
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
d96d0bb3-a485-4e98-b933-036052286dde	2026-03-12 19:23:22.095+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "ef4d3cb3-89dc-451e-9b36-d0d9a97e63d7", "category": "Medicine", "itemCode": "GEN4261", "brandName": "", "buyingPrice": 500, "formulation": "Injection", "genericName": "Gentamycin", "sellingPrice": 2300, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Ampule", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 2300, "concentrationValue": null, "bulkStoreReorderLevel": 20, "dispensaryReorderLevel": 6}, "before": {"id": "ef4d3cb3-89dc-451e-9b36-d0d9a97e63d7", "category": "Medicine", "itemCode": "GEN4261", "brandName": "", "buyingPrice": 500, "formulation": "Injection", "genericName": "Gentamycin", "sellingPrice": 2300, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Ampule", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 2300, "concentrationValue": null, "bulkStoreReorderLevel": 20, "dispensaryReorderLevel": 6}}
4503853a-3336-4f82-a984-56106bd4cfd1	2026-03-12 20:46:31.619+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "9331fe26-4fb3-447c-9262-66a93972af0a", "category": "Medicine", "itemCode": "ACE9442", "brandName": "Gacet", "buyingPrice": 300, "formulation": "Cream", "genericName": "Acetaminophen", "sellingPrice": 600, "strengthUnit": "mg", "strengthValue": 125, "unitOfMeasure": "tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 5}, "before": {"id": "9331fe26-4fb3-447c-9262-66a93972af0a", "category": "Medicine", "itemCode": "ACE9442", "brandName": "Gacet", "buyingPrice": 250, "formulation": "Cream", "genericName": "Acetaminophen", "sellingPrice": 600, "strengthUnit": "mg", "strengthValue": 125, "unitOfMeasure": "tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 5}}
9fa57e6c-0887-4e66-a36c-57b69200359a	2026-03-13 07:41:12.081+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "d19a7695-5173-4d5e-8f5f-68ef11e911f7", "category": "Medicine", "itemCode": "PAN9299", "brandName": "Curamol", "buyingPrice": 1250, "formulation": "Syrup", "genericName": "Panadol", "sellingPrice": 3000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3000, "concentrationValue": null, "bulkStoreReorderLevel": 10, "dispensaryReorderLevel": 5}, "before": {"id": "d19a7695-5173-4d5e-8f5f-68ef11e911f7", "category": "Medicine", "itemCode": "PAN9299", "brandName": "Curamol", "buyingPrice": 1250, "formulation": "Syrup", "genericName": "Panadol", "sellingPrice": 3000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3000, "concentrationValue": null, "bulkStoreReorderLevel": 10, "dispensaryReorderLevel": 5}}
df12c310-4e95-4b2a-93ef-9512b840fdca	2026-03-13 07:42:49.678+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "1047c602-67a3-4b45-9cde-c6595de01070", "category": "Medicine", "itemCode": "KEL1159", "brandName": "", "buyingPrice": 2950, "formulation": "Syrup", "genericName": "Kelvin-P", "sellingPrice": 6000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 6000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "1047c602-67a3-4b45-9cde-c6595de01070", "category": "Medicine", "itemCode": "KEL1159", "brandName": "", "buyingPrice": 2950, "formulation": "Syrup", "genericName": "Kelvin-P", "sellingPrice": 6000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 6000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
9bd37187-3f57-43e5-9e29-40588a93f410	2026-03-13 07:43:52.546+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "8a81a72a-c548-4981-9729-8fe268b2e498", "category": "Medicine", "itemCode": "MEF3418", "brandName": "", "buyingPrice": 2500, "formulation": "Syrup", "genericName": "Mefenamic Acid", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "8a81a72a-c548-4981-9729-8fe268b2e498", "category": "Medicine", "itemCode": "MEF3418", "brandName": "", "buyingPrice": 2500, "formulation": "Syrup", "genericName": "Mefenamic Acid", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
10915cc4-1703-4d8b-b3a5-620f9aadd26d	2026-03-13 07:44:52.344+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "871312b9-6f67-4799-a5e5-64bb5edf6ac5", "category": "Medicine", "itemCode": "IBU8974", "brandName": "", "buyingPrice": 2500, "formulation": "Syrup", "genericName": "Ibuplus", "sellingPrice": 5500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "871312b9-6f67-4799-a5e5-64bb5edf6ac5", "category": "Medicine", "itemCode": "IBU8974", "brandName": "", "buyingPrice": 2500, "formulation": "Syrup", "genericName": "Ibuplus", "sellingPrice": 5500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
16d16f28-822e-481e-93bf-3fb9b5559ad1	2026-03-13 13:04:22.392+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Issue Internal Order	{"items": [{"itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "itemName": "Stopcold Syrup", "quantity": 5, "bulkStoreQty": 15}], "orderId": "3902938b-43a3-44ac-a681-0f89b89ddfbb"}
7c005a09-00dd-477b-803a-86887956b7bd	2026-03-13 07:45:44.645+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "b522048b-3430-4df5-a7ab-166a58cca294", "category": "Medicine", "itemCode": "CEF1360", "brandName": "Cebay", "buyingPrice": 5950, "formulation": "Syrup", "genericName": "cefexime", "sellingPrice": 12000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 12000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "b522048b-3430-4df5-a7ab-166a58cca294", "category": "Medicine", "itemCode": "CEF1360", "brandName": "Cebay", "buyingPrice": 5950, "formulation": "Syrup", "genericName": "cefexime", "sellingPrice": 12000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 12000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
39d9370a-aed4-43c7-9654-231ebd528666	2026-03-13 08:07:07.697+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "17ed5d07-41f1-4849-98de-d49c9e2177be", "category": "Medicine", "itemCode": "GLY1249", "brandName": "", "buyingPrice": 2200, "formulation": "Syrup", "genericName": "Glycodex-C", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "17ed5d07-41f1-4849-98de-d49c9e2177be", "category": "Medicine", "itemCode": "GLY1249", "brandName": "", "buyingPrice": 2200, "formulation": "Syrup", "genericName": "Glycodex-C", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
783607c1-ddb8-4325-806e-eb20a1453eaa	2026-03-13 08:12:07.73+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "fc96df90-4671-4cd8-9d16-1c3e04383053", "category": "Medicine", "itemCode": "AMO3413", "brandName": "Moxileb-CV", "buyingPrice": 6900, "formulation": "Syrup", "genericName": "Amoxclav", "sellingPrice": 12000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle ", "packageSizeUnit": "ml", "packageSizeValue": 100, "concentrationUnit": "mg/5ml", "consultationPrice": 12000, "concentrationValue": 228.5, "bulkStoreReorderLevel": 2, "dispensaryReorderLevel": 1}, "before": {"id": "fc96df90-4671-4cd8-9d16-1c3e04383053", "category": "Medicine", "itemCode": "AMO3413", "brandName": "Moxileb-CV", "buyingPrice": 6900, "formulation": "Syrup", "genericName": "Amoxclav", "sellingPrice": 12000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle ", "packageSizeUnit": "ml", "packageSizeValue": 100, "concentrationUnit": "mg/5ml", "consultationPrice": 12000, "concentrationValue": 228.5, "bulkStoreReorderLevel": 2, "dispensaryReorderLevel": 1}}
d170c197-765a-47e8-8bd6-49d8b76cc27b	2026-03-13 08:15:04.077+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "4fbf82a6-1530-4a75-b88b-089b496a759f", "category": "Medicine", "itemCode": "NYA4514", "brandName": "", "buyingPrice": 1300, "formulation": "Syrup", "genericName": "Nyastatin ", "sellingPrice": 4000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle ", "packageSizeUnit": "ml", "packageSizeValue": 20, "concentrationUnit": "IU/ml", "consultationPrice": 3600, "concentrationValue": 100000, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "4fbf82a6-1530-4a75-b88b-089b496a759f", "category": "Medicine", "itemCode": "NYA4514", "brandName": "", "buyingPrice": 1300, "formulation": "Syrup", "genericName": "Nyastatin ", "sellingPrice": 4000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle ", "packageSizeUnit": "ml", "packageSizeValue": 20, "concentrationUnit": "IU/ml", "consultationPrice": 3600, "concentrationValue": 100000, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
13bf37a1-2c4b-4001-b0c1-1ffb1bb33b52	2026-03-13 07:48:19.453+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "7aa40760-fd34-4dc3-aaff-3b06b7a715b9", "category": "Medicine", "itemCode": "MOX5113", "brandName": "", "buyingPrice": 6400, "formulation": "Syrup", "genericName": "Moxaforte", "sellingPrice": 13000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 13000, "concentrationValue": null, "bulkStoreReorderLevel": 0, "dispensaryReorderLevel": 2}, "before": {"id": "7aa40760-fd34-4dc3-aaff-3b06b7a715b9", "category": "Medicine", "itemCode": "MOX5113", "brandName": "", "buyingPrice": 6400, "formulation": "Syrup", "genericName": "Moxaforte", "sellingPrice": 13000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 13000, "concentrationValue": null, "bulkStoreReorderLevel": 0, "dispensaryReorderLevel": 2}}
4e18b5fe-3164-4fc7-82d0-818669e9306e	2026-03-13 07:50:11.578+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "e8acac0d-316b-42c3-afc7-f8672e3423eb", "category": "Medicine", "itemCode": "ERY3354", "brandName": "", "buyingPrice": 2900, "formulation": "Syrup", "genericName": "Erythromycin", "sellingPrice": 6000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Ampule", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 6000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "e8acac0d-316b-42c3-afc7-f8672e3423eb", "category": "Medicine", "itemCode": "ERY3354", "brandName": "", "buyingPrice": 2900, "formulation": "Syrup", "genericName": "Erythromycin", "sellingPrice": 6000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Ampule", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 6000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
b356c588-78c4-43c4-923f-3b951eb8af1a	2026-03-13 07:52:53.842+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "b2a4fefb-e4dd-432b-a64e-22c5c3bd99df", "category": "Medicine", "itemCode": "CLO7480", "brandName": "", "buyingPrice": 2250, "formulation": "Syrup", "genericName": "Cloxacillin", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "b2a4fefb-e4dd-432b-a64e-22c5c3bd99df", "category": "Medicine", "itemCode": "CLO7480", "brandName": "", "buyingPrice": 2250, "formulation": "Syrup", "genericName": "Cloxacillin", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
4253ee30-b0ab-4683-a0a6-bfb7ab6f8863	2026-03-13 07:53:54.869+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "439fc161-fb49-4818-953e-5692f3d7c676", "category": "Medicine", "itemCode": "MET3754", "brandName": "", "buyingPrice": 2250, "formulation": "Syrup", "genericName": "Metronodazole", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "439fc161-fb49-4818-953e-5692f3d7c676", "category": "Medicine", "itemCode": "MET3754", "brandName": "", "buyingPrice": 2250, "formulation": "Syrup", "genericName": "Metronodazole", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
f0fee937-2fae-4c79-aad2-5be3a2296c56	2026-03-13 07:55:19.995+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "4015f9e1-61ff-4c00-9106-553ccbf78cce", "category": "Medicine", "itemCode": "CLO5328", "brandName": "", "buyingPrice": 1650, "formulation": "Syrup", "genericName": "Clotrimazole", "sellingPrice": 3500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "4015f9e1-61ff-4c00-9106-553ccbf78cce", "category": "Medicine", "itemCode": "CLO5328", "brandName": "", "buyingPrice": 1650, "formulation": "Syrup", "genericName": "Clotrimazole", "sellingPrice": 3500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
f8cd2f5c-477b-484b-bfcd-08d4af33132c	2026-03-13 07:58:08.877+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "4015f9e1-61ff-4c00-9106-553ccbf78cce", "category": "Medicine", "itemCode": "CLO5328", "brandName": "Trimoxol", "buyingPrice": 1650, "formulation": "Syrup", "genericName": "Cotrimoxazole", "sellingPrice": 3500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": "ml", "packageSizeValue": 100, "concentrationUnit": "mg/5ml", "consultationPrice": 3500, "concentrationValue": 240, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "4015f9e1-61ff-4c00-9106-553ccbf78cce", "category": "Medicine", "itemCode": "CLO5328", "brandName": "", "buyingPrice": 1650, "formulation": "Syrup", "genericName": "Clotrimazole", "sellingPrice": 3500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
15e21f7d-7b3f-476f-ab37-7ee2156a1a3e	2026-03-13 13:32:07.96+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Issue Internal Order	{"items": [{"itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "itemName": "Stopcold Syrup", "quantity": 2, "dispensaryQty": 5}], "orderId": "fefc9a41-cbb0-4be6-ba8c-da16055d0a71"}
4744ac47-4a2f-465b-8ce7-3e90f78972d6	2026-03-13 07:59:38.889+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "c34d8a49-4115-42f4-9584-918a06e73e8d", "category": "Medicine", "itemCode": "CET8220", "brandName": "Rinacet", "buyingPrice": 1500, "formulation": "Syrup", "genericName": "Cetirizine ", "sellingPrice": 3500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "c34d8a49-4115-42f4-9584-918a06e73e8d", "category": "Medicine", "itemCode": "CET8220", "brandName": "Rinacet", "buyingPrice": 1500, "formulation": "Syrup", "genericName": "Cetirizine ", "sellingPrice": 3500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
4de52788-9ab0-436b-8cb8-ce1d9c0271fc	2026-03-13 08:00:50.452+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "a4dc677a-74ba-4674-91cc-74509266768f", "category": "Medicine", "itemCode": "PIR3675", "brandName": "", "buyingPrice": 1150, "formulation": "Syrup", "genericName": "Piritoin", "sellingPrice": 3000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "a4dc677a-74ba-4674-91cc-74509266768f", "category": "Medicine", "itemCode": "PIR3675", "brandName": "", "buyingPrice": 1150, "formulation": "Syrup", "genericName": "Piritoin", "sellingPrice": 3000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 3000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
929268c7-ef9f-4e9d-93b0-295de519db56	2026-03-13 08:01:57.341+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "73fb8c99-44ef-49aa-ba53-21c367840bca", "category": "Medicine", "itemCode": "CHE7638", "brandName": "", "buyingPrice": 2850, "formulation": "Syrup", "genericName": "Chefron", "sellingPrice": 6000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 6000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "73fb8c99-44ef-49aa-ba53-21c367840bca", "category": "Medicine", "itemCode": "CHE7638", "brandName": "", "buyingPrice": 2850, "formulation": "Syrup", "genericName": "Chefron", "sellingPrice": 6000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 6000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
bf844be5-7b6b-4e59-99da-fd737620e7be	2026-03-13 08:03:42.501+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "8afdfd5b-8061-4b1f-8b6f-cf191f544172", "category": "Medicine", "itemCode": "VIF8114", "brandName": "", "buyingPrice": 4850, "formulation": "Syrup", "genericName": "Vifex", "sellingPrice": 9000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 9000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "8afdfd5b-8061-4b1f-8b6f-cf191f544172", "category": "Medicine", "itemCode": "VIF8114", "brandName": "", "buyingPrice": 4850, "formulation": "Syrup", "genericName": "Vifex", "sellingPrice": 9000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 9000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
f26541df-48c7-443f-9c4d-536b1c58fb1a	2026-03-13 08:04:47.621+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "0b9ea44d-591c-47ff-9591-d07057888779", "category": "Medicine", "itemCode": "ELC6949", "brandName": "", "buyingPrice": 2500, "formulation": "Syrup", "genericName": "Elcuf", "sellingPrice": 5500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "0b9ea44d-591c-47ff-9591-d07057888779", "category": "Medicine", "itemCode": "ELC6949", "brandName": "", "buyingPrice": 2500, "formulation": "Syrup", "genericName": "Elcuf", "sellingPrice": 5500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
6a7ad765-ca44-4d2b-8e82-6d1a7d5fff9e	2026-03-13 08:05:33.592+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "55cafa62-3e9d-49fa-8784-030caa101cc4", "category": "Medicine", "itemCode": "LIB7709", "brandName": "", "buyingPrice": 3500, "formulation": "Syrup", "genericName": "Libitus", "sellingPrice": 7000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 7000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "55cafa62-3e9d-49fa-8784-030caa101cc4", "category": "Medicine", "itemCode": "LIB7709", "brandName": "", "buyingPrice": 3500, "formulation": "Syrup", "genericName": "Libitus", "sellingPrice": 7000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 7000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
fb4395ff-8a71-438b-a7b2-4a06deefe973	2026-03-13 08:06:23.465+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "8cafe3b0-441f-4dc6-8b5f-d86ad75339a1", "category": "Medicine", "itemCode": "GLY8547", "brandName": "", "buyingPrice": 2200, "formulation": "Syrup", "genericName": "Glycodex", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "8cafe3b0-441f-4dc6-8b5f-d86ad75339a1", "category": "Medicine", "itemCode": "GLY8547", "brandName": "", "buyingPrice": 2200, "formulation": "Syrup", "genericName": "Glycodex", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5000, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
29e39ddb-77b5-447d-939e-86f3d626effe	2026-03-13 08:09:39.128+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "e39c5fd6-da0b-4ceb-926a-ae1b915167f5", "category": "Medicine", "itemCode": "AMO3455", "brandName": "Moxacil", "buyingPrice": 2200, "formulation": "Syrup", "genericName": "Amoxicillin ", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle ", "packageSizeUnit": "ml", "packageSizeValue": 100, "concentrationUnit": "mg/5ml", "consultationPrice": 4500, "concentrationValue": 125, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 3}, "before": {"id": "e39c5fd6-da0b-4ceb-926a-ae1b915167f5", "category": "Medicine", "itemCode": "AMO3455", "brandName": "Moxacil", "buyingPrice": 2200, "formulation": "Syrup", "genericName": "Amoxicillin ", "sellingPrice": 5000, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle ", "packageSizeUnit": "ml", "packageSizeValue": 100, "concentrationUnit": "mg/5ml", "consultationPrice": 4500, "concentrationValue": 125, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 3}}
478147ab-4c90-4f61-99ee-f95c8478b1d2	2026-03-13 08:24:02.995+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "34e0f914-4ef4-45f6-baa8-230b44fccc68", "category": "Medicine", "itemCode": "BIS3785", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Bisacodyl", "sellingPrice": 100, "strengthUnit": "mg ", "strengthValue": 5, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 100, "concentrationValue": null, "bulkStoreReorderLevel": 100, "dispensaryReorderLevel": 30}, "before": {"id": "34e0f914-4ef4-45f6-baa8-230b44fccc68", "category": "Medicine", "itemCode": "BIS3785", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Bisacodyl", "sellingPrice": 100, "strengthUnit": "mg ", "strengthValue": 5, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 100, "concentrationValue": null, "bulkStoreReorderLevel": 100, "dispensaryReorderLevel": 30}}
175b0f0a-2a89-4989-a9cb-6d86298852e9	2026-03-13 08:25:32.087+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "3c454d74-ba5b-4f2a-a5a1-41f7bfb310a7", "category": "Medicine", "itemCode": "PRO8492", "brandName": "", "buyingPrice": 200, "formulation": "Injection", "genericName": "Promethazine", "sellingPrice": 1500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Ampule", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 1500, "concentrationValue": null, "bulkStoreReorderLevel": 10, "dispensaryReorderLevel": 5}, "before": {"id": "3c454d74-ba5b-4f2a-a5a1-41f7bfb310a7", "category": "Medicine", "itemCode": "PRO8492", "brandName": "", "buyingPrice": 200, "formulation": "Injection", "genericName": "Promethazine", "sellingPrice": 1500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Ampule", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 1500, "concentrationValue": null, "bulkStoreReorderLevel": 10, "dispensaryReorderLevel": 5}}
6b11711d-abc9-4105-929f-fc559bbba531	2026-03-13 11:38:17.962+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "category": "Medicine", "itemCode": "STO2492", "brandName": "", "buyingPrice": 2650, "formulation": "Syrup", "genericName": "Stopcold", "sellingPrice": 5500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}, "before": {"id": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "category": "Medicine", "itemCode": "STO2492", "brandName": "", "buyingPrice": 2650, "formulation": "Syrup", "genericName": "Stopcold", "sellingPrice": 5500, "strengthUnit": "", "strengthValue": 0, "unitOfMeasure": "Bottle", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 5500, "concentrationValue": null, "bulkStoreReorderLevel": 5, "dispensaryReorderLevel": 2}}
ce35f2ba-6e78-4e31-928b-3be9e0c457db	2026-03-13 11:39:23.672+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Stock	{"after": {"id": "53b7f001-c347-47f0-b558-097cbdf1aa9e", "itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "batchId": "PV09501", "expiryDate": "2028-02-28T00:00:00.000Z", "locationId": "bulk-store", "currentStockQuantity": 10}, "before": {"id": "53b7f001-c347-47f0-b558-097cbdf1aa9e", "itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "batchId": "PV09501", "expiryDate": "2028-02-28T00:00:00.000Z", "locationId": "bulk-store", "currentStockQuantity": 15}}
d4ff7fe1-708b-48b5-b0e2-5fb82aff955e	2026-03-13 11:39:32.009+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Stock	{"after": {"id": "53b7f001-c347-47f0-b558-097cbdf1aa9e", "itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "batchId": "PV09501", "expiryDate": "2028-02-28T00:00:00.000Z", "locationId": "bulk-store", "currentStockQuantity": 10}, "before": {"id": "53b7f001-c347-47f0-b558-097cbdf1aa9e", "itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "batchId": "PV09501", "expiryDate": "2028-02-28T00:00:00.000Z", "locationId": "bulk-store", "currentStockQuantity": 10}}
825e195e-b024-4853-a08f-bf11479fe595	2026-03-13 11:42:31.181+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Stock	{"after": {"id": "53b7f001-c347-47f0-b558-097cbdf1aa9e", "itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "batchId": "PV09501", "expiryDate": "2028-02-28T00:00:00.000Z", "locationId": "bulk-store", "currentStockQuantity": 5}, "before": {"id": "53b7f001-c347-47f0-b558-097cbdf1aa9e", "itemId": "f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50", "batchId": "PV09501", "expiryDate": "2028-02-28T00:00:00.000Z", "locationId": "bulk-store", "currentStockQuantity": 10}}
00828eae-faa4-4b96-8fe3-9f82417a82cc	2026-03-13 12:08:54.479+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Internal Order	{"id": "4f4e9aaa-e74b-4655-bb6e-e282c0c34fe0", "status": "Rejected"}
f0d4e61d-a2fe-4f1e-a6b4-67eb1adfd80a	2026-03-13 13:47:01.332+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "fe4b22c6-a3d1-4794-a7e1-a34f12433abb", "category": "Medicine", "itemCode": "DIC9107", "brandName": "", "buyingPrice": 650, "formulation": "Tablet", "genericName": "Diclofenac", "sellingPrice": 2500, "strengthUnit": "mg", "strengthValue": 100, "unitOfMeasure": "Supository", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 2500, "concentrationValue": null, "bulkStoreReorderLevel": 0, "dispensaryReorderLevel": 5}, "before": {"id": "fe4b22c6-a3d1-4794-a7e1-a34f12433abb", "category": "Medicine", "itemCode": "DIC9107", "brandName": "", "buyingPrice": 650, "formulation": "Tablet", "genericName": "Diclofenac", "sellingPrice": 1200, "strengthUnit": "mg", "strengthValue": 100, "unitOfMeasure": "Supository", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 1200, "concentrationValue": null, "bulkStoreReorderLevel": 0, "dispensaryReorderLevel": 5}}
e4c2cff2-967a-4fab-b198-285a5191c082	2026-03-13 13:50:43.709+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "3bb7db91-f009-4999-931f-810ca1dcce29", "category": "Medicine", "itemCode": "DIC3168", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Diclofenac", "sellingPrice": 2000, "strengthUnit": "mg", "strengthValue": 50, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 2000, "concentrationValue": null, "bulkStoreReorderLevel": 0, "dispensaryReorderLevel": 200}, "before": {"id": "3bb7db91-f009-4999-931f-810ca1dcce29", "category": "Medicine", "itemCode": "DIC3168", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Diclofenac", "sellingPrice": 100, "strengthUnit": "mg", "strengthValue": 50, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 100, "concentrationValue": null, "bulkStoreReorderLevel": 0, "dispensaryReorderLevel": 200}}
734be0c5-7229-411c-933f-d94e8252cce7	2026-03-13 13:52:48.795+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "3bb7db91-f009-4999-931f-810ca1dcce29", "category": "Medicine", "itemCode": "DIC3168", "brandName": "LOFNAC 50", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Diclofenac", "sellingPrice": 2000, "strengthUnit": "mg", "strengthValue": 50, "unitOfMeasure": "Tablet", "packageSizeUnit": "", "packageSizeValue": 0, "concentrationUnit": "", "consultationPrice": 2000, "concentrationValue": 0, "bulkStoreReorderLevel": 0, "dispensaryReorderLevel": 200}, "before": {"id": "3bb7db91-f009-4999-931f-810ca1dcce29", "category": "Medicine", "itemCode": "DIC3168", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Diclofenac", "sellingPrice": 2000, "strengthUnit": "mg", "strengthValue": 50, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 2000, "concentrationValue": null, "bulkStoreReorderLevel": 0, "dispensaryReorderLevel": 200}}
96227ea9-f2dc-42c4-a90a-8973bf3c01f2	2026-03-13 14:27:29.367+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "1c9da8d1-3214-4fef-b225-89dd50a162ad", "category": "Medicine", "itemCode": "CAP5722", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Captopril", "sellingPrice": 100, "strengthUnit": "mg ", "strengthValue": 25, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 100, "concentrationValue": null, "bulkStoreReorderLevel": 100, "dispensaryReorderLevel": 20}, "before": {"id": "1c9da8d1-3214-4fef-b225-89dd50a162ad", "category": "Medicine", "itemCode": "CAP5722", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Captopril", "sellingPrice": 1000, "strengthUnit": "mg ", "strengthValue": 25, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 1000, "concentrationValue": null, "bulkStoreReorderLevel": 100, "dispensaryReorderLevel": 20}}
111f78e4-3840-41bc-8aa6-e8dd79ab0098	2026-03-13 14:32:47.467+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Item	{"after": {"id": "2708fceb-7a5d-4e44-8903-10b61402194b", "category": "Medicine", "itemCode": "ENA3183", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Enalapril", "sellingPrice": 100, "strengthUnit": "mg ", "strengthValue": 10, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 100, "concentrationValue": null, "bulkStoreReorderLevel": 100, "dispensaryReorderLevel": 20}, "before": {"id": "2708fceb-7a5d-4e44-8903-10b61402194b", "category": "Medicine", "itemCode": "ENA3183", "brandName": "", "buyingPrice": 50, "formulation": "Tablet", "genericName": "Enalapril", "sellingPrice": 1000, "strengthUnit": "mg ", "strengthValue": 10, "unitOfMeasure": "Tablet", "packageSizeUnit": null, "packageSizeValue": null, "concentrationUnit": null, "consultationPrice": 1000, "concentrationValue": null, "bulkStoreReorderLevel": 100, "dispensaryReorderLevel": 20}}
85fae03c-8df9-4928-b024-cdae15dab091	2026-03-13 14:47:06.318+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Stock	{"after": {"id": "dd2f5355-4cbe-4e28-97c9-9e6452b9611f", "itemId": "5332f489-75e3-4254-a33b-d68c3afa4077", "batchId": "2409007", "expiryDate": "2027-08-30T00:00:00.000Z", "locationId": "dispensary", "currentStockQuantity": 30}, "before": {"id": "dd2f5355-4cbe-4e28-97c9-9e6452b9611f", "itemId": "5332f489-75e3-4254-a33b-d68c3afa4077", "batchId": "2409007", "expiryDate": "2027-08-30T00:00:00.000Z", "locationId": "dispensary", "currentStockQuantity": 90}}
046820af-8914-407d-b34f-0db48384bc1a	2026-03-13 14:48:45.929+02	24e32786-4b18-4d89-a0d9-3b5066ff1908	System Administrator	Update Stock	{"after": {"id": "3ebb55f8-3ee9-4c84-bb7f-e76d11b78324", "itemId": "5332f489-75e3-4254-a33b-d68c3afa4077", "batchId": "2409007", "expiryDate": "2027-08-30T00:00:00.000Z", "locationId": "dispensary", "currentStockQuantity": 0}, "before": {"id": "3ebb55f8-3ee9-4c84-bb7f-e76d11b78324", "itemId": "5332f489-75e3-4254-a33b-d68c3afa4077", "batchId": "2409007", "expiryDate": "2027-08-30T00:00:00.000Z", "locationId": "dispensary", "currentStockQuantity": 30}}
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (id, patient_number, first_name, last_name, date_of_birth, gender, phone, address, loyalty_points, created_at) FROM stdin;
\.


--
-- Data for Name: payslips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payslips (id, employee_id, month, year, base_salary, allowances, allowance_details, deductions, deduction_details, net_pay, status, payment_date, created_at) FROM stdin;
\.


--
-- Data for Name: price_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_history (id, item_id, date, type, price) FROM stdin;
6792c0b9-1a8f-4cfc-9b9b-b3dac852bd45	9331fe26-4fb3-447c-9262-66a93972af0a	2026-03-12 20:46:31.692047+02	buyingPrice	300
661db7f6-d228-4b92-9bc8-9af0871f0fa5	fe4b22c6-a3d1-4794-a7e1-a34f12433abb	2026-03-13 13:47:01.453326+02	sellingPrice	2500
c9a322b3-f94a-44ca-85d3-39d6db067856	fe4b22c6-a3d1-4794-a7e1-a34f12433abb	2026-03-13 13:47:01.623639+02	consultationPrice	2500
7523ce7b-9c9c-4c3f-b47c-9b4f14e019c6	3bb7db91-f009-4999-931f-810ca1dcce29	2026-03-13 13:50:43.843244+02	sellingPrice	2000
96f77ff3-4a37-4b96-b1ac-4187322ea247	3bb7db91-f009-4999-931f-810ca1dcce29	2026-03-13 13:50:43.954147+02	consultationPrice	2000
a780a933-ee8a-4eb1-ba4c-88adeb9e2555	1c9da8d1-3214-4fef-b225-89dd50a162ad	2026-03-13 14:27:29.536113+02	sellingPrice	100
5e0c2ea9-82b1-4491-8d03-71bfe1bf3187	1c9da8d1-3214-4fef-b225-89dd50a162ad	2026-03-13 14:27:30.01032+02	consultationPrice	100
4d005927-5a20-440e-88e8-f9239a9922df	2708fceb-7a5d-4e44-8903-10b61402194b	2026-03-13 14:32:47.654617+02	sellingPrice	100
7350aafc-a70e-4c38-bf77-bfce414a3ffd	2708fceb-7a5d-4e44-8903-10b61402194b	2026-03-13 14:32:47.852384+02	consultationPrice	100
\.


--
-- Data for Name: procurement_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.procurement_sessions (id, created_at, status, procurement_list, vendor_quotes, lpo_quantities) FROM stdin;
a5cb218e-1597-47ec-b5d8-3680de2608b9	2026-03-12 15:29:26.198637+02	Draft	[]	{}	{}
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, name, fee, category) FROM stdin;
cb4d3727-516b-4724-bfd1-7199e659ac56	MRDT	2500	Laboratory
13f9429a-ac9c-401e-a67d-fd0c020c85ed	H Pylori	4500	Laboratory
b7be4260-df75-4c00-b9e1-784127a2c2fe	Blood Glucose	3500	Laboratory
dfd0e125-f78a-41e1-b127-d17806c6a0b7	HIV test	2000	Laboratory
cec2c65b-a119-4461-90d7-83fa493d9c11	Hepatis	2000	Laboratory
7ecb292a-2e8a-4d30-8a4f-f1faaaac7160	Urinalysis	3500	Laboratory
80e511f7-c19d-47e6-b821-1896ffc001c6	HCG (PT)	3000	Laboratory
4a1848ea-d6a8-4828-97c3-8ce18113e106	Syphilis 	2000	Laboratory
41d319a2-a337-4bf1-88f2-adb00f038290	Circumcision	60000	Procedure
ad01ac65-3698-4edc-9dcb-55cd49b4eb62	Suturing (small)	15000	Procedure
9b52b47d-dd5c-4e8a-933c-ee5a0ec2a7fb	Suturing (large)	25000	Procedure
d2abc68d-de64-48d1-8b3b-ed077087265a	Consultation 	2500	Consultation
5a0d2878-b9d9-4e2b-95c1-651137853202	Inplant Removal	5000	Laboratory
71920a79-6d05-4ef7-8d80-9ea2f028dc16	Inplant Insertion 	13000	Procedure
bf50334b-2bad-46eb-9432-15ed0e7d4aba	Ear syringing	10000	Procedure
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token, user_agent, ip_address, last_active, expires_at, created_at) FROM stdin;
1c11d885-4d58-4f2d-8cf0-ffe1b59d1691	24e32786-4b18-4d89-a0d9-3b5066ff1908	6d8e3af7-f0df-47d1-96ff-424862394119	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 EdgA/145.0.0.0	::ffff:192.168.1.109	2026-03-12 17:49:00.9+02	2026-03-19 17:01:30.589+02	2026-03-12 17:01:30.590339+02
9db457c9-cf1a-4f29-93c5-f9e824bc06c6	24e32786-4b18-4d89-a0d9-3b5066ff1908	5d5c542e-fb3d-4169-ac85-94f24e869b29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	::ffff:192.168.1.178	2026-03-12 18:06:14.597+02	2026-03-19 17:52:01.969+02	2026-03-12 17:52:01.970013+02
a54c575d-0646-4b9f-a0ad-303f1a2539d0	24e32786-4b18-4d89-a0d9-3b5066ff1908	317539f4-c37b-4ce3-ac72-c762b5448958	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	127.0.0.1	2026-03-13 15:47:40.157+02	2026-03-20 15:42:24.151+02	2026-03-13 15:42:24.155654+02
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, value) FROM stdin;
clinic	{"currency": "MWK", "clinicName": "MediTrack Pro", "clinicPhone": "+123456789", "clinicAddress": "123 Health St, Wellness City"}
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
d5953e12-6dff-4624-a774-d1af8072f196	9331fe26-4fb3-447c-9262-66a93972af0a	B1773322152100	bulk-store	2	2027-03-12 15:29:12.1+02
110b3f16-f140-4213-aa73-b49b09832975	9331fe26-4fb3-447c-9262-66a93972af0a	D1ACK040	bulk-store	10	2027-11-11 02:00:00+02
9f544773-b540-4e4e-9994-1c30bc974aee	f61c0f13-bce8-402d-8a22-c7decbfc3671	4E03673	bulk-store	100	2027-08-31 02:00:00+02
4b456788-3b01-463b-b710-d7d5562416a3	af88211a-2041-41d9-9890-f02d767c681a	PS175	bulk-store	3	2027-05-31 02:00:00+02
41e935e4-4bb1-4989-8494-f20afd306eec	f38d57d7-c055-449c-9bc6-31688184c00c	BABBV0182	bulk-store	1	2027-05-31 02:00:00+02
f6ca2555-a513-4df1-a0f8-c428d7fec0e1	782f2bd1-c5d8-44e8-ada1-8770a81fa936	2506176	bulk-store	12	2028-05-31 02:00:00+02
91a9910a-22fa-4130-a85c-716175984013	beaa519d-4908-4968-929d-7beeebb100e1	2509156	bulk-store	4	2028-08-31 02:00:00+02
79747677-84c7-4de7-9a9a-5aaf896cbe68	c50463dd-9a68-4380-a53f-07d1374a7910	PL253/BP	bulk-store	6	2027-08-31 02:00:00+02
66d77857-35d5-48a3-9f77-1e68a70ee8d9	05857163-9033-43db-9021-89f792e68939	IA24001	bulk-store	6	2026-12-31 02:00:00+02
d7581548-74f4-469e-bff1-1dce061c2164	dec8387a-c782-4900-b07e-302e91a94b1c	LA240736	bulk-store	60	2027-05-31 02:00:00+02
9c77556e-ecd4-4cf8-952e-a28a41f1e492	31f7765f-0045-4972-b5ff-e148c59b4665	LA240836	bulk-store	15	2027-07-31 02:00:00+02
453f15e6-b64e-4c46-8cbc-9c0a9294a125	01b6c3b5-a732-4635-8c10-360faa410fbe	250628	bulk-store	66	2028-05-31 02:00:00+02
079db497-bf22-4d43-9a51-bb49a62cd322	01b6c3b5-a732-4635-8c10-360faa410fbe	CXI042405	bulk-store	25	2026-03-31 02:00:00+02
f3918182-efec-439c-b4fe-155505175d90	ef4d3cb3-89dc-451e-9b36-d0d9a97e63d7	ZFGR45	bulk-store	10	2027-11-12 02:00:00+02
e9775845-7097-42cf-9631-92d0264b679d	d19a7695-5173-4d5e-8f5f-68ef11e911f7	2502070	bulk-store	29	2028-02-29 02:00:00+02
151ef182-1106-41cb-9ac3-b4ab90c80fe1	1047c602-67a3-4b45-9cde-c6595de01070	L1295	bulk-store	14	2028-06-30 02:00:00+02
f4f36b3e-f8b4-41d1-9674-07de07f10d78	8a81a72a-c548-4981-9729-8fe268b2e498	L-0739	bulk-store	3	2027-06-30 02:00:00+02
719f51bf-4ead-4aa9-a301-e286f56cb09e	871312b9-6f67-4799-a5e5-64bb5edf6ac5	L2365	bulk-store	9	2028-09-30 02:00:00+02
28618f3c-202c-46c4-981a-70f5490546b4	b522048b-3430-4df5-a7ab-166a58cca294	CS395	bulk-store	4	2028-03-30 02:00:00+02
ace849b6-6ef0-454b-9043-95ac8c52582f	7aa40760-fd34-4dc3-aaff-3b06b7a715b9	2410200	bulk-store	4	2027-09-30 02:00:00+02
a7a44f70-ac2c-436e-992b-026a9056c560	e8acac0d-316b-42c3-afc7-f8672e3423eb	2507220	bulk-store	8	2028-06-30 02:00:00+02
9b4894e9-81e5-4e50-96ab-f1964c6cd1f2	b2a4fefb-e4dd-432b-a64e-22c5c3bd99df	25003201	bulk-store	16	2020-02-28 02:00:00+02
907d0626-ce4e-4d42-a7f2-c53d6f542f15	439fc161-fb49-4818-953e-5692f3d7c676	2508040	bulk-store	9	2028-07-30 02:00:00+02
0f9ec1d7-e2eb-4907-9331-fa50bea3050a	4015f9e1-61ff-4c00-9106-553ccbf78cce	2510059	bulk-store	5	2028-09-30 02:00:00+02
e4cd7fb0-ae9e-4c41-bdec-578fd8dff5d2	c34d8a49-4115-42f4-9584-918a06e73e8d	2510076	bulk-store	12	2028-09-30 02:00:00+02
12aec6ac-2481-4672-b2eb-f8922a9f27e3	a4dc677a-74ba-4674-91cc-74509266768f	2512005	bulk-store	11	2028-11-30 02:00:00+02
7454aa3b-c8e0-4d15-b51c-05c7cc8ddaee	73fb8c99-44ef-49aa-ba53-21c367840bca	L1655	bulk-store	1	2027-07-30 02:00:00+02
512d87d8-fedd-43fa-912b-9ebfa79a8d7e	8afdfd5b-8061-4b1f-8b6f-cf191f544172	E29PA25017	bulk-store	2	2028-05-30 02:00:00+02
ec42c96e-f2f2-474a-a289-6bf4dce92084	0b9ea44d-591c-47ff-9591-d07057888779	PL253/46P	bulk-store	13	2026-11-30 02:00:00+02
2c46b3a8-da8e-43b9-bf86-c239ace88129	55cafa62-3e9d-49fa-8784-030caa101cc4	L3924	bulk-store	6	2028-01-30 02:00:00+02
231d3c5a-f70b-4168-8c46-03abde9afa70	8cafe3b0-441f-4dc6-8b5f-d86ad75339a1	PV11501	bulk-store	7	2028-08-30 02:00:00+02
60b9022c-5ef8-4ac9-a4eb-2bc81b6f0af9	17ed5d07-41f1-4849-98de-d49c9e2177be	PV12501	bulk-store	5	0028-03-20 01:52:00+01:52
e4b46f2f-d8b5-4cfc-aa2b-e2118add3561	e39c5fd6-da0b-4ceb-926a-ae1b915167f5	2506170	bulk-store	12	2028-05-30 02:00:00+02
dff041da-9584-4fb0-a517-81fe65b8d37c	fc96df90-4671-4cd8-9d16-1c3e04383053	PS175	bulk-store	3	2027-05-30 02:00:00+02
6a3b180e-69f6-4407-b7f4-1f914d5ae537	4fbf82a6-1530-4a75-b88b-089b496a759f	86536	bulk-store	4	2026-06-30 02:00:00+02
a8b010c5-4234-438f-95eb-6f2d27663aa5	4fbf82a6-1530-4a75-b88b-089b496a759f	1270305	bulk-store	4	2028-04-30 02:00:00+02
9f8d21cb-f84d-4250-873d-fab36ef11299	ef4d3cb3-89dc-451e-9b36-d0d9a97e63d7	2405033	bulk-store	160	2027-04-30 02:00:00+02
cb7eb6b7-10bc-4d6d-92a3-e5ff5c7b7124	ef4d3cb3-89dc-451e-9b36-d0d9a97e63d7	ZFGR45	bulk-store	290	2028-02-28 02:00:00+02
56916908-496b-49a5-b750-a81a8d749adc	ef4d3cb3-89dc-451e-9b36-d0d9a97e63d7	QD6230601	bulk-store	100	2026-06-30 02:00:00+02
bc79e122-febe-425c-b238-b0bc8f4f026f	34e0f914-4ef4-45f6-baa8-230b44fccc68	IF4014	bulk-store	100	2027-11-30 02:00:00+02
5d3ffdf2-e2d5-4d14-b0ee-c698b4934f49	3c454d74-ba5b-4f2a-a5a1-41f7bfb310a7	241048	bulk-store	20	2027-10-30 02:00:00+02
70b201c6-3999-4a1d-88c0-d8904e6386b7	d19a7695-5173-4d5e-8f5f-68ef11e911f7	2506118	dispensary	5	2028-05-30 02:00:00+02
ef462ff4-ddcf-48ac-8c77-6f96273035f0	1047c602-67a3-4b45-9cde-c6595de01070	L1295	dispensary	4	2028-06-30 02:00:00+02
b67382ad-a243-48f9-ba96-05c3b193eba4	871312b9-6f67-4799-a5e5-64bb5edf6ac5	L2365	dispensary	2	2028-12-30 02:00:00+02
8873f6f9-1496-4a39-9fe8-6675ee54ea75	8a81a72a-c548-4981-9729-8fe268b2e498	L-0739	dispensary	2	2027-06-30 02:00:00+02
4d961bb4-97be-4fdf-b2e6-ecafa7adf1d8	c34d8a49-4115-42f4-9584-918a06e73e8d	2510075	dispensary	1	2028-09-30 02:00:00+02
d4176c17-22cf-4e7b-bd22-076c6294f41c	a4dc677a-74ba-4674-91cc-74509266768f	2512006	dispensary	10	2028-11-30 02:00:00+02
23ff8c32-a988-46e8-9cc4-33ebf03ef57a	970bd2f8-169b-466e-8c69-3b683fd1f827	L365	dispensary	3	2028-04-30 02:00:00+02
26388700-17d7-4bb0-96fc-c8c7bca06d64	c50463dd-9a68-4380-a53f-07d1374a7910	L1865	dispensary	2	2027-08-20 02:00:00+02
13fe94f6-08b3-4813-acc4-6c5f01906c0a	e7ebf39b-dad3-4c6c-9c1f-dfac9243ea4b	L-0638	dispensary	4	2028-06-20 02:00:00+02
4cd0a546-bc90-404a-be4a-0ed11b14e33a	c1e8531e-1781-48aa-81dd-9465cc545817	251386	dispensary	1	2028-06-30 02:00:00+02
45c1fcb9-c2a2-41af-9328-163925c463ab	c1e8531e-1781-48aa-81dd-9465cc545817	88722	dispensary	3	2028-03-30 02:00:00+02
3873c4e1-da93-4295-9623-9045ff8c225c	73fb8c99-44ef-49aa-ba53-21c367840bca	L1655	dispensary	4	2027-07-30 02:00:00+02
37c507cb-0cd5-417c-b032-53ee04c18758	1f55909a-60a2-4834-9d3b-cc487548ae2d	1240013	dispensary	4	2026-03-31 02:00:00+02
40e1f94f-4dce-45e1-b43f-04bc844a4501	d24515c2-1861-4f51-93d6-27d4a8e5e50f	EVSS24001E	dispensary	1	2026-04-30 02:00:00+02
34b54cb8-9c70-4a0a-9239-aef6ca03469e	0b9ea44d-591c-47ff-9591-d07057888779	PL253/46P	dispensary	4	2026-11-30 02:00:00+02
926c6ca8-6966-4355-8f47-c61a2526e062	55cafa62-3e9d-49fa-8784-030caa101cc4	L3934	dispensary	4	2028-01-30 02:00:00+02
ff61f516-ca66-4c4a-ab54-f17bf61a8dd8	8afdfd5b-8061-4b1f-8b6f-cf191f544172	E29PA25017	dispensary	2	2028-05-30 02:00:00+02
e1f500c5-30ae-4315-bbcb-0a6925bd98ba	450aefcc-36fc-430b-a45f-19e7955ce21c	MH/102593ABBJ003	dispensary	2	2027-09-30 02:00:00+02
33e7c8e8-888c-4105-96c9-b9a723700f59	17ed5d07-41f1-4849-98de-d49c9e2177be	PV12501	dispensary	5	2028-03-28 02:00:00+02
675c20ef-4817-41b2-bc75-a8b2bf194e90	8cafe3b0-441f-4dc6-8b5f-d86ad75339a1	PV11501	dispensary	5	2028-08-30 02:00:00+02
aa7423bc-712e-48bf-ba56-0c0c37e974ee	d76b45ec-aa64-48fc-8eb3-5c255b350283	BLP021	dispensary	1	2028-08-30 02:00:00+02
addebfc7-37c2-4a49-9238-ff2e34c6aa64	34e0f914-4ef4-45f6-baa8-230b44fccc68	IF4014	dispensary	70	2027-11-30 02:00:00+02
02c4330b-4c0e-429f-9b4f-48b07be4259d	3bb7db91-f009-4999-931f-810ca1dcce29	DLF046	dispensary	4	2027-07-30 02:00:00+02
ec7287be-a512-4145-aae9-c2e6eaae07f1	328542fa-c267-4440-999e-bad98176c187	D1ACK040	dispensary	3	2017-11-30 02:00:00+02
d7eb16c0-4c2e-4bcb-b7f4-04d884b7f890	68062408-a884-4c89-bba4-a343d8721fa7	L2478	dispensary	5	2027-10-30 02:00:00+02
3f0098aa-f9a6-4255-9322-62b1ba8d61ad	f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50	PV09501	dispensary	3	2028-02-28 02:00:00+02
53b7f001-c347-47f0-b558-097cbdf1aa9e	f4e741b0-b1a1-41d4-87ff-bf8adfbfcc50	PV09501	bulk-store	12	2028-02-28 02:00:00+02
b272733f-0421-41b0-8856-6f60a1ba7bc2	b3831ae8-d73f-47fa-9642-7053fd1163d3	T2795	dispensary	5	2028-08-30 02:00:00+02
ddf44059-97c3-40b9-a960-86213fea1ba4	600e91f9-b3f7-457e-8a80-a93f5f7b4f10	L2113	dispensary	83	2026-11-30 02:00:00+02
7cc0b5ec-dc0f-4537-a1e1-92848ca7ba4e	a2a26b61-7e39-402a-b0b1-6e8395f9044d	417LJ04	dispensary	40	2026-06-30 02:00:00+02
494dd9cd-4833-4e6d-972f-655a161cc2dc	5ee0bd66-dfc8-469b-ab29-05ac8c9edf95	KL24090	dispensary	2	2027-08-30 02:00:00+02
c9505b53-4efd-4201-81a0-faa46ddcd098	84390ca0-e4ad-4396-9a22-42f260fc7b66	-MH/101072A	dispensary	4	2028-06-30 02:00:00+02
c1702827-d2fc-401d-88cf-49537fa7a29f	8777bf40-7a92-4fbb-85df-edbb7f8bd9de	DAP006	dispensary	1	2028-07-30 02:00:00+02
5f98b525-ff17-4f5b-b081-b77fb512c09e	920c23d9-1c72-45c9-8f21-3511bc4f811c	MH/102593A	dispensary	3	2028-02-28 02:00:00+02
cb253b54-d01f-4b77-a0ba-8789b744d337	06da1e0b-924e-47ed-81a1-5c2240a217c8	2511146	dispensary	40	2028-10-30 02:00:00+02
e5ec1a17-f304-4285-8c7d-0484c4b9a73d	fe4b22c6-a3d1-4794-a7e1-a34f12433abb	DLT504	dispensary	13	2028-07-20 02:00:00+02
a6c5da2a-66fb-4c9f-9c3d-3a6b992cc408	7c0c28fd-35b0-437e-af86-117bb0298e57	2504109	dispensary	100	2028-03-31 02:00:00+02
122284ec-1493-4d45-b17c-d4c8eaac0954	46ec861c-a3eb-481a-80b6-2bc8bbca9a1e	PCT25003E	dispensary	2	2027-11-30 02:00:00+02
8b47ce05-9304-4726-90cb-08c54e824c55	152ce255-786d-420f-b78d-54b2b7050896	24C020	dispensary	50	2027-02-28 02:00:00+02
23299b08-be9f-4b01-8f93-86fdcc03ac78	15dcee21-69f3-4094-8f25-a4cf2a941277	C844	dispensary	60	2026-09-30 02:00:00+02
e49fc900-b9b9-455b-8815-1d14661c4d96	cd19707b-5373-4132-b496-602a49c46215	T4014	dispensary	2	2027-11-30 02:00:00+02
f3ba6353-d153-4970-8060-1e9071326cf3	ce2bda74-c3d7-4b23-a375-01df779df191	2508242	dispensary	4	2028-07-30 02:00:00+02
64e726f6-d9c7-48ca-9797-c68c1fd3f7c4	e8acac0d-316b-42c3-afc7-f8672e3423eb	2507220	dispensary	4	2028-06-30 02:00:00+02
25f3a51d-09fa-4484-8e63-bcaf4de3c930	b2a4fefb-e4dd-432b-a64e-22c5c3bd99df	2503281	dispensary	5	2028-02-20 02:00:00+02
7db2f069-d861-445e-a388-ecac172a9ed2	fc96df90-4671-4cd8-9d16-1c3e04383053	PS175	dispensary	3	2027-05-30 02:00:00+02
37b8b143-8e30-4a02-98e9-4a663ec21232	782f2bd1-c5d8-44e8-ada1-8770a81fa936	2505211	dispensary	2	2028-04-30 02:00:00+02
cf131742-9e70-434b-987f-9fd17bb33c4a	beaa519d-4908-4968-929d-7beeebb100e1	2509156	dispensary	2	2028-08-30 02:00:00+02
a61ff611-1b4b-4ace-9428-a1e00d21cfcb	439fc161-fb49-4818-953e-5692f3d7c676	2506159	dispensary	4	2028-05-30 02:00:00+02
4fa08b13-9658-4d95-a48c-659eec018dc6	b522048b-3430-4df5-a7ab-166a58cca294	CS355	dispensary	4	2028-02-28 02:00:00+02
5c8269c9-57da-4bef-9275-636a55ed1edf	1c9da8d1-3214-4fef-b225-89dd50a162ad	250528	dispensary	100	2028-05-30 02:00:00+02
4b58a0e7-c990-495a-913d-e2b941787fb1	7ac5acaa-82db-4e02-83b0-eefacb340802	4E03535	dispensary	70	2026-07-30 02:00:00+02
5a110707-eb03-4a8f-b5ec-0b64f8031b9a	92321791-015c-463b-bc1b-3811f4fac8ca	U27TR45	dispensary	60	2027-12-30 02:00:00+02
2e726fc7-3bd4-4686-a313-e14d8fec04d6	9d3d704e-9707-4a63-b1de-e40b6020aedd	2408246	dispensary	5	2027-07-30 02:00:00+02
fa2992b6-71f4-4c29-89c2-b1ec55f2803c	ea187d32-64d3-49c4-b6bb-5ac1115b3c2b	D1ALK003	dispensary	2	2026-03-30 02:00:00+02
174449d5-984d-472f-b9a4-089aa176de4a	3c31ff83-2a1c-4e39-b9d2-0a0e8bc5591f	TCTE24004E	dispensary	4	2026-03-30 02:00:00+02
eb868e42-0495-48a6-a906-82aade12097d	f61c0f13-bce8-402d-8a22-c7decbfc3671	4E03673	dispensary	130	2027-08-30 02:00:00+02
1326e9f7-47de-47e8-a14a-96db57340e32	3f285e7f-6da2-4e30-b70d-5384fb97cb2d	2S25001	dispensary	70	2026-12-30 02:00:00+02
9dcbf8ec-197d-4c32-9c5a-3aee9139b0c5	2708fceb-7a5d-4e44-8903-10b61402194b	2408120	dispensary	60	2026-07-30 02:00:00+02
238872d0-606e-4616-b3cc-5d09510d1535	8fffc712-92e0-4170-bd4b-4cbc4625e785	E23924001	dispensary	5	2027-01-30 02:00:00+02
943b2c47-bffd-41b6-acb1-bd3996a8c8aa	655f0c8a-7b6b-4bb8-98f0-a3615bab08b2	WEWEWS	dispensary	15	2027-09-30 02:00:00+02
0bbc5067-e3f9-49cd-8982-6751a77b2a77	3ba48743-d232-4e69-a306-f2679e9dcded	2503262	dispensary	60	2028-02-28 02:00:00+02
e3e8623a-84a9-45a6-a73b-b33a71db3338	f61c0f13-bce8-402d-8a22-c7decbfc3671	2510084	dispensary	60	2028-09-20 02:00:00+02
dd2f5355-4cbe-4e28-97c9-9e6452b9611f	5332f489-75e3-4254-a33b-d68c3afa4077	2409007	dispensary	30	2027-08-30 02:00:00+02
3ebb55f8-3ee9-4c84-bb7f-e76d11b78324	5332f489-75e3-4254-a33b-d68c3afa4077	2409007	dispensary	0	2027-08-30 02:00:00+02
\.


--
-- Data for Name: under_five_income; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.under_five_income (id, date, amount, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, display_name, password_hash, role, location_id, disabled, created_at) FROM stdin;
24e32786-4b18-4d89-a0d9-3b5066ff1908	admin	System Administrator	240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9	admin	all	f	2026-03-09 17:27:51.972642+02
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vendors (id, name, contact_person, email, phone) FROM stdin;
2d7cabe1-a450-4569-b34f-85a8b13c7062	Pharmamed 	Tambudzai Madimbo	phrmamed2011@gmail.com	0888367237
1135769f-f9e4-4690-b13a-b67da2a95c5f	Ritechem Pharmaceuticals 	Abbie	ritechemllw@gmail.com	0888856146
ae6c0205-1958-4ea0-bb19-42640f275c45	Pharmavet LTD	Christina Magalasi	pharmavetilongwe@gmail.com	0885434312
a730206c-cdb9-455f-8c5d-033b264e8499	ICON PHARMA LTD	icon	vasimzmemon@yahoo.com	0982891545
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
-- Name: under_five_income under_five_income_date_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.under_five_income
    ADD CONSTRAINT under_five_income_date_unique UNIQUE (date);


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
-- Name: billings billings_patient_id_patients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.billings
    ADD CONSTRAINT billings_patient_id_patients_id_fk FOREIGN KEY (patient_id) REFERENCES public.patients(id);


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
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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

\unrestrict vBgXucVd7xGBcLobAmGAchvmgYE9baAjTql9c60akK2Egpu3bbUNhu439ykXcus

