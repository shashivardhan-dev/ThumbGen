import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";



export interface thumbnailVersion {
  id: string;
  thumbnailId: string;
  input: [
    {
      type: 'user' | 'assistant';
      message: string;
      suggestions?: string[]
    }
  ];
  s3Key: string;
  isSelected: boolean;
  createdAt: string;
}
export interface thumbnail {
  id: string;
  userId: string;
  isFavourite: boolean;
  title: string;
  createdAt: string;
  versions: thumbnailVersion[];
}

export const designsApi = createApi({
  reducerPath: "designsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    prepareHeaders: (headers) => {
      return headers;
    },
  }),
  tagTypes: ["Design"],
  endpoints: (builder) => ({
    getDesigns: builder.query<{ designs: thumbnail[] }, void>({
      query: () => "history",
      providesTags: (result) =>
        result
          ? [
              ...result.designs.map(({ id }) => ({
                type: "Design" as const,
                id,
              })),
              { type: "Design", id: "LIST" },
            ]
          : [{ type: "Design", id: "LIST" }],
    }),

    addFavourite: builder.mutation<void, string>({
      query: (id) => ({
        url: `favourite/${id}`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Design", id },
        { type: "Design", id: "LIST" },
      ],
    }),

    removeFavourite: builder.mutation<void, string>({
      query: (id) => ({
        url: `favourite/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Design", id },
        { type: "Design", id: "LIST" },
      ],
    })
  }),
});

export const { useGetDesignsQuery, useAddFavouriteMutation, useRemoveFavouriteMutation } = designsApi;
