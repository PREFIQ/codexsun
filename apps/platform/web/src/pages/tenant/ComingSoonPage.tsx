import { Button } from "@codexsun/ui/components/button"
import { ArrowLeft } from "lucide-react"
import { WorkspacePage } from "@codexsun/ui/workspace"

export function ComingSoonPage({ title, description, onBack }: { title: string; description?: string; onBack?: () => void }) {
  return (
    <WorkspacePage
      title={title}
      description={description ?? ""}
      actions={
        onBack ? (
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-muted/50 p-6">
          <span className="text-4xl">🚧</span>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-foreground/80">Coming Soon</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          This module is in development. Full data management, including create, update, and lookup, will be available in a future release.
        </p>
      </div>
    </WorkspacePage>
  )
}
