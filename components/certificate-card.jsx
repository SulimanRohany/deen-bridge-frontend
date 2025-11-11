'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'




export default function CertificateCard({ certificate }) {
  const title = certificate?.course_data?.title || `Course #${certificate?.course}`
  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
          {title}
        </CardTitle>
        <div className="mt-2 text-sm text-muted-foreground">
          Code: <span className="font-mono">{certificate?.certificate_code}</span>
        </div>
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground flex-1">
        {certificate?.issued_at && (
          <div>
            Issued:&nbsp;
            <Badge variant="outline">
              {new Date(certificate.issued_at).toLocaleDateString()}
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {certificate?.pdf_url ? (
          <Button asChild className="w-full" variant="outline">
            <a href={certificate.pdf_url} target="_blank" rel="noreferrer">
              View PDF
            </a>
          </Button>
        ) : (
          <Button disabled className="w-full" variant="outline">
            PDF Unavailable
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
