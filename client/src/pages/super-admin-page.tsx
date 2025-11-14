import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Loader2, Building, Users, CheckCircle, XCircle } from "lucide-react";

export default function SuperAdminPage() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    // Organization details
    orgName: "",
    orgLocation: "",
    orgDescription: "",
    // Org Admin details
    adminUsername: "",
    adminPassword: "",
    adminFullName: "",
    adminEmail: "",
    adminCompany: "",
    adminTitle: "",
  });

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["/api/chapters"],
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create the organization
      const org = await apiRequest("POST", "/api/chapters", {
        name: data.orgName,
        location: data.orgLocation,
        description: data.orgDescription,
      });

      // Then create the org admin user
      await apiRequest("POST", "/api/super-admin/create-org-admin", {
        chapterId: org.id,
        username: data.adminUsername,
        password: data.adminPassword,
        fullName: data.adminFullName,
        email: data.adminEmail,
        company: data.adminCompany,
        title: data.adminTitle,
      });

      return org;
    },
    onSuccess: () => {
      toast({
        title: "Organization Created!",
        description: "The organization and admin account have been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chapters"] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      orgName: "",
      orgLocation: "",
      orgDescription: "",
      adminUsername: "",
      adminPassword: "",
      adminFullName: "",
      adminEmail: "",
      adminCompany: "",
      adminTitle: "",
    });
  };

  const handleCreate = () => {
    createOrgMutation.mutate(formData);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, adminPassword: password });
  };

  return (
    <DashboardLayout title="Super Admin">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Platform Management</h2>
        <p className="text-neutral-600 mt-1">
          Manage all networking organizations on your platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                Organizations you've created for customers who have paid
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Organization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : organizations && organizations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org: any) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-muted-foreground">{org.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{org.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                        {org.memberCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.isActive ? (
                        <Badge variant="default" className="flex items-center w-fit gap-1">
                          <CheckCircle className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center w-fit gap-1">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-neutral-500 mb-4">No organizations yet</p>
              <p className="text-sm text-neutral-400 mb-6">
                Create an organization for each customer after they pay on your website
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create First Organization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Organization</DialogTitle>
            <DialogDescription>
              Create an organization and its admin account after customer payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Organization Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Organization Details</h3>

              <div className="space-y-2">
                <Label>Organization Name *</Label>
                <Input
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  placeholder="Charlotte Business Network"
                />
              </div>

              <div className="space-y-2">
                <Label>Location *</Label>
                <Input
                  value={formData.orgLocation}
                  onChange={(e) => setFormData({ ...formData, orgLocation: e.target.value })}
                  placeholder="Charlotte, NC"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.orgDescription}
                  onChange={(e) => setFormData({ ...formData, orgDescription: e.target.value })}
                  placeholder="Professional networking organization in Charlotte"
                  rows={2}
                />
              </div>
            </div>

            {/* Admin Account Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg border-b pb-2">Organization Admin Account</h3>
              <p className="text-sm text-muted-foreground">
                This person will manage their organization. Send them their login credentials.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Admin Full Name *</Label>
                  <Input
                    value={formData.adminFullName}
                    onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin Email *</Label>
                  <Input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin Username *</Label>
                  <Input
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                    placeholder="johnsmith"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Admin Password *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      placeholder="Auto-generate or enter"
                    />
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={formData.adminCompany}
                    onChange={(e) => setFormData({ ...formData, adminCompany: e.target.value })}
                    placeholder="Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.adminTitle}
                    onChange={(e) => setFormData({ ...formData, adminTitle: e.target.value })}
                    placeholder="President"
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Reminder:</strong> Send the admin their login credentials via email:
                <br />
                <code className="bg-white px-2 py-1 rounded mt-2 inline-block">
                  Username: {formData.adminUsername || "(will be set)"}
                  <br />
                  Password: {formData.adminPassword || "(will be generated)"}
                </code>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createOrgMutation.isPending || !formData.orgName || !formData.adminUsername || !formData.adminPassword || !formData.adminFullName || !formData.adminEmail}
            >
              {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
