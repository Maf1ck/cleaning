import type { CartItem, CleaningType, OrderEstimate, OrderStatus, PriceList, PublicBonus } from './types'

export interface AdminOrderSummary {
  id: string
  status: OrderStatus
  name: string
  phone: string
  address: string
  outOfCity: boolean
  types: CleaningType[]
  estimateTotal: number
  manualCount: number
  finalPrice: number | null
  agreedAt: string | null
  preferredDate: string | null
  preferredTime: string | null
  photoCount: number
  createdAt: string | null
}

export interface AdminOrderList {
  page: number
  hasMore: boolean
  counts: Record<string, number>
  orders: AdminOrderSummary[]
}

export interface AdminOrderEvent {
  id: number
  kind: string
  data: Record<string, unknown>
  at: string | null
}

export interface AdminOrder {
  id: string
  token: string
  status: OrderStatus
  name: string
  phone: string
  address: string
  outOfCity: boolean
  preferredDate: string | null
  preferredTime: string | null
  comment: string
  items: CartItem[]
  priceSnapshot: PriceList
  estimate: OrderEstimate
  finalPrice: number | null
  agreedAt: string | null
  ownerNote: string
  anonymized: boolean
  createdAt: string | null
  updatedAt: string | null
  photos: { id: string; width: number; height: number; size: number }[]
  events: AdminOrderEvent[]
  bonus: PublicBonus | null
}

export interface AdminBonus {
  code: string
  amount: number
  minOrder: number
  expiresAt: string | null
  status: string
  createdAt: string | null
  orderId: string
  name: string
}
