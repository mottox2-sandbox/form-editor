import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'

type History = {
  name: string
  payload: any
}

const initialState: {
  histories: History[]
} = {
  histories: [],
}

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushHistory(state, action: PayloadAction<History>) {
      state.histories.push(action.payload)
    },
    popHistory(state) {
      state.histories.pop()
    }
  },
})

export const historyActions = historySlice.actions

export const store = configureStore({
  reducer: combineReducers({
    history: historySlice.reducer
  })
})
