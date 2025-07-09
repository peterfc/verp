import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Welcome to CRM App</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">Navigate to manage your profiles and customers.</p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/profiles">Manage Profiles</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/customers">Manage Customers</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
