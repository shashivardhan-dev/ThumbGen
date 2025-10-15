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
      // Add any auth headers if needed
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
  }),
});

export const { useGetDesignsQuery } = designsApi;
