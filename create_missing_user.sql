-- Create missing user profile for existing authenticated user
-- Replace the UUID with your actual user ID from the error logs

-- Insert the missing user profile
INSERT INTO users (id, email, full_name, status, last_seen)
VALUES (
  '08486f96-5ea8-4e21-b34d-464bcf0b767e',
  'your-email@example.com', -- Replace with actual email
  'User', -- Replace with actual name
  'online',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'online',
  last_seen = now();

-- Create default user settings
INSERT INTO user_settings (user_id, email_notifications, push_notifications, message_notifications, sound_notifications, desktop_notifications)
VALUES (
  '08486f96-5ea8-4e21-b34d-464bcf0b767e',
  true,
  true,
  true,
  true,
  true
)
ON CONFLICT (user_id) DO NOTHING;
