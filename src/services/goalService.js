import { supabase } from '../lib/supabase'

export const goalService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  async getActive(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'Active')
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    return data[0] || null
  },

  async add(record) {
    const { data, error } = await supabase
      .from('goals')
      .insert([record])
      .select()
    if (error) throw error
    return data[0]
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
