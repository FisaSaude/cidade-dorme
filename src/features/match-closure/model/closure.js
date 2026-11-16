export const INITIAL_CLOSURE_STATE = Object.freeze({
  isConfirmOpen: false,
})

export function createClosureState() {
  return { ...INITIAL_CLOSURE_STATE }
}

export function openClosureDialog(state) {
  return { ...state, isConfirmOpen: true }
}

export function closeClosureDialog(state) {
  return { ...state, isConfirmOpen: false }
}

export default createClosureState
