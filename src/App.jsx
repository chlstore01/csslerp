import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// FIXED PATH & EXTENSION: Points to the 'modules' folder and the '.jsx' file
import EmployeeDashboard from "./modules/Employees/EmployeeDashboard.jsx"; 

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' });
  const [loginError, setLoginError] = useState('');

  // --- LOGIN LOGIC ---
  const handleLogin = async () => {
    setLoginError('');
    try {
      // Fetch user from Supabase 'employees' table
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employee_id', loginForm.id)
        .single();

      if (error || !data) {
        setLoginError('Invalid Employee ID');
        return;
      }

      // Strict Password Check
      if (data.password === loginForm.pass) {
        console.log("Login Successful. Role:", data.role);
        setCurrentUser(data); // This object flows into the EmployeeDashboard below
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
          <div style={navItem(activeModule === 'employees')} onClick={() => setActiveModule('employees')}>
            👥 Staff Directory
          </div>
        </nav>

        <button style={logoutBtn} onClick={() => setCurrentUser(null)}>Logout System</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        
        {/* Welcome Screen */}
        {activeModule === 'dashboard' && (
          <div style={welcomeCard}>
            <h1 style={{ color: '#003366' }}>Welcome back, {currentUser.name}</h1>
            <p>Your current access level is: <strong>{currentUser.role}</strong></p>
            <hr style={{ opacity: 0.1, margin: '20px 0' }} />
            <p style={{ fontSize: '14px', color: '#666' }}>Select a module from the sidebar to begin.</p>
          </div>
        )}

        {/* Employee Module: The Prop 'currentUser' is passed here for RBAC */}
        {activeModule === 'employees' && (
          <EmployeeDashboard currentUser={currentUser} />
        )}

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