import { Role } from './types';

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 5,
  ADMIN: 4,
  MEMBER: 3,
  GUEST: 2,
  VIEWER: 1,
};

export const PERMISSIONS = {
  // Org level
  MANAGE_ORG: ['OWNER', 'ADMIN'] as Role[],
  MANAGE_BILLING: ['OWNER'] as Role[],
  INVITE_MEMBERS: ['OWNER', 'ADMIN', 'MEMBER'] as Role[],
  
  // Workspace / Project level
  CREATE_WORKSPACE: ['OWNER', 'ADMIN', 'MEMBER'] as Role[],
  MANAGE_WORKSPACE: ['OWNER', 'ADMIN'] as Role[],
  CREATE_PROJECT: ['OWNER', 'ADMIN', 'MEMBER'] as Role[],
  MANAGE_PROJECT_SETTINGS: ['OWNER', 'ADMIN'] as Role[],
  
  // Task level
  CREATE_TASK: ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as Role[],
  EDIT_TASK: ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as Role[],
  DELETE_TASK: ['OWNER', 'ADMIN', 'MEMBER'] as Role[],
  COMMENT_ON_TASK: ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'] as Role[],
  VIEW_TASKS: ['OWNER', 'ADMIN', 'MEMBER', 'GUEST', 'VIEWER'] as Role[],
  
  // Agile & Automation
  MANAGE_SPRINTS: ['OWNER', 'ADMIN', 'MEMBER'] as Role[],
  MANAGE_AUTOMATIONS: ['OWNER', 'ADMIN'] as Role[],
};

export function hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

export function isRoleAtLeast(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}
