CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_val user_role;
    user_full_name TEXT;
    user_phone TEXT;
    user_avatar TEXT;
    user_age INT;
    user_dob DATE;
    user_address TEXT;
    user_city TEXT;
BEGIN
    -- Extract and sanitize values from raw user metadata
    user_role_val := COALESCE(nullif(new.raw_user_meta_data->>'role', '')::user_role, 'professional'::user_role);
    user_full_name := COALESCE(new.raw_user_meta_data->>'full_name', '');
    user_phone := nullif(new.raw_user_meta_data->>'phone', '');
    user_avatar := nullif(new.raw_user_meta_data->>'avatar_cloudinary_url', '');
    user_age := nullif(new.raw_user_meta_data->>'age', '')::INT;
    user_dob := nullif(new.raw_user_meta_data->>'date_of_birth', '')::DATE;
    user_address := nullif(new.raw_user_meta_data->>'address', '');
    user_city := nullif(new.raw_user_meta_data->>'city_region', '');

    -- 1. Insert into public.profiles
    INSERT INTO public.profiles (
        id, role, full_name, age, date_of_birth, address, city_region, avatar_cloudinary_url, phone, created_at
    ) VALUES (
        new.id,
        user_role_val,
        user_full_name,
        user_age,
        user_dob,
        user_address,
        user_city,
        user_avatar,
        user_phone,
        now()
    );

    -- 2. Insert into professional_details or company_details
    IF user_role_val = 'professional'::user_role THEN
        INSERT INTO public.professional_details (
            user_id, profession_title, bio, rate, skills, availability
        ) VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'profession_title', ''),
            COALESCE(new.raw_user_meta_data->>'bio', ''),
            COALESCE(nullif(new.raw_user_meta_data->>'rate', '')::numeric, 0.00),
            CASE 
                WHEN jsonb_typeof(new.raw_user_meta_data->'skills') = 'array' THEN
                    ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'skills'))
                ELSE
                    '{}'::text[]
            END,
            true
        );
    ELSIF user_role_val = 'company'::user_role THEN
        INSERT INTO public.company_details (
            user_id, company_name, logo_cloudinary_url, office_address, website, description, verified
        ) VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'company_name', ''),
            user_avatar,
            user_address,
            COALESCE(new.raw_user_meta_data->>'website', ''),
            COALESCE(new.raw_user_meta_data->>'description', ''),
            false
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
