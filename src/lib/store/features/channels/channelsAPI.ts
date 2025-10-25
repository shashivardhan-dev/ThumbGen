// lib/store/features/channels/channelsAPI.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface Channel {
  id: string;
  name: string;
  category: string;
  brandGuidelines: string;
  logoUrl: string | null;
}

export interface CreateChannelRequest {
  name: string;
  category: string;
  brandGuidelines?: string;
  logo?: File | null;
}

export interface UpdateChannelRequest {
  id: string;
  name?: string;
  category?: string;
  brandGuidelines?: string;
  logo?: File | null;
}

export const channelsApi = createApi({
  reducerPath: 'channelsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers) => {
      // Add any auth headers if needed
      return headers
    },
    credentials: 'include',
  }),
  tagTypes: ['Channel'],
  endpoints: (builder) => ({
    // Get all channels
    getChannels: builder.query<{channels: Channel[]}, void>({
      query: () => 'channels',
      providesTags: (result) =>
        result
          ? [
              ...result.channels.map(({ id }) => ({ type: 'Channel' as const, id })),
              { type: 'Channel', id: 'LIST' },
            ]
          : [{ type: 'Channel', id: 'LIST' }],
    }),
        
    // Get channel by ID
    getChannelById: builder.query<Channel, string>({
      query: (id) => `channels/${id}`,
      providesTags: (result, error, id) => [{ type: 'Channel', id }],
    }),
        
    // Create new channel
    createChannel: builder.mutation<Channel, CreateChannelRequest>({
      query: (channelData) => {
        const formData = new FormData()
        formData.append('name', channelData.name)
        formData.append('category', channelData.category)
        if (channelData.brandGuidelines) {
          formData.append('brandGuidelines', channelData.brandGuidelines)
        }
                
        if (channelData.logo) {
          formData.append('logo', channelData.logo)
        }
                
        return {
          url: 'channels',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: [{ type: 'Channel', id: 'LIST' }],
    }),
        
    // Update channel
    updateChannel: builder.mutation<Channel, UpdateChannelRequest>({
      query: ({ id, ...channelData }) => {
        const formData = new FormData()
                
        if (channelData.name) formData.append('name', channelData.name)
        if (channelData.category) formData.append('category', channelData.category)
        if (channelData.brandGuidelines) formData.append('brandGuidelines', channelData.brandGuidelines)
        if (channelData.logo) formData.append('logo', channelData.logo)
                
        return {
          url: `channels/${id}`,
          method: 'PUT',
          body: formData,
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Channel', id },
        { type: 'Channel', id: 'LIST' },
      ],
    }),
        
    // Delete channel
    deleteChannel: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `channels/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Channel', id },
        { type: 'Channel', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetChannelsQuery,
  useGetChannelByIdQuery,
  useCreateChannelMutation,
  useUpdateChannelMutation,
  useDeleteChannelMutation,
} = channelsApi