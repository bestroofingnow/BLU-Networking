import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Palette, ToggleLeft, Shield, DollarSign, FormInput, Loader2, Plus, Edit, Trash2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERMISSIONS } from "@shared/schema";

export default function OrganizationSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/organization/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/organization/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Organization settings have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Organization Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Organization Settings">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Organization Settings</h2>
        <p className="text-neutral-600 mt-1">
          Manage your organization's branding, features, and configuration
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="features">
            <ToggleLeft className="mr-2 h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="tiers">
            <DollarSign className="mr-2 h-4 w-4" />
            Membership
          </TabsTrigger>
          <TabsTrigger value="fields">
            <FormInput className="mr-2 h-4 w-4" />
            Custom Fields
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings settings={settings} updateMutation={updateSettingsMutation} />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettings settings={settings} updateMutation={updateSettingsMutation} />
        </TabsContent>

        <TabsContent value="features">
          <FeaturesSettings settings={settings} updateMutation={updateSettingsMutation} />
        </TabsContent>

        <TabsContent value="roles">
          <CustomRolesSettings />
        </TabsContent>

        <TabsContent value="tiers">
          <MembershipTiersSettings />
        </TabsContent>

        <TabsContent value="fields">
          <CustomFieldsSettings />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function GeneralSettings({ settings, updateMutation }: any) {
  const [formData, setFormData] = useState({
    contactEmail: settings?.contactEmail || "",
    contactPhone: settings?.contactPhone || "",
    websiteUrl: settings?.websiteUrl || "",
    welcomeMessage: settings?.welcomeMessage || "",
    timezone: settings?.timezone || "America/New_York",
    dateFormat: settings?.dateFormat || "MM/DD/YYYY",
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure basic organization information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="contact@example.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Textarea
            id="welcomeMessage"
            placeholder="Welcome to our organization! We're glad to have you here."
            rows={3}
            value={formData.welcomeMessage}
            onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BrandingSettings({ settings, updateMutation }: any) {
  const [formData, setFormData] = useState({
    logoUrl: settings?.logoUrl || "",
    primaryColor: settings?.primaryColor || "#3b82f6",
    secondaryColor: settings?.secondaryColor || "#10b981",
    accentColor: settings?.accentColor || "#f59e0b",
    customDomain: settings?.customDomain || "",
    subdomain: settings?.subdomain || "",
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding & Appearance</CardTitle>
        <CardDescription>
          Customize your organization's visual identity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            placeholder="https://example.com/logo.png"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            Enter the URL of your organization's logo (recommended: 200x60px)
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                placeholder="#10b981"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accentColor"
                type="color"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                placeholder="#f59e0b"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customDomain">Custom Domain</Label>
            <Input
              id="customDomain"
              type="text"
              placeholder="networking.yourorg.com"
              value={formData.customDomain}
              onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <div className="flex">
              <Input
                id="subdomain"
                type="text"
                placeholder="yourorg"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                className="rounded-r-none"
              />
              <span className="flex items-center px-3 bg-neutral-100 border border-l-0 rounded-r-md text-sm text-neutral-600">
                .blunetwork.app
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturesSettings({ settings, updateMutation }: any) {
  const [features, setFeatures] = useState(
    settings?.featuresEnabled || {
      events: true,
      leads: true,
      messaging: true,
      memberDirectory: true,
      boardMinutes: true,
      memberSpotlights: true,
      payments: false,
      emailCampaigns: false,
      customForms: false,
    }
  );

  const handleToggle = (feature: string) => {
    const newFeatures = { ...features, [feature]: !features[feature] };
    setFeatures(newFeatures);
    updateMutation.mutate({ featuresEnabled: newFeatures });
  };

  const featuresList = [
    { key: "events", label: "Events Management", description: "Create and manage networking events" },
    { key: "leads", label: "Leads Tracking", description: "Track business leads and opportunities" },
    { key: "messaging", label: "Member Messaging", description: "Direct messaging between members" },
    { key: "memberDirectory", label: "Member Directory", description: "Browse and search member profiles" },
    { key: "boardMinutes", label: "Board Minutes", description: "Document board meeting minutes" },
    { key: "memberSpotlights", label: "Member Spotlights", description: "Feature and highlight members" },
    { key: "payments", label: "Payment Processing", description: "Accept membership dues and event payments" },
    { key: "emailCampaigns", label: "Email Campaigns", description: "Send bulk emails to members" },
    { key: "customForms", label: "Custom Forms", description: "Create custom registration forms" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features Management</CardTitle>
        <CardDescription>
          Enable or disable features for your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {featuresList.map((feature) => (
          <div key={feature.key} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">{feature.label}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
            <Switch
              checked={features[feature.key]}
              onCheckedChange={() => handleToggle(feature.key)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CustomRolesSettings() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ["/api/organization/roles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/organization/roles", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Role created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/roles"] });
      setShowDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => apiRequest("PATCH", `/api/organization/roles/${id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/roles"] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/organization/roles/${id}`, {}),
    onSuccess: () => {
      toast({ title: "Success", description: "Role deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/roles"] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", permissions: [] });
    setEditingRole(null);
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions || [],
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const permissionGroups = {
    "Member Management": [PERMISSIONS.VIEW_MEMBERS, PERMISSIONS.EDIT_MEMBERS, PERMISSIONS.DELETE_MEMBERS, PERMISSIONS.APPROVE_MEMBERS],
    "Event Management": [PERMISSIONS.VIEW_EVENTS, PERMISSIONS.CREATE_EVENTS, PERMISSIONS.EDIT_EVENTS, PERMISSIONS.DELETE_EVENTS],
    "Communication": [PERMISSIONS.SEND_MESSAGES, PERMISSIONS.SEND_BULK_EMAILS],
    "Leads": [PERMISSIONS.VIEW_OWN_LEADS, PERMISSIONS.VIEW_ALL_LEADS],
    "Organization": [PERMISSIONS.MANAGE_SETTINGS, PERMISSIONS.MANAGE_ROLES, PERMISSIONS.MANAGE_TIERS],
    "Board Features": [PERMISSIONS.VIEW_BOARD_MINUTES, PERMISSIONS.CREATE_BOARD_MINUTES],
    "Analytics": [PERMISSIONS.VIEW_ANALYTICS, PERMISSIONS.VIEW_FINANCIAL_REPORTS],
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Custom Roles & Permissions</CardTitle>
            <CardDescription>Create and manage custom roles with specific permissions</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : roles && roles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role: any) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role.permissions?.length || 0} permissions</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {!role.isSystemRole && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(role.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">No custom roles yet. Create one to get started.</p>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Role" : "Create New Role"}</DialogTitle>
              <DialogDescription>Configure role name, description, and permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Event Coordinator"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Manages events and attendee coordination"
                  rows={2}
                />
              </div>
              <div className="space-y-4">
                <Label>Permissions</Label>
                {Object.entries(permissionGroups).map(([group, perms]) => (
                  <div key={group} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{group}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {perms.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission}
                            checked={formData.permissions.includes(permission)}
                            onCheckedChange={() => togglePermission(permission)}
                          />
                          <label htmlFor={permission} className="text-sm cursor-pointer">
                            {permission.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRole ? "Update Role" : "Create Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MembershipTiersSettings() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billingPeriod: "annually" as "monthly" | "quarterly" | "annually" | "lifetime",
    features: [] as string[],
    maxMembers: "",
    isActive: true,
  });

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["/api/organization/membership-tiers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/organization/membership-tiers", {
      ...data,
      price: Math.round(parseFloat(data.price) * 100), // Convert to cents
      maxMembers: data.maxMembers ? parseInt(data.maxMembers) : null,
    }),
    onSuccess: () => {
      toast({ title: "Success", description: "Membership tier created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/membership-tiers"] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => apiRequest("PATCH", `/api/organization/membership-tiers/${id}`, {
      ...data,
      price: Math.round(parseFloat(data.price) * 100),
      maxMembers: data.maxMembers ? parseInt(data.maxMembers) : null,
    }),
    onSuccess: () => {
      toast({ title: "Success", description: "Membership tier updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/membership-tiers"] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/organization/membership-tiers/${id}`, {}),
    onSuccess: () => {
      toast({ title: "Success", description: "Membership tier deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/membership-tiers"] });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", billingPeriod: "annually", features: [], maxMembers: "", isActive: true });
    setEditingTier(null);
  };

  const handleEdit = (tier: any) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description || "",
      price: (tier.price / 100).toString(),
      billingPeriod: tier.billingPeriod,
      features: tier.features || [],
      maxMembers: tier.maxMembers?.toString() || "",
      isActive: tier.isActive,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingTier) {
      updateMutation.mutate({ id: editingTier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Membership Tiers</CardTitle>
            <CardDescription>Configure membership levels and pricing</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Tier
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : tiers && tiers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiers.map((tier: any) => (
              <Card key={tier.id} className={tier.isActive ? "" : "opacity-60"}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <p className="text-2xl font-bold mt-2">
                        ${(tier.price / 100).toFixed(2)}
                        <span className="text-sm text-muted-foreground font-normal">/{tier.billingPeriod}</span>
                      </p>
                    </div>
                    {tier.isActive && <Badge>Active</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                  {tier.features && tier.features.length > 0 && (
                    <div className="space-y-2">
                      {tier.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center text-sm">
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tier)} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(tier.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No membership tiers yet. Create one to get started.</p>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingTier ? "Edit Tier" : "Create Membership Tier"}</DialogTitle>
              <DialogDescription>Configure tier details and pricing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tier Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Gold Member"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="99.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Premium membership with all features"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Billing Period</Label>
                  <Select
                    value={formData.billingPeriod}
                    onValueChange={(value: any) => setFormData({ ...formData, billingPeriod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="lifetime">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Members (Optional)</Label>
                  <Input
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <label htmlFor="isActive" className="text-sm cursor-pointer">Active</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingTier ? "Update Tier" : "Create Tier"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function CustomFieldsSettings() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [formData, setFormData] = useState({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text" as "text" | "email" | "phone" | "number" | "date" | "select" | "multiselect" | "checkbox" | "textarea",
    fieldOptions: [] as string[],
    isRequired: false,
    isVisibleToMembers: true,
  });

  const { data: fields, isLoading } = useQuery({
    queryKey: ["/api/organization/custom-fields"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/organization/custom-fields", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Custom field created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/custom-fields"] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => apiRequest("PATCH", `/api/organization/custom-fields/${id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Custom field updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/custom-fields"] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/organization/custom-fields/${id}`, {}),
    onSuccess: () => {
      toast({ title: "Success", description: "Custom field deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/custom-fields"] });
    },
  });

  const resetForm = () => {
    setFormData({ fieldName: "", fieldLabel: "", fieldType: "text", fieldOptions: [], isRequired: false, isVisibleToMembers: true });
    setEditingField(null);
  };

  const handleEdit = (field: any) => {
    setEditingField(field);
    setFormData({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      fieldOptions: field.fieldOptions || [],
      isRequired: field.isRequired,
      isVisibleToMembers: field.isVisibleToMembers,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const needsOptions = formData.fieldType === "select" || formData.fieldType === "multiselect";

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>Add custom fields to member profiles</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : fields && fields.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Field Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field: any) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.fieldLabel}</TableCell>
                  <TableCell><code className="text-xs">{field.fieldName}</code></TableCell>
                  <TableCell><Badge variant="secondary">{field.fieldType}</Badge></TableCell>
                  <TableCell>{field.isRequired ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(field)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(field.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">No custom fields yet. Create one to get started.</p>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingField ? "Edit Field" : "Create Custom Field"}</DialogTitle>
              <DialogDescription>Configure field properties</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Field Label</Label>
                <Input
                  value={formData.fieldLabel}
                  onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                  placeholder="LinkedIn Profile"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Name (Internal)</Label>
                <Input
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="linkedin_profile"
                />
              </div>
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select
                  value={formData.fieldType}
                  onValueChange={(value: any) => setFormData({ ...formData, fieldType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Select (Dropdown)</SelectItem>
                    <SelectItem value="multiselect">Multi-select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {needsOptions && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={formData.fieldOptions.join(", ")}
                    onChange={(e) => setFormData({ ...formData, fieldOptions: e.target.value.split(",").map(o => o.trim()) })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
                />
                <label htmlFor="isRequired" className="text-sm cursor-pointer">Required field</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isVisibleToMembers"
                  checked={formData.isVisibleToMembers}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVisibleToMembers: !!checked })}
                />
                <label htmlFor="isVisibleToMembers" className="text-sm cursor-pointer">Visible to members</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingField ? "Update Field" : "Create Field"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
