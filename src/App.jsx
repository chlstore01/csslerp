import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showPassModal, setShowPassModal] = useState(false)
  const [newPass, setNewPass] = useState('')

  // EMERGENCY BYPASS CREDENTIALS
  const MASTER_ID = "ADMIN"
  const MASTER_KEY = "CSSL_MASTER_2026"

  const [formData, setFormData] = useState({
    employee_id: '', name: '', designation: '', role: 'General Staff',
    site_location: '', phone_number: '', reference_number: '', 
    nid_number: '', blood_group: '', dob: '', joining_date: '', 
    present_address: '', permanent_address: '', supervisor_name: '', 
    email: '', basic_salary: '', status: 'Active'
  });

  const roleList = ["Admin", "General Manager", "Finance & Accountant Manager", "Supply Chain Manager", "Supply Chain Employee", "Finance & Accountant Employee", "Human Resource Manager", "Human Resource Employee", "Supervisor", "Site Manager", "Engineer", "General Staff"];

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase.from('employees').select('*')
    if (!error) setEmployees(data ? [...data].sort((a, b) => b.id - a.id) : [])
  }

  // --- UPDATED LOGIN LOGIC WITH BYPASS ---
  async function handleLogin(e) {
    e.preventDefault();
    
    // 1. Check Master Bypass first
    if (loginForm.id === MASTER_ID && loginForm.pass === MASTER_KEY) {
      setCurrentUser({ name: "System Admin", role: "Admin", employee_id: "ADMIN" });
      return;
    }

    // 2. Check Database for regular users
    const user = employees.find(emp => emp.employee_id === loginForm.id && emp.password === loginForm.pass);
    if (user) {
      setCurrentUser(user);
    } else {
      alert("Invalid Credentials. If this is your first time, your password is your Phone Number.");
    }
  }

  async function changeMyPassword() {
    if (!newPass || currentUser.employee_id === "ADMIN") {
        alert("Cannot change password for Master Admin account via this menu.");
        return;
    }
    const { error } = await supabase.from('employees').update({ password: newPass }).eq('id', currentUser.id);
    if (!error) { 
        alert("Password updated!"); 
        setShowPassModal(false); 
        setCurrentUser({...currentUser, password: newPass}); 
    }
  }

  async function resetUserPassword(emp) {
    if (!window.confirm(`Reset password for ${emp.name} to their phone number?`)) return;
    const { error } = await supabase.from('employees').update({ password: emp.phone_number }).eq('id', emp.id);
    if (!error) {
        alert("Password reset to: " + emp.phone_number);
        fetchEmployees();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => { if (cleanedData[key] === "") cleanedData[key] = null; });

    if (!editingId) {
      cleanedData.employee_id = `CSSL-${1001 + employees.length}`;
      cleanedData.password = cleanedData.phone_number; // Default password for new users
    }

    const { error } = editingId 
      ? await supabase.from('employees').update(cleanedData).eq('id', editingId)
      : await supabase.from('employees').insert([cleanedData]);
    
    if (!error) { setEditingId(null); fetchEmployees(); resetForm(); alert("Success!"); }
    else { alert("Error: " + error.message); }
    setLoading(false);
  }

  const resetForm = () => {
    setFormData({ employee_id: '', name: '', designation: '', role: 'General Staff', site_location: '', phone_number: '', reference_number: '', nid_number: '', blood_group: '', dob: '', joining_date: '', present_address: '', permanent_address: '', supervisor_name: '', email: '', basic_salary: '', status: 'Active' });
    setEditingId(null);
  };

  const exportToCSV = () => {
    const headers = "ID,Name,Role,Designation,Phone,NID,Salary,Blood,Site\n";
    const rows = filteredEmployees.map(e => `${e.employee_id},${e.name},${e.role},${e.designation},${e.phone_number},${e.nid_number},${e.basic_salary},${e.blood_group},${e.site_location}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `CSSL_Staff_Data.csv`; a.click();
  };

  const printID = (emp) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><style>
        body { font-family: sans-serif; display: flex; justify-content: center; padding: 50px; }
        .card { width: 350px; height: 220px; border: 3px solid #003366; border-radius: 12px; padding: 20px; background: #fff; position: relative; }
        .co { color: #003366; font-weight: bold; font-size: 18px; border-bottom: 2px solid #003366; margin-bottom: 10px; }
        .eid { position: absolute; top: 20px; right: 20px; background: #003366; color: #fff; padding: 3px 10px; border-radius: 5px; font-weight: bold; }
        .row { font-size: 14px; margin: 5px 0; }
      </style></head>
      <body>
        <div class="card">
          <div class="co">Composite Steel Structure Ltd.</div>
          <div class="eid">${emp.employee_id}</div>
          <div class="row"><strong>Name:</strong> ${emp.name}</div>
          <div class="row"><strong>Post:</strong> ${emp.designation}</div>
          <div class="row"><strong>Blood:</strong> ${emp.blood_group || 'N/A'}</div>
          <div class="row"><strong>Join Date:</strong> ${emp.joining_date || 'N/A'}</div>
          <div style="margin-top:20px; font-size:10px; text-align:center; color:#666;">Authorized Signature</div>
        </div>
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body></html>
    `);
    win.document.close();
  };

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (emp.name?.toLowerCase().includes(term) || emp.employee_id?.toLowerCase().includes(term) || emp.role?.toLowerCase().includes(term));
  });

  if (!currentUser) {
    return (
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#003366' }}>CSSL ERP LOGIN</h2>
        <form onSubmit={handleLogin}>
          <input style={inputStyle} placeholder="Employee ID (e.g. CSSL-1001)" value={loginForm.id} onChange={e => setLoginForm({...loginForm, id: e.target.value})} required />
          <input type="password" style={{...inputStyle, marginTop: '10px'}} placeholder="Password" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} required />
          <button type="submit" style={{...buttonStyle, marginTop: '20px'}}>Sign In</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '15px', maxWidth: '1400px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ color: '#003366', margin: 0 }}>CSSL ERP System</h2>
          <small>Welcome, <strong>{currentUser.name}</strong> | {currentUser.role}</small>
        </div>
        <div>
          <button onClick={() => setShowPassModal(true)} style={utilBtnStyle('#6c757d', '#fff')}>Change Password</button>
          <button onClick={() => setCurrentUser(null)} style={{...utilBtnStyle('#dc3545', '#fff'), marginLeft: '10px'}}>Logout</button>
        </div>
      </div>

      {(currentUser.role === 'Admin' || currentUser.role === 'General Manager') && (
        <form onSubmit={handleSubmit} style={formBoxStyle}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
          <div style={gridStyle}>
            <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div><label style={labelStyle}>Role</label><select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>{roleList.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label style={labelStyle}>Designation</label><input style={inputStyle} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
            <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
            <div><label style={labelStyle}>NID</label><input style={inputStyle} value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} /></div>
            <div><label style={labelStyle}>Salary (BDT)</label><input type="number" style={inputStyle} value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>
            <div><label style={labelStyle}>Blood Group</label><input style={inputStyle} value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} /></div>
            <div><label style={labelStyle}>Join Date</label><input type="date" style={inputStyle} value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} /></div>
            <div><label style={labelStyle}>Site</label><input style={inputStyle} value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} /></div>
          </div>
          <button type="submit" disabled={loading} style={{...buttonStyle, marginTop: '20px'}}>{loading ? 'Processing...' : 'Save Employee Data'}</button>
          {editingId && <button onClick={resetForm} style={{...buttonStyle, background: '#666', marginTop: '5px'}}>Cancel Edit</button>}
        </form>
      )}

      <div style={tableContainerStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
          <input style={{...inputStyle, flex: 2}} placeholder="🔍 Search Staff Name, ID, or Site..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={exportToCSV} style={utilBtnStyle('#28a745', '#fff')}>Excel Export</button>
          <div style={countBadgeStyle}>Total Staff: {filteredEmployees.length}</div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr style={{ backgroundColor: '#003366', color: 'white' }}><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Role</th><th style={thStyle}>Site</th><th style={thStyle}>Actions</th></tr></thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}><strong>{emp.employee_id}</strong></td>
                  <td style={tdStyle}>{emp.name}</td>
                  <td style={tdStyle}>{emp.role}</td>
                  <td style={tdStyle}>{emp.site_location}</td>
                  <td style={tdStyle}>
                    <button onClick={() => setSelectedEmployee(emp)} style={actionBtnStyle('#17a2b8', '#fff')}>View</button>
                    {(currentUser.role === 'Admin' || currentUser.role === 'General Manager') && (
                      <>
                        <button onClick={() => { setEditingId(emp.id); setFormData(emp); window.scrollTo(0,0); }} style={actionBtnStyle('#ffc107', '#000')}>Edit</button>
                        <button onClick={() => printID(emp)} style={actionBtnStyle('#28a745', '#fff')}>Print</button>
                        <button onClick={() => resetUserPassword(emp)} style={actionBtnStyle('#dc3545', '#fff')}>Reset Pass</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEmployee && (
        <div style={modalOverlayStyle} onClick={() => setSelectedEmployee(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#003366', borderBottom: '2px solid #003366', paddingBottom: '10px' }}>{selectedEmployee.employee_id} Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px', marginTop: '10px' }}>
              <p><strong>Name:</strong> {selectedEmployee.name}</p>
              <p><strong>Role:</strong> {selectedEmployee.role}</p>
              <p><strong>Phone:</strong> {selectedEmployee.phone_number}</p>
              <p><strong>NID:</strong> {selectedEmployee.nid_number}</p>
              <p><strong>Salary:</strong> {selectedEmployee.basic_salary} BDT</p>
              <p><strong>Joined:</strong> {selectedEmployee.joining_date}</p>
            </div>
            <button onClick={() => setSelectedEmployee(null)} style={{...buttonStyle, marginTop: '20px'}}>Close</button>
          </div>
        </div>
      )}

      {showPassModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Set New Password</h3>
            <input type="password" style={inputStyle} placeholder="Enter New Password" onChange={e => setNewPass(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
               <button onClick={changeMyPassword} style={buttonStyle}>Update</button>
               <button onClick={() => setShowPassModal(false)} style={{...buttonStyle, background: '#666'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// STYLES (Same as before)
const loginBoxStyle = { maxWidth: '350px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'center' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }
const formBoxStyle = { background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }
const tableContainerStyle = { background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#555', marginBottom: '4px' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }
const thStyle = { padding: '12px 8px' }
const tdStyle = { padding: '10px 8px' }
const countBadgeStyle = { background: '#003366', color: 'white', padding: '10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }
const utilBtnStyle = (bg, color) => ({ backgroundColor: bg, color, border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' })
const actionBtnStyle = (bg, color) => ({ backgroundColor: bg, color, border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold', fontSize: '11px' })
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '10px', maxWidth: '500px', width: '90%' }

export default App