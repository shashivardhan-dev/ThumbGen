// lib/store/features/channels/channelsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Channel {
  id: string;
  name: string;
  category: string;
  brandGuidelines: string;
  logo: string | null;
}

export interface ChannelState {
  // Remove channels array since RTK Query manages this
  selectedChannel: string | null;
  isFormDirty: boolean;
  formMode: "create" | "edit" | "view";
}

const initialState: ChannelState = {
  selectedChannel: null,
  isFormDirty: false,
  formMode: "create",
};

export const channelsSlice = createSlice({
  name: "channels",
  initialState,
  reducers: {
    setSelectedChannel: (state, action: PayloadAction<string | null>) => {
      state.selectedChannel = action.payload;
      // Don't automatically set formMode here - let the component handle it
    },
    
    setFormDirty: (state, action: PayloadAction<boolean>) => {
      state.isFormDirty = action.payload;
    },
    
    setFormMode: (state, action: PayloadAction<"create" | "edit" | "view">) => {
      state.formMode = action.payload;
    },
    
    clearForm: (state) => {
      state.selectedChannel = null;
      state.isFormDirty = false;
      state.formMode = "create";
    },
  },
});

export const {
  setSelectedChannel,
  setFormDirty,
  setFormMode,
  clearForm,
} = channelsSlice.actions;

export default channelsSlice.reducer;