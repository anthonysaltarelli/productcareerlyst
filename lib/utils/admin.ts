import { createClient } from '@/lib/supabase/server'

/**
 * Check if a user has admin status
 * @param userId - The user ID to check
 * @returns true if user is admin, false otherwise
 */
export const checkAdminStatus = async (userId: string): Promise<boolean> => {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) {
    return false
  }
  
  return data.is_admin === true
}

