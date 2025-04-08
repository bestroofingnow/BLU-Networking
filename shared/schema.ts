import { pgTable, text, serial, integer, boolean, timestamp, json, uuid as pgUuid, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  company: text("company").notNull(),
  title: text("title").notNull(),
  bio: text("bio"),
  industry: text("industry"),
  expertise: text("expertise"),
  profileImage: text("profile_image"),
  isAdmin: boolean("is_admin").default(false),
  phoneNumber: text("phone_number"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  joinedAt: true,
});

// Event schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  location: text("location").notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  capacity: integer("capacity"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

// Event registration
export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  registeredAt: timestamp("registered_at").defaultNow(),
  attended: boolean("attended").default(false),
  checkedInAt: timestamp("checked_in_at"),
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registeredAt: true,
  attended: true,
  checkedInAt: true,
});

// Lead schema
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  notes: text("notes"),
  type: text("type").notNull(), // Referral, Event Connection, Direct Outreach, etc.
  status: text("status").notNull(), // Initial Contact, Follow-up Scheduled, Needs Follow-up, etc.
  value: integer("value"), // Estimated value in dollars
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  followUpDate: date("follow_up_date"),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

// Stats/Goals schema for tracking personal goals
export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  connectionsGoal: integer("connections_goal").default(0),
  connectionsAchieved: integer("connections_achieved").default(0),
  leadsGoal: integer("leads_goal").default(0),
  leadsAchieved: integer("leads_achieved").default(0),
  eventsGoal: integer("events_goal").default(0),
  eventsAchieved: integer("events_achieved").default(0),
  followUpsGoal: integer("follow_ups_goal").default(0),
  followUpsAchieved: integer("follow_ups_achieved").default(0),
  period: text("period").notNull(), // Monthly, Quarterly, etc.
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
});

export const insertUserGoalSchema = createInsertSchema(userGoals).omit({
  id: true,
});

// Member spotlight schema
export const memberSpotlights = pgTable("member_spotlights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  description: text("description").notNull(),
  achievements: text("achievements"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  featuredUntil: date("featured_until"),
});

export const insertMemberSpotlightSchema = createInsertSchema(memberSpotlights).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;
export type UserGoal = typeof userGoals.$inferSelect;

export type InsertMemberSpotlight = z.infer<typeof insertMemberSpotlightSchema>;
export type MemberSpotlight = typeof memberSpotlights.$inferSelect;
