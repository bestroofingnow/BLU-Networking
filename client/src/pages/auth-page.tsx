import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BookOpen, Users, BarChart3 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "BLU",
    title: "Member",
  });
  
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm({
      ...registerForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("POST", "/api/login", loginForm);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to login");
      }
      
      const user = await response.json();
      console.log("Logged in successfully:", user);
      window.location.href = "/"; // This will force a reload and take us to the dashboard
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }
    
    try {
      const { confirmPassword, ...userData } = registerForm;
      const response = await apiRequest("POST", "/api/register", userData);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to register");
      }
      
      const user = await response.json();
      console.log("Registered successfully:", user);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-primary-500 rounded flex items-center justify-center text-white font-bold text-xl">
                BLU
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Welcome to BLU</CardTitle>
            <CardDescription className="text-center">
              Business Leaders United Networking Platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">Username</label>
                    <Input 
                      id="username"
                      name="username"
                      value={loginForm.username}
                      onChange={handleLoginChange}
                      placeholder="Enter your username" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <Input 
                      id="password"
                      name="password"
                      type="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      placeholder="Enter your password" 
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                  
                  {error && (
                    <div className="text-red-500 text-sm mt-2">
                      {error}
                    </div>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="reg-username" className="text-sm font-medium">Username</label>
                    <Input 
                      id="reg-username"
                      name="username"
                      value={registerForm.username}
                      onChange={handleRegisterChange}
                      placeholder="Create a username" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                    <Input 
                      id="fullName"
                      name="fullName"
                      value={registerForm.fullName}
                      onChange={handleRegisterChange}
                      placeholder="Enter your full name" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      placeholder="Enter your email" 
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-sm font-medium">Company</label>
                      <Input 
                        id="company"
                        name="company"
                        value={registerForm.company}
                        onChange={handleRegisterChange}
                        placeholder="Your company" 
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium">Job Title</label>
                      <Input 
                        id="title"
                        name="title"
                        value={registerForm.title}
                        onChange={handleRegisterChange}
                        placeholder="Your title" 
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="reg-password" className="text-sm font-medium">Password</label>
                    <Input 
                      id="reg-password"
                      name="password"
                      type="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      placeholder="Create a password" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                    <Input 
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="Confirm your password" 
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  
                  {error && (
                    <div className="text-red-500 text-sm mt-2">
                      {error}
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to BLU's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
      
      <div className="hidden lg:flex flex-col justify-center p-10 bg-primary-500 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6">BLU Networking Platform</h1>
          <p className="text-xl mb-6">Connect, Share, and Grow with the Premier Business Networking Platform</p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4 mt-1">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Event Management</h3>
                <p>Register for networking events and track attendance</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4 mt-1">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Lead Tracking</h3>
                <p>Record and follow up on valuable business connections</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4 mt-1">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Member Directory</h3>
                <p>Connect with other members and expand your network</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-white/10 p-2 mr-4 mt-1">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                <p>Track your networking performance and ROI</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
