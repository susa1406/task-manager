import { supabase } from '../lib/supabase'

export const noteService = {
  async getAll(userId, filters = {}) {
    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async add(record) {
    const { data, error } = await supabase
      .from('notes')
      .insert([record])
      .select()
    if (error) throw error
    return data[0]
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
