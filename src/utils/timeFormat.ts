import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isThisYear,
} from "date-fns";

/**
 * Format last seen time in 12-hour format with smart display
 * @param lastSeen - ISO string or Date object
 * @returns Formatted time string
 */
export const formatLastSeen = (lastSeen: string | Date): string => {
  const date = new Date(lastSeen);

  // If today, show time in 12-hour format
  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  // If yesterday, show "Yesterday" and time
  if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  }

  // If this year, show month, day, and time
  if (isThisYear(date)) {
    return format(date, "MMM d, h:mm a");
  }

  // If older than this year, show full date and time
  return format(date, "MMM d, yyyy, h:mm a");
};

/**
 * Format message time in 12-hour format with smart display
 * @param messageTime - ISO string or Date object
 * @returns Formatted time string
 */
export const formatMessageTime = (messageTime: string | Date): string => {
  const date = new Date(messageTime);

  // If today, show time in 12-hour format
  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  // If yesterday, show "Yesterday" and time
  if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  }

  // If this year, show month, day, and time
  if (isThisYear(date)) {
    return format(date, "MMM d, h:mm a");
  }

  // If older than this year, show full date and time
  return format(date, "MMM d, yyyy, h:mm a");
};

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param time - ISO string or Date object
 * @returns Relative time string
 */
export const formatRelativeTime = (time: string | Date): string => {
  return formatDistanceToNow(new Date(time), { addSuffix: true });
};
