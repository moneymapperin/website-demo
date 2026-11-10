-- 1. Create the announcements table in the public schema
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    show_once_per_user BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy so any user (even logged out) can read active announcements
CREATE POLICY "Enable read access for all on active announcements"
ON public.announcements FOR SELECT
USING (is_active = true);

-- 4. Insert a test announcement
INSERT INTO public.announcements (title, html_content, is_active, show_once_per_user)
VALUES (
    'Welcome to MoneyMapper Pro!',
    '<div style="text-align: center;">
        <img src="https://example.com/festive-banner.jpg" style="width:100%; border-radius:12px; margin-bottom: 12px;"/>
        <h3>Diwali Special Offer! 🪔</h3>
        <p>Get <span class="highlight">Flat ₹500 OFF</span> on the Yearly Plan using code <b>DIWALI500</b> at checkout.</p>
        <p><i>Hurry, offer valid till October 31st!</i></p>
     </div>',
    true,
    true
);
