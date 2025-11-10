"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowRight, FileText, Upload, RefreshCcw, Users } from "lucide-react"

interface DealersImportContextProps {
  onComplete: (context: any) => void
}

export function DealersImportContext({ onComplete }: DealersImportContextProps) {
  const [purpose, setPurpose] = useState<string>('new_dealers')
  const [dataSource, setDataSource] = useState<string>('manual_entry')
  const [duplicateStrategy, setDuplicateStrategy] = useState<string>('skip')

  const handleContinue = () => {
    onComplete({
      purpose,
      dataSource,
      duplicateStrategy,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Purpose</CardTitle>
          <CardDescription>What type of dealers are you importing?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={purpose} onValueChange={setPurpose} className="space-y-3">
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="new_dealers" id="new_dealers" />
              <div className="flex-1">
                <Label htmlFor="new_dealers" className="cursor-pointer">
                  <div className="font-medium">New Dealers</div>
                  <div className="text-sm text-muted-foreground">
                    Register brand new dealers in the system
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="update_dealers" id="update_dealers" />
              <div className="flex-1">
                <Label htmlFor="update_dealers" className="cursor-pointer">
                  <div className="font-medium">Update Existing Dealers</div>
                  <div className="text-sm text-muted-foreground">
                    Update information for existing dealers
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="territory_assignment" id="territory_assignment" />
              <div className="flex-1">
                <Label htmlFor="territory_assignment" className="cursor-pointer">
                  <div className="font-medium">Territory Assignment</div>
                  <div className="text-sm text-muted-foreground">
                    Assign dealers to field staff and territories
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
                    Mixed dealer data import
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
          <CardDescription>Where is this data coming from?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={dataSource} onValueChange={setDataSource} className="space-y-3">
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="manual_entry" id="manual_entry" />
              <Label htmlFor="manual_entry" className="cursor-pointer">
                <div className="font-medium">Manual Entry / Spreadsheet</div>
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="field_survey" id="field_survey" />
              <Label htmlFor="field_survey" className="cursor-pointer">
                <div className="font-medium">Field Survey / Market Research</div>
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="referral" id="referral" />
              <Label htmlFor="referral" className="cursor-pointer">
                <div className="font-medium">Referral / Partner Network</div>
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="market_research" id="market_research" />
              <Label htmlFor="market_research" className="cursor-pointer">
                <div className="font-medium">Market Research / Database</div>
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <RadioGroupItem value="existing_database" id="existing_database" />
              <Label htmlFor="existing_database" className="cursor-pointer">
                <div className="font-medium">Existing Database / Migration</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Duplicate Handling</CardTitle>
          <CardDescription>What should we do if a dealer already exists?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={duplicateStrategy} onValueChange={setDuplicateStrategy} className="space-y-3">
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="skip" id="skip" />
              <div className="flex-1">
                <Label htmlFor="skip" className="cursor-pointer">
                  <div className="font-medium">Skip Duplicates</div>
                  <div className="text-sm text-muted-foreground">
                    Don't import dealers that already exist (based on dealer code or phone)
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
                    Update existing dealers with new information
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
                    Always create as new dealer (may create duplicates)
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
