import { supabase } from './client'

export interface Meeting {
  id: string
  meeting_title: string
  meeting_type: string
  meeting_date: string
  meeting_time?: string
  venue: string
  area_id?: string
  organized_by?: string
  total_invitees: number
  total_attendees: number
  status: string
  notes?: string
  created_at: string
}

export const meetingsAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: false })
    return { data, error }
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  create: async (meeting: Partial<Meeting>) => {
    const { data, error } = await supabase
      .from('meetings')
      .insert(meeting)
      .select()
      .single()
    return { data, error }
  },

  update: async (id: string, meeting: Partial<Meeting>) => {
    const { data, error } = await supabase
      .from('meetings')
      .update(meeting)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },
}
