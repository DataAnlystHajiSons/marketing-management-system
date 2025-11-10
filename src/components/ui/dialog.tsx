import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open = false, onOpenChange, children }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)
    const [shouldRender, setShouldRender] = React.useState(false)

    React.useEffect(() => {
      if (open) {
        setShouldRender(true)
        document.body.style.overflow = "hidden"
        // Trigger animation after render
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsVisible(true)
          })
        })
      } else {
        setIsVisible(false)
        document.body.style.overflow = "unset"
        // Wait for animation to complete before unmounting
        const timer = setTimeout(() => {
          setShouldRender(false)
        }, 300) // Match the transition duration
        return () => clearTimeout(timer)
      }
      return () => {
        document.body.style.overflow = "unset"
      }
    }, [open])

    if (!shouldRender) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop with smooth fade */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          onClick={() => onOpenChange?.(false)}
        />
        {/* Content with smooth scale and fade */}
        <div 
          ref={ref} 
          className={cn(
            "relative z-50 transition-all duration-300 ease-out",
            isVisible 
              ? "opacity-100 scale-100" 
              : "opacity-0 scale-95"
          )}
        >
          {children}
        </div>
      </div>
    )
  }
)
Dialog.displayName = "Dialog"

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto",
      "transform transition-all duration-300 ease-out",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 border-b",
      className
    )}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-2 p-6 border-t",
      className
    )}
    {...props}
  />
))
DialogFooter.displayName = "DialogFooter"

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
