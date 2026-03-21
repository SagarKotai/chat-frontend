import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ChatUiState {
  selectedChatId: string | null;
  rightPanelOpen: boolean;
  searchTerm: string;
  messageSearchTerm: string;
  pinnedMessageIdsByChat: Record<string, string[]>;
}

const initialState: ChatUiState = {
  selectedChatId: null,
  rightPanelOpen: true,
  searchTerm: '',
  messageSearchTerm: '',
  pinnedMessageIdsByChat: {},
};

const chatUiSlice = createSlice({
  name: 'chatUi',
  initialState,
  reducers: {
    setSelectedChatId: (state, action: PayloadAction<string | null>) => {
      state.selectedChatId = action.payload;
    },
    setRightPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.rightPanelOpen = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setMessageSearchTerm: (state, action: PayloadAction<string>) => {
      state.messageSearchTerm = action.payload;
    },
    pinMessage: (state, action: PayloadAction<{ chatId: string; messageId: string }>) => {
      const { chatId, messageId } = action.payload;
      if (!state.pinnedMessageIdsByChat[chatId]) state.pinnedMessageIdsByChat[chatId] = [];
      if (!state.pinnedMessageIdsByChat[chatId].includes(messageId)) {
        state.pinnedMessageIdsByChat[chatId].unshift(messageId);
      }
    },
    unpinMessage: (state, action: PayloadAction<{ chatId: string; messageId: string }>) => {
      const { chatId, messageId } = action.payload;
      state.pinnedMessageIdsByChat[chatId] = (state.pinnedMessageIdsByChat[chatId] || []).filter(
        (id) => id !== messageId,
      );
    },
  },
});

export const {
  setSelectedChatId,
  setRightPanelOpen,
  setSearchTerm,
  setMessageSearchTerm,
  pinMessage,
  unpinMessage,
} = chatUiSlice.actions;

export default chatUiSlice.reducer;
