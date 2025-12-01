'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Lock, Users, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { userAPI } from '@/lib/api';

const RELATIONSHIP_OPTIONS = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Other', label: 'Other' },
];

export default function CreateParentAccountDialog({ 
  open, 
  onOpenChange, 
  student, 
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    parent_email: '',
    parent_full_name: '',
    relationship: '',
    password: '',
    link_to_existing: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [existingParent, setExistingParent] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        parent_email: '',
        parent_full_name: '',
        relationship: '',
        password: '',
        link_to_existing: false,
      });
      setErrors({});
      setExistingParent(null);
    }
  }, [open]);

  // Check if email exists when email changes
  useEffect(() => {
    const checkEmailExists = async () => {
      if (!formData.parent_email || !formData.parent_email.includes('@')) {
        setExistingParent(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const response = await userAPI.getUsers({ 
          email: formData.parent_email,
          role: 'parent'
        });
        
        if (response.data?.results?.length > 0 || response.data?.length > 0) {
          const parent = response.data?.results?.[0] || response.data?.[0];
          if (parent && parent.role === 'parent') {
            setExistingParent(parent);
            if (!formData.link_to_existing) {
              setFormData(prev => ({ ...prev, link_to_existing: true }));
            }
          } else {
            setExistingParent(null);
          }
        } else {
          setExistingParent(null);
        }
      } catch (error) {
        // Email doesn't exist or error - that's okay
        setExistingParent(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmailExists, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.parent_email]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRelationshipChange = (value) => {
    setFormData(prev => ({ ...prev, relationship: value }));
    if (errors.relationship) {
      setErrors(prev => ({ ...prev, relationship: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const validationErrors = {};
    if (!formData.parent_email) {
      validationErrors.parent_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parent_email)) {
      validationErrors.parent_email = 'Please enter a valid email address';
    }

    if (!formData.parent_full_name) {
      validationErrors.parent_full_name = 'Full name is required';
    }

    if (!formData.relationship) {
      validationErrors.relationship = 'Relationship is required';
    }

    // Password required if creating new account
    if (!formData.link_to_existing && !formData.password) {
      validationErrors.password = 'Password is required when creating a new account';
    } else if (formData.password && formData.password.length < 8) {
      validationErrors.password = 'Password must be at least 8 characters long';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the form errors');
      return;
    }

    setSubmitting(true);

    try {
      const response = await userAPI.createParentAccount({
        student_id: student.id,
        parent_email: formData.parent_email,
        parent_full_name: formData.parent_full_name,
        relationship: formData.relationship,
        password: formData.link_to_existing ? undefined : formData.password,
        link_to_existing: formData.link_to_existing && existingParent ? true : false,
      });

      toast.success(response.data.message || 'Parent account created successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      if (error.response?.status === 400) {
        const backendErrors = error.response.data;
        const formErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          if (key !== 'detail' && key !== 'error') {
            formErrors[key] = Array.isArray(backendErrors[key]) 
              ? backendErrors[key].join(' ') 
              : backendErrors[key];
          }
        });
        
        if (Object.keys(formErrors).length > 0) {
          setErrors(formErrors);
        } else {
          toast.error(backendErrors.detail || backendErrors.error || 'Failed to create parent account');
        }
      } else {
        toast.error(error.response?.data?.error || 'Failed to create parent account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Create Parent Account
          </DialogTitle>
          <DialogDescription>
            Create a parent account for {student.full_name || student.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Info */}
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-xs text-muted-foreground uppercase">Student</Label>
            <p className="font-medium">{student.full_name || student.email}</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>

          {/* Parent Email */}
          <div className="space-y-2">
            <Label htmlFor="parent_email">
              Parent Email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="parent_email"
                name="parent_email"
                type="email"
                placeholder="parent@example.com"
                value={formData.parent_email}
                onChange={handleChange}
                className={`pl-10 ${errors.parent_email ? 'border-red-500' : ''}`}
                disabled={submitting}
              />
            </div>
            {errors.parent_email && (
              <p className="text-sm text-red-500">{errors.parent_email}</p>
            )}
            {checkingEmail && (
              <p className="text-sm text-muted-foreground">Checking email...</p>
            )}
          </div>

          {/* Existing Parent Alert */}
          {existingParent && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A parent account with this email already exists: {existingParent.full_name}
                <br />
                <Checkbox
                  id="link_to_existing"
                  checked={formData.link_to_existing}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, link_to_existing: checked }))
                  }
                  className="mt-2"
                />
                <Label htmlFor="link_to_existing" className="ml-2 font-normal cursor-pointer">
                  Link student to existing parent account
                </Label>
              </AlertDescription>
            </Alert>
          )}

          {/* Parent Full Name */}
          <div className="space-y-2">
            <Label htmlFor="parent_full_name">
              Parent Full Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="parent_full_name"
                name="parent_full_name"
                type="text"
                placeholder="John Doe"
                value={formData.parent_full_name}
                onChange={handleChange}
                className={`pl-10 ${errors.parent_full_name ? 'border-red-500' : ''}`}
                disabled={submitting || (existingParent && formData.link_to_existing)}
              />
            </div>
            {errors.parent_full_name && (
              <p className="text-sm text-red-500">{errors.parent_full_name}</p>
            )}
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label htmlFor="relationship">
              Relationship <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.relationship}
              onValueChange={handleRelationshipChange}
              disabled={submitting}
            >
              <SelectTrigger id="relationship" className={errors.relationship ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.relationship && (
              <p className="text-sm text-red-500">{errors.relationship}</p>
            )}
          </div>

          {/* Password - only show if not linking to existing */}
          {(!existingParent || !formData.link_to_existing) && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : formData.link_to_existing ? 'Link Account' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


