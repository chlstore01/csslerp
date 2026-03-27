import { useMemo } from 'react';
import RBAC from '../utils/rbac';

/**
 * Custom Hook for Role-Based Access Control
 * Usage: const permissions = useRBAC(currentUser);
 * Then use: permissions.canEditEmployee, permissions.canViewPayroll, etc.
 */

export default function useRBAC(currentUser) {
  const role = currentUser?.role || 'Guest';

  const permissions = useMemo(() => ({
    // Current user's role
    role,

    // Staff Directory
    canViewStaffDirectory: RBAC.canViewStaffDirectory(role),
    canEditEmployee: RBAC.canEditEmployee(role),
    canDeleteEmployee: RBAC.canDeleteEmployee(role),
    canViewEmployeeSalary: RBAC.canViewEmployeeSalary(role),

    // Own Data Access (available to all employees)
    canViewOwnProfile: RBAC.canViewOwnProfile(role),
    canViewOwnSalary: RBAC.canViewOwnSalary(role),

    // Attendance
    canViewAttendance: RBAC.canViewAttendance(role),
    canMarkAttendance: RBAC.canMarkAttendance(role),
    canViewOwnAttendance: RBAC.canViewOwnAttendance(role),

    // Leave
    canViewLeave: RBAC.canViewLeave(role),
    canApplyLeave: RBAC.canApplyLeave(role),
    canApproveLeave: RBAC.canApproveLeave(role),
    canViewOwnLeave: RBAC.canViewOwnLeave(role),

    // Payroll
    canViewPayroll: RBAC.canViewPayroll(role),
    canManagePayroll: RBAC.canManagePayroll(role),
    canSetDeductions: RBAC.canSetDeductions(role),
    canPrintPayslip: RBAC.canPrintPayslip(role),
    canViewOwnPayslip: RBAC.canViewOwnPayslip(role),

    // Utilities
    canViewResource: (resourceRole) => RBAC.canViewResource(role, resourceRole),
    getRoleDisplay: () => RBAC.getRoleDisplay(role),
    getAvailableModules: () => RBAC.getAvailableModules(role),
    
    // Check multiple permissions (AND logic)
    hasAllPermissions: (...checks) => checks.every(check => check === true),
    
    // Check multiple permissions (OR logic)  
    hasAnyPermission: (...checks) => checks.some(check => check === true),
    
    // Not authorized message
    getAccessDeniedMessage: () => `Your role (${RBAC.getRoleDisplay(role)}) does not have access to this resource.`
  }), [role]);

  return permissions;
}
