"use client";

import { useTransition, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Activity,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  updateProfile,
  getUserProfile,
  getUserActivityLog,
} from "@/actions/profile";
import { getRoleDisplayName } from "@/lib/permissions";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSettingsProps {
  user: any;
}

export function ProfileSettings({ user: initialUser }: ProfileSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState(initialUser);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      department: user?.department || "",
      position: user?.position || "",
      phone: user?.phone || "",
      bio: "", // user?.bio || "", // TODO: Add bio field support
    },
  });

  // Load user profile and activity log
  useEffect(() => {
    const loadUserData = async () => {
      setLoadingActivities(true);
      try {
        const [profileResult, activityResult] = await Promise.all([
          getUserProfile(),
          getUserActivityLog(5),
        ]);

        if (profileResult.success) {
          setUser(profileResult.user);
          form.reset({
            name: profileResult.user.name || "",
            email: profileResult.user.email || "",
            department: profileResult.user.department || "",
            position: profileResult.user.position || "",
            phone: profileResult.user.phone || "",
            bio: "", // profileResult.user.bio || "", // TODO: Add bio field support
          });
        }

        if (activityResult.success) {
          setActivities(activityResult.activities);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoadingActivities(false);
      }
    };

    loadUserData();
  }, [form]);

  const onSubmit = (data: ProfileFormData) => {
    startTransition(async () => {
      try {
        const result = await updateProfile(data);

        if (result.success) {
          toast.success("Profile updated successfully!");
          setUser(result.user);
        } else {
          toast.error(result.error || "Failed to update profile");
        }
      } catch (error) {
        toast.error("Failed to update profile");
      }
    });
  };

  const departments = [
    "Smart Places",
    "Health",
    "Energy",
    "Manufacturing",
    "Mining",
    "Defence",
    "Information Technology",
    "Other",
  ];

  const formatActivityAction = (action: string) => {
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Overview
          </CardTitle>
          <CardDescription>
            Your account information and current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            <div className="flex flex-col items-center space-y-2">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="text-xl">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Change Photo
              </Button>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {user?.name || "Unknown User"}
                </h3>
                <p className="text-gray-600">
                  {user?.position || "No position set"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{user?.email || "No email"}</span>
                  {user?.emailVerified && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <Badge variant="secondary">
                    {getRoleDisplayName(user?.role || "USER")}
                  </Badge>
                </div>

                {user?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{user.phone}</span>
                  </div>
                )}

                {user?.department && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{user.department}</span>
                  </div>
                )}
              </div>

              {/* Account Statistics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {user?._count?.projectsLed || 0}
                  </div>
                  <div className="text-sm text-gray-600">Projects Led</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {user?._count?.projectMembers || 0}
                  </div>
                  <div className="text-sm text-gray-600">Projects Involved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {user?._count?.gateReviews || 0}
                  </div>
                  <div className="text-sm text-gray-600">Reviews Conducted</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Edit Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.smith@csir.co.za"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Lead Researcher" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+27 12 841 2911" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself and your research interests..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description about yourself (max 500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Account Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your recent account activities and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingActivities ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">
                Loading activities...
              </p>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formatActivityAction(activity.action)}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-600">
                        {activity.details}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity to display</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Account Information
          </CardTitle>
          <CardDescription>
            Account creation and verification details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Account Created</h4>
              <p className="text-sm text-gray-600">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Unknown"}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Last Updated</h4>
              <p className="text-sm text-gray-600">
                {user?.updatedAt
                  ? new Date(user.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Unknown"}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Email Verification</h4>
              <div className="flex items-center gap-2">
                {user?.emailVerified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">
                      Not Verified
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
              <div className="flex items-center gap-2">
                {user?.isTwoFactorEnabled ? (
                  <>
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Enabled</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Disabled</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
