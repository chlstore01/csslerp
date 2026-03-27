import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
// HR Modules
import Attendance from './modules/HR/Attendance';
import LeaveManagement from './modules/HR/LeaveManagement';
import Payroll from './modules/HR/Payroll';
// Employee Module
import EmployeeDashboard from "./modules/Employees/EmployeeDashboard.jsx";

// --- ROLE-BASED ACCESS CONTROL (RBAC) MODEL ---
const RBAC = {
  canViewStaffDirectory: (role) => {
    return ["Admin", "HR Manager", "General Manager", "Finance Manager"].includes(role);
  },
  
  canEditEmployee: (role) => {
    return ["Admin", "HR Manager"].includes(role);
  },
  
  canDeleteEmployee: (role) => {
    return ["Admin"].includes(role);
  },
  
  canViewAttendance: (role) => {
    return ["Admin", "HR Manager", "Supervisor", "General Manager"].includes(role);
  },
  
  canViewLeave: (role) => {
    return ["Admin", "HR Manager", "General Manager"].includes(role);
  },
  
  canApproveLeave: (role) => {
    return ["Admin", "HR Manager"].includes(role);
  },
  
  canViewPayroll: (role) => {
    return ["Admin", "HR Manager", "Finance Manager", "General Manager"].includes(role);
  },
  
  canManagePayroll: (role) => {
    return ["Admin", "Finance Manager"].includes(role);
  },
  
  // Employee visibility rules
  canViewEmployee: (currentUserRole, targetEmployeeDept, currentUserDept) => {
    if (currentUserRole === "Admin") return true;
    if (["HR Manager", "General Manager", "Finance Manager"].includes(currentUserRole)) return true;
    if (currentUserRole === "Supervisor") {
      // Supervisors can only see their team
      return currentUserDept === targetEmployeeDept;
    }
    // General Staff and others can only see themselves
    return false;
  },

  canEditEmployeeField: (role, field) => {
    if (role === "Admin") return true;
    if (role === "HR Manager" && !["password", "approval_status"].includes(field)) return true;
    return false;
  }
};

export { RBAC }; 

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' });
  const [loginError, setLoginError] = useState('');

  // --- LOGIN LOGIC ---
  const handleLogin = async () => {
    setLoginError('');
    // --- 1. THE MASTER KEY (Hardcoded Admin) ---
    // This allows you to login without needing a row in the Supabase table.
    if (loginForm.id === 'ADMIN' && loginForm.pass === 'CSSL_MASTER_2026') {
      const adminUser = {
        employee_id: 'ADMIN',
        name: 'M Arman (MD)',
        role: 'Admin', // This triggers the Full Access in the Dashboard
        designation: 'Managing Director'
      };
      console.log("Master Admin Login Successful");
      setCurrentUser(adminUser);
      return; // Stop here, don't check the database
    }

    // --- 2. STANDARD DATABASE LOGIN ---
    // If it's not the Master Admin, check the Supabase table for staff.
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', loginForm.id)
        .single();

      if (error || !data) {
        setLoginError('Invalid Employee ID');
        return;
      }

      if (data.password === loginForm.pass) {
        console.log("Login Successful. Role:", data.role);
        setCurrentUser(data);
      } else {
        setLoginError('Incorrect Password');
      }
    } catch (err) {
      setLoginError('Connection Error');
    }
  };

  // --- LOGIN SCREEN ---
  if (!currentUser) {
    return (
      <div style={loginContainer}>
        <div style={loginCard}>
          <h2 style={{ color: '#003366', marginBottom: '20px', textAlign: 'center' }}>CSSL ERP SYSTEM</h2>
          {loginError && <p style={{ color: '#e74c3c', fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>{loginError}</p>}
          
          <label style={lbl}>Employee ID</label>
          <input 
            style={inputStyle} 
            placeholder="e.g. CSSL-1001" 
            onChange={e => setLoginForm({...loginForm, id: e.target.value})} 
          />
          
          <label style={{...lbl, marginTop: '15px'}}>Password</label>
          <input 
            type="password" 
            style={inputStyle} 
            placeholder="••••••••" 
            onChange={e => setLoginForm({...loginForm, pass: e.target.value})} 
          />
          
          <button style={loginBtn} onClick={handleLogin}>Log In</button>
        </div>
      </div>
    );
  }

  // --- MAIN APP SHELL ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <div style={sidebarStyle}>
        <div style={{ padding: '20px', borderBottom: '1px solid #34495e' }}>
          <h3 style={{ color: '#fff', margin: 0 }}>CSSL PORTAL</h3>
          <p style={{ color: '#2ecc71', fontSize: '12px', margin: '5px 0 0 0' }}>● {currentUser.name}</p>
          <p style={{ color: '#bdc3c7', fontSize: '11px', margin: 0 }}>{currentUser.role}</p>
        </div>

        <nav style={{ marginTop: '20px' }}>
          <div style={navItem(activeModule === 'dashboard')} onClick={() => setActiveModule('dashboard')}>
            🏠 Dashboard Home
          </div>
          
          {RBAC.canViewStaffDirectory(currentUser.role) && (
            <div style={navItem(activeModule === 'employees')} onClick={() => setActiveModule('employees')}>
              👥 Staff Directory
            </div>
          )}
          
          {RBAC.canViewAttendance(currentUser.role) && (
            <div style={navItem(activeModule === 'attendance')} onClick={() => setActiveModule('attendance')}>
              📋 Attendance
            </div>
          )}
          
          {RBAC.canViewLeave(currentUser.role) && (
            <div style={navItem(activeModule === 'leave')} onClick={() => setActiveModule('leave')}>
              🏖️ Leave Management
            </div>
          )}
          
          {RBAC.canViewPayroll(currentUser.role) && (
            <div style={navItem(activeModule === 'payroll')} onClick={() => setActiveModule('payroll')}>
              💰 Payroll
            </div>
          )}
        </nav>

        <button style={logoutBtn} onClick={() => setCurrentUser(null)}>Logout System</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* Welcome Screen */}
        {activeModule === 'dashboard' && (
          <div style={welcomeCard}>
            <h1 style={{ color: '#003366', fontSize: '1.5rem', marginBottom: '10px' }}>
              Welcome back, {currentUser.name}
            </h1>
            <p style={{ fontSize: '0.9rem' }}>Access Level: <strong>{currentUser.role}</strong></p>
          </div>
        )}

        {/* Employee Module */}
        {activeModule === 'employees' && RBAC.canViewStaffDirectory(currentUser.role) ? (
          <EmployeeDashboard 
            currentUser={currentUser} 
            rbac={RBAC}
            onNavigateToModule={(module, employee) => {
              setSelectedEmployee(employee);
              setActiveModule(module);
            }}
          />
        ) : activeModule === 'employees' ? (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#dc3545' }}>
            <h3>Access Denied</h3>
            <p>You do not have permission to access the Staff Directory.</p>
          </div>
        ) : null}

        {/* HR Modules */}
        {activeModule === 'attendance' && RBAC.canViewAttendance(currentUser.role) ? (
          <Attendance currentUser={currentUser} selectedEmployee={selectedEmployee} rbac={RBAC} />
        ) : activeModule === 'attendance' ? (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#dc3545' }}>
            <h3>Access Denied</h3>
            <p>You do not have permission to access Attendance records.</p>
          </div>
        ) : null}

        {activeModule === 'leave' && RBAC.canViewLeave(currentUser.role) ? (
          <LeaveManagement currentUser={currentUser} selectedEmployee={selectedEmployee} rbac={RBAC} />
        ) : activeModule === 'leave' ? (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#dc3545' }}>
            <h3>Access Denied</h3>
            <p>You do not have permission to access Leave Management.</p>
          </div>
        ) : null}

        {activeModule === 'payroll' && RBAC.canViewPayroll(currentUser.role) ? (
          <Payroll currentUser={currentUser} selectedEmployee={selectedEmployee} rbac={RBAC} />
        ) : activeModule === 'payroll' ? (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#dc3545' }}>
            <h3>Access Denied</h3>
            <p>You do not have permission to access Payroll management.</p>
          </div>
        ) : null}

      </div>
    </div>
  );
}

// --- STYLING ---
const loginContainer = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#003366' };
const loginCard = { background: '#fff', padding: '40px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const inputStyle = { width: '100%', padding: '12px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' };
const lbl = { fontSize: '12px', fontWeight: 'bold', color: '#555', display: 'block' };
const loginBtn = { width: '100%', padding: '12px', background: '#003366', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '25px', fontWeight: 'bold' };
const sidebarStyle = { width: '260px', background: '#2c3e50', color: '#fff', display: 'flex', flexDirection: 'column' };
const navItem = (active) => ({ padding: '15px 20px', cursor: 'pointer', background: active ? '#34495e' : 'transparent', borderLeft: active ? '4px solid #3498db' : '4px solid transparent', transition: '0.2s' });
const logoutBtn = { marginTop: 'auto', padding: '15px', background: '#c0392b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' };
const welcomeCard = { background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };