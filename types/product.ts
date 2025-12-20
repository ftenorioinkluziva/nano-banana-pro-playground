export interface Product {
  id: number
  name: string
  slug: string | null
  price: string | null
  category: string | null
  format: string | null
  quantity_label: string | null
  description: string | null
  usage_instructions: string | null
  contraindications: string | null
  ingredients: string | null
  benefits: any
  nutritional_info: any
  image_url: string | null
  target_audience: string | null
  brand_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Brand {
  id: number
  name: string
  tone: string | null
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductWithBrand extends Product {
  brand_tone?: string | null
  brand_name?: string | null
}
