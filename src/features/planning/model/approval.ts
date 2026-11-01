import type { PlanningApprovalStatus, PlanningContent } from '../api'

/** Only whoever submitted a post for approval may withdraw it; approvers reject instead. */
export function canWithdrawApproval(content: PlanningContent, userId: string | undefined): boolean {
  return (
    content.approvalStatus === 'pending' &&
    Boolean(userId) &&
    content.approvalRequestedById === userId
  )
}

/**
 * Approval changes the actor may make now. Only drafts change approval: once approved, a post
 * is scheduled or publishing. Approvers approve or reject; the submitter withdraws.
 */
export function approvalTransitions(
  content: PlanningContent,
  { canApprove, canSubmit, userId }: { canApprove: boolean; canSubmit: boolean; userId?: string },
): PlanningApprovalStatus[] {
  if (content.status !== 'draft') return []
  if (content.approvalStatus === 'pending')
    return [
      ...(canApprove ? (['approved', 'rejected'] as const) : []),
      ...(canSubmit && canWithdrawApproval(content, userId) ? (['none'] as const) : []),
    ]
  if (!canSubmit) return []
  if (content.approvalStatus === 'none') return ['pending']
  if (content.approvalStatus === 'rejected') return ['pending', 'none']
  return []
}

export type ApprovalStatusLabelKey =
  | 'approvalStatus.pending'
  | 'approvalStatus.approved'
  | 'approvalStatus.rejected'
  | 'approvalStatus.notSubmitted'
  | 'approvalStatus.notRequired'

/**
 * "No approval" reads like a rejection, so it is named by context: a draft has not been
 * submitted yet; anything else went out without needing approval.
 */
export function approvalStatusLabelKey(content: PlanningContent): ApprovalStatusLabelKey {
  if (content.approvalStatus !== 'none') return `approvalStatus.${content.approvalStatus}`
  return content.status === 'draft' ? 'approvalStatus.notSubmitted' : 'approvalStatus.notRequired'
}

/** How Content waiting for approval will go out once approved; null when not waiting. */
export function pendingApprovalIntent(content: PlanningContent): 'publish_now' | 'schedule' | null {
  if (content.approvalStatus !== 'pending') return null
  return content.approvalIntent ?? (content.scheduledAt ? 'schedule' : 'publish_now')
}
