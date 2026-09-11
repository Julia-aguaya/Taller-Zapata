// The backend represents ROLE_ADMIN's global assignment with both scope IDs absent.
export const hasGlobalAdminScope = (session) => (session?.scopes ?? []).some(
  ({ organizationId, branchId }) => organizationId == null && branchId == null,
);
