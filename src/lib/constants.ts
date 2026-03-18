/** Application-wide constants. Replaces magic numbers across the codebase. */

export const LIMITS = {
  /** Max audio recording duration in seconds (1 hour) */
  AUDIO_MAX_DURATION_SECONDS: 3600,
  /** Max audio file size for upload (50MB) */
  AUDIO_MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
  /** Max photo file size for upload (10MB) */
  PHOTO_MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  /** Default appointment duration in minutes */
  DEFAULT_APPOINTMENT_DURATION_MINUTES: 60,
  /** Patient access token expiry in days */
  PATIENT_TOKEN_EXPIRY_DAYS: 30,
  /** Organization invite expiry in days */
  INVITE_EXPIRY_DAYS: 7,
  /** Max users returned from admin search */
  MAX_USERS_PER_SEARCH: 1000,
  /** Patients per page in list view */
  PATIENTS_PAGE_SIZE: 50,
} as const;

export const APPOINTMENT_STATUSES = {
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const;

/** Valid status transitions for appointments */
export const APPOINTMENT_TRANSITIONS: Record<string, string[]> = {
  scheduled: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
} as const;
