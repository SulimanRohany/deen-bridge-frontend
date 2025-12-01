// components/blog/SocialShare.jsx
'use client'
import {
  IconBrandTwitter,
  IconBrandFacebook,
  IconBrandLinkedin,
  IconLink,
  IconCopy,
  IconShare
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

export default function SocialShare({ post }) {
  const [copied, setCopied] = useState(false)
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const shareUrl = encodeURIComponent(currentUrl)
  const shareText = encodeURIComponent(post.title)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <IconShare className="h-4 w-4 mr-1.5" />
          <span className="text-sm">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem asChild>
          <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <IconBrandTwitter className="mr-2 h-4 w-4" />
            Twitter
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <IconBrandFacebook className="mr-2 h-4 w-4" />
            Facebook
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <IconBrandLinkedin className="mr-2 h-4 w-4" />
            LinkedIn
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          {copied ? (
            <>
              <IconCopy className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <IconLink className="mr-2 h-4 w-4" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}