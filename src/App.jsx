import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [editingDbId, setEditingDbId] = useState(null) // The "Lock" for Editing
  const [showPassModal, setShowPassModal] = useState(false)
  const [newPass, setNewPass] = useState('')

  const MASTER_ID = "ADMIN", MASTER_KEY = "CSSL_MASTER_2026";

  const [formData, setFormData] = useState({
    employee_id: '', name: '', designation: '', role: 'General Staff',
    site_location: '', phone_number: '', reference_number: '', 
    nid_number: '', blood_group: '', dob: '', joining_date: '', 
    present_address: '', permanent_address: '', supervisor_name: '', 
    email: '', basic_salary: '', status: 'Active'
  });

  const roleList = ["Admin", "General Manager", "Finance & Accountant Manager", "Supply Chain Manager", "Supply Chain Employee", "Finance & Accountant Employee", "Human Resource Manager", "Human Resource Employee", "Supervisor", "Site Manager", "Engineer", "General Staff"];

  // Permissions
  const canSeeSalary = currentUser && ["Admin", "General Manager", "Finance & Accountant Manager", "Finance & Accountant Employee"].includes(currentUser.role);
  const canManageStaff = currentUser && ["Admin", "General Manager", "Human Resource Manager"].includes(currentUser.role);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase.from('employees').select('*')
    if (!error) setEmployees(data ? [...data].sort((a, b) => b.id - a.id) : [])
  }

  // --- LOGIN FACILITY ---
  async function handleLogin(e) {
    e.preventDefault();
    if (loginForm.id === MASTER_ID && loginForm.pass === MASTER_KEY) {
      setCurrentUser({ name: "System Admin", role: "Admin", employee_id: "ADMIN" });
      return;
    }
    const user = employees.find(emp => emp.employee_id === loginForm.id && emp.password === loginForm.pass);
    if (user && user.status !== 'Inactive') setCurrentUser(user); 
    else alert("Login Failed: Check credentials or Account Status.");
  }

  // --- EDIT FACILITY (FIXED) ---
  const startEdit = (emp) => {
    setEditingDbId(emp.id); // Secure the unique DB key
    setFormData({ ...emp }); // Load data into form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Prepare data for Supabase
    const submissionData = { ...formData };
    delete submissionData.id; // Remove ID from the data body to prevent Update errors
    delete submissionData.created_at;

    // Convert empty fields to null
    Object.keys(submissionData).forEach(key => { if (submissionData[key] === "") submissionData[key] = null; });

    if (editingDbId) {
      // UPDATE PATH
      const { error } = await supabase.from('employees').update(submissionData).eq('id', editingDbId);
      if (error) alert("Update Error: " + error.message);
      else alert(`Updated: ${submissionData.name}`);
    } else {
      // INSERT PATH
      submissionData.employee_id = `CSSL-${1001 + employees.length}`;
      submissionData.password = submissionData.phone_number; 
      const { error } = await supabase.from('employees').insert([submissionData]);
      if (error) alert("Insert Error: " + error.message);
      else alert("New Staff Registered");
    }

    setEditingDbId(null);
    resetForm();
    fetchEmployees();
    setLoading(false);
  }

  const resetForm = () => {
    setFormData({ employee_id: '', name: '', designation: '', role: 'General Staff', site_location: '', phone_number: '', reference_number: '', nid_number: '', blood_group: '', dob: '', joining_date: '', present_address: '', permanent_address: '', supervisor_name: '', email: '', basic_salary: '', status: 'Active' });
    setEditingDbId(null);
  };

  // --- EXPORT & PRINT FACILITIES ---
  const exportToCSV = () => {
    const headers = `ID,Name,Role,Status,Site,${canSeeSalary ? 'Salary' : ''}\n`;
    const rows = filteredEmployees.map(e => `${e.employee_id},${e.name},${e.role},${e.status},${e.site_location},${canSeeSalary ? e.basic_salary : ''}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'CSSL_Employee_Report.csv'; a.click();
  };

  const printID = (emp) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><style>
        body { font-family: sans-serif; display: flex; justify-content: center; padding: 30px; }
        .card { width: 320px; height: 200px; border: 2px solid #003366; border-radius: 8px; padding: 15px; position: relative; }
        .h { color: #003366; font-weight: bold; border-bottom: 2px solid #003366; margin-bottom: 10px; padding-bottom: 5px; }
        .badge { position: absolute; top: 15px; right: 15px; background: #003366; color: white; padding: 2px 5px; border-radius: 3px; font-size: 11px; }
        .d { font-size: 13px; margin: 5px 0; }
      </style></head><body>
        <div class="card"><div class="h">CSSL BANGLADESH</div><div class="badge">${emp.employee_id}</div>
        <div class="d"><strong>NAME:</strong> ${emp.name}</div><div class="d"><strong>ROLE:</strong> ${emp.role}</div>
        <div class="d"><strong>BLOOD:</strong> ${emp.blood_group || 'N/A'}</div><div class="d"><strong>JOINED:</strong> ${emp.joining_date || 'N/A'}</div>
        </div><script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body></html>
    `);
    win.document.close();
  };

  const filteredEmployees = employees.filter(emp => {
    const t = searchTerm.toLowerCase();
    return emp.name?.toLowerCase().includes(t) || emp.employee_id?.toLowerCase().includes(t);
  });

  if (!currentUser) {
    return (
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#003366' }}>CSSL ERP LOGIN</h2>
        <form onSubmit={handleLogin}>
          <input style={inputStyle} placeholder="Employee ID" onChange={e => setLoginForm({...loginForm, id: e.target.value})} required />
          <input type="password" style={{...inputStyle, marginTop: '10px'}} placeholder="Password" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} required />
          <button type="submit" style={{...buttonStyle, marginTop: '20px'}}>Sign In</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={headerStyle}>
        <div><h2 style={{ color: '#003366', margin: 0 }}>Composite Steel Structure Ltd.</h2><small>Logged: {currentUser.name} ({currentUser.role})</small></div>
        <button onClick={() => setCurrentUser(null)} style={utilBtnStyle('#dc3545', '#fff')}>Logout</button>
      </div>

      {canManageStaff && (
        <div style={{...formBoxStyle, borderLeft: editingDbId ? '6px solid #ffc107' : '6px solid #003366'}}>
          <h3 style={{ marginTop: 0 }}>{editingDbId ? `✏️ Editing: ${formData.employee_id}` : '➕ Add New Employee'}</h3>
          <form onSubmit={handleSubmit} style={gridStyle}>
            <input style={inputStyle} placeholder="Full Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>{roleList.map(r => <option key={r} value={r}>{r}</option>)}</select>
            <input style={inputStyle} placeholder="Designation" value={formData.designation || ''} onChange={e => setFormData({...formData, designation: e.target.value})} />
            <input style={inputStyle} placeholder="Phone" value={formData.phone_number || ''} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
            {canSeeSalary && <input type="number" style={inputStyle} placeholder="Basic Salary" value={formData.basic_salary || ''} onChange={e => setFormData({...formData, basic_salary: e.target.value})} />}
            <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
            <input style={inputStyle} placeholder="Site Location" value={formData.site_location || ''} onChange={e => setFormData({...formData, site_location: e.target.value})} />
            <input type="date" style={inputStyle} value={formData.joining_date || ''} onChange={e => setFormData({...formData, joining_date: e.target.value})} />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={loading} style={{...buttonStyle, backgroundColor: editingDbId ? '#ffc107' : '#003366', color: editingDbId ? '#000' : '#fff'}}>
                {loading ? 'Processing...' : (editingDbId ? 'UPDATE RECORD' : 'SAVE NEW EMPLOYEE')}
              </button>
              {editingDbId && <button type="button" onClick={resetForm} style={{...buttonStyle, backgroundColor: '#666'}}>CANCEL</button>}
            </div>
          </form>
        </div>
      )}

      <div style={tableContainerStyle}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input style={{...inputStyle, flex: 2}} placeholder="🔍 Search Staff Name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={exportToCSV} style={utilBtnStyle('#28a745', '#fff')}>Excel Export</button>
        </div>
        <table style={tableStyle}>
          <thead><tr style={{ backgroundColor: '#003366', color: 'white' }}><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #eee', opacity: emp.status === 'Inactive' ? 0.5 : 1 }}>
                <td style={tdStyle}><strong>{emp.employee_id}</strong></td>
                <td style={tdStyle}>{emp.name}</td>
                <td style={tdStyle}><span style={{ color: emp.status === 'Active' ? 'green' : 'red', fontWeight: 'bold' }}>{emp.status}</span></td>
                <td style={tdStyle}>
                  <button onClick={() => setSelectedEmployee(emp)} style={actionBtnStyle('#17a2b8', '#fff')}>View</button>
                  {canManageStaff && (
                    <><button onClick={() => startEdit(emp)} style={actionBtnStyle('#ffc107', '#000')}>Edit</button>
                    <button onClick={() => printID(emp)} style={actionBtnStyle('#28a745', '#fff')}>Print</button></>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// STYLES
const loginBoxStyle = { maxWidth: '350px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'center' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }
const formBoxStyle = { background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }
const tableContainerStyle = { background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }
const thStyle = { padding: '12px 8px', textAlign: 'left' }
const tdStyle = { padding: '10px 8px' }
const utilBtnStyle = (bg, color) => ({ backgroundColor: bg, color, border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' })
const actionBtnStyle = (bg, color) => ({ backgroundColor: bg, color, border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' })

export default App