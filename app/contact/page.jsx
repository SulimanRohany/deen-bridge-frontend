'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  IconMail, 
  IconPhone, 
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandYoutube,
  IconSend,
  IconMessageCircle,
  IconBook,
  IconSparkles,
  IconCheck
} from '@tabler/icons-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { contactAPI } from "@/lib/contact-api"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await contactAPI.createContactMessage(formData)
      
      setIsSubmitting(false)
      setSubmitted(true)
      
      toast.success('Message sent successfully!', {
        description: response.message || 'We will get back to you within 24 hours.'
      })
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        })
        setSubmitted(false)
      }, 2000)
      
    } catch (error) {
      setIsSubmitting(false)
      console.error('Error sending message:', error)
      
      toast.error('Failed to send message', {
        description: error.message || 'Please try again or contact us directly.'
      })
    }
  }

  const contactMethods = [
    {
      icon: IconMail,
      title: 'Email Us',
      description: 'Our team is here to help',
      contact: 'info@deenbridge.com',
      link: 'mailto:info@deenbridge.com',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: IconMessageCircle,
      title: 'Message Us',
      description: 'Chat with us on WhatsApp',
      contact: 'WhatsApp Chat',
      link: 'https://wa.me/8801234567890',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: IconPhone,
      title: 'Schedule a Call',
      description: 'Book a consultation',
      contact: 'Book Now',
      link: 'https://calendly.com/deenbridge/consultation',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  const faqs = [
    {
      question: 'What are your working hours?',
      answer: 'We are available Monday to Friday from 8:00 AM to 6:00 PM (GMT+6). Support requests received outside these hours will be answered on the next business day.'
    },
    {
      question: 'How quickly will you respond?',
      answer: 'We typically respond to all inquiries within 24 hours during business days. Urgent matters are prioritized and often receive faster responses.'
    },
    {
      question: 'Can I schedule a call?',
      answer: 'Yes! You can request a callback by mentioning your preferred time in the message field, and our team will reach out to you.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-background border-b">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <IconSparkles className="w-4 h-4" />
              <span>We're Here to Help</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Get in Touch
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
                with Deen Bridge
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Have questions about our courses? Need help with enrollment? We're here to support you on your Islamic learning journey.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods Grid */}
      <section className="container mx-auto px-4 -mt-12 relative z-20 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => (
            <Card 
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 bg-background shadow-lg"
            >
              <CardContent className="p-8 text-center space-y-6">
                <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <method.icon className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-foreground">{method.title}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">{method.description}</p>
                  <a 
                    href={method.link}
                    target={method.link.startsWith('http') ? '_blank' : '_self'}
                    rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg font-medium text-sm transition-all duration-300 group-hover:gap-3"
                  >
                    {method.contact}
                    <IconSend className="w-4 h-4 transition-all" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Content - Form and Info */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-2 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <IconMessageCircle className="w-5 h-5 text-white" />
                  </div>
                  Send us a Message
                </CardTitle>
                <CardDescription className="text-base">
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Muhammad Ali"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="h-11"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="ali@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="h-11"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+880 1234 567890"
                        value={formData.phone}
                        onChange={handleChange}
                        className="h-11"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-semibold">
                        Subject <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="How can we help you?"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="h-11"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-semibold">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="resize-none"
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={isSubmitting || submitted}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : submitted ? (
                      <>
                        <IconCheck className="w-5 h-5 mr-2" />
                        Message Sent!
                      </>
                    ) : (
                      <>
                        <IconSend className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting this form, you agree to our{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    {' '}and{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">

            {/* Social Media */}
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="text-lg">Follow Us</CardTitle>
                <CardDescription>Stay connected on social media</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button variant="outline" size="icon" className="hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all" asChild>
                    <a href="#" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                      <IconBrandFacebook className="w-5 h-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" className="hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all" asChild>
                    <a href="#" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                      <IconBrandInstagram className="w-5 h-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" className="hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all" asChild>
                    <a href="#" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                      <IconBrandTwitter className="w-5 h-5" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" className="hover:bg-red-500 hover:text-white hover:border-red-500 transition-all" asChild>
                    <a href="#" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                      <IconBrandYoutube className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconBook className="w-5 h-5 text-primary" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link 
                  href="/courses" 
                  className="block p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-sm font-medium text-foreground group"
                >
                  <span className="flex items-center justify-between">
                    Browse Courses
                    <IconSend className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>
                <Link 
                  href="/pricing" 
                  className="block p-3 rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium text-foreground hover:text-primary group"
                >
                  <span className="flex items-center justify-between">
                    Pricing Plans
                    <IconSend className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>
                <Link 
                  href="/reports" 
                  className="block p-3 rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium text-foreground hover:text-primary group"
                >
                  <span className="flex items-center justify-between">
                    Report Issue / Feedback
                    <IconSend className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                      {index + 1}
                    </span>
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed pl-11">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Still have questions? Feel free to contact us using the form above!
            </p>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-2 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <CardContent className="relative z-10 py-16 px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of students learning Quran and Islamic studies with expert teachers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="font-semibold" asChild>
                <Link href="/courses">
                  Browse Classes
                  <IconBook className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-primary font-semibold" asChild>
                <Link href="/signup">
                  Sign Up Free
                  <IconSparkles className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

