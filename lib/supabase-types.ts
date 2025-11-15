// You can generate these types automatically from your Supabase schema using:
// npx supabase gen types typescript --project-id jshyrizjqtvhiwmmraqp > lib/supabase-types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Add your database types here
// Example:
// export interface Database {
//   public: {
//     Tables: {
//       your_table: {
//         Row: {
//           id: number
//           created_at: string
//           // ... other fields
//         }
//         Insert: {
//           id?: number
//           created_at?: string
//           // ... other fields
//         }
//         Update: {
//           id?: number
//           created_at?: string
//           // ... other fields
//         }
//       }
//     }
//   }
// }
