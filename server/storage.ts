import {
  users, 
  chapters,
  events, 
  eventRegistrations, 
  leads, 
  userGoals, 
  memberSpotlights,
  memberMessages,
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
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  getAllEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  getActiveEventCount(): Promise<number>;
  
  // Event registration operations
  getEventRegistration(eventId: number, userId: number): Promise<EventRegistration | undefined>;
  getEventRegistrationCount(eventId: number): Promise<number>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
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
    // Check if an admin user exists
    const adminUser = await db.select().from(users).where(eq(users.userLevel, USER_LEVELS.EXECUTIVE_BOARD)).limit(1);
    
    // If no admin user, create one
    if (adminUser.length === 0) {
      // First ensure we have a default chapter
      let defaultChapter = await db.select().from(chapters).limit(1);
      if (defaultChapter.length === 0) {
        defaultChapter = await db.insert(chapters).values({
          name: "Charlotte Main",
          location: "Charlotte, NC",
          description: "Primary BLU chapter in Charlotte"
        }).returning();
      }

      await this.createUser({
        username: "admin",
        password: "password123", // In real app, this would be hashed
        fullName: "Admin User",
        email: "admin@blunetworking.org",
        company: "BLU",
        title: "Administrator",
        bio: "System administrator for BLU networking app",
        industry: "Technology",
        expertise: "System Administration",
        profileImage: "",
        phoneNumber: "704-555-1234",
        chapterId: defaultChapter[0].id
      });

      // Update the created user to executive board level
      const createdAdmin = await this.getUserByUsername("admin");
      if (createdAdmin) {
        await this.updateUserLevel(createdAdmin.id, USER_LEVELS.EXECUTIVE_BOARD);
      }
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
}

export const storage = new DatabaseStorage();
