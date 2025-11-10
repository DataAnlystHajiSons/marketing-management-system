/**
 * Table Preferences Management using localStorage
 * Handles saving and loading user table preferences
 */

export interface ColumnPreference {
  visible: boolean
  order: number
  width?: number
}

export interface TablePreferences {
  tableName: string
  columns: Record<string, ColumnPreference>
  density: 'compact' | 'comfortable' | 'spacious'
  defaultSort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  lastUpdated: string
}

const STORAGE_KEY_PREFIX = 'table_preferences_'

/**
 * Get preferences for a specific table
 */
export function getTablePreferences(tableName: string): TablePreferences | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tableName}`)
    if (!stored) return null
    
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading table preferences:', error)
    return null
  }
}

/**
 * Save preferences for a specific table
 */
export function saveTablePreferences(preferences: TablePreferences): void {
  if (typeof window === 'undefined') return
  
  try {
    const toSave = {
      ...preferences,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${preferences.tableName}`,
      JSON.stringify(toSave)
    )
  } catch (error) {
    console.error('Error saving table preferences:', error)
  }
}

/**
 * Reset preferences to default
 */
export function resetTablePreferences(tableName: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${tableName}`)
  } catch (error) {
    console.error('Error resetting table preferences:', error)
  }
}

/**
 * Get default preferences for farmers table
 */
export function getDefaultFarmersPreferences(): TablePreferences {
  return {
    tableName: 'farmers',
    columns: {
      // Basic Info
      farmerInfo: { visible: true, order: 1 },
      farmerCode: { visible: false, order: 2 },
      
      // Contact
      phone: { visible: true, order: 3 },
      email: { visible: false, order: 4 },
      
      // Location
      zone: { visible: false, order: 5 },
      area: { visible: false, order: 6 },
      village: { visible: true, order: 7 },
      fullAddress: { visible: false, order: 8 },
      
      // Lead Info
      leadQuality: { visible: true, order: 9 },
      leadStage: { visible: false, order: 10 },
      leadScore: { visible: false, order: 11 },
      customerStatus: { visible: false, order: 12 },
      dataSource: { visible: false, order: 13 },
      
      // Farming Details
      landSize: { visible: false, order: 14 },
      primaryCrops: { visible: false, order: 15 },
      
      // Engagements
      engagements: { visible: true, order: 16 },
      activeProducts: { visible: false, order: 17 },
      
      // Assignments
      assignedTMO: { visible: false, order: 18 },
      assignedFieldStaff: { visible: false, order: 19 },
      assignedDealer: { visible: false, order: 20 },
      
      // Activity
      lastActivity: { visible: true, order: 21 },
      totalInteractions: { visible: false, order: 22 },
      registrationDate: { visible: false, order: 23 },
    },
    density: 'comfortable',
    defaultSort: {
      field: 'name',
      direction: 'asc'
    },
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Merge saved preferences with defaults (in case new columns were added)
 */
export function mergeWithDefaults(
  saved: TablePreferences | null,
  defaults: TablePreferences
): TablePreferences {
  if (!saved) return defaults
  
  // Merge columns - add any new columns from defaults that don't exist in saved
  const mergedColumns = { ...defaults.columns }
  Object.keys(saved.columns).forEach(key => {
    if (mergedColumns[key]) {
      mergedColumns[key] = saved.columns[key]
    }
  })
  
  return {
    ...defaults,
    ...saved,
    columns: mergedColumns
  }
}

/**
 * Export preferences as JSON (for backup)
 */
export function exportPreferences(tableName: string): string {
  const prefs = getTablePreferences(tableName)
  return JSON.stringify(prefs, null, 2)
}

/**
 * Import preferences from JSON
 */
export function importPreferences(jsonString: string): boolean {
  try {
    const prefs = JSON.parse(jsonString) as TablePreferences
    saveTablePreferences(prefs)
    return true
  } catch (error) {
    console.error('Error importing preferences:', error)
    return false
  }
}

/**
 * Get default preferences for dealers table
 */
export function getDefaultDealersPreferences(): TablePreferences {
  return {
    tableName: 'dealers',
    columns: {
      // Basic Info (3 columns)
      dealerInfo: { visible: true, order: 1 }, // Business name + owner
      dealerCode: { visible: true, order: 2 },
      phone: { visible: true, order: 3 },
      
      // Contact (2 columns)
      email: { visible: false, order: 4 },
      alternatePhone: { visible: false, order: 5 },
      
      // Location (3 columns)
      area: { visible: true, order: 6 },
      city: { visible: true, order: 7 },
      fullAddress: { visible: false, order: 8 },
      
      // Relationship (4 columns)
      relationshipStatus: { visible: true, order: 9 },
      relationshipScore: { visible: true, order: 10 },
      performanceRating: { visible: true, order: 11 },
      isActive: { visible: true, order: 12 },
      
      // Financial (2 columns)
      creditLimit: { visible: false, order: 13 },
      currentBalance: { visible: false, order: 14 },
      
      // Assignment (1 column)
      assignedFieldStaff: { visible: true, order: 15 },
      
      // Activity (3 columns)
      lastContact: { visible: true, order: 16 },
      nextContact: { visible: true, order: 17 },
      registrationDate: { visible: false, order: 18 },
      
      // Sales (2 columns)
      salesLast6Months: { visible: true, order: 19 },
      totalSales: { visible: false, order: 20 },
      
      // Actions (1 column) - always visible
      actions: { visible: true, order: 21 },
    },
    density: 'comfortable',
    defaultSort: {
      field: 'business_name',
      direction: 'asc'
    },
    lastUpdated: new Date().toISOString()
  }
}
