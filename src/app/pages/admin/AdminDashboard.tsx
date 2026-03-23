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
  registrationsData,
  reviewsData,
} from "../../data/mockData";
import { useEvents } from "../../context/EventsContext";
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

const monthlyData = [
  { month: "Jan", registrations: 45 },
  { month: "Feb", registrations: 52 },
  { month: "Mar", registrations: 68 },
  { month: "Apr", registrations: 78 },
  { month: "May", registrations: 85 },
  { month: "Jun", registrations: 92 },
];

const eventData = [
  { name: "Ralamandal", participants: 42 },
  { name: "Janapav", participants: 56 },
  { name: "Dhawalgiri", participants: 38 },
];

export function AdminDashboard() {
  const { events, upcomingEvents, completedEvents } = useEvents();
  const totalRevenue = registrationsData
    .filter((r) => r.paymentStatus === "paid")
    .reduce((sum, r) => {
      const event = events.find((e) => e.id === r.eventId);
      return sum + (event?.price || 0);
    }, 0);

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
                  {registrationsData.length}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12% from last month</span>
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
                  {upcomingEvents.length}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {completedEvents.length} completed
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
                  {totalRevenue.toLocaleString("en-IN")}
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
                  {reviewsData.length}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Average rating: 5.0
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
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="participants" fill="#008080" />
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
            {registrationsData.slice(0, 5).map((reg) => (
              <div
                key={reg.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#008080] to-[#4B0082] rounded-full flex items-center justify-center text-white font-bold">
                    {reg.name.charAt(0)}
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
                    className={`px-3 py-1 rounded-full text-sm ${
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}