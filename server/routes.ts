import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEventSchema, insertEventRegistrationSchema, insertLeadSchema, insertMemberSpotlightSchema } from "@shared/schema";
import { z } from "zod";
import { generateNetworkingTips, NetworkingTipsRequest } from "./openai";

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
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chapters" });
    }
  });

  app.post("/api/chapters", ensureExecutiveBoard, async (req, res) => {
    try {
      const chapter = await storage.createChapter(req.body);
      res.status(201).json(chapter);
    } catch (error) {
      res.status(500).json({ message: "Failed to create chapter" });
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
      res.status(201).json(spotlight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid spotlight data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create member spotlight" });
      }
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", ensureAuthenticated, async (req, res) => {
    try {
      const period = req.query.period || "monthly";
      
      // Example stats data - in a real app, this would come from the database
      const stats = {
        totalLeads: 43,
        leadChange: 12,
        conversionRate: 23,
        conversionRateChange: 5,
        eventsAttended: 8,
        eventsChange: -10,
        connections: 127,
        connectionsChange: 15
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics stats" });
    }
  });
  
  app.get("/api/analytics/lead-types", ensureAuthenticated, async (req, res) => {
    try {
      const period = req.query.period || "monthly";
      
      // Example lead type data
      const leadTypes = [
        { name: "Referral", value: 18 },
        { name: "Event Connection", value: 12 },
        { name: "Direct Outreach", value: 8 },
        { name: "Online", value: 5 }
      ];
      
      res.json(leadTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead types" });
    }
  });
  
  app.get("/api/analytics/lead-statuses", ensureAuthenticated, async (req, res) => {
    try {
      const period = req.query.period || "monthly";
      
      // Example lead status data
      const leadStatuses = [
        { name: "Initial Contact", value: 15 },
        { name: "Follow-up Scheduled", value: 10 },
        { name: "Needs Follow-up", value: 8 },
        { name: "Converted", value: 7 },
        { name: "Lost", value: 3 }
      ];
      
      res.json(leadStatuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead statuses" });
    }
  });
  
  app.get("/api/analytics/trends", ensureAuthenticated, async (req, res) => {
    try {
      const period = req.query.period || "monthly";
      
      // Example trends data
      const trends = [
        { month: "Jan", leads: 5, connections: 12, events: 1 },
        { month: "Feb", leads: 7, connections: 15, events: 2 },
        { month: "Mar", leads: 10, connections: 20, events: 1 },
        { month: "Apr", leads: 8, connections: 18, events: 2 },
        { month: "May", leads: 12, connections: 25, events: 1 },
        { month: "Jun", leads: 15, connections: 30, events: 2 }
      ];
      
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trends" });
    }
  });
  
  app.get("/api/analytics/top-members", ensureAuthenticated, async (req, res) => {
    try {
      const period = req.query.period || "monthly";
      
      // Example top members data
      const topMembers = [
        { 
          name: "Sarah Johnson", 
          leadsGenerated: 15, 
          leadValue: 8750, 
          avatarUrl: null 
        },
        { 
          name: "David Washington", 
          leadsGenerated: 12, 
          leadValue: 6500, 
          avatarUrl: null
        },
        { 
          name: "Michael Chen", 
          leadsGenerated: 10, 
          leadValue: 5200, 
          avatarUrl: null
        }
      ];
      
      res.json(topMembers);
    } catch (error) {
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

  const httpServer = createServer(app);

  return httpServer;
}
