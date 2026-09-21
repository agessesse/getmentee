/**
 * Where a notification points. Shared by the bell in the top bar and the
 * "Since you were here" line on the dashboard, so the same event never sends
 * two people to two different places.
 */
export function notificationHref(type: string, data?: Record<string, string>): string {
  switch (type) {
    case 'request_received':     return '/requests';
    case 'request_accepted':     return '/mentorships';
    case 'request_declined':     return '/requests';
    case 'new_message':          return data?.mentorship_id ? `/messages?mentorshipId=${data.mentorship_id}` : '/messages';
    case 'session_scheduled':    return '/schedule';
    case 'session_reminder':     return '/schedule';
    case 'session_cancelled':    return '/schedule';
    case 'goal_completed':       return '/goals';
    case 'action_item_due':      return '/goals';
    case 'action_item_assigned': return '/goals';
    case 'review_received':      return '/impact';
    default:                     return '/dashboard';
  }
}
