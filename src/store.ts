import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

export type StoreHistory = {
  name: string
  payload: any
}

const initialState: {
  undoStack: StoreHistory[]
  redoStack: StoreHistory[]
} = {
  undoStack: [],
  redoStack: [],
}

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushHistory(state, action: PayloadAction<StoreHistory>) {
      state.undoStack.push(action.payload)
      state.redoStack = []
    },
    popHistory(state) {
      const stack = state.undoStack.pop()
      if (!stack) return
      state.redoStack.push(stack!)
    },
    redo(state) {
      const stack = state.redoStack.pop()
      if (!stack) return
      state.undoStack.push(stack!)
    }
  },
})

export const historyActions = historySlice.actions

export const store = configureStore({
  reducer: combineReducers({
    history: historySlice.reducer
  })
})

export type RootState = ReturnType<typeof store.getState>