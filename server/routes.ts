import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEventSchema, insertEventRegistrationSchema, insertLeadSchema, insertMemberSpotlightSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Ensure user is authenticated
  const ensureAuthenticated = (req: Express.Request, res: Express.Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Ensure user is admin
  const ensureAdmin = (req: Express.Request, res: Express.Response, next: Function) => {
    if (req.isAuthenticated() && req.user?.isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // User routes
  app.get("/api/members", ensureAuthenticated, async (req, res) => {
    try {
      const members = await storage.getAllUsers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
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
  
  app.post("/api/events", ensureAdmin, async (req, res) => {
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
  
  app.post("/api/member-spotlights", ensureAdmin, async (req, res) => {
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
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.get("/api/admin/events", ensureAdmin, async (req, res) => {
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
  
  app.get("/api/admin/spotlights", ensureAdmin, async (req, res) => {
    try {
      const spotlights = await storage.getAllMemberSpotlights();
      res.json(spotlights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spotlights" });
    }
  });
  
  app.get("/api/admin/stats", ensureAdmin, async (req, res) => {
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
  
  // Notification settings
  app.patch("/api/notifications", ensureAuthenticated, async (req, res) => {
    try {
      // In a real app, you'd save these preferences to the database
      res.json({ message: "Notification preferences updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
