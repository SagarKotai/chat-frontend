import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface MessageUiState {
  draftByChatId: Record<string, string>;
  reactionsByMessageId: Record<string, string[]>;
  typingByChatId: Record<string, string[]>;
  voiceRecording: boolean;
}

const initialState: MessageUiState = {
  draftByChatId: {},
  reactionsByMessageId: {},
  typingByChatId: {},
  voiceRecording: false,
};

const messageUiSlice = createSlice({
  name: 'messageUi',
  initialState,
  reducers: {
    setDraft: (state, action: PayloadAction<{ chatId: string; text: string }>) => {
      state.draftByChatId[action.payload.chatId] = action.payload.text;
    },
    toggleReaction: (state, action: PayloadAction<{ messageId: string; emoji: string }>) => {
      const { messageId, emoji } = action.payload;
      const current = state.reactionsByMessageId[messageId] || [];
      state.reactionsByMessageId[messageId] = current.includes(emoji)
        ? current.filter((x) => x !== emoji)
        : [...current, emoji];
    },
    setTypingUsers: (state, action: PayloadAction<{ chatId: string; userIds: string[] }>) => {
      state.typingByChatId[action.payload.chatId] = action.payload.userIds;
    },
    setVoiceRecording: (state, action: PayloadAction<boolean>) => {
      state.voiceRecording = action.payload;
    },
  },
});

export const { setDraft, toggleReaction, setTypingUsers, setVoiceRecording } =
  messageUiSlice.actions;
export default messageUiSlice.reducer;
