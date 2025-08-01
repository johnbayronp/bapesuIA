

npm install 

create file .env frontend 

VITE_SUPABASE_URL= <sUPASBASE>
VITE_SUPABASE_ANON_KEY= <sUPASBASE_KEY>
VITE_API_URL= <URL_BACKEND>


backend .env 

DEEPSEEK_API_KEY=
DEEPSEEK_API_URL=
DEEPSEEK_MODEL=
DEEPSEEK_TEMPERATURE=
DEEPSEEK_MAX_TOKENS=

#Flask Configuration
FLASK_APP=app
FLASK_ENV=development
FLASK_DEBUG=1


SUPABASE_JWT_SECRET=
 


# pip install -r requirements.txt



-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id bigint NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  slug character varying UNIQUE,
  icon character varying,
  color character varying DEFAULT '#3B82F6'::character varying,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  parent_id bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id bigint,
  product_name character varying NOT NULL,
  product_price numeric NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  total_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT fk_order_items_order_id FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number character varying NOT NULL UNIQUE,
  user_id uuid,
  customer_name character varying NOT NULL,
  customer_email character varying NOT NULL,
  customer_phone character varying NOT NULL,
  shipping_address text NOT NULL,
  shipping_city character varying NOT NULL,
  shipping_state character varying NOT NULL,
  shipping_zip_code character varying NOT NULL,
  shipping_country character varying DEFAULT 'Colombia'::character varying,
  subtotal numeric NOT NULL,
  shipping_cost numeric NOT NULL,
  total_amount numeric NOT NULL,
  payment_method character varying NOT NULL,
  shipping_method character varying NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'processing'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'cancelled'::character varying]::text[])),
  comments text,
  whatsapp_sent boolean DEFAULT false,
  tracking_number character varying,
  tracking_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.product_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id bigint NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_approved boolean DEFAULT true,
  is_flagged boolean DEFAULT false,
  flag_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT product_ratings_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT product_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT product_ratings_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id bigint NOT NULL,
  name character varying NOT NULL,
  description text,
  category character varying NOT NULL,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  stock integer DEFAULT 0 CHECK (stock >= 0),
  status character varying DEFAULT 'Activo'::character varying CHECK (status::text = ANY (ARRAY['Activo'::character varying, 'Inactivo'::character varying, 'Sin Stock'::character varying, 'Borrador'::character varying]::text[])),
  image_url text,
  sku character varying UNIQUE,
  barcode character varying,
  weight numeric,
  dimensions jsonb,
  tags ARRAY,
  specifications jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  discount_percentage numeric DEFAULT 0.00 CHECK (discount_percentage >= 0::numeric AND discount_percentage <= 100::numeric),
  cost_price numeric,
  supplier_info jsonb DEFAULT '{}'::jsonb,
  inventory_alerts jsonb DEFAULT '{}'::jsonb,
  seo_data jsonb DEFAULT '{}'::jsonb,
  original_price numeric CHECK (original_price >= 0::numeric),
  average_rating numeric DEFAULT 0.00,
  total_ratings integer DEFAULT 0,
  rating_distribution jsonb DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}'::jsonb,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  role text DEFAULT 'customer'::text,
  profile_image_url text,
  preferences jsonb DEFAULT '{}'::jsonb,
  wishlist jsonb DEFAULT '[]'::jsonb,
  cart_items jsonb DEFAULT '[]'::jsonb,
  order_history jsonb DEFAULT '[]'::jsonb,
  total_spent numeric DEFAULT 0,
  loyalty_points integer DEFAULT 0,
  newsletter_subscription boolean DEFAULT false,
  marketing_consent boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);