export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: "admin" | "manager" | "customer"
          full_name: string | null
          phone: string | null
          address: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          role?: "admin" | "manager" | "customer"
          full_name?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          role?: "admin" | "manager" | "customer"
          full_name?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          parent_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          parent_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      articles: {
        Row: {
          id: string
          name: string | null
          description: string | null
          weight: number | null
          unit_of_measurement: string | null
          category_id: string | null
          sub_category_id: string | null
          mrp: number | null
          cost_price: number | null
          product_photos: string[] | null
          hsn_code: string | null
          gst_percentage: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          description?: string | null
          weight?: number | null
          unit_of_measurement?: string | null
          category_id?: string | null
          sub_category_id?: string | null
          mrp?: number | null
          cost_price?: number | null
          product_photos?: string[] | null
          hsn_code?: string | null
          gst_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          description?: string | null
          weight?: number | null
          unit_of_measurement?: string | null
          category_id?: string | null
          sub_category_id?: string | null
          mrp?: number | null
          cost_price?: number | null
          product_photos?: string[] | null
          hsn_code?: string | null
          gst_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      vendors: {
        Row: {
          id: string
          name: string
          address: string | null
          contact_number: string | null
          email: string | null
          trade_license: string | null
          gst_number: string | null
          fssai_license: string | null
          gst_file_url: string | null
          fssai_file_url: string | null
          aadhar_file_url: string | null
          pan_file_url: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_ifsc: string | null
          vendor_code: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          contact_number?: string | null
          email?: string | null
          trade_license?: string | null
          gst_number?: string | null
          fssai_license?: string | null
          gst_file_url?: string | null
          fssai_file_url?: string | null
          aadhar_file_url?: string | null
          pan_file_url?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_ifsc?: string | null
          vendor_code?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          contact_number?: string | null
          email?: string | null
          trade_license?: string | null
          gst_number?: string | null
          fssai_license?: string | null
          gst_file_url?: string | null
          fssai_file_url?: string | null
          aadhar_file_url?: string | null
          pan_file_url?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_ifsc?: string | null
          vendor_code?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      purchase_orders: {
        Row: {
          id: string
          vendor_id: string
          vendor_code: string | null
          vendor_name: string | null
          vendor_address: string | null
          vendor_phone: string | null
          vendor_email: string | null
          vendor_gst: string | null
          payment_terms: "0-15 days" | "16-30 days" | "31-45 days" | "46-60 days"
          rtv: "Yes" | "No"
          created_at: string | null
          updated_at: string | null
          po_status: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          vendor_code?: string | null
          vendor_name?: string | null
          vendor_address?: string | null
          vendor_phone?: string | null
          vendor_email?: string | null
          vendor_gst?: string | null
          payment_terms?: "0-15 days" | "16-30 days" | "31-45 days" | "46-60 days"
          rtv?: "Yes" | "No"
          created_at?: string | null
          updated_at?: string | null
          po_status?: string | null
        }
        Update: {
          id?: string
          vendor_id?: string
          vendor_code?: string | null
          vendor_name?: string | null
          vendor_address?: string | null
          vendor_phone?: string | null
          vendor_email?: string | null
          vendor_gst?: string | null
          payment_terms?: "0-15 days" | "16-30 days" | "31-45 days" | "46-60 days"
          rtv?: "Yes" | "No"
          created_at?: string | null
          updated_at?: string | null
          po_status?: string | null
        }
      }
      goods_receipt_notes: {
        Row: {
          id: string
          po_id: string
          received_date: string | null
          status: string | null
          notes: string | null
          received_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          po_id: string
          received_date?: string | null
          status?: string | null
          notes?: string | null
          received_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          po_id?: string
          received_date?: string | null
          status?: string | null
          notes?: string | null
          received_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      grn_items: {
        Row: {
          id: string
          grn_id: string
          po_item_id: string
          article_id: string
          ordered_quantity: number
          received_quantity: number
          rejected_quantity: number | null
          unit_price: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          grn_id: string
          po_item_id: string
          article_id: string
          ordered_quantity: number
          received_quantity: number
          rejected_quantity?: number | null
          unit_price?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          grn_id?: string
          po_item_id?: string
          article_id?: string
          ordered_quantity?: number
          received_quantity?: number
          rejected_quantity?: number | null
          unit_price?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          stock: number
          category: string
          image_url: string | null
          created_at: string | null
          updated_at: string | null
          category_id: string | null
          approval_status: "pending" | "approved" | "rejected"
          rejection_reason: string | null
          submitted_at: string | null
          approved_at: string | null
          brand: string | null
          hsn_code: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          stock?: number
          category: string
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          category_id?: string | null
          approval_status?: "pending" | "approved" | "rejected"
          rejection_reason?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          brand?: string | null
          hsn_code?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          stock?: number
          category?: string
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          category_id?: string | null
          approval_status?: "pending" | "approved" | "rejected"
          rejection_reason?: string | null
          submitted_at?: string | null
          approved_at?: string | null
          brand?: string | null
          hsn_code?: string | null
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string
          is_primary: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          image_url: string
          is_primary?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          image_url?: string
          is_primary?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
       discount_banners: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          link_url: string | null;
          position: string | null;
          priority: number | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          image_url: string;
          link_url?: string | null;
          position?: string | null;
          priority?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          image_url?: string;
          link_url?: string | null;
          position?: string | null;
          priority?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      }
      banners: {
        Row: {
          id: string
          title: string
          image_url: string
          link_url: string | null
          position: string | null
          priority: number | null
          start_date: string | null
          end_date: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          image_url: string
          link_url?: string | null
          position?: string | null
          priority?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          image_url?: string
          link_url?: string | null
          position?: string | null
          priority?: number | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      store_configurations: {
        Row: {
          id: string
          minimum_order_value: number
          minimum_order_enabled: boolean
          created_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          minimum_order_value?: number
          minimum_order_enabled?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          minimum_order_value?: number
          minimum_order_enabled?: boolean
          created_at?: string
          updated_at?: string
          updated_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_term: "0-15 days" | "16-30 days" | "31-45 days" | "46-60 days"
      rtv_status: "Yes" | "No"
      user_role: "admin" | "manager" | "customer"
    }
  }
}
