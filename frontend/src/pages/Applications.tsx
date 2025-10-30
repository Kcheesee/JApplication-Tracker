import { useState } from 'react'
import { JobTrackerWidget } from '../components/JobTrackerWidget'
import { EmailTemplates } from '../components/EmailTemplates'
import { Button } from '../components/ui/button'
import { Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'

export default function Applications() {
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            All Applications
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            View and manage all your job applications in one place
          </p>
        </div>
        <Button
          onClick={() => setShowTemplates(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Email Templates
        </Button>
      </div>

      <JobTrackerWidget />

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Templates</DialogTitle>
          </DialogHeader>
          <EmailTemplates />
        </DialogContent>
      </Dialog>
    </div>
  )
}
