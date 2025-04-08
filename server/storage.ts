import {
  users, 
  events, 
  eventRegistrations, 
  leads, 
  userGoals, 
  memberSpotlights,
  type User, 
  type InsertUser, 
  type Event, 
  type InsertEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type Lead,
  type InsertLead,
  type UserGoal,
  type InsertUserGoal,
  type MemberSpotlight,
  type InsertMemberSpotlight
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserPassword(id: number, newPassword: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  
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
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersStore: Map<number, User>;
  private eventsStore: Map<number, Event>;
  private eventRegistrationsStore: Map<number, EventRegistration>;
  private leadsStore: Map<number, Lead>;
  private userGoalsStore: Map<number, UserGoal>;
  private memberSpotlightsStore: Map<number, MemberSpotlight>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number = 1;
  private eventIdCounter: number = 1;
  private registrationIdCounter: number = 1;
  private leadIdCounter: number = 1;
  private goalIdCounter: number = 1;
  private spotlightIdCounter: number = 1;

  constructor() {
    this.usersStore = new Map();
    this.eventsStore = new Map();
    this.eventRegistrationsStore = new Map();
    this.leadsStore = new Map();
    this.userGoalsStore = new Map();
    this.memberSpotlightsStore = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
    
    // Create an admin user for testing
    this.createUser({
      username: "admin",
      password: "password123", // In real app, this would be hashed
      fullName: "Admin User",
      email: "admin@bloccharlotte.org",
      company: "BLOC",
      title: "Administrator",
      bio: "System administrator for BLOC networking app",
      industry: "Technology",
      expertise: "System Administration",
      profileImage: "",
      phoneNumber: "704-555-1234",
      isAdmin: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersStore.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false,
      joinedAt: now
    };
    this.usersStore.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    // Don't allow changing sensitive fields
    const { id: _, password: __, isAdmin: ___, joinedAt: ____, ...safeUserData } = userData;
    
    const updatedUser = { ...user, ...safeUserData };
    this.usersStore.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    
    const updatedUser = { ...user, password: newPassword };
    this.usersStore.set(id, updatedUser);
    return true;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersStore.values());
  }
  
  async getUserCount(): Promise<number> {
    return this.usersStore.size;
  }
  
  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    return this.eventsStore.get(id);
  }
  
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.eventsStore.values());
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const now = new Date();
    const newEvent: Event = { ...event, id, createdAt: now };
    this.eventsStore.set(id, newEvent);
    return newEvent;
  }
  
  async getActiveEventCount(): Promise<number> {
    const now = new Date();
    return Array.from(this.eventsStore.values()).filter(
      event => new Date(event.date) >= now
    ).length;
  }
  
  // Event registration operations
  async getEventRegistration(eventId: number, userId: number): Promise<EventRegistration | undefined> {
    return Array.from(this.eventRegistrationsStore.values()).find(
      reg => reg.eventId === eventId && reg.userId === userId
    );
  }
  
  async getEventRegistrationCount(eventId: number): Promise<number> {
    return Array.from(this.eventRegistrationsStore.values()).filter(
      reg => reg.eventId === eventId
    ).length;
  }
  
  async createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration> {
    const id = this.registrationIdCounter++;
    const now = new Date();
    const newRegistration: EventRegistration = { 
      ...registration, 
      id, 
      registeredAt: now,
      attended: false,
      checkedInAt: null
    };
    this.eventRegistrationsStore.set(id, newRegistration);
    return newRegistration;
  }
  
  async getEventAttendanceCountByUser(userId: number): Promise<number> {
    return Array.from(this.eventRegistrationsStore.values()).filter(
      reg => reg.userId === userId && reg.attended
    ).length;
  }
  
  // Lead operations
  async getLeadsByUser(userId: number): Promise<Lead[]> {
    return Array.from(this.leadsStore.values()).filter(
      lead => lead.userId === userId
    );
  }
  
  async createLead(lead: InsertLead): Promise<Lead> {
    const id = this.leadIdCounter++;
    const now = new Date();
    const newLead: Lead = { ...lead, id, createdAt: now };
    this.leadsStore.set(id, newLead);
    return newLead;
  }
  
  async getLeadCountByUser(userId: number): Promise<number> {
    return Array.from(this.leadsStore.values()).filter(
      lead => lead.userId === userId
    ).length;
  }
  
  async getTotalLeadCount(): Promise<number> {
    return this.leadsStore.size;
  }
  
  async getTotalLeadValueByUser(userId: number): Promise<number> {
    return Array.from(this.leadsStore.values())
      .filter(lead => lead.userId === userId)
      .reduce((sum, lead) => sum + (lead.value || 0), 0);
  }
  
  async getAverageLeadValue(): Promise<number> {
    const leads = Array.from(this.leadsStore.values());
    if (leads.length === 0) return 0;
    
    const total = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    return Math.round(total / leads.length);
  }
  
  // User goals operations
  async getCurrentUserGoals(userId: number): Promise<UserGoal | undefined> {
    const now = new Date();
    
    return Array.from(this.userGoalsStore.values()).find(
      goal => goal.userId === userId && 
             new Date(goal.startDate) <= now && 
             new Date(goal.endDate) >= now
    );
  }
  
  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const id = this.goalIdCounter++;
    const newGoal: UserGoal = { ...goal, id };
    this.userGoalsStore.set(id, newGoal);
    return newGoal;
  }
  
  // Member spotlight operations
  async getActiveMemberSpotlight(): Promise<MemberSpotlight | undefined> {
    const now = new Date();
    
    const spotlight = Array.from(this.memberSpotlightsStore.values()).find(
      s => s.active && (!s.featuredUntil || new Date(s.featuredUntil) >= now)
    );
    
    if (!spotlight) return undefined;
    
    // Add user data to spotlight
    const user = await this.getUser(spotlight.userId);
    return { 
      ...spotlight, 
      user: user! 
    } as MemberSpotlight & { user: User };
  }
  
  async getAllMemberSpotlights(): Promise<MemberSpotlight[]> {
    const spotlights = Array.from(this.memberSpotlightsStore.values());
    
    // Add user data to each spotlight
    return Promise.all(spotlights.map(async (spotlight) => {
      const user = await this.getUser(spotlight.userId);
      return { 
        ...spotlight, 
        user: user! 
      } as MemberSpotlight & { user: User };
    }));
  }
  
  async createMemberSpotlight(spotlight: InsertMemberSpotlight): Promise<MemberSpotlight> {
    const id = this.spotlightIdCounter++;
    const now = new Date();
    const newSpotlight: MemberSpotlight = { 
      ...spotlight, 
      id, 
      active: true, 
      createdAt: now 
    };
    this.memberSpotlightsStore.set(id, newSpotlight);
    
    // Add user data to spotlight
    const user = await this.getUser(spotlight.userId);
    return { 
      ...newSpotlight, 
      user: user! 
    } as MemberSpotlight & { user: User };
  }
}

export const storage = new MemStorage();
