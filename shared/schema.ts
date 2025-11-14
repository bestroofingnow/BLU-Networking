import { pgTable, text, serial, integer, boolean, timestamp, json, uuid as pgUuid, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Chapters/Organizations schema
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organization settings for white-labeling
export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull().unique(),
  // Branding
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#10b981"),
  accentColor: text("accent_color").default("#f59e0b"),
  customDomain: text("custom_domain"),
  subdomain: text("subdomain"),
  // Features
  featuresEnabled: json("features_enabled").$type<{
    events: boolean;
    leads: boolean;
    messaging: boolean;
    memberDirectory: boolean;
    boardMinutes: boolean;
    memberSpotlights: boolean;
    payments: boolean;
    emailCampaigns: boolean;
    customForms: boolean;
  }>().default({
    events: true,
    leads: true,
    messaging: true,
    memberDirectory: true,
    boardMinutes: true,
    memberSpotlights: true,
    payments: false,
    emailCampaigns: false,
    customForms: false,
  }),
  // Contact info
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  websiteUrl: text("website_url"),
  // Misc
  welcomeMessage: text("welcome_message"),
  timezone: text("timezone").default("America/New_York"),
  dateFormat: text("date_format").default("MM/DD/YYYY"),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  isSuperAdmin: boolean("is_super_admin").default(false), // Platform owner - manages all organizations
  isOrgAdmin: boolean("is_org_admin").default(false), // Organization admin - manages their org
  isAdmin: boolean("is_admin").default(false), // Legacy field for backward compatibility
  userLevel: text("user_level", { enum: ["member", "board_member", "executive_board"] }).default("member").notNull(),
  customRoleId: integer("custom_role_id"),
  chapterId: integer("chapter_id").references(() => chapters.id),
  phoneNumber: text("phone_number"),
  customFields: json("custom_fields").$type<Record<string, any>>().default({}),
  membershipTier: text("membership_tier"),
  membershipStatus: text("membership_status", { enum: ["active", "inactive", "pending", "expired", "suspended"] }).default("active"),
  membershipExpiresAt: timestamp("membership_expires_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Custom roles per organization
export const customRoles = pgTable("custom_roles", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  permissions: json("permissions").$type<string[]>().default([]),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Membership tiers per organization
export const membershipTiers = pgTable("membership_tiers", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  billingPeriod: text("billing_period", { enum: ["monthly", "quarterly", "annually", "lifetime"] }).default("annually"),
  features: json("features").$type<string[]>().default([]),
  maxMembers: integer("max_members"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom fields definitions per organization
export const customFieldDefinitions = pgTable("custom_field_definitions", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: text("field_type", { enum: ["text", "email", "phone", "number", "date", "select", "multiselect", "checkbox", "textarea"] }).notNull(),
  fieldOptions: json("field_options").$type<string[]>(),
  isRequired: boolean("is_required").default(false),
  isVisibleToMembers: boolean("is_visible_to_members").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
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
  latitude: text("latitude"),
  longitude: text("longitude"),
  requireGeoCheckin: boolean("require_geo_checkin").default(false),
  geoFenceRadius: integer("geo_fence_radius").default(100), // meters
  createdById: integer("created_by_id").references(() => users.id),
  chapterId: integer("chapter_id").references(() => chapters.id),
  capacity: integer("capacity"),
  price: integer("price").default(0), // in cents
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: json("recurring_pattern").$type<{
    frequency: "daily" | "weekly" | "monthly";
    interval: number;
    endDate?: string;
  }>(),
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
  checkInLatitude: text("check_in_latitude"),
  checkInLongitude: text("check_in_longitude"),
  checkInLocation: text("check_in_location"), // Human-readable location
});

// Geo-location tracking for logins and activities
export const geoLocationLog = pgTable("geo_location_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventType: text("event_type", { enum: ["login", "event_checkin", "profile_update", "other"] }).notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  location: text("location"), // Human-readable location (city, state)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  eventId: integer("event_id").references(() => events.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  registeredAt: true,
  attended: true,
  checkedInAt: true,
  checkInLatitude: true,
  checkInLongitude: true,
  checkInLocation: true,
});

export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertCustomRoleSchema = createInsertSchema(customRoles).omit({
  id: true,
  createdAt: true,
});

export const insertMembershipTierSchema = createInsertSchema(membershipTiers).omit({
  id: true,
  createdAt: true,
});

export const insertCustomFieldDefinitionSchema = createInsertSchema(customFieldDefinitions).omit({
  id: true,
  createdAt: true,
});

export const insertGeoLocationLogSchema = createInsertSchema(geoLocationLog).omit({
  id: true,
  createdAt: true,
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

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  users: many(users),
  messages: many(memberMessages),
  settings: one(organizationSettings),
  customRoles: many(customRoles),
  membershipTiers: many(membershipTiers),
  customFieldDefinitions: many(customFieldDefinitions),
  events: many(events),
}));

export const organizationSettingsRelations = relations(organizationSettings, ({ one }) => ({
  chapter: one(chapters, {
    fields: [organizationSettings.chapterId],
    references: [chapters.id],
  }),
}));

export const customRolesRelations = relations(customRoles, ({ one }) => ({
  chapter: one(chapters, {
    fields: [customRoles.chapterId],
    references: [chapters.id],
  }),
}));

export const membershipTiersRelations = relations(membershipTiers, ({ one }) => ({
  chapter: one(chapters, {
    fields: [membershipTiers.chapterId],
    references: [chapters.id],
  }),
}));

export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ one }) => ({
  chapter: one(chapters, {
    fields: [customFieldDefinitions.chapterId],
    references: [chapters.id],
  }),
}));

export const geoLocationLogRelations = relations(geoLocationLog, ({ one }) => ({
  user: one(users, {
    fields: [geoLocationLog.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [geoLocationLog.eventId],
    references: [events.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [events.chapterId],
    references: [chapters.id],
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

export type InsertOrganizationSettings = z.infer<typeof insertOrganizationSettingsSchema>;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;

export type InsertCustomRole = z.infer<typeof insertCustomRoleSchema>;
export type CustomRole = typeof customRoles.$inferSelect;

export type InsertMembershipTier = z.infer<typeof insertMembershipTierSchema>;
export type MembershipTier = typeof membershipTiers.$inferSelect;

export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;
export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;

export type InsertGeoLocationLog = z.infer<typeof insertGeoLocationLogSchema>;
export type GeoLocationLog = typeof geoLocationLog.$inferSelect;

// User level permissions
export const USER_LEVELS = {
  MEMBER: "member",
  BOARD_MEMBER: "board_member",
  EXECUTIVE_BOARD: "executive_board",
} as const;

export type UserLevel = typeof USER_LEVELS[keyof typeof USER_LEVELS];

// Permissions for custom roles
export const PERMISSIONS = {
  // Member management
  VIEW_MEMBERS: "view_members",
  EDIT_MEMBERS: "edit_members",
  DELETE_MEMBERS: "delete_members",
  APPROVE_MEMBERS: "approve_members",

  // Event management
  VIEW_EVENTS: "view_events",
  CREATE_EVENTS: "create_events",
  EDIT_EVENTS: "edit_events",
  DELETE_EVENTS: "delete_events",

  // Communication
  SEND_MESSAGES: "send_messages",
  SEND_BULK_EMAILS: "send_bulk_emails",

  // Leads
  VIEW_OWN_LEADS: "view_own_leads",
  VIEW_ALL_LEADS: "view_all_leads",

  // Organization settings
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_ROLES: "manage_roles",
  MANAGE_TIERS: "manage_tiers",

  // Board features
  VIEW_BOARD_MINUTES: "view_board_minutes",
  CREATE_BOARD_MINUTES: "create_board_minutes",

  // Analytics
  VIEW_ANALYTICS: "view_analytics",
  VIEW_FINANCIAL_REPORTS: "view_financial_reports",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
