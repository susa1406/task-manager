import { supabase } from '../lib/supabase'

export const expenseService = {
  async getAll(userId, filters = {}) {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (filters.category && filters.category !== 'All') {
      query = query.eq('category', filters.category)
    }
    if (filters.startDate) query = query.gte('date', filters.startDate)
    if (filters.endDate) query = query.lte('date', filters.endDate)
    if (filters.month) {
      const [year, month] = filters.month.split('-')
      const startDate = `${year}-${month}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async getTotalExpenses(userId) {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
    if (error) throw error
    return data.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
  },

  async getMonthlyTotal(userId) {
    const now = new Date()
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error
    return data.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
  },

  async getTodayTotal(userId) {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .eq('date', today)
    if (error) throw error
    return data.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
  },

  async getCategoryTotals(userId) {
    const now = new Date()
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
    if (error) throw error

    const totals = {}
    data.forEach(r => {
      totals[r.category] = (totals[r.category] || 0) + parseFloat(r.amount || 0)
    })
    return totals
  },

  async add(record) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([record])
      .select()
    if (error) throw error
    return data[0]
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
    if (error) throw error
    return data[0]
  },

  async delete(id) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
