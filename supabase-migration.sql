ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS luggage_pieces JSONB;

ALTER TABLE public.packing_items
  ADD COLUMN IF NOT EXISTS activity TEXT,
  ADD COLUMN IF NOT EXISTS is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS plan_signature TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trips_valid_date_range'
  ) THEN
    ALTER TABLE public.trips
      ADD CONSTRAINT trips_valid_date_range CHECK (end_date >= start_date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trips_no_user_date_overlap'
  ) THEN
    ALTER TABLE public.trips
      ADD CONSTRAINT trips_no_user_date_overlap
      EXCLUDE USING gist (
        user_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
      );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.copy_trip_for_user(
  source_trip_id uuid,
  target_user_id uuid
)
RETURNS public.trips
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  source public.trips;
  new_trip public.trips;
  source_country public.trip_countries;
  new_country_id uuid;
  source_city public.trip_cities;
  new_city_id uuid;
BEGIN
  SELECT * INTO source FROM public.trips WHERE public.trips.id = source_trip_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Viaje no encontrado';
  END IF;
  IF source.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Solo el dueño puede copiar el viaje';
  END IF;
  IF source.user_id = target_user_id THEN
    RAISE EXCEPTION 'No puedes copiar el viaje a tu propia cuenta';
  END IF;

  INSERT INTO public.trips (
    user_id, destination, start_date, end_date,
    weather, luggage_size, luggage_pieces, duration_days
  )
  SELECT
    target_user_id, destination, start_date, end_date,
    weather, luggage_size, luggage_pieces, duration_days
  FROM public.trips
  WHERE public.trips.id = source_trip_id
  RETURNING * INTO new_trip;

  FOR source_country IN
    SELECT * FROM public.trip_countries
    WHERE public.trip_countries.trip_id = source_trip_id
    ORDER BY public.trip_countries.order_index
  LOOP
    INSERT INTO public.trip_countries (trip_id, name, order_index)
    VALUES (new_trip.id, source_country.name, source_country.order_index)
    RETURNING public.trip_countries.id INTO new_country_id;

    FOR source_city IN
      SELECT * FROM public.trip_cities
      WHERE public.trip_cities.country_id = source_country.id
      ORDER BY public.trip_cities.order_index
    LOOP
      INSERT INTO public.trip_cities (
        country_id, name, arrival_date, departure_date, order_index
      )
      VALUES (
        new_country_id, source_city.name,
        source_city.arrival_date, source_city.departure_date,
        source_city.order_index
      )
      RETURNING public.trip_cities.id INTO new_city_id;

      INSERT INTO public.city_links (
        city_id, type, name, url, notes, order_index
      )
      SELECT
        new_city_id, type, name, url, notes, order_index
      FROM public.city_links
      WHERE public.city_links.city_id = source_city.id
      ORDER BY public.city_links.order_index;
    END LOOP;
  END LOOP;

  RETURN new_trip;
END;
$$;

-- Compartir itinerarios con código entre usuarios
CREATE TABLE IF NOT EXISTS public.shared_itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shared_itineraries_code ON public.shared_itineraries(code);
CREATE INDEX IF NOT EXISTS idx_shared_itineraries_trip_id ON public.shared_itineraries(trip_id);

ALTER TABLE public.shared_itineraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_select_by_code"
  ON public.shared_itineraries
  FOR SELECT
  TO authenticated
  USING (expires_at > now());

CREATE POLICY "share_insert_owner"
  ON public.shared_itineraries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.trips
      WHERE public.trips.id = shared_itineraries.trip_id
        AND public.trips.user_id = auth.uid()
    )
  );

CREATE POLICY "share_delete_owner"
  ON public.shared_itineraries
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.trips
      WHERE public.trips.id = shared_itineraries.trip_id
        AND public.trips.user_id = auth.uid()
    )
  );
