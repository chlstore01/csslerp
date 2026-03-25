import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import EmployeeDashboard from './modules/EmployeeManagement/EmployeeDashboard';

// --- ROLE GUARD COMPONENT ---
// This wraps a module and checks if the user's role is allowed
const RoleGuard = ({ user, allowedRoles, children }) => {
  if (!user) return null;
  if (allowedRoles.includes(user.role)) return children;
  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>
      <h3>Access Denied</h3>
      <p>You do not have permission to view this module.</p>
    </div>
  );
};

function App() {
  const [employees, setEmployees] = useState([]); // Loaded once for login check
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' });

  useEffect(() => {
    fetchEmployeesForAuth();
  }, []);

  async function fetchEmployeesForAuth() {
    const { data } = await supabase.from('employees').select('*');
    if (data) setEmployees(data);
  }

  const handleLogin = () => {
    if (loginForm.id === "ADMIN" && loginForm.pass === "CSSL_MASTER_2026") {
      setCurrentUser({ name: "Admin", role: "Admin", employee_id: "MASTER" });
    } else {
      const user = employees.find(e => e.employee_id === loginForm.id && e.password === loginForm.pass);
      if (user && user.status === 'Active') {
        setCurrentUser(user);
      } else {
        alert("Invalid Login or Inactive Account");
      }
    }
  };

  // --- LOGIN UI ---
  if (!currentUser) {
    return (
      <div style={loginContainer}>
        <div style={loginBox}>
          <h2 style={{ color: '#003366' }}>CSSL ERP SYSTEM</h2>
          <input style={inputStyle} placeholder="Employee ID" onChange={e => setLoginForm({...loginForm, id: e.target.value})} />
          <input type="password" style={{...inputStyle, marginTop: '10px'}} placeholder="Password" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
          <button style={loginBtn} onClick={handleLogin}>Login to Dashboard</button>
        </div>
      </div>
    );
  }

  // --- MAIN ERP LAYOUT ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR */}
      <nav style={sidebarStyle}>
        <div style={{ padding: '20px', borderBottom: '1px solid #004d99' }}>
          <h3 style={{ margin: 0 }}>CSSL ERP</h3>
          <small style={{ color: '#a0c4ff' }}>{currentUser.role}: {currentUser.name}</small>
        </div>

        <div style={{ padding: '10px' }}>
          <button onClick={() => setActiveModule('dashboard')} style={navBtn(activeModule === 'dashboard')}>🏠 Home</button>
          
          {/* Admin & HR Only */}
          {["Admin", "HR Manager", "General Manager"].includes(currentUser.role) && (
            <button onClick={() => setActiveModule('employees')} style={navBtn(activeModule === 'employees')}>👥 Employee Setup</button>
          )}

          {/* Admin & Finance/Supply Chain Only */}
          {["Admin", "Finance Manager", "Supply Chain Manager"].includes(currentUser.role) && (
            <button onClick={() => setActiveModule('procurement')} style={navBtn(activeModule === 'procurement')}>🏗️ Procurement</button>
          )}

          {/* All Staff can see Attendance */}
          <button onClick={() => setActiveModule('attendance')} style={navBtn(activeModule === 'attendance')}>📍 Site Attendance</button>
        </div>

        <button onClick={() => setCurrentUser(null)} style={logoutBtn}>Logout</button>
      </nav>

      {/* CONTENT AREA */}
      <main style={{ flex: 1, background: '#f4f7f6', overflowY: 'auto' }}>
        {activeModule === 'dashboard' && (
          <div style={{ padding: '30px' }}>
            <h2>Welcome, {currentUser.name}</h2>
            <p>Select a module from the sidebar to begin.</p>
          </div>
        )}

        {activeModule === 'employees' && (
          <RoleGuard user={currentUser} allowedRoles={['Admin', 'HR Manager', 'General Manager']}>
            <EmployeeDashboard currentUser={currentUser} />
          </RoleGuard>
        )}

        {activeModule === 'procurement' && (
          <RoleGuard user={currentUser} allowedRoles={['Admin', 'Finance Manager', 'Supply Chain Manager']}>
            <div style={{ padding: '30px' }}><h3>Procurement Module</h3><p>Development in progress...</p></div>
          </RoleGuard>
        )}
      </main>
    </div>
  );
}

// STYLES
const loginContainer = { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' };
const loginBox = { padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', width: '320px' };
const sidebarStyle = { width: '260px', background: '#003366', color: 'white', display: 'flex', flexDirection: 'column' };
const navBtn = (active) => ({
  width: '100%', padding: '12px 15px', textAlign: 'left', background: active ? '#004d99' : 'transparent',
  color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', marginBottom: '5px', fontWeight: active ? 'bold' : 'normal'
});
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const loginBtn = { width: '100%', padding: '12px', background: '#003366', color: 'white', border: 'none', borderRadius: '6px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' };
const logoutBtn = { marginTop: 'auto', padding: '15px', background: '#8d0000', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' };

export default App;