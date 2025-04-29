import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Zap, Star, LightbulbIcon, Share2Icon, MessageCircle, MessagesSquare, RefreshCw } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { DashboardLayout } from "@/layouts/dashboard-layout";

// Define the NetworkingTip interface
interface NetworkingTip {
  category: string;
  tip: string;
  reasoning?: string;
}

// Define the NetworkingTipsResponse interface
interface NetworkingTipsResponse {
  tips: NetworkingTip[];
  summary: string;
}

// Form validation schema for the networking tips request
const networkingTipsFormSchema = z.object({
  industry: z.string().optional(),
  expertise: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  goal: z.string().optional(),
  eventType: z.string().optional(),
});

type NetworkingTipsFormValues = z.infer<typeof networkingTipsFormSchema>;

// Category icon mapping
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "conversation_starter":
      return <MessageCircle className="h-5 w-5" />;
    case "follow_up":
      return <Share2Icon className="h-5 w-5" />;
    case "industry_specific":
      return <Zap className="h-5 w-5" />;
    case "networking_strategy":
      return <MessagesSquare className="h-5 w-5" />;
    default:
      return <LightbulbIcon className="h-5 w-5" />;
  }
};

// Category color mapping
const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case "conversation_starter":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "follow_up":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "industry_specific":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "networking_strategy":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

// Format category name for display
const formatCategory = (category: string) => {
  return category
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function NetworkingTipsPage() {
  const { toast } = useToast();
  const [tips, setTips] = useState<NetworkingTipsResponse | null>(null);
  
  // Initialize form
  const form = useForm<NetworkingTipsFormValues>({
    resolver: zodResolver(networkingTipsFormSchema),
    defaultValues: {
      industry: "",
      expertise: "",
      company: "",
      title: "",
      goal: "",
      eventType: ""
    },
  });

  // Mutation for generating networking tips
  const networkingTipsMutation = useMutation({
    mutationFn: async (data: NetworkingTipsFormValues) => {
      const res = await apiRequest("POST", "/api/networking-tips", data);
      return res.json() as Promise<NetworkingTipsResponse>;
    },
    onSuccess: (data: NetworkingTipsResponse) => {
      setTips(data);
      toast({
        title: "Networking tips generated",
        description: "Your personalized networking tips are ready!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate tips",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: NetworkingTipsFormValues) => {
    networkingTipsMutation.mutate(values);
  };

  // Helper function to calculate tip quality stars
  const getTipQualityStars = (tip: NetworkingTip) => {
    // Base quality on tip length and presence of reasoning
    const length = tip.tip.length;
    if (length > 200 && tip.reasoning) return 5;
    if (length > 150 && tip.reasoning) return 4;
    if (length > 100) return 3;
    if (length > 50) return 2;
    return 1;
  };

  return (
    <DashboardLayout title="Personalized Networking Tips">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Generate New Tips</CardTitle>
              <CardDescription>
                Provide information to get personalized networking advice powered by AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Technology, Finance, Healthcare" {...field} />
                        </FormControl>
                        <FormDescription>
                          The industry you work in or are targeting
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expertise"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expertise/Skills</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Project Management, Web Development" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your professional expertise or key skills
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Your job title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Networking Goal</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g. Find a mentor, Expand professional network in fintech, Generate new leads" 
                            {...field} 
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormDescription>
                          What you're hoping to achieve through networking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upcoming Event (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Industry conference, Networking mixer" {...field} />
                        </FormControl>
                        <FormDescription>
                          Type of event you're preparing for
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={networkingTipsMutation.isPending}
                  >
                    {networkingTipsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Tips
                      </>
                    ) : (
                      <>
                        <LightbulbIcon className="mr-2 h-4 w-4" /> Generate Tips
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <div className="lg:col-span-2">
            {networkingTipsMutation.isPending ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Generating personalized networking tips...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                </CardContent>
              </Card>
            ) : tips ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Personalized Networking Strategy</CardTitle>
                    <CardDescription>
                      {tips.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {tips.tips.map((tip, index) => (
                        <div key={index} className="p-4 bg-background rounded-lg border">
                          <div className="flex items-start justify-between space-x-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`rounded-full p-1 ${getCategoryColor(tip.category)}`}>
                                {getCategoryIcon(tip.category)}
                              </span>
                              <Badge variant="outline" className={getCategoryColor(tip.category)}>
                                {formatCategory(tip.category)}
                              </Badge>
                              <div className="flex ml-1">
                                {Array.from({ length: getTipQualityStars(tip) }).map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="mb-2 text-sm leading-relaxed">{tip.tip}</p>
                          {tip.reasoning && (
                            <>
                              <Separator className="my-2" />
                              <p className="text-xs text-muted-foreground italic">
                                <span className="font-semibold">Why this works:</span> {tip.reasoning}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => form.reset()}>
                      Start Fresh
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => networkingTipsMutation.mutate(form.getValues())}
                      disabled={networkingTipsMutation.isPending}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Tips
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <div className="rounded-full bg-primary/10 p-3 mb-4">
                    <LightbulbIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Get Personalized Networking Tips</h3>
                  <p className="text-center text-muted-foreground max-w-md mb-6">
                    Fill out the form to get AI-powered networking advice tailored to your professional profile and goals.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center">
                      <MessageCircle className="h-4 w-4 mr-2 text-primary" />
                      Conversation starters tailored to your industry
                    </li>
                    <li className="flex items-center">
                      <Share2Icon className="h-4 w-4 mr-2 text-primary" />
                      Follow-up strategies that build lasting connections
                    </li>
                    <li className="flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-primary" />
                      Industry-specific networking techniques
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}