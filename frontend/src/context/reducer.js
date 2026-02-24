export const initialState = {
  loading: false,
  resumeResult: null,
  rexcodeResult: null,
  error: null
}

export const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_RESUME_RESULT':
      return { ...state, resumeResult: action.payload }
    case 'SET_REXCODE_RESULT':
      return { ...state, rexcodeResult: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    default:
      return state
  }
}