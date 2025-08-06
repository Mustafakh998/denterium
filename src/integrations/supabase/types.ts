export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          chief_complaint: string | null
          clinic_id: string | null
          created_at: string | null
          dentist_id: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string | null
          reminders_sent: number | null
          status: string | null
          treatment_type: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          chief_complaint?: string | null
          clinic_id?: string | null
          created_at?: string | null
          dentist_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          reminders_sent?: number | null
          status?: string | null
          treatment_type?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          chief_complaint?: string | null
          clinic_id?: string | null
          created_at?: string | null
          dentist_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          reminders_sent?: number | null
          status?: string | null
          treatment_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          discount_amount: number | null
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_amount: number | null
          patient_id: string | null
          payment_method: string | null
          status: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string | null
          payment_method?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string | null
          payment_method?: string | null
          status?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_payments: {
        Row: {
          amount_iqd: number
          clinic_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string
          sender_name: string
          sender_phone: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          transaction_reference: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_iqd: number
          clinic_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url: string
          sender_name: string
          sender_phone: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_iqd?: number
          clinic_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string
          sender_name?: string
          sender_phone?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_images: {
        Row: {
          annotations: Json | null
          appointment_id: string | null
          clinic_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_type: string
          image_url: string
          metadata: Json | null
          patient_id: string | null
          thumbnail_url: string | null
          title: string | null
          tooth_numbers: number[] | null
        }
        Insert: {
          annotations?: Json | null
          appointment_id?: string | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_type: string
          image_url: string
          metadata?: Json | null
          patient_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          tooth_numbers?: number[] | null
        }
        Update: {
          annotations?: Json | null
          appointment_id?: string | null
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_type?: string
          image_url?: string
          metadata?: Json | null
          patient_id?: string | null
          thumbnail_url?: string | null
          title?: string | null
          tooth_numbers?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_images_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_images_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          avatar_url: string | null
          clinic_id: string | null
          created_at: string | null
          date_of_birth: string | null
          dental_history: Json | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          insurance_number: string | null
          insurance_provider: string | null
          is_active: boolean | null
          last_name: string
          medical_history: Json | null
          medications: string[] | null
          notes: string | null
          patient_number: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          dental_history?: Json | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          last_name: string
          medical_history?: Json | null
          medications?: string[] | null
          notes?: string | null
          patient_number?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          dental_history?: Json | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          insurance_number?: string | null
          insurance_provider?: string | null
          is_active?: boolean | null
          last_name?: string
          medical_history?: Json | null
          medications?: string[] | null
          notes?: string | null
          patient_number?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          clinic_id: string | null
          created_at: string
          dentist_id: string | null
          id: string
          notes: string | null
          patient_age: number | null
          patient_id: string | null
          patient_name: string
          prescribed_drugs: Json
          prescription_number: string | null
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_id?: string | null
          patient_name: string
          prescribed_drugs?: Json
          prescription_number?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          dentist_id?: string | null
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_id?: string | null
          patient_name?: string
          prescribed_drugs?: Json
          prescription_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          bulk_price: number | null
          bulk_quantity: number | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          expiry_date: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          manufacture_date: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          model: string | null
          name: string
          requires_prescription: boolean | null
          sku: string | null
          specifications: Json | null
          stock_quantity: number | null
          supplier_id: string | null
          unit_price: number
          updated_at: string | null
          warranty_months: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          bulk_price?: number | null
          bulk_quantity?: number | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          manufacture_date?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          model?: string | null
          name: string
          requires_prescription?: boolean | null
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          supplier_id?: string | null
          unit_price: number
          updated_at?: string | null
          warranty_months?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          bulk_price?: number | null
          bulk_quantity?: number | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          manufacture_date?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          model?: string | null
          name?: string
          requires_prescription?: boolean | null
          sku?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          supplier_id?: string | null
          unit_price?: number
          updated_at?: string | null
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          clinic_id: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          license_number: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          specialization: string | null
          system_role: Database["public"]["Enums"]["system_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          specialization?: string | null
          system_role?: Database["public"]["Enums"]["system_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          clinic_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          license_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          specialization?: string | null
          system_role?: Database["public"]["Enums"]["system_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_features: {
        Row: {
          created_at: string
          feature_limit: number | null
          feature_name: string
          id: string
          is_enabled: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Insert: {
          created_at?: string
          feature_limit?: number | null
          feature_name: string
          id?: string
          is_enabled?: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Update: {
          created_at?: string
          feature_limit?: number | null
          feature_name?: string
          id?: string
          is_enabled?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_iqd: number
          amount_usd: number
          clinic_id: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          amount_iqd: number
          amount_usd: number
          clinic_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          amount_iqd?: number
          amount_usd?: number
          clinic_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_messages: {
        Row: {
          created_at: string | null
          dentist_id: string | null
          id: string
          is_read: boolean | null
          message_text: string
          order_id: string | null
          product_id: string | null
          sender_type: string | null
          supplier_id: string | null
        }
        Insert: {
          created_at?: string | null
          dentist_id?: string | null
          id?: string
          is_read?: boolean | null
          message_text: string
          order_id?: string | null
          product_id?: string | null
          sender_type?: string | null
          supplier_id?: string | null
        }
        Update: {
          created_at?: string | null
          dentist_id?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          order_id?: string | null
          product_id?: string | null
          sender_type?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_messages_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_messages_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          billing_address: string | null
          clinic_id: string | null
          created_at: string | null
          delivered_at: string | null
          dentist_id: string | null
          discount_amount: number | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_number: string | null
          payment_method: string | null
          payment_status: string | null
          shipping_address: string | null
          shipping_amount: number | null
          status: string | null
          supplier_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          billing_address?: string | null
          clinic_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          dentist_id?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: string | null
          shipping_amount?: number | null
          status?: string | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          billing_address?: string | null
          clinic_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          dentist_id?: string | null
          discount_amount?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: string | null
          shipping_amount?: number | null
          status?: string | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payment_accounts: {
        Row: {
          account_name: string | null
          account_number: string
          created_at: string | null
          id: string
          is_active: boolean | null
          payment_method: string
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          account_number: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method: string
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_pending_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          dentist_id: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          order_id: string | null
          paid_at: string | null
          payment_account_details: Json | null
          payment_method: string | null
          payment_reference: string | null
          status: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          dentist_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_account_details?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          dentist_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_account_details?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_verified: boolean | null
          order_id: string | null
          rating: number | null
          review_text: string | null
          reviewer_id: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          order_id?: string | null
          rating?: number | null
          review_text?: string | null
          reviewer_id?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          order_id?: string | null
          rating?: number | null
          review_text?: string | null
          reviewer_id?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_license: string | null
          city: string | null
          company_name: string
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          fib_account_number: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          payment_accounts: Json | null
          phone: string | null
          qi_card_number: string | null
          rating: number | null
          tax_id: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
          website: string | null
          zaincash_number: string | null
        }
        Insert: {
          address?: string | null
          business_license?: string | null
          city?: string | null
          company_name: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          fib_account_number?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          payment_accounts?: Json | null
          phone?: string | null
          qi_card_number?: string | null
          rating?: number | null
          tax_id?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
          zaincash_number?: string | null
        }
        Update: {
          address?: string | null
          business_license?: string | null
          city?: string | null
          company_name?: string
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          fib_account_number?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          payment_accounts?: Json | null
          phone?: string | null
          qi_card_number?: string | null
          rating?: number | null
          tax_id?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
          zaincash_number?: string | null
        }
        Relationships: []
      }
      treatments: {
        Row: {
          appointment_id: string | null
          clinic_id: string | null
          completion_date: string | null
          cost: number | null
          created_at: string | null
          dentist_id: string | null
          description: string | null
          id: string
          insurance_covered: number | null
          notes: string | null
          patient_id: string | null
          patient_paid: number | null
          status: string | null
          tooth_numbers: number[] | null
          treatment_code: string | null
          treatment_date: string | null
          treatment_name: string
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          clinic_id?: string | null
          completion_date?: string | null
          cost?: number | null
          created_at?: string | null
          dentist_id?: string | null
          description?: string | null
          id?: string
          insurance_covered?: number | null
          notes?: string | null
          patient_id?: string | null
          patient_paid?: number | null
          status?: string | null
          tooth_numbers?: number[] | null
          treatment_code?: string | null
          treatment_date?: string | null
          treatment_name: string
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string | null
          completion_date?: string | null
          cost?: number | null
          created_at?: string | null
          dentist_id?: string | null
          description?: string | null
          id?: string
          insurance_covered?: number | null
          notes?: string | null
          patient_id?: string | null
          patient_paid?: number | null
          status?: string | null
          tooth_numbers?: number[] | null
          treatment_code?: string | null
          treatment_date?: string | null
          treatment_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_dentist_id_fkey"
            columns: ["dentist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_clinic: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_prescription_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_super_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      payment_method:
        | "stripe"
        | "qi_card"
        | "zain_cash"
        | "bank_transfer"
        | "fib"
      payment_status: "pending" | "approved" | "rejected" | "expired"
      subscription_plan: "basic" | "premium" | "enterprise"
      system_role: "super_admin" | "support" | "user"
      user_role:
        | "admin"
        | "dentist"
        | "assistant"
        | "receptionist"
        | "patient"
        | "supplier"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method: [
        "stripe",
        "qi_card",
        "zain_cash",
        "bank_transfer",
        "fib",
      ],
      payment_status: ["pending", "approved", "rejected", "expired"],
      subscription_plan: ["basic", "premium", "enterprise"],
      system_role: ["super_admin", "support", "user"],
      user_role: [
        "admin",
        "dentist",
        "assistant",
        "receptionist",
        "patient",
        "supplier",
      ],
    },
  },
} as const
