-- After your table definition and before any indexes

-- Create trigger function to set role_password to email when null
CREATE OR REPLACE FUNCTION set_default_role_password()
RETURNS TRIGGER AS $$
BEGIN
    -- If role_password is NULL, set it to email value
    IF NEW.role_password IS NULL THEN
        NEW.role_password := NEW.email;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to fire before insert
CREATE TRIGGER set_role_password_from_email
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_default_role_password();

-- Add comment for documentation
COMMENT ON COLUMN users.role_password IS 'Password for database role, defaults to user email';