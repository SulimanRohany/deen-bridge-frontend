'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  IconBrandFacebook, 
  IconBrandInstagram, 
  IconBrandTwitter, 
  IconBrandYoutube,
  IconBrandTiktok,
  IconMail,
  IconPhone,
  IconMapPin,
  IconHeart
} from '@tabler/icons-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"

export default function Footer() {
  const { resolvedTheme } = useTheme()
  
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-20 px-4 md:px-12">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4 group">
              <div className="w-32 h-32 rounded-lg flex items-center justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md border border-gray-200 dark:border-gray-700">
                <Image 
                  src="/Transparent Version of Logo.png" 
                  alt="Deen Bridge Logo" 
                  width={128} 
                  height={128}
                  className={`object-contain drop-shadow-lg w-full h-full transition-all ${resolvedTheme === 'dark' ? 'brightness-0 invert' : ''}`}
                />
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-xs leading-relaxed text-sm">
              Empowering Muslims worldwide with quality Islamic education. Learn Quran and Islamic studies from expert teachers online.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10 transition-all rounded-lg" asChild>
                <a href="https://www.facebook.com/share/1Cwe8d5N7L/" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                  <IconBrandFacebook size={20} />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10 transition-all rounded-lg" asChild>
                <a href="https://www.instagram.com/deenbridge4/" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <IconBrandInstagram size={20} />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10 transition-all rounded-lg" asChild>
                <a href="https://x.com/DeenBridge4" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                  <IconBrandTwitter size={20} />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10 transition-all rounded-lg" asChild>
                <a href="https://www.youtube.com/@DeenBridge4" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                  <IconBrandYoutube size={20} />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10 transition-all rounded-lg" asChild>
                <a href="https://www.tiktok.com/@deenbridge" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                  <IconBrandTiktok size={20} />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-base font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Courses
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group cursor-pointer">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Our Teachers
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group cursor-pointer">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Pricing
                </span>
              </li>
              <li>
                <Link href="/blogs" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="text-base font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Contact Us
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group cursor-pointer">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  FAQ
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group cursor-pointer">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group cursor-pointer">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group cursor-pointer">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Refund Policy
                </span>
              </li>
              <li>
                <Link href="/reports" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 text-sm group">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                  Report Issue / Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-base font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Contact Us
            </h3>
            <div className="space-y-4">
              <div className="flex items-start group">
                <IconMapPin className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-muted-foreground text-sm leading-relaxed">Kabul, Afghanistan</span>
              </div>
              <div className="flex items-center group">
                <IconPhone className="h-5 w-5 text-primary mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a href="tel:0789468067" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  0789468067
                </a>
              </div>
              <div className="flex items-center group">
                <IconMail className="h-5 w-5 text-primary mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <a href="mailto:support@deenbridge.com" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  support@deenbridge.com
                </a>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="mt-8">
              <h3 className="text-base font-bold mb-3 text-foreground">Stay Updated 📧</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Get the latest courses and updates delivered to your inbox
              </p>
              <form className="flex flex-col gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-background border-2 border-input hover:border-primary/30 focus:border-primary/50 transition-colors h-11"
                  required
                />
                <Button 
                  type="submit"
                  className="w-full h-11 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Subscribe Now
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <Separator className="opacity-50" />
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} <span className="text-primary font-bold">Deen Bridge</span>. All rights reserved.
          </p>
          <div className="flex items-center text-muted-foreground text-sm gap-2">
            <span>Made with</span>
            <IconHeart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
            <span>for the Muslim Ummah 🤲</span>
          </div>
        </div>
      </div>
    </footer>
  )
}