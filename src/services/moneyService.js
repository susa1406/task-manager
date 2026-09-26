import { supabase } from '../lib/supabase'

export const moneyService = {
  async getAll(userId) {
    const { data, error } = await supabase
      .from('money_received')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  async getMonthly(userId, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('money_received')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (error) throw error
    return data
  },

  async getTotalReceived(userId) {
    const { data, error } = await supabase
      .from('money_received')
      .select('amount')
      .eq('user_id', userId)
    if (error) throw error
    return data.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
  },

  async getMonthlyTotal(userId) {
    const now = new Date()
    const records = await this.getMonthly(userId, now.getFullYear(), now.getMonth() + 1)
    return records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
  },

  async add(record) {
    const { data, error } = await supabase
      .from('money_received')
      .insert([record])
      .select()
    if (error) throw error
    return data[0]
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('money_received')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase
      .from('money_received')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
