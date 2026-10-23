-- Admin portfolio uploads keep their Supabase object path for safe cleanup.
ALTER TABLE public.portfolio
    ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Reviews from verified bookings are not linked to registered user accounts.
ALTER TABLE public.reviews
    ALTER COLUMN user_id DROP NOT NULL;

-- Optional booking add-ons retain their booking-time price and deposit.
CREATE TABLE IF NOT EXISTS public.appointment_add_ons (
    appointment_id INT NOT NULL
        REFERENCES public.appointments(appointments_id) ON DELETE CASCADE,
    service_id INT NOT NULL
        REFERENCES public.services(services_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    service_price NUMERIC(10,2) NOT NULL CHECK (service_price >= 0),
    deposit_amount NUMERIC(10,2) NOT NULL
        CHECK (deposit_amount >= 0 AND deposit_amount <= service_price),
    PRIMARY KEY (appointment_id, service_id)
);
