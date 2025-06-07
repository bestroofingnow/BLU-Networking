import { pgTable, text, serial, integer, boolean, timestamp, json, uuid as pgUuid, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Chapters schema
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  userLevel: text("user_level", { enum: ["member", "board_member", "executive_board"] }).default("member").notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id),
  phoneNumber: text("phone_number"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  userLevel: true,
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

// Member communications schema
export const memberMessages = pgTable("member_messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  toUserId: integer("to_user_id").references(() => users.id).notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const insertMemberMessageSchema = createInsertSchema(memberMessages).omit({
  id: true,
  isRead: true,
  sentAt: true,
});

// Board meeting minutes schema
export const boardMeetingMinutes = pgTable("board_meeting_minutes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  meetingDate: date("meeting_date").notNull(),
  attendees: text("attendees").array().notNull(),
  agenda: text("agenda"),
  minutes: text("minutes").notNull(),
  actionItems: text("action_items").array(),
  nextMeetingDate: date("next_meeting_date"),
  isPublished: boolean("is_published").default(false),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBoardMeetingMinutesSchema = createInsertSchema(boardMeetingMinutes).omit({
  id: true,
  createdAt: true,
});

// Relations
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [users.chapterId],
    references: [chapters.id],
  }),
  events: many(events),
  eventRegistrations: many(eventRegistrations),
  leads: many(leads),
  userGoals: many(userGoals),
  memberSpotlights: many(memberSpotlights),
  sentMessages: many(memberMessages, { relationName: "sentMessages" }),
  receivedMessages: many(memberMessages, { relationName: "receivedMessages" }),
}));

export const chaptersRelations = relations(chapters, ({ many }) => ({
  users: many(users),
  messages: many(memberMessages),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventRegistrations.userId],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
}));

export const userGoalsRelations = relations(userGoals, ({ one }) => ({
  user: one(users, {
    fields: [userGoals.userId],
    references: [users.id],
  }),
}));

export const memberSpotlightsRelations = relations(memberSpotlights, ({ one }) => ({
  user: one(users, {
    fields: [memberSpotlights.userId],
    references: [users.id],
  }),
}));

export const memberMessagesRelations = relations(memberMessages, ({ one }) => ({
  fromUser: one(users, {
    fields: [memberMessages.fromUserId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  toUser: one(users, {
    fields: [memberMessages.toUserId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  chapter: one(chapters, {
    fields: [memberMessages.chapterId],
    references: [chapters.id],
  }),
}));

export const boardMeetingMinutesRelations = relations(boardMeetingMinutes, ({ one }) => ({
  createdBy: one(users, {
    fields: [boardMeetingMinutes.createdById],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [boardMeetingMinutes.chapterId],
    references: [chapters.id],
  }),
}));

// Type definitions
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Chapter = typeof chapters.$inferSelect;

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

export type InsertMemberMessage = z.infer<typeof insertMemberMessageSchema>;
export type MemberMessage = typeof memberMessages.$inferSelect;

export type InsertBoardMeetingMinutes = z.infer<typeof insertBoardMeetingMinutesSchema>;
export type BoardMeetingMinutes = typeof boardMeetingMinutes.$inferSelect;

// User level permissions
export const USER_LEVELS = {
  MEMBER: "member",
  BOARD_MEMBER: "board_member",
  EXECUTIVE_BOARD: "executive_board",
} as const;

export type UserLevel = typeof USER_LEVELS[keyof typeof USER_LEVELS];
