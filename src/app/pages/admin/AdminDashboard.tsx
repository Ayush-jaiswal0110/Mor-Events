import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Calendar,
  Users,
  CheckCircle,
  Star,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiFetch } from "../../../api/client";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    averageRating: 0,
    totalReviews: 0,
    monthlyGrowth: 0
  });
  
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [eventData, setEventData] = useState<any[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, monthlyRes, eventRes, recentRes] = await Promise.all([
          apiFetch('/analytics/dashboard'),
          apiFetch('/analytics/registrations/monthly'),
          apiFetch('/analytics/events/participation'),
          apiFetch('/registrations?limit=5')
        ]);
        
        if (statsRes.success) setStats(statsRes.data);
        if (monthlyRes.success) {
           // Shorten month names for better chart display
           const mData = monthlyRes.data.map((d: any) => ({
                ...d,
                month: d.month.substring(0, 3)
           }));
           setMonthlyData(mData);
        }
        if (eventRes.success) setEventData(eventRes.data);
        if (recentRes.success) setRecentRegistrations(recentRes.data);
        
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, []);

  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-[500px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F3057] dark:border-white"></div>
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#0F3057] dark:text-white mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your events.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Registrations
                </p>
                <p className="text-3xl font-bold text-[#0F3057] dark:text-white">
                  {stats.totalRegistrations}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+{stats.monthlyGrowth}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Upcoming Events
                </p>
                <p className="text-3xl font-bold text-[#0F3057] dark:text-white">
                  {stats.upcomingEvents}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {stats.completedEvents} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-[#0F3057] dark:text-white flex items-center">
                  <IndianRupee className="h-6 w-6" />
                  {stats.totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              From paid registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Reviews
                </p>
                <p className="text-3xl font-bold text-[#0F3057] dark:text-white">
                  {stats.totalReviews}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Average rating: {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#0F3057"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="eventName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRegistrations" fill="#008080" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRegistrations.length > 0 ? recentRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#008080] to-[#4B0082] rounded-full flex items-center justify-center text-white font-bold">
                    {reg.name ? reg.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F3057] dark:text-white">
                      {reg.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {reg.eventName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      reg.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : reg.paymentStatus === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {reg.paymentStatus}
                  </span>
                </div>
              </div>
            )) : (
               <div className="text-center py-4 text-gray-500">No recent registrations.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}