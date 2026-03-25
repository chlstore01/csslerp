import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import EmployeeDashboard from './EmployeeDashboard'

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' });
  const [employees, setEmployees] = useState([]);

  // Fetch employees to validate login credentials
  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data } = await supabase.from('employees').select('*');
    if (data) setEmployees(data);
  }

  const handleLogin = () => {
    // Master Admin Bypass
    if (loginForm.id === "ADMIN" && loginForm.pass === "CSSL_MASTER_2026") {
      setCurrentUser({ name: "System Admin", role: "Admin", employee_id: "ADMIN" });
      return;
    }

    const user = employees.find(
      (e) => e.employee_id === loginForm.id && e.password === loginForm.pass
    );

    if (user) {
      if (user.status === 'Active') {
        setCurrentUser(user);
      } else {
        alert("Account Inactive. Contact HR.");
      }
    } else {
      alert("Invalid Credentials.");
    }
  };

  if (!currentUser) {
    return (
      <div style={loginContainer}>
        <div style={loginCard}>
          <h2 style={{ color: '#003366', marginBottom: '20px' }}>CSSL ERP SYSTEM</h2>
          <input 
            style={inputStyle} 
            placeholder="Employee ID" 
            onChange={e => setLoginForm({...loginForm, id: e.target.value})} 
          />
          <input 
            type="password" 
            style={{...inputStyle, marginTop: '10px'}} 
            placeholder="Password" 
            onChange={e => setLoginForm({...loginForm, pass: e.target.value})} 
          />
          <button style={{...loginBtn, marginTop: '20px'}} onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <h3 style={{ color: '#fff', borderBottom: '1px solid #34495e', paddingBottom: '10px' }}>CSSL ERP</h3>
        <p style={{ color: '#bdc3c7', fontSize: '12px' }}>User: {currentUser.name}</p>
        <p style={{ color: '#2ecc71', fontSize: '11px', fontWeight: 'bold' }}>{currentUser.role}</p>
        
        <nav style={{ marginTop: '30px' }}>
          <div style={navItem(activeModule === 'dashboard')} onClick={() => setActiveModule('dashboard')}>
            🏠 Home
          </div>
          <div style={navItem(activeModule === 'employees')} onClick={() => setActiveModule('employees')}>
            👥 Employees
          </div>
          {/* Future Modules like Inventory/Attendance go here */}
        </nav>

        <button style={logoutBtn} onClick={() => setCurrentUser(null)}>Logout</button>
      </div>

      {/* CONTENT WINDOW */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {activeModule === 'dashboard' && (
          <div style={welcomeCard}>
            <h1>Welcome to CSSL Portal</h1>
            <p>You are logged in as <strong>{currentUser.role}</strong>.</p>
          </div>
        )}

       {activeModule === 'employees' && (
  /* The "currentUser" must be passed here as a prop */
  <EmployeeDashboard currentUser={currentUser} />
)}
      </div>
    </div>
  );
}

// --- STYLES ---
const loginContainer = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#003366' };
const loginCard = { background: '#fff', padding: '40px', borderRadius: '12px', width: '320px', textAlign: 'center' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const loginBtn = { width: '100%', padding: '12px', background: '#003366', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const sidebarStyle = { width: '220px', background: '#2c3e50', padding: '20px', display: 'flex', flexDirection: 'column' };
const navItem = (isActive) => ({ padding: '12px', color: '#fff', cursor: 'pointer', borderRadius: '6px', marginBottom: '5px', background: isActive ? '#34495e' : 'transparent' });
const logoutBtn = { marginTop: 'auto', padding: '10px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const welcomeCard = { background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };

export default App;