// types/channel.ts
export interface Channel {
  id: string
  name: string
  category: string
  brandGuidelines: string
  logoUrl: string | null
}

export interface CreateChannelRequest {
  name: string
  category: string
  brandGuidelines?: string
  logo: File | null
}

export interface UpdateChannelRequest {
  id: string
  name?: string
  category?: string
  brandGuidelines?: string
  logo?: File | null
}