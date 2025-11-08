"use client";

import {
  Calendar,
  Eye,
  Filter,
  FlaskConical,
  Microscope,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Slider } from "@/shared/ui/shadcn/slider";

export default function BrowseServices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [userType] = useState("MJIIT"); // Simulated user type

  const services = [
    {
      id: "SRV001",
      name: "FTIR Spectroscopy - ATR",
      code: "FTIR-ATR-001",
      category: "Analysis",
      description:
        "Fourier Transform Infrared Spectroscopy with Attenuated Total Reflectance for surface analysis",
      pricing: {
        MJIIT: 50,
        UTM: 60,
        External: 80,
      },
      unit: "per sample",
      availability: "Available",
      icon: FlaskConical,
    },
    {
      id: "SRV002",
      name: "FTIR Spectroscopy - KBr",
      code: "FTIR-KBr-001",
      category: "Analysis",
      description:
        "Fourier Transform Infrared Spectroscopy with KBr pellet method for bulk analysis",
      pricing: {
        MJIIT: 55,
        UTM: 65,
        External: 90,
      },
      unit: "per sample",
      availability: "Available",
      icon: FlaskConical,
    },
    {
      id: "SRV003",
      name: "UV-Vis Spectroscopy - Absorbance/Transmittance",
      code: "UV-VIS-ABS-001",
      category: "Analysis",
      description:
        "UV-Visible spectroscopy for absorbance and transmittance measurements",
      pricing: {
        MJIIT: 20,
        UTM: 30,
        External: 50,
      },
      unit: "per sample",
      availability: "Available",
      icon: Zap,
    },
    {
      id: "SRV004",
      name: "UV-Vis Spectroscopy - Reflectance",
      code: "UV-VIS-REF-001",
      category: "Analysis",
      description: "UV-Visible spectroscopy for reflectance measurements",
      pricing: {
        MJIIT: 25,
        UTM: 35,
        External: 55,
      },
      unit: "per sample",
      availability: "Available",
      icon: Zap,
    },
    {
      id: "SRV005",
      name: "Surface Area and Pore Analyzer (BET)",
      code: "BET-001",
      category: "Analysis",
      description:
        "BET surface area and pore size analysis for material characterization",
      pricing: {
        MJIIT: 190,
        UTM: 210,
        External: 250,
      },
      unit: "per sample",
      availability: "Available",
      icon: Microscope,
    },
    {
      id: "SRV006",
      name: "HPLC-Photodiode Array Detection",
      code: "HPLC-PAD-001",
      category: "Analysis",
      description:
        "High-performance liquid chromatography with photodiode array detection",
      pricing: {
        MJIIT: 65,
        UTM: 95,
        External: 170,
      },
      unit: "per sample",
      availability: "Available",
      icon: FlaskConical,
      preparation: {
        name: "Filter and HPLC vial preparation",
        pricing: {
          MJIIT: 20,
          UTM: 20,
          External: 20,
        },
      },
    },
    {
      id: "SRV007",
      name: "Working Area (Bench fees)",
      code: "WORK-001",
      category: "Working Space",
      description:
        "Lab bench rental with basic equipment access for research work",
      pricing: {
        MJIIT: 150,
        UTM: 200,
        External: 300,
      },
      unit: "per person per month",
      availability: "Available",
      icon: Calendar,
      note: "*Subject to terms and conditions",
    },
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" ||
      service.category.toLowerCase() === categoryFilter;
    const servicePrice =
      service.pricing[userType as keyof typeof service.pricing];
    const matchesPrice = servicePrice
      ? servicePrice >= (priceRange[0] ?? 0) &&
      servicePrice <= (priceRange[1] ?? 1000)
      : true;
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case "MJIIT":
        return "MJIIT Member Rate";
      case "UTM":
        return "UTM Member Rate";
      case "External":
        return "External Client Rate";
      default:
        return "Rate";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filter Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm"
                    htmlFor="service-search"
                  >
                    Search
                  </label>
                  <div className="relative">
                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                    <Input
                      className="pl-10"
                      id="service-search"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search services..."
                      value={searchTerm}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm"
                    htmlFor="service-category-filter"
                  >
                    Service Category
                  </label>
                  <Select
                    onValueChange={setCategoryFilter}
                    value={categoryFilter}
                  >
                    <SelectTrigger id="service-category-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="analysis">
                        Analysis Services
                      </SelectItem>
                      <SelectItem value="working space">
                        Working Space
                      </SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm"
                    htmlFor="price-range"
                  >
                    Price Range (RM {priceRange[0]} - RM {priceRange[1]})
                  </label>
                  <Slider
                    className="mt-2"
                    id="price-range"
                    max={1000}
                    onValueChange={setPriceRange}
                    step={10}
                    value={priceRange}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block font-medium text-gray-700 text-sm"
                    htmlFor="availability-filter"
                  >
                    Availability
                  </label>
                  <Select>
                    <SelectTrigger id="availability-filter">
                      <SelectValue placeholder="All Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Availability</SelectItem>
                      <SelectItem value="available">Available Now</SelectItem>
                      <SelectItem value="limited">Limited Slots</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* User Rate Info */}
            <Card className="mt-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 text-lg">
                  Your Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-600">MJIIT Member</Badge>
                </div>
                <p className="mt-2 text-blue-700 text-sm">
                  You receive special MJIIT member pricing on all services.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Services Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-2xl text-gray-900">
                  Available Lab Services
                </h2>
                <p className="text-gray-600">
                  {filteredServices.length} services available
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Sort by Price
                </Button>
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <Card className="py-12 text-center">
                <CardContent>
                  <FlaskConical className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 font-medium text-gray-900 text-lg">
                    No Services Available
                  </h3>
                  <p className="text-gray-600">
                    No services match your current filter criteria.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setPriceRange([0, 1000]);
                    }}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredServices.map((service) => {
                  const IconComponent = service.icon;
                  const userPrice =
                    service.pricing[userType as keyof typeof service.pricing];

                  return (
                    <Card
                      className="transition-shadow hover:shadow-lg"
                      key={service.id}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {service.name}
                              </CardTitle>
                              <CardDescription className="text-gray-500 text-sm">
                                Code: {service.code}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            className={
                              service.availability === "Available"
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }
                            variant={
                              service.availability === "Available"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {service.availability}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-4 text-gray-600 text-sm">
                          {service.description}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">
                              Category:
                            </span>
                            <Badge variant="outline">{service.category}</Badge>
                          </div>

                          <div className="rounded-lg bg-blue-50 p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-blue-800 text-sm">
                                {getUserTypeLabel(userType)}:
                              </span>
                              <div className="text-right">
                                <span className="font-bold text-blue-900 text-lg">
                                  RM {userPrice}
                                </span>
                                <span className="block text-blue-700 text-sm">
                                  {service.unit}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center space-x-2">
                          <Button className="flex-1" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Booking
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
