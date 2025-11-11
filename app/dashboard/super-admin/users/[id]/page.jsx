'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  IconArrowLeft,
  IconCalendar,
  IconMail,
  IconPhone,
  IconMapPin,
  IconUser,
  IconEdit,
  IconCheck,
  IconX,
  IconRefresh,
  IconGenderMale,
  IconGenderFemale,
  IconGenderThird,
  IconSchool,
  IconBriefcase,
  IconCrown,
  IconUsers,
  IconBuilding,
} from '@tabler/icons-react';

// Form validation schema based on your backend models
const profileSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  profile: z.object({
    address: z.string().optional(),
    gender: z.string().optional(),
    phone_number: z.string().optional(),
    date_of_birth: z.string().optional(),
    preferred_timezone: z.string().optional(),
    preferred_language: z.string().optional(),
    // Role-specific fields
    department: z.string().optional(),
    specialization: z.string().optional(),
    qualification: z.string().optional(),
    bio: z.string().optional(),
    is_paid: z.boolean().optional(),
    is_minor: z.boolean().optional(),
    position: z.string().optional(),
    relationship: z.string().optional(),
  }),
});

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: '',
      full_name: '',
      profile: {
        address: '',
        gender: '',
        phone_number: '',
        date_of_birth: '',
        preferred_timezone: 'UTC',
        preferred_language: 'en',
        department: '',
        specialization: '',
        qualification: '',
        bio: '',
        is_paid: false,
        is_minor: false,
        position: '',
        relationship: '',
      },
    },
  });

  // Get access token
  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    const authTokens = localStorage.getItem('authTokens');
    if (!authTokens) {
      toast.error('Authentication required. Please login again.');
      router.push('/login');
      return null;
    }
    try {
      const parsedTokens = JSON.parse(authTokens);
      return parsedTokens.access;
    } catch (error) {
      console.error('Error parsing authTokens:', error);
      toast.error('Invalid authentication data. Please login again.');
      router.push('/login');
      return null;
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) return;

      const response = await axios.get(
        `http://127.0.0.1:8000/api/auth/user/${userId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUserData(response.data);
      
      // Normalize values to avoid nulls in controlled inputs
      const sanitizeString = (value) => (value === null || value === undefined ? '' : String(value));
      const sanitizeBoolean = (value) => Boolean(value);
      const apiProfile = response.data.profile || {};

      // Set form values
      form.reset({
        email: sanitizeString(response.data.email),
        full_name: sanitizeString(response.data.full_name),
        profile: {
          address: sanitizeString(apiProfile.address),
          gender: sanitizeString(apiProfile.gender),
          phone_number: sanitizeString(apiProfile.phone_number),
          date_of_birth: apiProfile.date_of_birth 
            ? new Date(apiProfile.date_of_birth).toISOString().split('T')[0]
            : '',
          preferred_timezone: sanitizeString(apiProfile.preferred_timezone) || 'UTC',
          preferred_language: sanitizeString(apiProfile.preferred_language) || 'en',
          department: sanitizeString(apiProfile.department),
          specialization: sanitizeString(apiProfile.specialization),
          qualification: sanitizeString(apiProfile.qualification),
          bio: sanitizeString(apiProfile.bio),
          is_paid: sanitizeBoolean(apiProfile.is_paid),
          is_minor: sanitizeBoolean(apiProfile.is_minor),
          position: sanitizeString(apiProfile.position),
          relationship: sanitizeString(apiProfile.relationship),
        },
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const token = getAccessToken();
      if (!token) return;

      // Format date properly for backend
      const formattedData = {
        ...data,
        profile: {
          ...data.profile,
          date_of_birth: data.profile.date_of_birth 
            ? new Date(data.profile.date_of_birth).toISOString()
            : null,
        },
      };

      await axios.patch(
        `http://127.0.0.1:8000/api/auth/user/${userId}/`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      toast.success('Profile updated successfully');
      setEditing(false);
      fetchUserData(); // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-secondary/10 text-secondary';
      case 'staff': return 'bg-primary/10 text-primary';
      case 'teacher': return 'bg-primary/10 text-primary';
      case 'student': return 'bg-orange-100 text-orange-800';
      case 'parent': return 'bg-pink-100 text-pink-800';
      default: return 'bg-muted/50 text-foreground';
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return <IconCrown className="h-4 w-4" />;
      case 'staff': return <IconBuilding className="h-4 w-4" />;
      case 'teacher': return <IconSchool className="h-4 w-4" />;
      case 'student': return <IconUser className="h-4 w-4" />;
      case 'parent': return <IconUsers className="h-4 w-4" />;
      default: return <IconUser className="h-4 w-4" />;
    }
  };

  // Get gender icon
  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'male': return <IconGenderMale className="h-4 w-4" />;
      case 'female': return <IconGenderFemale className="h-4 w-4" />;
      case 'other': return <IconGenderThird className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="items-center">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-6 w-40 mt-4" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-3" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">User Profile</h1>
        </div>
        
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <IconEdit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              <IconX className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="items-center">
                  <Avatar className="h-32 w-32">
                    <AvatarImage 
                      src={userData.profile?.profile_image || ''} 
                      alt={userData.full_name}
                    />
                    <AvatarFallback className="text-4xl">
                      {userData.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center mt-4">
                    <h2 className="text-xl font-semibold">
                      {editing ? (
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} className="text-center text-xl font-semibold" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        userData.full_name
                      )}
                    </h2>
                    
                    <div className="mt-2">
                      <Badge className={getRoleBadgeColor(userData.role)}>
                        {getRoleIcon(userData.role)}
                        <span className="ml-1 capitalize">
                          {userData.role.replace('_', ' ')}
                        </span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <IconMail className="h-4 w-4 mr-3 text-muted-foreground" />
                    <div className="flex-1">
                      {editing ? (
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <span className="text-sm">{userData.email}</span>
                      )}
                    </div>
                  </div>
                  
                  {userData.profile?.phone_number && (
                    <div className="flex items-center">
                      <IconPhone className="h-4 w-4 mr-3 text-muted-foreground" />
                      <div className="flex-1">
                        {editing ? (
                          <FormField
                            control={form.control}
                            name="profile.phone_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <span className="text-sm">{userData.profile.phone_number}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {userData.profile?.gender && (
                    <div className="flex items-center">
                      {getGenderIcon(userData.profile.gender)}
                      <span className="ml-3 text-sm capitalize">
                        {userData.profile.gender}
                      </span>
                    </div>
                  )}
                  
                  {userData.profile?.date_of_birth && (
                    <div className="flex items-center">
                      <IconCalendar className="h-4 w-4 mr-3 text-muted-foreground" />
                      <div className="flex-1">
                        {editing ? (
                          <FormField
                            control={form.control}
                            name="profile.date_of_birth"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <span className="text-sm">
                            {new Date(userData.profile.date_of_birth).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {userData.profile?.address && (
                    <div className="flex items-start">
                      <IconMapPin className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        {editing ? (
                          <FormField
                            control={form.control}
                            name="profile.address"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea {...field} rows={3} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <span className="text-sm">{userData.profile.address}</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex flex-col items-start">
                  <div className="text-xs text-muted-foreground mb-2">Account Created</div>
                  <div className="text-sm">
                    {new Date(userData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            {/* Right Column - Detailed Information */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Basic information about this user
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!editing} />
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
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" disabled={!editing} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="profile.phone_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={!editing} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="profile.gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={!editing}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="profile.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} disabled={!editing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Role-specific fields */}
                      {userData.role === 'teacher' && (
                        <>
                          <Separator />
                          <h3 className="text-lg font-medium">Teacher Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="profile.department"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Department</FormLabel>
                                  <FormControl>
                                    <Input {...field} disabled={!editing} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="profile.specialization"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Specialization</FormLabel>
                                  <FormControl>
                                    <Input {...field} disabled={!editing} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="profile.qualification"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Qualification</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!editing} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="profile.bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={4} disabled={!editing} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      {userData.role === 'student' && (
                        <>
                          <Separator />
                          <h3 className="text-lg font-medium">Student Information</h3>
                          <div className="flex items-center space-x-2">
                            <FormField
                              control={form.control}
                              name="profile.is_paid"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={!editing}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Paid Account</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="profile.is_minor"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={!editing}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Minor Student</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </>
                      )}
                      
                      {userData.role === 'staff' && (
                        <>
                          <Separator />
                          <h3 className="text-lg font-medium">Staff Information</h3>
                          <FormField
                            control={form.control}
                            name="profile.position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!editing} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      
                      {userData.role === 'parent' && (
                        <>
                          <Separator />
                          <h3 className="text-lg font-medium">Parent Information</h3>
                          <FormField
                            control={form.control}
                            name="profile.relationship"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relationship</FormLabel>
                                <FormControl>
                                  <Input {...field} disabled={!editing} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Details</CardTitle>
                      <CardDescription>
                        Additional information about this user
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>User ID</Label>
                          <p className="text-sm text-muted-foreground">{userData.id}</p>
                        </div>
                        
                        <div>
                          <Label>Account Status</Label>
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-2 ${userData.is_active ? 'bg-primary' : 'bg-destructive'}`} />
                            <span className="text-sm">{userData.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Created At</Label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(userData.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div>
                          <Label>Last Updated</Label>
                          <p className="text-sm text-muted-foreground">
                            {userData.profile?.updated_at 
                              ? new Date(userData.profile.updated_at).toLocaleString()
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      
                      {userData.profile && (
                        <>
                          <Separator />
                          <h3 className="text-lg font-medium">Profile Metadata</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Profile ID</Label>
                              <p className="text-sm text-muted-foreground">{userData.profile.id || 'N/A'}</p>
                            </div>
                            
                            <div>
                              <Label>Profile Type</Label>
                              <p className="text-sm text-muted-foreground capitalize">
                                {userData.role.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferences</CardTitle>
                      <CardDescription>
                        User preferences and settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="profile.preferred_timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Timezone</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={!editing}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select timezone" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="UTC">UTC</SelectItem>
                                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                  <SelectItem value="Asia/Dhaka">Bangladesh Time</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="profile.preferred_language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Language</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={!editing}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="bn">Bengali</SelectItem>
                                  <SelectItem value="ar">Arabic</SelectItem>
                                  <SelectItem value="es">Spanish</SelectItem>
                                  <SelectItem value="fr">French</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        User activity and events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <IconCalendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity to display</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}