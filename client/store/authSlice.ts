import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UserLike = any;

type AuthState = {
  currentUser: UserLike | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  currentUser: null,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserLike | null>) {
      state.currentUser = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout(state) {
      state.currentUser = null;
      state.isLoading = false;
      state.error = null;
    },
  }
});

export const { setUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;


// import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// type UserLike = any;

// type AuthState = {
//   currentUser: UserLike | null;
//   loading: boolean;
// };

// const initialState: AuthState = {
//   currentUser: null,
//   loading: true,
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     setUser(state, action: PayloadAction<UserLike | null>) {
//       state.currentUser = action.payload;
//       state.loading = false;
//     },
//     setLoading(state, action: PayloadAction<boolean>) {
//       state.loading = action.payload;
//     },
//   }
// });

// export const { setUser, setLoading } = authSlice.actions;
// export default authSlice.reducer;
