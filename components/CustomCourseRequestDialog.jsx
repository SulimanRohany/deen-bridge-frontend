'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  Users, 
  Award, 
  Target, 
  Clock, 
  MessageCircle,
  Send,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Zap,
  Star,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'
import * as communicationsAPI from '@/lib/communications-api'

export default function CustomCourseRequestDialog({ open, onOpenChange }) {
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    courseType: '',
    numberOfStudents: '',
    preferredSchedule: '',
    subjects: '',
    message: ''
  })

  const totalSteps = 3

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    validateField(field)
  }

  const validateField = (field) => {
    let error = ''
    const value = formData[field]

    switch(field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          error = 'Name must be at least 2 characters'
        }
        break
      case 'email':
        if (!value) {
          error = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email'
        }
        break
      case 'phone':
        if (!value) {
          error = 'Phone number is required'
        } else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value.replace(/\s/g, ''))) {
          error = 'Please enter a valid phone number'
        }
        break
      case 'courseType':
        if (!value) {
          error = 'Please select a course type'
        }
        break
    }

    setErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }

  const validateStep = (step) => {
    let fieldsToValidate = []
    
    switch(step) {
      case 1:
        fieldsToValidate = ['name', 'email', 'phone']
        break
      case 2:
        fieldsToValidate = ['courseType']
        break
      case 3:
        fieldsToValidate = []
        break
    }

    let isValid = true
    const newTouched = { ...touched }
    
    fieldsToValidate.forEach(field => {
      newTouched[field] = true
      if (!validateField(field)) {
        isValid = false
      }
    })

    setTouched(newTouched)
    return isValid
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    } else {
      toast.error('Please fill in all required fields correctly')
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmitToBackend = async (e) => {
    if (e) e.preventDefault()
    
    if (!validateStep(1) || !validateStep(2)) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    setLoading(true)

    try {
      // Prepare data with correct field names for unified API
      const requestData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        course_type: formData.courseType,
        number_of_students: formData.numberOfStudents,
        preferred_schedule: formData.preferredSchedule,
        subjects: formData.subjects,
        message: formData.message
      }

      // Submit to unified API
      const response = await communicationsAPI.createCustomCourseRequest(requestData)

      // Then, send to WhatsApp
      const whatsappMessage = `🎓 New Custom Course Request

📝 Name: ${formData.name}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}
🎯 Course Type: ${formData.courseType}
👥 Students: ${formData.numberOfStudents}
📅 Schedule: ${formData.preferredSchedule}
📚 Subjects: ${formData.subjects}
💬 Message: ${formData.message || 'None'}

Please respond within 10 minutes!`

      const encodedMessage = encodeURIComponent(whatsappMessage)
      const whatsappURL = `https://wa.me/93789468067?text=${encodedMessage}`
      
      // Open WhatsApp in new tab
      window.open(whatsappURL, '_blank')

      toast.success('🎉 Request submitted successfully!', {
        description: 'We\'ll respond within 10 minutes!'
      })
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        courseType: '',
        numberOfStudents: '',
        preferredSchedule: '',
        subjects: '',
        message: ''
      })
      setCurrentStep(1)
      setErrors({})
      setTouched({})
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('Failed to submit request', {
        description: error.message || 'Please try again later'
      })
    } finally {
      setLoading(false)
    }
  }


  const stepLabels = [
    { number: 1, title: 'Personal Info', icon: Users },
    { number: 2, title: 'Course Details', icon: Award },
    { number: 3, title: 'Additional Info', icon: MessageCircle }
  ]

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0 border shadow-xl">
        {/* Professional Header */}
        <div className="border-b bg-white dark:bg-gray-950 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Custom Course Request
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Complete the form below and we'll respond within 10 minutes
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Step {currentStep} of {totalSteps}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{Math.round(progressPercentage)}% Complete</div>
            </div>
          </div>

          {/* Professional Step Indicator */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {stepLabels.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                    currentStep > step.number 
                      ? 'bg-blue-600 dark:bg-blue-500' 
                      : currentStep === step.number
                      ? 'bg-blue-600 dark:bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}></div>
                  {index < stepLabels.length - 1 && (
                    <div className="w-2"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
              {stepLabels.map((step) => (
                <div key={step.number} className={`flex-1 ${currentStep >= step.number ? 'text-gray-900 dark:text-white font-semibold' : ''}`}>
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div>
          <form onSubmit={handleSubmitToBackend} className="p-8">
            {/* Step 1: Contact Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">We'll use these details to reach you regarding your request</p>
                </div>

                <div className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Full Name <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      placeholder="John Doe"
                      className={`h-11 text-sm rounded-lg border ${
                        touched.name && errors.name 
                          ? 'border-red-500 focus-visible:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus-visible:border-blue-600 focus-visible:ring-blue-600'
                      } bg-white dark:bg-gray-900`}
                    />
                    {touched.name && errors.name && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Email Address <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="john.doe@company.com"
                      className={`h-11 text-sm rounded-lg border ${
                        touched.email && errors.email 
                          ? 'border-red-500 focus-visible:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus-visible:border-blue-600 focus-visible:ring-blue-600'
                      } bg-white dark:bg-gray-900`}
                    />
                    {touched.email && errors.email && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Phone Number <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      placeholder="+1 (555) 123-4567"
                      className={`h-11 text-sm rounded-lg border ${
                        touched.phone && errors.phone 
                          ? 'border-red-500 focus-visible:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus-visible:border-blue-600 focus-visible:ring-blue-600'
                      } bg-white dark:bg-gray-900`}
                    />
                    {touched.phone && errors.phone && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Professional Note */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong className="text-gray-900 dark:text-white">Response Time:</strong> We guarantee a response within 10 minutes during business hours (Mon-Fri, 9am-6pm). Your information is secure and will not be shared.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Course Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Course Requirements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Specify your course preferences and requirements</p>
                </div>

                <div className="space-y-5">
                  {/* Course Type */}
                  <div>
                    <Label htmlFor="courseType" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Course Type <span className="text-red-600">*</span>
                    </Label>
                    <Select 
                      value={formData.courseType} 
                      onValueChange={(value) => {
                        handleInputChange('courseType', value)
                        handleBlur('courseType')
                      }}
                    >
                      <SelectTrigger className={`h-11 text-sm rounded-lg border ${
                        touched.courseType && errors.courseType 
                          ? 'border-red-500 focus-visible:ring-red-500' 
                          : 'border-gray-300 dark:border-gray-600 focus-visible:border-blue-600 focus-visible:ring-blue-600'
                      } bg-white dark:bg-gray-900`}>
                        <SelectValue placeholder="Select course type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">Family Course</SelectItem>
                        <SelectItem value="private">Private Class (1-on-1)</SelectItem>
                        <SelectItem value="group">Small Group (2-5 students)</SelectItem>
                        <SelectItem value="corporate">Corporate Training</SelectItem>
                      </SelectContent>
                    </Select>
                    {touched.courseType && errors.courseType && (
                      <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.courseType}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Number of Students */}
                    <div>
                      <Label htmlFor="numberOfStudents" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Number of Students
                      </Label>
                      <Select 
                        value={formData.numberOfStudents} 
                        onValueChange={(value) => handleInputChange('numberOfStudents', value)}
                      >
                        <SelectTrigger className="h-11 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus-visible:border-blue-600 focus-visible:ring-blue-600">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Student</SelectItem>
                          <SelectItem value="2-3">2-3 Students</SelectItem>
                          <SelectItem value="4-5">4-5 Students</SelectItem>
                          <SelectItem value="6+">6+ Students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preferred Schedule */}
                    <div>
                      <Label htmlFor="preferredSchedule" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Preferred Schedule
                      </Label>
                      <Select 
                        value={formData.preferredSchedule} 
                        onValueChange={(value) => handleInputChange('preferredSchedule', value)}
                      >
                        <SelectTrigger className="h-11 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus-visible:border-blue-600 focus-visible:ring-blue-600">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (8:00 AM - 12:00 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12:00 PM - 5:00 PM)</SelectItem>
                          <SelectItem value="evening">Evening (5:00 PM - 9:00 PM)</SelectItem>
                          <SelectItem value="weekend">Weekend Only</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div>
                    <Label htmlFor="subjects" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Subjects of Interest <span className="text-gray-400 text-xs">(Optional)</span>
                    </Label>
                    <Input
                      id="subjects"
                      value={formData.subjects}
                      onChange={(e) => handleInputChange('subjects', e.target.value)}
                      placeholder="e.g., Quran, Arabic, Islamic Studies"
                      className="h-11 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus-visible:border-blue-600 focus-visible:ring-blue-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Separate multiple subjects with commas</p>
                  </div>
                </div>

                {/* Professional Note */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <strong className="text-gray-900 dark:text-white">Note:</strong> All instructors are certified professionals with extensive teaching experience. We'll recommend the best match based on your requirements.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Details</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Provide any additional information that will help us serve you better</p>
                </div>

                <div className="space-y-5">
                  {/* Message */}
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Additional Comments <span className="text-gray-400 text-xs">(Optional)</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Please share your learning goals, specific requirements, or any questions you may have.

You may include:
- Specific learning objectives
- Previous experience or background
- Preferred teaching methodology
- Any special accommodations needed"
                      rows={8}
                      className="text-sm px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus-visible:border-blue-600 focus-visible:ring-blue-600 resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Providing detailed information helps us match you with the most suitable instructor</p>
                  </div>
                </div>

                {/* Next Steps Information */}
                <div className="mt-6 p-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">What to Expect</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-white">1</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Immediate Response:</strong> Our team will contact you within 10 minutes during business hours
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-white">2</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Consultation:</strong> Discuss your requirements and get matched with a qualified instructor
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-white">3</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Trial Session:</strong> Schedule a complimentary trial class to evaluate fit
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Professional Footer */}
        <div className="border-t bg-gray-50 dark:bg-gray-900 px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="h-11 px-6 rounded-lg font-medium text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-11 px-8 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmitToBackend}
                disabled={loading}
                className="h-11 px-8 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
