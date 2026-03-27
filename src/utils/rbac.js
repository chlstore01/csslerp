/**
 * Role-Based Access Control (RBAC) Rules
 * Centralized permission definitions for all roles
 */

export const RBAC = {
  // Staff Directory Permissions
  canViewStaffDirectory: (role) => {
    return ["Admin", "HR Manager", "General Manager", "Finance Manager"].includes(role);
  },

  canEditEmployee: (role) => {
    return ["Admin", "HR Manager"].includes(role);
  },

  canDeleteEmployee: (role) => {
    return ["Admin"].includes(role);
  },

  canViewEmployeeSalary: (role) => {
    return ["Admin", "General Manager", "Finance Manager"].includes(role);
  },

  // Can view own salary (all employees can)
  canViewOwnSalary: (role) => {
    return true; // Everyone can view their own salary
  },

  // Can view own profile (all employees can)
  canViewOwnProfile: (role) => {
    return true; // Everyone can view their own profile
  },

  // Attendance Permissions
  canViewAttendance: (role) => {
    return ["Admin", "HR Manager", "Supervisor", "General Manager"].includes(role);
  },

  // Can view own attendance (all employees can)
  canViewOwnAttendance: (role) => {
    return true; // Everyone can view their own attendance
  },

  canMarkAttendance: (role) => {
    return ["Admin", "HR Manager", "Supervisor"].includes(role);
  },

  // Leave Management Permissions
  canViewLeave: (role) => {
    return ["Admin", "HR Manager", "General Manager"].includes(role);
  },

  // Can view own leaves (all employees can)
  canViewOwnLeave: (role) => {
    return true; // Everyone can view their own leaves
  },

  canApplyLeave: (role) => {
    return ["Admin", "HR Manager", "General Manager", "Finance Manager", "Supply Chain Manager", "Supervisor", "Engineer", "General Staff", "Facilities"].includes(role);
  },

  canApproveLeave: (role) => {
    return ["Admin", "HR Manager", "General Manager"].includes(role);
  },

  // Payroll Permissions
  canViewPayroll: (role) => {
    return ["Admin", "HR Manager", "Finance Manager", "General Manager"].includes(role);
  },

  // Can view own payslip (all employees can)
  canViewOwnPayslip: (role) => {
    return true; // Everyone can view their own payslip
  },

  canManagePayroll: (role) => {
    return ["Admin", "Finance Manager"].includes(role);
  },

  canSetDeductions: (role) => {
    return ["Admin", "Finance Manager"].includes(role);
  },

  canPrintPayslip: (role) => {
    return ["Admin", "Finance Manager", "HR Manager"].includes(role);
  },

  // Helper function to check if user can perform an action on a resource
  canViewResource: (userRole, resourceRole) => {
    // Admins can view everyone
    if (userRole === "Admin") return true;
    // Managers can view their staff
    if (["HR Manager", "General Manager", "Finance Manager"].includes(userRole)) return true;
    // Supervisors can view their team
    if (userRole === "Supervisor") return true;
    // Others can only view themselves
    return false;
  },

  // Get role display name
  getRoleDisplay: (role) => {
    const roleMap = {
      Admin: "Administrator",
      "HR Manager": "HR Manager",
      "General Manager": "General Manager",
      "Finance Manager": "Finance Manager",
      "Supply Chain Manager": "Supply Chain Manager",
      Supervisor: "Supervisor",
      Engineer: "Engineer",
      "General Staff": "Staff Member",
      Facilities: "Facilities"
    };
    return roleMap[role] || role;
  },

  // Get navigation items available to a role
  getAvailableModules: (role) => {
    const modules = ["dashboard"];
    
    if (RBAC.canViewStaffDirectory(role)) modules.push("employees");
    if (RBAC.canViewAttendance(role)) modules.push("attendance");
    if (RBAC.canViewLeave(role) || RBAC.canApplyLeave(role)) modules.push("leave");
    if (RBAC.canViewPayroll(role)) modules.push("payroll");

    return modules;
  }
};

export default RBAC;
