-- ==============================================================================
-- Life_OS: Wealth Management Schema
-- เพิ่มระบบจัดการพอร์ตหุ้น / ETF สำหรับ Buff Agent
-- ==============================================================================

-- 1. Trades Table (ประวัติการซื้อขายหุ้น)
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    total_value NUMERIC NOT NULL,
    broker_fee NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Dividends Table (ประวัติรับปันผล)
CREATE TABLE IF NOT EXISTS public.dividends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    symbol TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    tax_withheld NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Watchlists Table (หุ้นที่เฝ้าติดตาม)
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    target_price NUMERIC,
    reason TEXT,
    priority TEXT CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ตั้งค่า Row Level Security (RLS) เพื่อความปลอดภัย
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own trades"
    ON public.trades FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own dividends"
    ON public.dividends FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlists"
    ON public.watchlists FOR ALL USING (auth.uid() = user_id);
