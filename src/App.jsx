import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import EmployeeDashboard from './EmployeeDashboard' // Ensure the filename matches exactly

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard'); // Default view
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch employees once to allow login verification
  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data } = await supabase.from('employees').select('*');
    if (data) setEmployees(data);
  }

  // 2. Login Logic
  const handleLogin = () => {
    // Master Admin Bypass
    if (loginForm.id === "ADMIN" && loginForm.pass === "CSSL_MASTER_2026") {
      setCurrentUser({ name: "System Admin", role: "Admin", employee_id: "ADMIN" });
      return;
    }

    // Standard Employee Login
    const user = employees.find(
      (e) => e.employee_id === loginForm.id && e.password === loginForm.pass
    );

    if (user) {
      if (user.status === 'Active') {
        setCurrentUser(user);
      } else {
        alert("This account is Inactive. Please contact HR.");
      }
    } else {
      alert("Invalid ID or Password.");
    }
  };

  // 3. Login Screen UI
  if (!currentUser) {
    return (
      <div style={loginContainer}>
        <div style={loginCard}>
          <h2 style={{ color: '#003366', marginBottom: '20px' }}>CSSL ERP SYSTEM</h2>
          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <label style={labelStyle}>Employee ID</label>
            <input 
              style={inputStyle} 
              placeholder="e.g. CSSL-1001" 
              onChange={e => setLoginForm({...loginForm, id: e.target.value})} 
            />
          </div>
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label style={labelStyle}>Password</label>
            <input 
              type="password" 
              style={inputStyle} 
              placeholder="••••••••" 
              onChange={e => setLoginForm({...loginForm, pass: e.target.value})} 
            />
          </div>
          <button style={loginBtn} onClick={handleLogin}>Login to Dashboard</button>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
            Internal Use Only • Composite Steel Structure Ltd.
          </p>
        </div>
      </div>
    );
  }

  // 4. Main Application UI (After Login)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      {/* Sidebar Navigation */}
      <div style={sidebarStyle}>
        <h3 style={{ color: '#fff', borderBottom: '1px solid #34495e', paddingBottom: '10px' }}>CSSL ERP</h3>
        <p style={{ color: '#bdc3c7', fontSize: '12px' }}>Welcome, {currentUser.name}</p>
        <p style={{ color: '#2ecc71', fontSize: '11px', fontWeight: 'bold' }}>Role: {currentUser.role}</p>
        
        <nav style={{ marginTop: '30px' }}>
          <div 
            style={navItem(activeModule === 'dashboard')} 
            onClick={() => setActiveModule('dashboard')}
          >
            🏠 Home Dashboard
          </div>
          <div 
            style={navItem(activeModule === 'employees')} 
            onClick={() => setActiveModule('employees')}
          >
            👥 Employee Directory
          </div>
          {/* Add more modules here as we build them */}
        </nav>

        <button 
          style={logoutBtn} 
          onClick={() => setCurrentUser(null)}
        >
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '20px' }}>
        {activeModule === 'dashboard' && (
          <div style={welcomeCard}>
            <h1>Welcome to CSSL Management System</h1>
            <p>Select a module from the sidebar to begin.</p>
          </div>
        )}

        {activeModule === 'employees' && (
          /* CRITICAL: We pass the "currentUser" here so the dashboard knows the role */
          <EmployeeDashboard currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}

// --- STYLES ---
const loginContainer = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#003366' };
const loginCard = { background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center', width: '350px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', marginTop: '5px', boxSizing: 'border-box' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#333' };
const loginBtn = { width: '100%', padding: '12px', background: '#003366', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };
const sidebarStyle = { width: '240px', background: '#2c3e50', padding: '20px', display: 'flex', flexDirection: 'column' };
const navItem = (isActive) => ({ padding: '12px', color: '#fff', cursor: 'pointer', borderRadius: '6px', marginBottom: '5px', background: isActive ? '#34495e' : 'transparent', fontWeight: isActive ? 'bold' : 'normal' });
const logoutBtn = { marginTop: 'auto', padding: '10px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const welcomeCard = { background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };

export default App;