import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, TrendingUp, BarChart3, Target, Award } from "lucide-react";

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("monthly");
  
  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats", period],
  });
  
  const { data: leadTypeData } = useQuery({
    queryKey: ["/api/analytics/lead-types", period],
  });
  
  const { data: leadStatusData } = useQuery({
    queryKey: ["/api/analytics/lead-statuses", period],
  });
  
  const { data: trendsData } = useQuery({
    queryKey: ["/api/analytics/trends", period],
  });
  
  const { data: topMembers } = useQuery({
    queryKey: ["/api/analytics/top-members", period],
  });
  
  // Chart colors from theme
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];
  
  // Default data if API hasn't returned yet
  const defaultLeadTypes = [
    { name: "Referral", value: 0 },
    { name: "Event Connection", value: 0 },
    { name: "Direct Outreach", value: 0 },
    { name: "Online", value: 0 }
  ];
  
  const defaultLeadStatuses = [
    { name: "Initial Contact", value: 0 },
    { name: "Follow-up Scheduled", value: 0 },
    { name: "Needs Follow-up", value: 0 },
    { name: "Converted", value: 0 },
    { name: "Lost", value: 0 }
  ];
  
  const defaultTrends = [
    { month: "Jan", leads: 0, connections: 0, events: 0 },
    { month: "Feb", leads: 0, connections: 0, events: 0 },
    { month: "Mar", leads: 0, connections: 0, events: 0 },
    { month: "Apr", leads: 0, connections: 0, events: 0 },
    { month: "May", leads: 0, connections: 0, events: 0 },
    { month: "Jun", leads: 0, connections: 0, events: 0 }
  ];
  
  // Use data from API or fallback to default
  const leadTypes = leadTypeData || defaultLeadTypes;
  const leadStatuses = leadStatusData || defaultLeadStatuses;
  const trends = trendsData || defaultTrends;
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-neutral-200 shadow-sm rounded-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <DashboardLayout title="Analytics">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">Performance Analytics</h2>
          <div className="flex gap-2 items-center">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Export</Button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Leads"
            value={stats?.totalLeads || 0}
            change={stats?.leadChange || 0}
            icon={<BarChart3 className="h-6 w-6 text-primary-500" />}
          />
          
          <StatCard 
            title="Lead Conversion Rate"
            value={`${stats?.conversionRate || 0}%`}
            change={stats?.conversionRateChange || 0}
            icon={<TrendingUp className="h-6 w-6 text-secondary-500" />}
          />
          
          <StatCard 
            title="Events Attended"
            value={stats?.eventsAttended || 0}
            change={stats?.eventsChange || 0}
            icon={<Target className="h-6 w-6 text-green-500" />}
          />
          
          <StatCard 
            title="Member Connections"
            value={stats?.connections || 0}
            change={stats?.connectionsChange || 0}
            icon={<Award className="h-6 w-6 text-purple-500" />}
          />
        </div>
        
        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="leads">Lead Analytics</TabsTrigger>
            <TabsTrigger value="events">Event Participation</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trends Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Activity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="leads" 
                          stroke="hsl(var(--chart-1))" 
                          activeDot={{ r: 8 }}
                          name="Leads"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="connections" 
                          stroke="hsl(var(--chart-3))" 
                          name="Connections"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="events" 
                          stroke="hsl(var(--chart-2))" 
                          name="Events"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Lead Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                          label={(entry) => entry.name}
                        >
                          {leadTypes.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Lead Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadStatuses}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="hsl(var(--chart-1))">
                          {leadStatuses.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  {topMembers ? (
                    <div className="space-y-5">
                      {topMembers.map((member, index) => (
                        <div key={index} className="flex items-center">
                          <div className="flex-shrink-0 mr-4 font-bold text-lg text-neutral-400">
                            #{index + 1}
                          </div>
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            {member.avatarUrl ? (
                              <img 
                                src={member.avatarUrl}
                                className="h-10 w-10 rounded-full" 
                                alt={member.name} 
                              />
                            ) : (
                              <span className="text-primary-700 font-semibold">
                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{member.name}</div>
                            <div className="text-sm text-neutral-500">{member.leadsGenerated} leads generated</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${member.leadValue}</div>
                            <div className="text-sm text-neutral-500">Lead value</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-72">
                      <p className="text-neutral-400">No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Lead Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-72">
                  <p className="text-neutral-400">Detailed lead analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Event Participation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-72">
                  <p className="text-neutral-400">Event participation analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="roi">
            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-72">
                  <p className="text-neutral-400">ROI analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, change, icon }) {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardContent className="pt-6 px-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-neutral-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className="bg-primary-50 p-3 rounded-full">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <div className={`mr-2 rounded-full p-1 ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
            {isPositive ? (
              <ArrowUp className={`h-3 w-3 text-green-600`} />
            ) : (
              <ArrowDown className={`h-3 w-3 text-red-600`} />
            )}
          </div>
          <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
          <span className="text-xs text-neutral-500 ml-1">vs previous period</span>
        </div>
      </CardContent>
    </Card>
  );
}
