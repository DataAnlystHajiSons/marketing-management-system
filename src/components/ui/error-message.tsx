import { AlertCircle } from "lucide-react"
import { Button } from "./button"

interface ErrorMessageProps {
  title?: string
  message: string
  retry?: () => void
}

export function ErrorMessage({ title = "Error", message, retry }: ErrorMessageProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {retry && (
          <Button onClick={retry}>Try Again</Button>
        )}
      </div>
    </div>
  )
}
