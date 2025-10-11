/**
 * Permission constants and utilities
 * Defines all available permissions in the system
 */

// Permission constants matching backend
export const PERMISSIONS = {
  // Reports
  VIEW_REPORTS: "view_reports",

  // Documents
  CREATE_DOCUMENT: "create_document",
  EDIT_DOCUMENT: "edit_document",
  DELETE_DOCUMENT: "delete_document",

  // Users
  VIEW_USERS: "view_users",
  EDIT_PROFILE: "edit_profile",
  DELETE_USER: "delete_user",

  // Permissions
  MANAGE_PERMISSIONS: "manage_permissions",
} as const;

// Type for permission values
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  [PERMISSIONS.VIEW_REPORTS]: "Ver reportes de auditoría y ventas",
  [PERMISSIONS.CREATE_DOCUMENT]: "Crear nuevos documentos",
  [PERMISSIONS.EDIT_DOCUMENT]: "Editar documentos existentes",
  [PERMISSIONS.DELETE_DOCUMENT]: "Eliminar documentos",
  [PERMISSIONS.VIEW_USERS]: "Ver información de usuarios",
  [PERMISSIONS.EDIT_PROFILE]: "Editar perfiles de usuario",
  [PERMISSIONS.DELETE_USER]: "Eliminar usuarios del sistema",
  [PERMISSIONS.MANAGE_PERMISSIONS]: "Gestionar permisos del sistema",
};

// Profile types
export const PROFILES = {
  ADMINISTRATOR: "Administrator", // TODO: Review roles and permissions for ASRs
  EDITOR: "Editor",
  VIEWER: "Viewer",
  MANAGER: "Manager",
} as const;

// Helper to check if a permission is valid
export const isValidPermission = (
  permission: string
): permission is Permission => {
  return Object.values(PERMISSIONS).includes(permission as Permission);
};
