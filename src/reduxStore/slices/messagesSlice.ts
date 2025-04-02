import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface User {
    username: string;
    nickname: string;
}

interface Message {
    id: number;
    createdAt: string;
    content: string;
    user: User;
}

interface MessageState {
    messages: Message[];
}

const initialState: MessageState = {
    messages: [],
};

export const messagesSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload;
        }
    }
});

export const { setMessages } = messagesSlice.actions;

export default messagesSlice.reducer;