"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowRight } from "lucide-react"

interface VillagesImportContextProps {
  onComplete: (context: any) => void
}

export function VillagesImportContext({ onComplete }: VillagesImportContextProps) {
  const [purpose, setPurpose] = useState<string>('new_villages')
  const [duplicateStrategy, setDuplicateStrategy] = useState<string>('skip')

  const handleContinue = () => {
    onComplete({
      purpose,
      duplicateStrategy,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Purpose</CardTitle>
          <CardDescription>What type of villages are you importing?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={purpose} onValueChange={setPurpose} className="space-y-3">
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="new_villages" id="new_villages" />
              <div className="flex-1">
                <Label htmlFor="new_villages" className="cursor-pointer">
                  <div className="font-medium">New Villages</div>
                  <div className="text-sm text-muted-foreground">
                    Register brand new villages in the system
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="update_villages" id="update_villages" />
              <div className="flex-1">
                <Label htmlFor="update_villages" className="cursor-pointer">
                  <div className="font-medium">Update Existing Villages</div>
                  <div className="text-sm text-muted-foreground">
                    Update information for existing villages
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="general" id="general" />
              <div className="flex-1">
                <Label htmlFor="general" className="cursor-pointer">
                  <div className="font-medium">General Import</div>
                  <div className="text-sm text-muted-foreground">
                    Mixed village data import
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duplicate Handling</CardTitle>
          <CardDescription>What should we do if a village already exists? (Detected by same name + area)</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={duplicateStrategy} onValueChange={setDuplicateStrategy} className="space-y-3">
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="skip" id="skip" />
              <div className="flex-1">
                <Label htmlFor="skip" className="cursor-pointer">
                  <div className="font-medium">Skip Duplicates</div>
                  <div className="text-sm text-muted-foreground">
                    Don't import villages that already exist (based on name + area)
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="update" id="update" />
              <div className="flex-1">
                <Label htmlFor="update" className="cursor-pointer">
                  <div className="font-medium">Update Existing</div>
                  <div className="text-sm text-muted-foreground">
                    Update existing villages with new information
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="create_new" id="create_new" />
              <div className="flex-1">
                <Label htmlFor="create_new" className="cursor-pointer">
                  <div className="font-medium">Create as New</div>
                  <div className="text-sm text-muted-foreground">
                    Always create as new village (may create duplicates)
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleContinue} size="lg">
          Continue to Upload
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
