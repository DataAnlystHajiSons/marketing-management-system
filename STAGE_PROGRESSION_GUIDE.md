# Stage Progression System - Complete Guide

## Overview

Farmers progress through stages in their journey from lead to customer. The system supports **both automatic and manual stage progression**.

---

## Stage Flow

```
new
  ↓ (first contact)
contacted
  ↓ (qualification)
qualified
  ↓ (invite to meeting)
meeting_invited
  ↓ (attends meeting)
meeting_attended
  ↓ (schedule visit)
visit_scheduled
  ↓ (complete visit)
visit_completed
  ↓ (shows interest)
interested
  ↓ (price discussion)
negotiation
  ↓ (makes purchase)
converted
  ↓ (repeat customer)
active_customer

Alternative endings:
  → inactive (no response)
  → lost (chose competitor)
  → rejected (not interested)
```

---

## Automatic Stage Progression

After running `ENGAGEMENT_STAGE_HISTORY_MIGRATION.sql`, stages update automatically when activities are logged:

### **Trigger: Log Activity → Auto Stage Change**

| Current Stage | Activity Type | New Stage | Auto? |
|---------------|---------------|-----------|-------|
| new | call, email, whatsapp | contacted | ✅ Yes |
| contacted | meeting | meeting_attended | ✅ Yes |
| qualified | meeting | meeting_attended | ✅ Yes |
| new/contacted/qualified | visit | visit_completed | ✅ Yes |
| meeting_attended | visit | visit_completed | ✅ Yes |

**Example:**
```
Farmer: Ahmed Khan (Onion - Winter 2024)
Stage: new

TMO logs activity:
  Type: call
  Title: "Discussed Onion seeds"
  
Automatic Result:
  ✅ Stage changes: new → contacted
  ✅ History recorded
  ✅ Score updated
  ✅ Notification: "Stage changed to Contacted"
```

---

## Manual Stage Progression

### **Current Limitation:**
❌ No UI to manually change stages yet!

### **What's Needed:**
Manual stage change controls on:
1. Farmer Detail Page - engagement cards
2. Product Engagements tab
3. Farmers List page - bulk actions

---

## Recommended Implementation

### **Option 1: Stage Change Dropdown (Quick)**

Add to each engagement card:

```jsx
<div className="flex items-center gap-2">
  <Label>Stage:</Label>
  <Select 
    value={engagement.lead_stage}
    onChange={(e) => handleStageChange(engagement.id, e.target.value)}
  >
    <option value="new">New</option>
    <option value="contacted">Contacted</option>
    <option value="qualified">Qualified</option>
    <option value="meeting_invited">Meeting Invited</option>
    <option value="meeting_attended">Meeting Attended</option>
    <option value="visit_scheduled">Visit Scheduled</option>
    <option value="visit_completed">Visit Completed</option>
    <option value="interested">Interested</option>
    <option value="negotiation">Negotiation</option>
    <option value="converted">Converted</option>
    <option value="active_customer">Active Customer</option>
    <option value="inactive">Inactive</option>
    <option value="lost">Lost</option>
    <option value="rejected">Rejected</option>
  </Select>
</div>

async function handleStageChange(engagementId, newStage) {
  await farmerEngagementsAPI.updateStage(
    engagementId, 
    newStage,
    currentUserId,
    'Stage changed manually by TMO'
  )
}
```

### **Option 2: Stage Action Buttons (Better UX)**

Add stage progression buttons:

```jsx
<div className="flex gap-2">
  {/* Show relevant next action based on current stage */}
  {engagement.lead_stage === 'contacted' && (
    <Button onClick={() => moveToStage('qualified')}>
      Mark as Qualified
    </Button>
  )}
  
  {engagement.lead_stage === 'qualified' && (
    <Button onClick={() => moveToStage('meeting_invited')}>
      Invite to Meeting
    </Button>
  )}
  
  {engagement.lead_stage === 'meeting_attended' && (
    <Button onClick={() => moveToStage('visit_scheduled')}>
      Schedule Visit
    </Button>
  )}
  
  {engagement.lead_stage === 'interested' && (
    <Button onClick={() => moveToStage('negotiation')}>
      Start Negotiation
    </Button>
  )}
  
  {engagement.lead_stage === 'negotiation' && (
    <Button onClick={() => moveToStage('converted')}>
      Mark as Converted
    </Button>
  )}
</div>
```

### **Option 3: Stage Change Modal (Most Control)**

```jsx
<Dialog>
  <DialogTrigger>
    <Button variant="outline">Change Stage</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Change Stage</DialogTitle>
      <DialogDescription>
        Update the stage for this product engagement
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>Current Stage</Label>
        <Badge>{engagement.lead_stage}</Badge>
      </div>
      
      <div>
        <Label>New Stage</Label>
        <Select value={newStage} onChange={setNewStage}>
          {/* All stage options */}
        </Select>
      </div>
      
      <div>
        <Label>Reason for Change</Label>
        <Textarea 
          placeholder="Why is this stage changing?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      
      <Button onClick={handleSubmit}>
        Update Stage
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## Integration with Log Activity Modal

### **Current Behavior:**
When TMO logs an activity:
1. Activity is saved to database
2. Trigger fires
3. Stage auto-updates (if applicable)
4. Score recalculates
5. History recorded

### **Recommended Enhancement:**

Show stage prediction in the modal:

```jsx
<LogActivityModal>
  {/* Existing fields */}
  
  {/* Add this prediction */}
  {activityType === 'call' && engagement.lead_stage === 'new' && (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
      <p className="text-sm font-medium text-blue-900">
        📈 Stage will auto-update
      </p>
      <p className="text-xs text-blue-700">
        After logging this call, stage will change from "New" to "Contacted"
      </p>
    </div>
  )}
  
  {activityType === 'meeting' && (
    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
      <p className="text-sm font-medium text-purple-900">
        📈 Stage will auto-update
      </p>
      <p className="text-xs text-purple-700">
        Stage will change to "Meeting Attended"
      </p>
    </div>
  )}
</LogActivityModal>
```

---

## Stage Change Rules

### **Allowed Progressions:**

| From | To | Method | Validation |
|------|-----|--------|-----------|
| new | contacted | Auto/Manual | Must have activity |
| contacted | qualified | Manual | TMO assessment |
| qualified | meeting_invited | Manual | Meeting scheduled |
| meeting_invited | meeting_attended | Auto | Meeting activity logged |
| meeting_attended | visit_scheduled | Manual | Visit planned |
| visit_scheduled | visit_completed | Auto | Visit activity logged |
| visit_completed | interested | Manual | Farmer shows interest |
| interested | negotiation | Manual | Price discussion started |
| negotiation | converted | Manual/Auto | Purchase made |
| converted | active_customer | Auto | Repeat purchase |

### **Rejected/Lost:**
Any stage can move to:
- `rejected` - Farmer not interested
- `lost` - Chose competitor
- `inactive` - No response for 90+ days

---

## API Usage

### **Manual Stage Change:**

```typescript
// Update stage with reason
await farmerEngagementsAPI.updateStage(
  engagementId: string,
  newStage: LeadStage,
  changedBy: string,
  reason?: string
)

// Example
await farmerEngagementsAPI.updateStage(
  'eng-123',
  'interested',
  currentUserId,
  'Farmer expressed strong interest in Onion seeds after visit'
)
```

### **Get Stage History:**

```typescript
// Fetch all stage changes for an engagement
const { data } = await farmerEngagementsAPI.getStageHistory(engagementId)

// Returns:
[
  {
    previous_stage: 'new',
    new_stage: 'contacted',
    duration_in_previous_stage_days: 0,
    lead_score_at_change: 5,
    changed_by_user: { full_name: 'Ali Raza' },
    triggered_by: 'activity',
    created_at: '2024-10-01'
  },
  {
    previous_stage: 'contacted',
    new_stage: 'meeting_attended',
    duration_in_previous_stage_days: 5,
    lead_score_at_change: 20,
    triggered_by: 'activity',
    created_at: '2024-10-06'
  }
]
```

---

## Dashboard Widgets

### **Stage Funnel View:**

```
New             (50) ████████████████████
Contacted       (40) ████████████████
Qualified       (30) ████████████
Meeting Invited (20) ████████
Meeting Attended(15) ██████
Interested      (10) ████
Negotiation     (5)  ██
Converted       (3)  █
```

### **Stage Duration Report:**

| Stage | Avg Days | Fastest | Slowest |
|-------|----------|---------|---------|
| new → contacted | 2 days | 0 days | 7 days |
| contacted → qualified | 5 days | 1 day | 14 days |
| qualified → meeting_attended | 7 days | 3 days | 21 days |
| interested → converted | 14 days | 5 days | 45 days |

---

## Next Steps to Implement

### **High Priority:**
1. ✅ Database trigger exists (after migration)
2. ✅ API method exists (`updateStage`)
3. ❌ **Need:** UI to manually change stages
4. ❌ **Need:** Stage history timeline component
5. ❌ **Need:** Stage change confirmation modal

### **Recommended Quick Win:**

Add stage dropdown to engagement cards on Farmer Detail page:

```tsx
// In Product Engagements tab
{activeEngagements.map((eng) => (
  <Card key={eng.id}>
    {/* Existing engagement info */}
    
    <div className="flex items-center justify-between mt-4">
      <div>
        <Label>Current Stage</Label>
        <Badge>{eng.lead_stage}</Badge>
      </div>
      
      <Select 
        value={eng.lead_stage}
        onChange={(e) => handleStageChange(eng.id, e.target.value)}
      >
        <option value="contacted">Contacted</option>
        <option value="qualified">Qualified</option>
        <option value="interested">Interested</option>
        <option value="negotiation">Negotiation</option>
        <option value="converted">Converted</option>
        {/* etc */}
      </Select>
    </div>
  </Card>
))}
```

---

## Summary

### **Current State:**
- ✅ Stage progression database structure exists
- ✅ Automatic stage changes work (after migration)
- ✅ API supports manual stage changes
- ✅ Stage history is tracked
- ❌ No UI for manual stage changes yet

### **What Happens Now:**
1. Farmer created → Stage: `new`
2. TMO logs call → Auto changes to `contacted`
3. TMO logs meeting → Auto changes to `meeting_attended`
4. TMO logs visit → Auto changes to `visit_completed`
5. **For other stages:** Need manual UI controls

### **Action Required:**
Implement manual stage change UI on farmer detail page (engagement cards) to allow TMO to move farmers through all stages manually when needed.

---

**Would you like me to implement the stage change UI now?** 🚀
