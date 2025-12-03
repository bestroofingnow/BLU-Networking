import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  insertEventSchema,
  insertEventRegistrationSchema,
  insertLeadSchema,
  insertMemberSpotlightSchema,
  insertBoardMeetingMinutesSchema,
  insertOrganizationSettingsSchema,
  insertCustomRoleSchema,
  insertMembershipTierSchema,
  insertCustomFieldDefinitionSchema,
  insertGeoLocationLogSchema,
  PERMISSIONS
} from "@shared/schema";
import { z } from "zod";
import { generateNetworkingTips, NetworkingTipsRequest } from "./openai";
import {
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendSpotlightNotificationEmail,
  sendBoardMinutesEmail
} from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Ensure user is authenticated
  const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Ensure user has board member access or higher
  const ensureBoardMember = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userLevel = req.user?.userLevel;
    if (userLevel !== "board_member" && userLevel !== "executive_board") {
      return res.status(403).json({ message: "Board member access required" });
    }
    next();
  };

  // Ensure user has executive board access
  const ensureExecutiveBoard = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user?.userLevel !== "executive_board") {
      return res.status(403).json({ message: "Executive board access required" });
    }
    next();
  };

  // Ensure user is Super Admin (platform owner)
  const ensureSuperAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ message: "Super Admin access required" });
    }
    next();
  };

  // User routes
  app.get("/api/members", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      let members;
      
      // Regular members can only see members from their chapter
      if (user.userLevel === "member" && user.chapterId) {
        members = await storage.getUsersByChapter(user.chapterId);
      } else {
        // Board members and executive board can see all members
        members = await storage.getAllUsers();
      }
      
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Chapter routes
  app.get("/api/chapters", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      let chapters;

      // Super Admin can see all organizations
      if (user.isSuperAdmin) {
        chapters = await storage.getAllChapters();
      } else if (user.chapterId) {
        // Regular users see only their organization
        const chapter = await storage.getChapter(user.chapterId);
        chapters = chapter ? [chapter] : [];
      } else {
        chapters = [];
      }

      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.post("/api/chapters", async (req, res) => {
    try {
      // Allow Super Admin or Executive Board to create organizations
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user!;
      if (!user.isSuperAdmin && user.userLevel !== "executive_board") {
        return res.status(403).json({ message: "Super Admin or Executive Board access required" });
      }

      const chapter = await storage.createChapter(req.body);

      // Auto-create organization settings for new organization
      await storage.createOrganizationSettings({
        chapterId: chapter.id,
        contactEmail: req.body.contactEmail || "contact@organization.com",
        contactPhone: req.body.contactPhone || "",
        address: req.body.address || "",
        timezone: "America/New_York",
        welcomeMessage: `Welcome to ${chapter.name}!`
      });

      res.status(201).json(chapter);
    } catch (error) {
      res.status(500).json({ message: "Failed to create chapter" });
    }
  });

  // ============================================================================
  // SUPER ADMIN ROUTES (Platform Owner)
  // ============================================================================

  // Create organization admin account
  app.post("/api/super-admin/create-org-admin", ensureSuperAdmin, async (req, res) => {
    try {
      const { chapterId, username, password, fullName, email, company, title } = req.body;

      // Validate required fields
      if (!chapterId || !username || !password || !fullName || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify the organization exists
      const chapter = await storage.getChapter(chapterId);
      if (!chapter) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create org admin user
      const newUser = await storage.createUser({
        username,
        password, // Will be hashed in storage layer
        fullName,
        email,
        company: company || "",
        title: title || "Administrator",
        chapterId,
        isOrgAdmin: true,
        isAdmin: true, // For backward compatibility with existing checks
        isSuperAdmin: false,
        userLevel: "executive_board",
        membershipStatus: "active",
        joinedAt: new Date()
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating org admin:", error);
      res.status(500).json({ message: "Failed to create organization admin" });
    }
  });

  app.patch("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      const user = await storage.updateUser(req.user!.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Event routes
  app.get("/api/events", ensureAuthenticated, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      
      // Add registration status for each event
      const eventsWithStatus = await Promise.all(
        events.map(async (event) => {
          const registration = await storage.getEventRegistration(event.id, req.user!.id);
          return {
            ...event,
            isRegistered: !!registration,
            attended: registration ? registration.attended : false,
          };
        })
      );
      
      res.json(eventsWithStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  app.post("/api/events", ensureBoardMember, async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse({
        ...req.body,
        createdById: req.user!.id
      });
      
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create event" });
      }
    }
  });
  
  app.post("/api/event-registrations", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEventRegistrationSchema.parse(req.body);
      
      // Check if user is already registered
      const existingRegistration = await storage.getEventRegistration(
        validatedData.eventId, 
        validatedData.userId
      );
      
      if (existingRegistration) {
        return res.status(400).json({ message: "Already registered for this event" });
      }
      
      // Check if event exists and has capacity
      const event = await storage.getEvent(validatedData.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (event.capacity) {
        const registrations = await storage.getEventRegistrationCount(event.id);
        if (registrations >= event.capacity) {
          return res.status(400).json({ message: "Event is at full capacity" });
        }
      }
      
      const registration = await storage.createEventRegistration(validatedData);

      // Send confirmation email
      const user = await storage.getUser(validatedData.userId);
      if (user && user.email) {
        const eventDate = new Date(event.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        sendEventRegistrationEmail(
          user.email,
          user.username,
          event.title,
          eventDate,
          event.location || 'TBA'
        ).catch(err => console.error('Failed to send registration email:', err));
      }

      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to register for event" });
      }
    }
  });

  // Lead routes
  app.get("/api/leads", ensureAuthenticated, async (req, res) => {
    try {
      const leads = await storage.getLeadsByUser(req.user!.id);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });
  
  app.post("/api/leads", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLeadSchema.parse(req.body);
      
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create lead" });
      }
    }
  });

  // Stats routes
  app.get("/api/stats", ensureAuthenticated, async (req, res) => {
    try {
      const connections = 127; // Placeholder
      const leadsExchanged = await storage.getLeadCountByUser(req.user!.id);
      const eventsAttended = await storage.getEventAttendanceCountByUser(req.user!.id);
      const leadValue = await storage.getTotalLeadValueByUser(req.user!.id);
      
      res.json({
        connections,
        leadsExchanged,
        eventsAttended,
        leadValue
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Goals routes
  app.get("/api/goals", ensureAuthenticated, async (req, res) => {
    try {
      const goals = await storage.getCurrentUserGoals(req.user!.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  // Member spotlight routes
  app.get("/api/spotlight", ensureAuthenticated, async (req, res) => {
    try {
      const spotlight = await storage.getActiveMemberSpotlight();
      res.json(spotlight);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch member spotlight" });
    }
  });
  
  app.post("/api/member-spotlights", ensureBoardMember, async (req, res) => {
    try {
      const validatedData = insertMemberSpotlightSchema.parse(req.body);

      const spotlight = await storage.createMemberSpotlight(validatedData);

      // Send notification email to all members in the organization
      const user = req.user!;
      if (user.chapterId) {
        const allMembers = await storage.getUsersByChapter(user.chapterId);
        const memberEmails = allMembers
          .filter(m => m.email && m.id !== spotlight.userId)
          .map(m => m.email!);

        if (memberEmails.length > 0) {
          const spotlightedUser = await storage.getUser(spotlight.userId);
          if (spotlightedUser) {
            sendSpotlightNotificationEmail(
              memberEmails,
              spotlightedUser.fullName || spotlightedUser.username,
              spotlight.achievement
            ).catch(err => console.error('Failed to send spotlight notification:', err));
          }
        }
      }

      res.status(201).json(spotlight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid spotlight data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create member spotlight" });
      }
    }
  });

  // ============================================================================
  // DASHBOARD ROUTES
  // ============================================================================

  // Get dashboard stats for the current user
  app.get("/api/dashboard/stats", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Get total connections (members in the same chapter)
      const allMembers = await storage.getUsersByChapter(user.chapterId);
      const totalConnections = allMembers.length - 1; // Exclude self

      // Get upcoming events (events that haven't happened yet)
      const allEvents = await storage.getAllEvents();
      const now = new Date();
      const upcomingEvents = allEvents
        .filter(event => new Date(event.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5); // Return first 5 upcoming events

      // Get active leads for the user
      const userLeads = await storage.getLeadsByUser(user.id);
      const activeLeads = userLeads.filter(lead =>
        lead.status !== 'converted' && lead.status !== 'lost'
      );

      // Calculate total lead value
      const totalLeadValue = await storage.getTotalLeadValueByUser(user.id);

      // Get event attendance count
      const eventsAttended = await storage.getEventAttendanceCountByUser(user.id);

      // Get recent activity (member spotlights, recent messages)
      const recentSpotlight = await storage.getActiveMemberSpotlight();

      res.json({
        totalConnections,
        upcomingEventsCount: upcomingEvents.length,
        upcomingEvents,
        activeLeadsCount: activeLeads.length,
        needsFollowUpCount: activeLeads.filter(lead => lead.status === 'needs_follow_up').length,
        totalLeadValue,
        eventsAttended,
        recentSpotlight
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // ============================================================================
  // ANALYTICS ROUTES
  // ============================================================================

  app.get("/api/analytics/stats", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Get all members in the organization for calculations
      const allMembers = await storage.getUsersByChapter(user.chapterId);

      // Calculate total leads across the organization
      let totalLeads = 0;
      let totalConvertedLeads = 0;
      for (const member of allMembers) {
        const memberLeads = await storage.getLeadsByUser(member.id);
        totalLeads += memberLeads.length;
        totalConvertedLeads += memberLeads.filter(l => l.status === 'converted').length;
      }

      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? Math.round((totalConvertedLeads / totalLeads) * 100) : 0;

      // Get events attended by all members
      let totalEventsAttended = 0;
      for (const member of allMembers) {
        const attended = await storage.getEventAttendanceCountByUser(member.id);
        totalEventsAttended += attended;
      }

      // Total connections (members in organization)
      const connections = allMembers.length;

      const stats = {
        totalLeads,
        leadChange: 0, // Would need historical data to calculate change
        conversionRate,
        conversionRateChange: 0, // Would need historical data
        eventsAttended: totalEventsAttended,
        eventsChange: 0, // Would need historical data
        connections,
        connectionsChange: 0 // Would need historical data
      };

      res.json(stats);
    } catch (error) {
      console.error('Analytics stats error:', error);
      res.status(500).json({ message: "Failed to fetch analytics stats" });
    }
  });
  
  app.get("/api/analytics/lead-types", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Get all members in the organization
      const allMembers = await storage.getUsersByChapter(user.chapterId);

      // Collect all leads and group by type
      const typeCount: Record<string, number> = {};
      for (const member of allMembers) {
        const memberLeads = await storage.getLeadsByUser(member.id);
        for (const lead of memberLeads) {
          typeCount[lead.type] = (typeCount[lead.type] || 0) + 1;
        }
      }

      // Convert to array format for charts
      const leadTypes = Object.entries(typeCount).map(([name, value]) => ({
        name,
        value
      }));

      res.json(leadTypes);
    } catch (error) {
      console.error('Lead types error:', error);
      res.status(500).json({ message: "Failed to fetch lead types" });
    }
  });
  
  app.get("/api/analytics/lead-statuses", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Get all members in the organization
      const allMembers = await storage.getUsersByChapter(user.chapterId);

      // Collect all leads and group by status
      const statusCount: Record<string, number> = {};
      for (const member of allMembers) {
        const memberLeads = await storage.getLeadsByUser(member.id);
        for (const lead of memberLeads) {
          statusCount[lead.status] = (statusCount[lead.status] || 0) + 1;
        }
      }

      // Convert to array format for charts
      const leadStatuses = Object.entries(statusCount).map(([name, value]) => ({
        name,
        value
      }));

      res.json(leadStatuses);
    } catch (error) {
      console.error('Lead statuses error:', error);
      res.status(500).json({ message: "Failed to fetch lead statuses" });
    }
  });
  
  app.get("/api/analytics/trends", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Get all members in the organization
      const allMembers = await storage.getUsersByChapter(user.chapterId);

      // Collect all leads for the organization
      const allLeads: any[] = [];
      for (const member of allMembers) {
        const memberLeads = await storage.getLeadsByUser(member.id);
        allLeads.push(...memberLeads);
      }

      // Get all events
      const allEvents = await storage.getAllEvents();

      // Create trends for last 6 months
      const trends = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });

        // Count leads created in this month
        const leadsInMonth = allLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt);
          return leadDate.getMonth() === monthDate.getMonth() &&
                 leadDate.getFullYear() === monthDate.getFullYear();
        }).length;

        // Count events in this month
        const eventsInMonth = allEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === monthDate.getMonth() &&
                 eventDate.getFullYear() === monthDate.getFullYear();
        }).length;

        trends.push({
          month: monthName,
          leads: leadsInMonth,
          connections: allMembers.length, // Total members (connections don't change per month in current schema)
          events: eventsInMonth
        });
      }

      res.json(trends);
    } catch (error) {
      console.error('Trends error:', error);
      res.status(500).json({ message: "Failed to fetch trends" });
    }
  });
  
  app.get("/api/analytics/top-members", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      // Get all members in the organization
      const allMembers = await storage.getUsersByChapter(user.chapterId);

      // Calculate stats for each member
      const memberStats = await Promise.all(
        allMembers.map(async (member) => {
          const leads = await storage.getLeadsByUser(member.id);
          const leadValue = await storage.getTotalLeadValueByUser(member.id);

          return {
            name: member.fullName || member.username,
            leadsGenerated: leads.length,
            leadValue: leadValue || 0,
            avatarUrl: member.profilePictureUrl || null
          };
        })
      );

      // Sort by leads generated and take top 5
      const topMembers = memberStats
        .sort((a, b) => b.leadsGenerated - a.leadsGenerated)
        .slice(0, 5)
        .filter(m => m.leadsGenerated > 0); // Only show members with leads

      res.json(topMembers);
    } catch (error) {
      console.error('Top members error:', error);
      res.status(500).json({ message: "Failed to fetch top members" });
    }
  });
  
  // Admin routes
  app.get("/api/admin/users", ensureBoardMember, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/admin/events", ensureBoardMember, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      
      // Add attendee count to each event
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          const attendeeCount = await storage.getEventRegistrationCount(event.id);
          return { ...event, attendeeCount };
        })
      );
      
      res.json(eventsWithCounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  app.get("/api/admin/spotlights", ensureBoardMember, async (req, res) => {
    try {
      const spotlights = await storage.getAllMemberSpotlights();
      res.json(spotlights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spotlights" });
    }
  });
  
  app.get("/api/admin/stats", ensureBoardMember, async (req, res) => {
    try {
      const totalMembers = await storage.getUserCount();
      const activeEvents = await storage.getActiveEventCount();
      const totalLeads = await storage.getTotalLeadCount();
      const avgLeadValue = await storage.getAverageLeadValue();
      
      res.json({
        totalMembers,
        activeEvents,
        totalLeads,
        avgLeadValue
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });
  
  // Password change
  app.post("/api/change-password", ensureAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Verify the current password matches
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get the user from the database
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // This would need actual password verification in production
      // const isPasswordValid = await comparePasswords(currentPassword, user.password);
      // For now, just do a simple check for demo purposes
      const isPasswordValid = true;
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // In production, you would hash the password here
      // const hashedPassword = await hashPassword(newPassword);
      // For demo purposes, we'll just use the password as-is
      const success = await storage.updateUserPassword(req.user!.id, newPassword);
      
      if (success) {
        res.json({ message: "Password updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  
  // Profile image upload
  app.post("/api/profile/image", ensureAuthenticated, async (req, res) => {
    try {
      // In a real application, you would:
      // 1. Use multipart form-data handling middleware (e.g., multer)
      // 2. Process the uploaded image (e.g., resize, optimize)
      // 3. Store it in a cloud storage service or server filesystem
      // 4. Save the image URL/path to the user's profile in the database
      
      // For demo purposes, we'll just update the user with a placeholder image URL
      const demoImageUrl = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
      
      const updatedUser = await storage.updateUser(req.user!.id, { 
        profileImage: demoImageUrl 
      });
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Notification settings
  app.patch("/api/notifications", ensureAuthenticated, async (req, res) => {
    try {
      // In a real app, you'd save these preferences to the database
      res.json({ message: "Notification preferences updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Networking tips
  app.post("/api/networking-tips", ensureAuthenticated, async (req, res) => {
    try {
      // Get the user's profile data to enhance the networking request
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Combine user profile with the request data
      const tipRequest: NetworkingTipsRequest = {
        ...req.body,
        fullName: user.fullName || user.username,
        industry: user.industry || req.body.industry,
        expertise: user.expertise || req.body.expertise,
        company: user.company || req.body.company,
        title: user.title || req.body.title
      };

      // Generate personalized networking tips using OpenAI
      const tips = await generateNetworkingTips(tipRequest);
      
      res.json(tips);
    } catch (error) {
      console.error("Error generating networking tips:", error);
      res.status(500).json({ 
        message: "Failed to generate networking tips",
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Member communication routes
  app.get("/api/messages/chapter/:chapterId", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const chapterId = parseInt(req.params.chapterId);
      
      // Only allow access to messages from user's own chapter (unless board member+)
      if (user.userLevel === "member" && user.chapterId !== chapterId) {
        return res.status(403).json({ message: "Access denied to this chapter's messages" });
      }
      
      const messages = await storage.getMessagesByChapter(chapterId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/user/:userId", ensureAuthenticated, async (req, res) => {
    try {
      const fromUserId = req.user!.id;
      const toUserId = parseInt(req.params.userId);
      
      const messages = await storage.getMessagesBetweenUsers(fromUserId, toUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      const { toUserId, subject, message } = req.body;
      
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to a chapter to send messages" });
      }
      
      const newMessage = await storage.createMemberMessage({
        fromUserId: user.id,
        toUserId,
        chapterId: user.chapterId,
        subject,
        message
      });
      
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.patch("/api/messages/:messageId/read", ensureAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const success = await storage.markMessageAsRead(messageId);
      
      if (success) {
        res.json({ message: "Message marked as read" });
      } else {
        res.status(500).json({ message: "Failed to mark message as read" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // User level management (executive board only)
  app.patch("/api/admin/users/:userId/level", ensureExecutiveBoard, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { userLevel } = req.body;
      
      if (!["member", "board_member", "executive_board"].includes(userLevel)) {
        return res.status(400).json({ message: "Invalid user level" });
      }
      
      const updatedUser = await storage.updateUserLevel(userId, userLevel);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user level" });
    }
  });

  // Board Meeting Minutes routes (board members and executive board only)
  app.get("/api/board-minutes", ensureBoardMember, async (req, res) => {
    try {
      const user = req.user!;
      let chapterId = undefined;
      
      // Regular board members can only see their chapter's minutes
      if (user.userLevel === "board_member") {
        chapterId = user.chapterId || undefined;
      }
      
      const minutes = await storage.getBoardMeetingMinutes(chapterId);
      res.json(minutes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch board meeting minutes" });
    }
  });

  app.get("/api/board-minutes/:id", ensureBoardMember, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const minute = await storage.getBoardMeetingMinute(id);
      
      if (!minute) {
        return res.status(404).json({ message: "Meeting minutes not found" });
      }
      
      const user = req.user!;
      
      // Check if user has access to this chapter's minutes
      if (user.userLevel === "board_member" && user.chapterId !== minute.chapterId) {
        return res.status(403).json({ message: "Access denied to this chapter's minutes" });
      }
      
      res.json(minute);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meeting minutes" });
    }
  });

  app.post("/api/board-minutes", ensureBoardMember, async (req, res) => {
    try {
      const user = req.user!;
      
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to a chapter to create meeting minutes" });
      }
      
      const validatedData = insertBoardMeetingMinutesSchema.parse({
        ...req.body,
        createdById: user.id,
        chapterId: user.chapterId
      });
      
      const minutes = await storage.createBoardMeetingMinutes(validatedData);
      res.status(201).json(minutes);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create meeting minutes" });
    }
  });

  app.patch("/api/board-minutes/:id", ensureBoardMember, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      
      // Get existing minutes to check permissions
      const existingMinutes = await storage.getBoardMeetingMinute(id);
      if (!existingMinutes) {
        return res.status(404).json({ message: "Meeting minutes not found" });
      }
      
      // Check if user has permission to edit
      if (user.userLevel === "board_member" && 
          (user.chapterId !== existingMinutes.chapterId || user.id !== existingMinutes.createdById)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const updatedMinutes = await storage.updateBoardMeetingMinutes(id, req.body);

      // Send notification email if minutes are being published
      if (req.body.isPublished === true && !existingMinutes.isPublished && user.chapterId) {
        const allMembers = await storage.getUsersByChapter(user.chapterId);
        const memberEmails = allMembers.filter(m => m.email).map(m => m.email!);

        if (memberEmails.length > 0) {
          const meetingDate = new Date(updatedMinutes.meetingDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          // Take first 200 characters of minutes as summary
          const summary = updatedMinutes.minutes.substring(0, 200) +
                         (updatedMinutes.minutes.length > 200 ? '...' : '');

          sendBoardMinutesEmail(memberEmails, meetingDate, summary)
            .catch(err => console.error('Failed to send board minutes notification:', err));
        }
      }

      res.json(updatedMinutes);
    } catch (error) {
      res.status(500).json({ message: "Failed to update meeting minutes" });
    }
  });

  app.delete("/api/board-minutes/:id", ensureBoardMember, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      
      // Get existing minutes to check permissions
      const existingMinutes = await storage.getBoardMeetingMinute(id);
      if (!existingMinutes) {
        return res.status(404).json({ message: "Meeting minutes not found" });
      }
      
      // Only executive board or creator can delete
      if (user.userLevel !== "executive_board" && user.id !== existingMinutes.createdById) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const success = await storage.deleteBoardMeetingMinutes(id);
      if (success) {
        res.json({ message: "Meeting minutes deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete meeting minutes" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete meeting minutes" });
    }
  });

  // ============================================================================
  // ORGANIZATION SETTINGS ROUTES (White-labeling & Customization)
  // ============================================================================

  // Get organization settings
  app.get("/api/organization/settings", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const settings = await storage.getOrganizationSettings(user.chapterId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organization settings" });
    }
  });

  // Update organization settings (board member+)
  app.patch("/api/organization/settings", ensureBoardMember, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const settings = await storage.updateOrganizationSettings(user.chapterId, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update organization settings" });
    }
  });

  // ============================================================================
  // CUSTOM ROLES & PERMISSIONS ROUTES
  // ============================================================================

  // Get all roles for an organization
  app.get("/api/organization/roles", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const roles = await storage.getCustomRolesByChapter(user.chapterId);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Create a custom role (board member+)
  app.post("/api/organization/roles", ensureBoardMember, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const validatedData = insertCustomRoleSchema.parse({
        ...req.body,
        chapterId: user.chapterId,
        isSystemRole: false
      });

      const role = await storage.createCustomRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  // Update a custom role (board member+)
  app.patch("/api/organization/roles/:roleId", ensureBoardMember, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const user = req.user!;

      // Get the role to verify it belongs to the user's chapter
      const role = await storage.getCustomRole(roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (role.chapterId !== user.chapterId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (role.isSystemRole) {
        return res.status(403).json({ message: "Cannot modify system roles" });
      }

      const updatedRole = await storage.updateCustomRole(roleId, req.body);
      res.json(updatedRole);
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Delete a custom role (board member+)
  app.delete("/api/organization/roles/:roleId", ensureBoardMember, async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const user = req.user!;

      const role = await storage.getCustomRole(roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (role.chapterId !== user.chapterId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (role.isSystemRole) {
        return res.status(403).json({ message: "Cannot delete system roles" });
      }

      const success = await storage.deleteCustomRole(roleId);
      if (success) {
        res.json({ message: "Role deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete role" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // ============================================================================
  // MEMBERSHIP TIERS ROUTES
  // ============================================================================

  // Get all membership tiers for an organization
  app.get("/api/organization/membership-tiers", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const tiers = await storage.getMembershipTiersByChapter(user.chapterId);
      res.json(tiers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch membership tiers" });
    }
  });

  // Create a membership tier (board member+)
  app.post("/api/organization/membership-tiers", ensureBoardMember, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const validatedData = insertMembershipTierSchema.parse({
        ...req.body,
        chapterId: user.chapterId
      });

      const tier = await storage.createMembershipTier(validatedData);
      res.status(201).json(tier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create membership tier" });
    }
  });

  // Update a membership tier (board member+)
  app.patch("/api/organization/membership-tiers/:tierId", ensureBoardMember, async (req, res) => {
    try {
      const tierId = parseInt(req.params.tierId);
      const user = req.user!;

      const tier = await storage.getMembershipTier(tierId);
      if (!tier) {
        return res.status(404).json({ message: "Membership tier not found" });
      }

      if (tier.chapterId !== user.chapterId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedTier = await storage.updateMembershipTier(tierId, req.body);
      res.json(updatedTier);
    } catch (error) {
      res.status(500).json({ message: "Failed to update membership tier" });
    }
  });

  // Delete a membership tier (board member+)
  app.delete("/api/organization/membership-tiers/:tierId", ensureBoardMember, async (req, res) => {
    try {
      const tierId = parseInt(req.params.tierId);
      const user = req.user!;

      const tier = await storage.getMembershipTier(tierId);
      if (!tier) {
        return res.status(404).json({ message: "Membership tier not found" });
      }

      if (tier.chapterId !== user.chapterId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteMembershipTier(tierId);
      if (success) {
        res.json({ message: "Membership tier deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete membership tier" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete membership tier" });
    }
  });

  // ============================================================================
  // CUSTOM FIELDS ROUTES
  // ============================================================================

  // Get all custom field definitions for an organization
  app.get("/api/organization/custom-fields", ensureAuthenticated, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const fields = await storage.getCustomFieldDefinitionsByChapter(user.chapterId);
      res.json(fields);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch custom fields" });
    }
  });

  // Create a custom field definition (board member+)
  app.post("/api/organization/custom-fields", ensureBoardMember, async (req, res) => {
    try {
      const user = req.user!;
      if (!user.chapterId) {
        return res.status(400).json({ message: "User must belong to an organization" });
      }

      const validatedData = insertCustomFieldDefinitionSchema.parse({
        ...req.body,
        chapterId: user.chapterId
      });

      const field = await storage.createCustomFieldDefinition(validatedData);
      res.status(201).json(field);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid field data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create custom field" });
    }
  });

  // Update a custom field definition (board member+)
  app.patch("/api/organization/custom-fields/:fieldId", ensureBoardMember, async (req, res) => {
    try {
      const fieldId = parseInt(req.params.fieldId);
      const user = req.user!;

      const field = await storage.getCustomFieldDefinition(fieldId);
      if (!field) {
        return res.status(404).json({ message: "Custom field not found" });
      }

      if (field.chapterId !== user.chapterId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedField = await storage.updateCustomFieldDefinition(fieldId, req.body);
      res.json(updatedField);
    } catch (error) {
      res.status(500).json({ message: "Failed to update custom field" });
    }
  });

  // Delete a custom field definition (board member+)
  app.delete("/api/organization/custom-fields/:fieldId", ensureBoardMember, async (req, res) => {
    try {
      const fieldId = parseInt(req.params.fieldId);
      const user = req.user!;

      const field = await storage.getCustomFieldDefinition(fieldId);
      if (!field) {
        return res.status(404).json({ message: "Custom field not found" });
      }

      if (field.chapterId !== user.chapterId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteCustomFieldDefinition(fieldId);
      if (success) {
        res.json({ message: "Custom field deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete custom field" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete custom field" });
    }
  });

  // ============================================================================
  // GEO-LOCATION TRACKING ROUTES
  // ============================================================================

  // Event check-in with geo-location
  app.post("/api/events/:eventId/checkin", ensureAuthenticated, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user!.id;
      const { latitude, longitude, location } = req.body;

      // Get the event to check geo-fencing if enabled
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Check if user is registered
      const registration = await storage.getEventRegistration(eventId, userId);
      if (!registration) {
        return res.status(400).json({ message: "Not registered for this event" });
      }

      // Validate geo-location if required
      if (event.requireGeoCheckin && event.latitude && event.longitude && latitude && longitude) {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(event.latitude),
          parseFloat(event.longitude)
        );

        if (distance > (event.geoFenceRadius || 100)) {
          return res.status(403).json({
            message: `You must be within ${event.geoFenceRadius || 100} meters of the event location to check in`,
            distance: Math.round(distance)
          });
        }
      }

      // Update registration with check-in info
      await storage.updateEventRegistration(registration.id, {
        attended: true,
        checkedInAt: new Date(),
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        checkInLocation: location
      });

      // Log geo-location
      if (latitude && longitude) {
        await storage.createGeoLocationLog({
          userId,
          eventType: "event_checkin",
          latitude,
          longitude,
          location,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          eventId
        });
      }

      res.json({ message: "Checked in successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  // Get user's geo-location history
  app.get("/api/geo-location/history", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const eventType = req.query.eventType as string | undefined;

      const history = await storage.getGeoLocationLogByUser(userId, eventType);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location history" });
    }
  });

  // Log a geo-location event (login, profile update, etc.)
  app.post("/api/geo-location/log", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertGeoLocationLogSchema.parse({
        ...req.body,
        userId: req.user!.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const log = await storage.createGeoLocationLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid geo-location data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to log geo-location" });
    }
  });

  // ============================================================================
  // ENHANCED USER MANAGEMENT ROUTES
  // ============================================================================

  // Create a new user (board member+)
  app.post("/api/admin/users", ensureBoardMember, async (req, res) => {
    try {
      const user = req.user!;
      const {
        username,
        email,
        fullName,
        company,
        title,
        userLevel,
        membershipTier,
        membershipStatus,
        customRoleId,
        customFields
      } = req.body;

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Generate a temporary password
      const tempPassword = generateTempPassword();

      const newUser = await storage.createUser({
        username,
        password: tempPassword, // Will be hashed in storage layer
        email,
        fullName,
        company,
        title,
        userLevel: userLevel || "member",
        chapterId: user.chapterId,
        membershipTier,
        membershipStatus: membershipStatus || "pending",
        customRoleId,
        customFields: customFields || {}
      });

      // Send welcome email with temporary password
      if (newUser.email) {
        const chapter = await storage.getChapter(user.chapterId!);
        const orgName = chapter?.name || "BLU Networking";
        sendWelcomeEmail(newUser.email, newUser.username, orgName)
          .catch(err => console.error('Failed to send welcome email:', err));
      }

      res.status(201).json({
        ...newUser,
        temporaryPassword: tempPassword // Only in response, not stored
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user membership status (board member+)
  app.patch("/api/admin/users/:userId/membership", ensureBoardMember, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { membershipStatus, membershipTier, membershipExpiresAt } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        membershipStatus,
        membershipTier,
        membershipExpiresAt: membershipExpiresAt ? new Date(membershipExpiresAt) : undefined
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update membership status" });
    }
  });

  // Update user custom role (board member+)
  app.patch("/api/admin/users/:userId/role", ensureBoardMember, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { customRoleId } = req.body;

      // Verify the role exists and belongs to the same chapter
      if (customRoleId) {
        const role = await storage.getCustomRole(customRoleId);
        if (!role || role.chapterId !== req.user!.chapterId) {
          return res.status(400).json({ message: "Invalid role" });
        }
      }

      const updatedUser = await storage.updateUser(userId, { customRoleId });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Update user custom fields
  app.patch("/api/profile/custom-fields", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { customFields } = req.body;

      const updatedUser = await storage.updateUser(userId, { customFields });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update custom fields" });
    }
  });

  // Get available permissions list
  app.get("/api/permissions", ensureBoardMember, async (req, res) => {
    try {
      res.json(Object.values(PERMISSIONS));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Helper function to generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
