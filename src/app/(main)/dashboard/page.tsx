"use client";

import {
  Bell,
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  FlaskConical,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/shadcn/table";

export default function UserDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const bookings = [
    {
      id: "BK001",
      services: ["HPLC", "FTIR-ATR"], // 'HPLC-Photodiode Array Detection', 'FTIR Spectroscopy - ATR'
      status: "In Progress",
      submissionDate: "2025-06-20",
      statusColor: "bg-blue-500",
    },
    {
      id: "BK002",
      services: ["Working Area"], // 'Working area (Bench fees)'
      status: "Approved",
      submissionDate: "2025-06-18",
      statusColor: "bg-green-500",
    },
    {
      id: "BK003",
      services: ["UV-Vis-Absorbance"], // 'UV-Vis Spectroscopy - Absorbance/Transmittance'
      status: "Results Ready",
      submissionDate: "2025-06-15",
      statusColor: "bg-purple-500",
    },
    {
      id: "BK004",
      services: ["BET"], // 'Surface area and pore analyzer (BET)'
      status: "Pending Approval",
      submissionDate: "2025-06-12",
      statusColor: "bg-yellow-500",
    },
    {
      id: "BK005",
      services: ["FTIR-KBr"], // 'FTIR Spectroscopy - KBr'
      status: "Completed",
      submissionDate: "2025-06-05",
      statusColor: "bg-gray-500",
    },
    {
      id: "BK006",
      services: ["HPLC"], // 'HPLC-Photodiode Array Detection'
      status: "Pending Approval",
      submissionDate: "2025-06-21",
      statusColor: "bg-yellow-500",
    },
  ];

  const notifications = [
    "Booking #BK003 results are ready for download",
    "Payment reminder for Booking #BK001",
    "Booking #BK002 has been approved",
    "New service available: Mass Spectrometry",
    "Maintenance scheduled for Lab A on Jan 25",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="font-semibold text-gray-900 text-lg">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start bg-blue-600 text-white hover:bg-blue-700"
                  variant="default"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Services
                </Button>
                <Button
                  className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Booking Request
                </Button>
                <Button
                  className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
                  variant="outline"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All My Bookings
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6 border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="font-semibold text-gray-900 text-lg">
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm"
                    htmlFor="service-category"
                  >
                    Service Category
                  </label>
                  <Select>
                    <SelectTrigger
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      id="service-category"
                    >
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analysis">
                        Analysis Services
                      </SelectItem>
                      <SelectItem value="workspace">Working Space</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm"
                    htmlFor="booking-status"
                  >
                    Booking Status
                  </label>
                  <Select onValueChange={setStatusFilter} value={statusFilter}>
                    <SelectTrigger
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      id="booking-status"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Welcome Section */}
            <div className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="mb-2 font-bold text-2xl">Welcome back, Harith!</h2>
              <p className="text-blue-100">
                You have 4 active bookings and 1 result ready for download.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Bookings</p>
                      <p className="font-bold text-2xl">12</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">In Progress</p>
                      <p className="font-bold text-2xl">3</p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Completed</p>
                      <p className="font-bold text-2xl">8</p>
                    </div>
                    <FlaskConical className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Pending Payment</p>
                      <p className="font-bold text-2xl">1</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Bookings Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Bookings Overview</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                      <Input
                        className="w-64 pl-10"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search bookings..."
                        value={searchTerm}
                      />
                    </div>
                    <Button size="sm" variant="outline">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.id}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {booking.services.map((service) => (
                              <Badge
                                className="mr-1"
                                key={service}
                                variant="secondary"
                              >
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${booking.statusColor} text-white`}
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{booking.submissionDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {booking.status === "Results Ready" && (
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3"
                      key={notification}
                    >
                      <Bell className="mt-0.5 h-4 w-4 text-blue-500" />
                      <p className="text-gray-700 text-sm">{notification}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
