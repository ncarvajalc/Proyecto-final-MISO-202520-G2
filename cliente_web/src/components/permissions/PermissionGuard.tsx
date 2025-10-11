/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */

import { type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-hooks";

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

/**
 * PermissionGuard - Renders children only if user has required permissions
 *
 * @param permission - Single permission to check
 * @param permissions - Array of permissions to check
 * @param requireAll - If true, user must have ALL permissions. If false, user needs ANY permission
 * @param fallback - What to render if user doesn't have permission
 *
 * @example
 * // Single permission
 * <PermissionGuard permission="view_reports">
 *   <ReportsSection />
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions (any)
 * <PermissionGuard permissions={['create_document', 'edit_document']}>
 *   <DocumentEditor />
 * </PermissionGuard>
 *
 * @example
 * // Multiple permissions (all required)
 * <PermissionGuard permissions={['edit_document', 'delete_document']} requireAll>
 *   <AdvancedEditor />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified, render children
  return <>{children}</>;
}
