-- BLU Networking App - Initial Schema
-- Run this migration in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE availability_status AS ENUM ('available', 'busy', 'dnd');
CREATE TYPE subscription_status AS ENUM ('pending', 'active', 'cancelled', 'past_due');
CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'expert');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE conversation_type AS ENUM ('direct', 'group');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
CREATE TYPE event_type AS ENUM ('meeting', 'special', 'virtual');
CREATE TYPE registration_status AS ENUM ('registered', 'waitlisted', 'cancelled');
CREATE TYPE referral_outcome AS ENUM ('pending', 'successful', 'unsuccessful');
CREATE TYPE suggestion_status AS ENUM ('pending', 'accepted', 'dismissed');
CREATE TYPE target_audience AS ENUM ('all', 'location', 'tier');
CREATE TYPE leaderboard_period AS ENUM ('weekly', 'monthly', 'all_time');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  industry TEXT,
  bio TEXT,
  elevator_pitch TEXT,
  profile_image_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_city TEXT,
  availability_status availability_status DEFAULT 'available',
  profile_completeness_score INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  subscription_status subscription_status DEFAULT 'pending',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skills
CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level proficiency_level,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User goals (what they're looking for)
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User offers (what they can provide)
CREATE TABLE user_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections between users
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status connection_status DEFAULT 'pending',
  notes TEXT,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id)
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type conversation_type DEFAULT 'direct',
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (venues for events)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  capacity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  event_type event_type DEFAULT 'meeting',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  rrule TEXT,
  capacity INTEGER,
  virtual_link TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event registrations
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status registration_status DEFAULT 'registered',
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_to_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT,
  outcome referral_outcome DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting notes
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  meeting_date TIMESTAMPTZ,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI suggestions
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suggested_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  score DECIMAL(5, 2) NOT NULL,
  status suggestion_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_audience target_audience DEFAULT 'all',
  target_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- User streaks
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  current_count INTEGER DEFAULT 0,
  best_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Leaderboard snapshots
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period leaderboard_period NOT NULL,
  category TEXT NOT NULL,
  rankings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User real-time locations (for proximity feature)
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_offers_user_id ON user_offers(user_id);
CREATE INDEX idx_connections_requester_id ON connections(requester_id);
CREATE INDEX idx_connections_recipient_id ON connections(recipient_id);
CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all active profiles, but only update their own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User skills, goals, offers: User can manage their own
CREATE POLICY "Users can manage their own skills" ON user_skills
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view others skills" ON user_skills
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own goals" ON user_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view others goals" ON user_goals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own offers" ON user_offers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view others offers" ON user_offers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Connections: Users can see their own connections
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests" ON connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Events: Everyone can see active events
CREATE POLICY "Events are viewable by authenticated users" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Event registrations: Users can manage their own registrations
CREATE POLICY "Users can view event registrations" ON event_registrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own registrations" ON event_registrations
  FOR ALL USING (auth.uid() = user_id);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- AI Suggestions: Users can only see their own
CREATE POLICY "Users can view their own suggestions" ON ai_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" ON ai_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

-- Announcements: Everyone can see active announcements
CREATE POLICY "Announcements are viewable by authenticated users" ON announcements
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Locations: Everyone can see active locations
CREATE POLICY "Locations are viewable by authenticated users" ON locations
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- User badges: Everyone can see badges
CREATE POLICY "Badges are viewable by authenticated users" ON user_badges
  FOR SELECT USING (auth.role() = 'authenticated');

-- Leaderboards: Everyone can see leaderboards
CREATE POLICY "Leaderboards are viewable by authenticated users" ON leaderboard_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

-- User locations: Only the user can see their location
CREATE POLICY "Users can manage their own location" ON user_locations
  FOR ALL USING (auth.uid() = user_id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  profile_record profiles%ROWTYPE;
  skill_count INTEGER;
  goal_count INTEGER;
  offer_count INTEGER;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = user_id;

  IF profile_record.full_name IS NOT NULL AND profile_record.full_name != '' THEN
    score := score + 10;
  END IF;

  IF profile_record.company IS NOT NULL AND profile_record.company != '' THEN
    score := score + 10;
  END IF;

  IF profile_record.role IS NOT NULL AND profile_record.role != '' THEN
    score := score + 10;
  END IF;

  IF profile_record.industry IS NOT NULL AND profile_record.industry != '' THEN
    score := score + 10;
  END IF;

  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    score := score + 10;
  END IF;

  IF profile_record.elevator_pitch IS NOT NULL AND profile_record.elevator_pitch != '' THEN
    score := score + 10;
  END IF;

  IF profile_record.profile_image_url IS NOT NULL THEN
    score := score + 10;
  END IF;

  IF profile_record.linkedin_url IS NOT NULL THEN
    score := score + 5;
  END IF;

  IF profile_record.location_city IS NOT NULL THEN
    score := score + 5;
  END IF;

  SELECT COUNT(*) INTO skill_count FROM user_skills WHERE user_skills.user_id = calculate_profile_completeness.user_id;
  IF skill_count > 0 THEN
    score := score + 10;
  END IF;

  SELECT COUNT(*) INTO goal_count FROM user_goals WHERE user_goals.user_id = calculate_profile_completeness.user_id;
  IF goal_count > 0 THEN
    score := score + 5;
  END IF;

  SELECT COUNT(*) INTO offer_count FROM user_offers WHERE user_offers.user_id = calculate_profile_completeness.user_id;
  IF offer_count > 0 THEN
    score := score + 5;
  END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile completeness on profile update
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completeness_score := calculate_profile_completeness(NEW.id);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_completeness();
