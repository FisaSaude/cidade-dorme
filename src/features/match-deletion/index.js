export {
  INITIAL_MATCH_DELETION_STATE,
  MATCH_NOT_FINISHED,
  cancelMatchDeletion,
  createMatchDeletionState,
  getMatchDeletionDecision,
  isAlreadyRemoved,
  requestMatchDeletion,
  shouldCloseDetail,
} from './model/matchDeletion'

export { default as DeleteMatchDialog } from './ui/DeleteMatchDialog'
