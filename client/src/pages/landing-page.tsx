import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, Globe, CalendarDays, MessagesSquare, LightbulbIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().min(1, { message: "Full name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  industry: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function LandingPage() {
  return <PublicLandingPage />;
}

function PublicLandingPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Initialize login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Initialize registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      industry: "",
      company: "",
      title: "",
    },
  });
  
  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoggingIn(true);
      const res = await apiRequest("POST", "/api/login", values);
      const user = await res.json();
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName}!`,
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  // Handle registration form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      setIsRegistering(true);
      // Ensure required fields have values for the API
      const completeValues = {
        ...values,
        company: values.company || "Not specified",
        title: values.title || "Not specified",
        industry: values.industry || null
      };
      
      const res = await apiRequest("POST", "/api/register", completeValues);
      const user = await res.json();
      
      toast({
        title: "Registration successful",
        description: `Welcome to BLU, ${user.fullName}!`,
      });
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-700">BLU Networking</h1>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                The Premier Networking Community in Charlotte
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                Building business connections, fostering relationships, and creating opportunities for professionals in Charlotte and beyond.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-blue-700 hover:bg-blue-800">
                <Link href="#features">Learn More</Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => setActiveTab("register")}>
                Join BLU Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <Card className="w-full shadow-lg border-gray-100">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-gray-900">
                  Join Our Networking Community
                </CardTitle>
                <CardDescription className="text-center">
                  Login to your account or register to become a member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-6 bg-blue-700 hover:bg-blue-800"
                          disabled={isLoggingIn}
                        >
                          {isLoggingIn ? "Logging in..." : "Login"}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center">
                      <p className="text-gray-600 text-sm">
                        Don't have an account?{" "}
                        <button
                          onClick={() => setActiveTab("register")}
                          className="text-blue-700 hover:underline font-medium"
                        >
                          Register now
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="Choose a username" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={registerForm.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Technology, Finance, Healthcare" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your company name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Marketing Director" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full mt-6 bg-blue-700 hover:bg-blue-800"
                          disabled={isRegistering}
                        >
                          {isRegistering ? "Creating account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                    
                    <div className="mt-4 text-center">
                      <p className="text-gray-600 text-sm">
                        Already have an account?{" "}
                        <button
                          onClick={() => setActiveTab("login")}
                          className="text-blue-700 hover:underline font-medium"
                        >
                          Login
                        </button>
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why Join BLU Networking?</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              BLU is the premier networking community in Charlotte, NC and surrounding areas, dedicated to helping business professionals grow through meaningful connections.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Connections</h3>
              <p className="text-gray-600">Connect with like-minded professionals and expand your business network.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CalendarDays className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Exclusive Events</h3>
              <p className="text-gray-600">Access to members-only networking events, workshops, and educational sessions.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Presence</h3>
              <p className="text-gray-600">Active in Charlotte, Lake Norman, Belmont, and surrounding areas with growing chapters.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <LightbulbIcon className="w-8 h-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Networking</h3>
              <p className="text-gray-600">Get personalized networking tips and strategies based on your profile and goals.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What Our Members Say</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-700 font-bold">JD</span>
                </div>
                <div>
                  <h4 className="font-semibold">John Davis</h4>
                  <p className="text-sm text-gray-600">Marketing Director</p>
                </div>
              </div>
              <p className="text-gray-700">
                "BLU has transformed my professional network. The connections I've made have led to 
                multiple business partnerships and opportunities."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-700 font-bold">SJ</span>
                </div>
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-gray-600">Business Owner</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Being part of BLU has helped me grow my business in ways I never imagined. The community is supportive, 
                engaged, and genuinely interested in each other's success."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-700 font-bold">MC</span>
                </div>
                <div>
                  <h4 className="font-semibold">Michael Chen</h4>
                  <p className="text-sm text-gray-600">Financial Advisor</p>
                </div>
              </div>
              <p className="text-gray-700">
                "The quality of connections at BLU is exceptional. I've met professionals who have 
                become not just business contacts but also friends and mentors."
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Elevate Your Professional Network?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Join BLU Networking today and connect with Charlotte's most engaged business professionals.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-700 hover:bg-blue-50"
            onClick={() => setActiveTab("register")}
          >
            Join BLU Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold mb-4">BLU Networking</h3>
              <p className="text-gray-400 max-w-md">
                The premier networking community in Charlotte, NC. Building connections that last.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Locations</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>Charlotte, NC</li>
                  <li>Lake Norman Area</li>
                  <li>Belmont, NC</li>
                  <li>Cornelius, NC</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><button onClick={() => setActiveTab("login")}>Login</button></li>
                  <li><button onClick={() => setActiveTab("register")}>Register</button></li>
                  <li><Link href="#features">Features</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>info@blunetworking.com</li>
                  <li>Charlotte, NC</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} BLU Networking Group. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}