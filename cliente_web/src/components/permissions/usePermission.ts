/**
 * Permission hooks
 * Custom hooks for checking permissions
 */

import { useAuth } from "@/contexts/auth-hooks";

/**
 * Hook to check if user has a specific permission
 *
 * @example
 * const canViewReports = usePermission('view_reports');
 *
 * return (
 *   <div>
 *     {canViewReports && <ReportsLink />}
 *   </div>
 * );
 */
export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Hook to check if user has any of the specified permissions
 *
 * @example
 * const canEdit = useAnyPermission(['create_document', 'edit_document']);
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(permissions);
}

/**
 * Hook to check if user has all of the specified permissions
 *
 * @example
 * const canFullEdit = useAllPermissions(['edit_document', 'delete_document']);
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { hasAllPermissions } = useAuth();
  return hasAllPermissions(permissions);
}

/**
 * Hook to get all user permissions
 *
 * @example
 * const userPermissions = usePermissions();
 * console.log('User has', userPermissions.length, 'permissions');
 */
export function usePermissions(): string[] {
  const { permissions } = useAuth();
  return permissions;
}

/**
 * Hook to get user info and permissions
 *
 * @example
 * const { user, permissions, profileName } = useUserInfo();
 */
export function useUserInfo() {
  const { user, permissions } = useAuth();
  return {
    user,
    permissions,
    profileName: user?.profileName,
  };
}
