import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpenText, Filter, Plus, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertLeadSchema } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const newLeadSchema = insertLeadSchema.pick({
  name: true,
  company: true,
  email: true,
  phoneNumber: true,
  notes: true,
  type: true,
  status: true,
  value: true,
  followUpDate: true
}).extend({
  value: z.coerce.number().min(0, "Value cannot be negative"),
  followUpDate: z.string().optional()
});

type NewLeadFormValues = z.infer<typeof newLeadSchema>;

export default function LeadsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddLeadDialog, setShowAddLeadDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  const { data: leads, isLoading } = useQuery({
    queryKey: ["/api/leads"],
  });
  
  const newLeadForm = useForm<NewLeadFormValues>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phoneNumber: "",
      notes: "",
      type: "Referral",
      status: "Initial Contact",
      value: 0,
      followUpDate: new Date().toISOString().slice(0, 10)
    }
  });
  
  const addLeadMutation = useMutation({
    mutationFn: async (data: NewLeadFormValues & { userId: number }) => {
      return await apiRequest("POST", "/api/leads", data);
    },
    onSuccess: () => {
      toast({
        title: "Lead Added",
        description: "Your new lead has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setShowAddLeadDialog(false);
      newLeadForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add lead: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmitLead = (values: NewLeadFormValues) => {
    addLeadMutation.mutate({
      ...values,
      userId: user?.id || 0
    });
  };
  
  // Filter leads
  const filteredLeads = leads
    ? leads.filter(lead => {
        // Filter by search query
        if (searchQuery && !(
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()))
        )) {
          return false;
        }
        
        // Filter by type
        if (typeFilter && lead.type !== typeFilter) {
          return false;
        }
        
        // Filter by status
        if (statusFilter && lead.status !== statusFilter) {
          return false;
        }
        
        return true;
      })
    : [];
  
  // Get unique lead types and statuses for filters
  const leadTypes = leads
    ? Array.from(new Set(leads.map(lead => lead.type)))
    : [];
    
  const leadStatuses = leads
    ? Array.from(new Set(leads.map(lead => lead.status)))
    : [];
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getBadgeVariantForType = (type) => {
    switch (type) {
      case 'Referral': return 'blue';
      case 'Event Connection': return 'purple';
      case 'Direct Outreach': return 'orange';
      case 'Online': return 'cyan';
      default: return 'default';
    }
  };
  
  const getBadgeVariantForStatus = (status) => {
    switch (status) {
      case 'Initial Contact': return 'yellow';
      case 'Follow-up Scheduled': return 'green';
      case 'Needs Follow-up': return 'red';
      case 'Converted': return 'blue';
      case 'Lost': return 'gray';
      default: return 'default';
    }
  };
  
  return (
    <DashboardLayout title="Lead Management">
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Your Business Leads</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input 
                    placeholder="Search leads..." 
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Lead Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {leadTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {leadStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button onClick={() => setShowAddLeadDialog(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-neutral-100 rounded mb-4"></div>
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-16 bg-neutral-50 rounded mb-2"></div>
                ))}
              </div>
            ) : filteredLeads.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Follow-up Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map(lead => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-9 w-9 mr-3">
                              <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-sm text-muted-foreground">{lead.company}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariantForType(lead.type)} className="px-2 py-1 text-xs">
                            {lead.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariantForStatus(lead.status)} className="px-2 py-1 text-xs">
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${lead.value || 0}</TableCell>
                        <TableCell>
                          {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState 
                icon={<BookOpenText className="h-12 w-12 text-muted-foreground" />}
                title="No leads found"
                description={searchQuery || typeFilter || statusFilter 
                  ? "Try adjusting your search or filters"
                  : "You haven't added any leads yet. Get started by adding your first lead."
                }
                action={
                  !searchQuery && !typeFilter && !statusFilter ? (
                    <Button onClick={() => setShowAddLeadDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add Your First Lead
                    </Button>
                  ) : null
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add Lead Dialog */}
      <Dialog open={showAddLeadDialog} onOpenChange={setShowAddLeadDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter the details of your new business lead.
            </DialogDescription>
          </DialogHeader>
          <Form {...newLeadForm}>
            <form onSubmit={newLeadForm.handleSubmit(onSubmitLead)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newLeadForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newLeadForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newLeadForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newLeadForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newLeadForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lead type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Referral">Referral</SelectItem>
                          <SelectItem value="Event Connection">Event Connection</SelectItem>
                          <SelectItem value="Direct Outreach">Direct Outreach</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newLeadForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                          <SelectItem value="Follow-up Scheduled">Follow-up Scheduled</SelectItem>
                          <SelectItem value="Needs Follow-up">Needs Follow-up</SelectItem>
                          <SelectItem value="Converted">Converted</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={newLeadForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potential Value ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={newLeadForm.control}
                  name="followUpDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={newLeadForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this lead" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={addLeadMutation.isPending}
                >
                  {addLeadMutation.isPending ? "Adding..." : "Add Lead"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Lead Details Dialog */}
      {selectedLead && (
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarFallback>{getInitials(selectedLead.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{selectedLead.name}</h2>
                  <p className="text-muted-foreground">{selectedLead.company}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Status</p>
                  <Badge variant={getBadgeVariantForStatus(selectedLead.status)} className="mt-1">
                    {selectedLead.status}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-neutral-500">Type</p>
                  <Badge variant={getBadgeVariantForType(selectedLead.type)} className="mt-1">
                    {selectedLead.type}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-neutral-500">Email</p>
                  <p className="text-sm">{selectedLead.email || "Not provided"}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-neutral-500">Phone</p>
                  <p className="text-sm">{selectedLead.phoneNumber || "Not provided"}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-neutral-500">Potential Value</p>
                  <p className="text-sm">${selectedLead.value || 0}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-neutral-500">Follow-up Date</p>
                  <p className="text-sm">
                    {selectedLead.followUpDate 
                      ? new Date(selectedLead.followUpDate).toLocaleDateString() 
                      : "Not scheduled"}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-500">Notes</p>
                <p className="text-sm mt-1">{selectedLead.notes || "No notes added"}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-500">Created</p>
                <p className="text-sm">
                  {new Date(selectedLead.createdAt).toLocaleDateString()} at 
                  {" " + new Date(selectedLead.createdAt).toLocaleTimeString()}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">Edit Lead</Button>
                <Button>Mark as Converted</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}

function EmptyState({ icon, title, description, action = null }) {
  return (
    <div className="text-center py-16 flex flex-col items-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-neutral-800 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  );
}
