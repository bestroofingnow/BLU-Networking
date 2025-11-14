import {
  users,
  chapters,
  events,
  eventRegistrations,
  leads,
  userGoals,
  memberSpotlights,
  memberMessages,
  boardMeetingMinutes,
  organizationSettings,
  customRoles,
  membershipTiers,
  customFieldDefinitions,
  geoLocationLog,
  type User,
  type InsertUser,
  type Chapter,
  type InsertChapter,
  type Event,
  type InsertEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type Lead,
  type InsertLead,
  type UserGoal,
  type InsertUserGoal,
  type MemberSpotlight,
  type InsertMemberSpotlight,
  type MemberMessage,
  type InsertMemberMessage,
  type BoardMeetingMinutes,
  type InsertBoardMeetingMinutes,
  type OrganizationSettings,
  type InsertOrganizationSettings,
  type CustomRole,
  type InsertCustomRole,
  type MembershipTier,
  type InsertMembershipTier,
  type CustomFieldDefinition,
  type InsertCustomFieldDefinition,
  type GeoLocationLog,
  type InsertGeoLocationLog,
  type UserLevel,
  USER_LEVELS
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserPassword(id: number, newPassword: string): Promise<boolean>;
  updateUserLevel(id: number, userLevel: UserLevel): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByChapter(chapterId: number): Promise<User[]>;
  getUserCount(): Promise<number>;

  // Chapter operations
  getChapter(id: number): Promise<Chapter | undefined>;
  getAllChapters(): Promise<Chapter[]>;
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  updateChapter(id: number, chapterData: Partial<Chapter>): Promise<Chapter>;

  // Organization settings operations
  getOrganizationSettings(chapterId: number): Promise<OrganizationSettings | undefined>;
  updateOrganizationSettings(chapterId: number, settings: Partial<OrganizationSettings>): Promise<OrganizationSettings>;
  createOrganizationSettings(settings: InsertOrganizationSettings): Promise<OrganizationSettings>;

  // Custom roles operations
  getCustomRole(id: number): Promise<CustomRole | undefined>;
  getCustomRolesByChapter(chapterId: number): Promise<CustomRole[]>;
  createCustomRole(role: InsertCustomRole): Promise<CustomRole>;
  updateCustomRole(id: number, role: Partial<CustomRole>): Promise<CustomRole>;
  deleteCustomRole(id: number): Promise<boolean>;

  // Membership tiers operations
  getMembershipTier(id: number): Promise<MembershipTier | undefined>;
  getMembershipTiersByChapter(chapterId: number): Promise<MembershipTier[]>;
  createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier>;
  updateMembershipTier(id: number, tier: Partial<MembershipTier>): Promise<MembershipTier>;
  deleteMembershipTier(id: number): Promise<boolean>;

  // Custom field definitions operations
  getCustomFieldDefinition(id: number): Promise<CustomFieldDefinition | undefined>;
  getCustomFieldDefinitionsByChapter(chapterId: number): Promise<CustomFieldDefinition[]>;
  createCustomFieldDefinition(field: InsertCustomFieldDefinition): Promise<CustomFieldDefinition>;
  updateCustomFieldDefinition(id: number, field: Partial<CustomFieldDefinition>): Promise<CustomFieldDefinition>;
  deleteCustomFieldDefinition(id: number): Promise<boolean>;

  // Geo-location log operations
  createGeoLocationLog(log: InsertGeoLocationLog): Promise<GeoLocationLog>;
  getGeoLocationLogByUser(userId: number, eventType?: string): Promise<GeoLocationLog[]>;

  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  getActiveEventCount(): Promise<number>;

  // Event registration operations
  getEventRegistration(eventId: number, userId: number): Promise<EventRegistration | undefined>;
  getEventRegistrationCount(eventId: number): Promise<number>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateEventRegistration(id: number, registration: Partial<EventRegistration>): Promise<EventRegistration>;
  getEventAttendanceCountByUser(userId: number): Promise<number>;

  // Lead operations
  getLeadsByUser(userId: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadCountByUser(userId: number): Promise<number>;
  getTotalLeadCount(): Promise<number>;
  getTotalLeadValueByUser(userId: number): Promise<number>;
  getAverageLeadValue(): Promise<number>;

  // User goals operations
  getCurrentUserGoals(userId: number): Promise<UserGoal | undefined>;
  createUserGoal(goal: InsertUserGoal): Promise<UserGoal>;

  // Member spotlight operations
  getActiveMemberSpotlight(): Promise<MemberSpotlight | undefined>;
  getAllMemberSpotlights(): Promise<MemberSpotlight[]>;
  createMemberSpotlight(spotlight: InsertMemberSpotlight): Promise<MemberSpotlight>;

  // Member message operations
  getMessagesByChapter(chapterId: number): Promise<MemberMessage[]>;
  getMessagesBetweenUsers(fromUserId: number, toUserId: number): Promise<MemberMessage[]>;
  createMemberMessage(message: InsertMemberMessage): Promise<MemberMessage>;
  markMessageAsRead(messageId: number): Promise<boolean>;

  // Board meeting minutes operations
  getBoardMeetingMinutes(chapterId?: number): Promise<BoardMeetingMinutes[]>;
  getBoardMeetingMinute(id: number): Promise<BoardMeetingMinutes | undefined>;
  createBoardMeetingMinutes(minutes: InsertBoardMeetingMinutes): Promise<BoardMeetingMinutes>;
  updateBoardMeetingMinutes(id: number, minutes: Partial<BoardMeetingMinutes>): Promise<BoardMeetingMinutes>;
  deleteBoardMeetingMinutes(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Create an admin user for testing if necessary
    this.initAdminUser();
  }
  
  private async initAdminUser() {
    try {
      // Check if super admin user already exists
      const existingAdmin = await this.getUserByUsername("superadmin");

      if (!existingAdmin) {
        // Create super admin user (platform owner)
        const superAdmin = await db.insert(users).values({
          username: "superadmin",
          password: "password123", // CHANGE THIS IMMEDIATELY!
          fullName: "Platform Administrator",
          email: "admin@yourplatform.com",
          company: "Platform",
          title: "Super Administrator",
          bio: "Platform owner - manages all networking organizations",
          industry: "Technology",
          expertise: "Platform Management",
          profileImage: "",
          phoneNumber: "",
          isSuperAdmin: true,
          isOrgAdmin: false,
          isAdmin: true, // For backward compatibility
          userLevel: "executive_board",
          chapterId: null, // Super admin is not tied to any specific organization
          membershipStatus: "active",
          joinedAt: new Date()
        }).returning();

        console.log("✅ Super Admin created successfully!");
        console.log("Login: superadmin / password123");
        console.log("⚠️  CHANGE PASSWORD IMMEDIATELY!");
      } else if (!existingAdmin.isSuperAdmin) {
        // Upgrade existing admin to super admin
        await db.update(users)
          .set({ isSuperAdmin: true, chapterId: null })
          .where(eq(users.username, "superadmin"));

        console.log("✅ Upgraded existing admin to Super Admin");
      }
    } catch (error) {
      console.error("Error initializing super admin user:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      joinedAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    // Don't allow changing sensitive fields
    const { id: _, password: __, joinedAt: ___, ...safeUserData } = userData;
    
    const result = await db.update(users)
      .set(safeUserData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async updateUserLevel(id: number, userLevel: UserLevel): Promise<User> {
    const result = await db.update(users)
      .set({ userLevel })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getUsersByChapter(chapterId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.chapterId, chapterId));
  }

  // Chapter operations
  async getChapter(id: number): Promise<Chapter | undefined> {
    const result = await db.select().from(chapters).where(eq(chapters.id, id));
    return result[0];
  }

  async getAllChapters(): Promise<Chapter[]> {
    return await db.select().from(chapters).where(eq(chapters.isActive, true));
  }

  async createChapter(chapter: InsertChapter): Promise<Chapter> {
    const result = await db.insert(chapters).values({
      ...chapter,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateChapter(id: number, chapterData: Partial<Chapter>): Promise<Chapter> {
    const result = await db.update(chapters)
      .set(chapterData)
      .where(eq(chapters.id, id))
      .returning();
    return result[0];
  }
  
  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }
  
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.date));
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values({
      ...event,
      createdAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async getActiveEventCount(): Promise<number> {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(gte(events.date, today));
    
    return result[0].count;
  }
  
  // Event registration operations
  async getEventRegistration(eventId: number, userId: number): Promise<EventRegistration | undefined> {
    const result = await db.select()
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.userId, userId)
      ));
    
    return result[0];
  }
  
  async getEventRegistrationCount(eventId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));
    
    return result[0].count;
  }
  
  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    const result = await db.insert(eventRegistrations).values({
      ...registration,
      registeredAt: new Date(),
      attended: false,
      checkedInAt: null
    }).returning();
    
    return result[0];
  }
  
  async getEventAttendanceCountByUser(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.userId, userId),
        eq(eventRegistrations.attended, true)
      ));
    
    return result[0].count;
  }
  
  // Lead operations
  async getLeadsByUser(userId: number): Promise<Lead[]> {
    return await db.select()
      .from(leads)
      .where(eq(leads.userId, userId))
      .orderBy(desc(leads.createdAt));
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    const result = await db.insert(leads).values({
      ...lead,
      createdAt: new Date()
    }).returning();
    
    return result[0];
  }
  
  async getLeadCountByUser(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.userId, userId));
    
    return result[0].count;
  }
  
  async getTotalLeadCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(leads);
    return result[0].count;
  }
  
  async getTotalLeadValueByUser(userId: number): Promise<number> {
    const result = await db.select({
      total: sql<number>`sum(value)`
    })
    .from(leads)
    .where(eq(leads.userId, userId));
    
    return result[0].total || 0;
  }
  
  async getAverageLeadValue(): Promise<number> {
    const result = await db.select({
      average: sql<number>`avg(value)`
    })
    .from(leads);
    
    return result[0].average || 0;
  }
  
  // User goals operations
  async getCurrentUserGoals(userId: number): Promise<UserGoal | undefined> {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const result = await db.select()
      .from(userGoals)
      .where(and(
        eq(userGoals.userId, userId),
        lte(userGoals.startDate, today),
        gte(userGoals.endDate, today)
      ));
    
    return result[0];
  }
  
  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const result = await db.insert(userGoals).values(goal).returning();
    return result[0];
  }
  
  // Member spotlight operations
  async getActiveMemberSpotlight(): Promise<MemberSpotlight | undefined> {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    const spotlight = await db.select()
      .from(memberSpotlights)
      .where(and(
        eq(memberSpotlights.active, true),
        sql`(${memberSpotlights.featuredUntil} IS NULL OR ${memberSpotlights.featuredUntil} >= ${today})`
      ))
      .limit(1);
    
    if (spotlight.length === 0) return undefined;
    
    // Get the user
    const user = await this.getUser(spotlight[0].userId);
    if (!user) return undefined;
    
    return {
      ...spotlight[0],
      user
    } as unknown as MemberSpotlight;
  }
  
  async getAllMemberSpotlights(): Promise<MemberSpotlight[]> {
    const spotlights = await db.select().from(memberSpotlights);
    const result: MemberSpotlight[] = [];
    
    for (const spotlight of spotlights) {
      const user = await this.getUser(spotlight.userId);
      if (user) {
        result.push({
          ...spotlight,
          user
        } as unknown as MemberSpotlight);
      }
    }
    
    return result;
  }
  
  async createMemberSpotlight(spotlight: InsertMemberSpotlight): Promise<MemberSpotlight> {
    const result = await db.insert(memberSpotlights).values({
      ...spotlight,
      active: true,
      createdAt: new Date()
    }).returning();
    
    const user = await this.getUser(spotlight.userId);
    
    return {
      ...result[0],
      user: user!
    } as unknown as MemberSpotlight;
  }

  // Member message operations
  async getMessagesByChapter(chapterId: number): Promise<MemberMessage[]> {
    return await db.select().from(memberMessages)
      .where(eq(memberMessages.chapterId, chapterId))
      .orderBy(desc(memberMessages.sentAt));
  }

  async getMessagesBetweenUsers(fromUserId: number, toUserId: number): Promise<MemberMessage[]> {
    return await db.select().from(memberMessages)
      .where(
        and(
          eq(memberMessages.fromUserId, fromUserId),
          eq(memberMessages.toUserId, toUserId)
        )
      )
      .orderBy(desc(memberMessages.sentAt));
  }

  async createMemberMessage(message: InsertMemberMessage): Promise<MemberMessage> {
    const result = await db.insert(memberMessages).values({
      ...message,
      sentAt: new Date()
    }).returning();
    return result[0];
  }

  async markMessageAsRead(messageId: number): Promise<boolean> {
    try {
      await db.update(memberMessages)
        .set({ isRead: true })
        .where(eq(memberMessages.id, messageId));
      return true;
    } catch (error) {
      console.error("Error marking message as read:", error);
      return false;
    }
  }

  // Board meeting minutes operations
  async getBoardMeetingMinutes(chapterId?: number): Promise<BoardMeetingMinutes[]> {
    const query = db.select().from(boardMeetingMinutes);
    
    if (chapterId) {
      return await query.where(eq(boardMeetingMinutes.chapterId, chapterId))
        .orderBy(desc(boardMeetingMinutes.meetingDate));
    }
    
    return await query.orderBy(desc(boardMeetingMinutes.meetingDate));
  }

  async getBoardMeetingMinute(id: number): Promise<BoardMeetingMinutes | undefined> {
    const result = await db.select().from(boardMeetingMinutes)
      .where(eq(boardMeetingMinutes.id, id));
    return result[0];
  }

  async createBoardMeetingMinutes(minutes: InsertBoardMeetingMinutes): Promise<BoardMeetingMinutes> {
    const result = await db.insert(boardMeetingMinutes).values({
      ...minutes,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateBoardMeetingMinutes(id: number, minutesData: Partial<BoardMeetingMinutes>): Promise<BoardMeetingMinutes> {
    const { id: _, createdAt: __, ...safeData } = minutesData;
    
    const result = await db.update(boardMeetingMinutes)
      .set(safeData)
      .where(eq(boardMeetingMinutes.id, id))
      .returning();
    return result[0];
  }

  async deleteBoardMeetingMinutes(id: number): Promise<boolean> {
    try {
      await db.delete(boardMeetingMinutes)
        .where(eq(boardMeetingMinutes.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting board meeting minutes:", error);
      return false;
    }
  }

  // Organization settings operations
  async getOrganizationSettings(chapterId: number): Promise<OrganizationSettings | undefined> {
    const result = await db.select()
      .from(organizationSettings)
      .where(eq(organizationSettings.chapterId, chapterId));

    if (result.length === 0) {
      // Create default settings if none exist
      return await this.createOrganizationSettings({ chapterId });
    }

    return result[0];
  }

  async createOrganizationSettings(settings: InsertOrganizationSettings): Promise<OrganizationSettings> {
    const result = await db.insert(organizationSettings)
      .values({
        ...settings,
        updatedAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updateOrganizationSettings(
    chapterId: number,
    settingsData: Partial<OrganizationSettings>
  ): Promise<OrganizationSettings> {
    const { id: _, chapterId: __, updatedAt: ___, ...safeData } = settingsData;

    const result = await db.update(organizationSettings)
      .set({
        ...safeData,
        updatedAt: new Date()
      })
      .where(eq(organizationSettings.chapterId, chapterId))
      .returning();

    return result[0];
  }

  // Custom roles operations
  async getCustomRole(id: number): Promise<CustomRole | undefined> {
    const result = await db.select()
      .from(customRoles)
      .where(eq(customRoles.id, id));
    return result[0];
  }

  async getCustomRolesByChapter(chapterId: number): Promise<CustomRole[]> {
    return await db.select()
      .from(customRoles)
      .where(eq(customRoles.chapterId, chapterId));
  }

  async createCustomRole(role: InsertCustomRole): Promise<CustomRole> {
    const result = await db.insert(customRoles)
      .values({
        ...role,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updateCustomRole(id: number, roleData: Partial<CustomRole>): Promise<CustomRole> {
    const { id: _, chapterId: __, createdAt: ___, ...safeData } = roleData;

    const result = await db.update(customRoles)
      .set(safeData)
      .where(eq(customRoles.id, id))
      .returning();

    return result[0];
  }

  async deleteCustomRole(id: number): Promise<boolean> {
    try {
      await db.delete(customRoles)
        .where(eq(customRoles.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting custom role:", error);
      return false;
    }
  }

  // Membership tiers operations
  async getMembershipTier(id: number): Promise<MembershipTier | undefined> {
    const result = await db.select()
      .from(membershipTiers)
      .where(eq(membershipTiers.id, id));
    return result[0];
  }

  async getMembershipTiersByChapter(chapterId: number): Promise<MembershipTier[]> {
    return await db.select()
      .from(membershipTiers)
      .where(eq(membershipTiers.chapterId, chapterId))
      .orderBy(membershipTiers.sortOrder);
  }

  async createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier> {
    const result = await db.insert(membershipTiers)
      .values({
        ...tier,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updateMembershipTier(id: number, tierData: Partial<MembershipTier>): Promise<MembershipTier> {
    const { id: _, chapterId: __, createdAt: ___, ...safeData } = tierData;

    const result = await db.update(membershipTiers)
      .set(safeData)
      .where(eq(membershipTiers.id, id))
      .returning();

    return result[0];
  }

  async deleteMembershipTier(id: number): Promise<boolean> {
    try {
      await db.delete(membershipTiers)
        .where(eq(membershipTiers.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting membership tier:", error);
      return false;
    }
  }

  // Custom field definitions operations
  async getCustomFieldDefinition(id: number): Promise<CustomFieldDefinition | undefined> {
    const result = await db.select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.id, id));
    return result[0];
  }

  async getCustomFieldDefinitionsByChapter(chapterId: number): Promise<CustomFieldDefinition[]> {
    return await db.select()
      .from(customFieldDefinitions)
      .where(eq(customFieldDefinitions.chapterId, chapterId))
      .orderBy(customFieldDefinitions.sortOrder);
  }

  async createCustomFieldDefinition(field: InsertCustomFieldDefinition): Promise<CustomFieldDefinition> {
    const result = await db.insert(customFieldDefinitions)
      .values({
        ...field,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updateCustomFieldDefinition(
    id: number,
    fieldData: Partial<CustomFieldDefinition>
  ): Promise<CustomFieldDefinition> {
    const { id: _, chapterId: __, createdAt: ___, ...safeData } = fieldData;

    const result = await db.update(customFieldDefinitions)
      .set(safeData)
      .where(eq(customFieldDefinitions.id, id))
      .returning();

    return result[0];
  }

  async deleteCustomFieldDefinition(id: number): Promise<boolean> {
    try {
      await db.delete(customFieldDefinitions)
        .where(eq(customFieldDefinitions.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting custom field definition:", error);
      return false;
    }
  }

  // Geo-location log operations
  async createGeoLocationLog(log: InsertGeoLocationLog): Promise<GeoLocationLog> {
    const result = await db.insert(geoLocationLog)
      .values({
        ...log,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }

  async getGeoLocationLogByUser(userId: number, eventType?: string): Promise<GeoLocationLog[]> {
    if (eventType) {
      return await db.select()
        .from(geoLocationLog)
        .where(and(
          eq(geoLocationLog.userId, userId),
          eq(geoLocationLog.eventType, eventType as any)
        ))
        .orderBy(desc(geoLocationLog.createdAt));
    }

    return await db.select()
      .from(geoLocationLog)
      .where(eq(geoLocationLog.userId, userId))
      .orderBy(desc(geoLocationLog.createdAt));
  }

  // Update event registration (for check-ins)
  async updateEventRegistration(
    id: number,
    registrationData: Partial<EventRegistration>
  ): Promise<EventRegistration> {
    const { id: _, eventId: __, userId: ___, registeredAt: ____, ...safeData } = registrationData;

    const result = await db.update(eventRegistrations)
      .set(safeData)
      .where(eq(eventRegistrations.id, id))
      .returning();

    return result[0];
  }
}

export const storage = new DatabaseStorage();
