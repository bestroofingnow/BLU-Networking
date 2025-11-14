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
import { Settings, Palette, ToggleLeft, Shield, DollarSign, FormInput, Users, Loader2 } from "lucide-react";

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
  // This will be implemented with the custom roles management UI
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Roles & Permissions</CardTitle>
        <CardDescription>
          Create and manage custom roles with specific permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Custom roles management coming soon...</p>
      </CardContent>
    </Card>
  );
}

function MembershipTiersSettings() {
  // This will be implemented with membership tiers UI
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership Tiers</CardTitle>
        <CardDescription>
          Configure membership levels and pricing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Membership tiers management coming soon...</p>
      </CardContent>
    </Card>
  );
}

function CustomFieldsSettings() {
  // This will be implemented with custom fields builder
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Fields</CardTitle>
        <CardDescription>
          Add custom fields to member profiles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Custom fields builder coming soon...</p>
      </CardContent>
    </Card>
  );
}
