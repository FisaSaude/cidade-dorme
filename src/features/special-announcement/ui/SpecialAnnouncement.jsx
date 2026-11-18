import { SpecialOverlay } from '@/shared/ui/SpecialOverlay'
import { getAnnouncementText } from '../model/announcements'

/**
 * View de anúncio especial independente do motor.
 * @param {{ phase: string, onDismiss?: () => void }} props
 */
export function SpecialAnnouncement({ phase, onDismiss }) {
  const title = getAnnouncementText(phase)

  if (!title) {
    return null
  }

  return <SpecialOverlay title={title} onDismiss={onDismiss} />
}

export default SpecialAnnouncement
