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

  const MASTER_ID = "ADMIN", MASTER_KEY = "CSSL_MASTER_2026";

  const [formData, setFormData] = useState({
    employee_id: '', name: '', designation: '', role: 'General Staff',
    site_location: '', phone_number: '', reference_number: '', 
    nid_number: '', blood_group: '', dob: '', joining_date: '', 
    present_address: '', permanent_address: '', supervisor_name: '', 
    email: '', basic_salary: '', status: 'Active'
  });

  const roleList = ["Admin", "General Manager", "Finance & Accountant Manager", "Supply Chain Manager", "Supply Chain Employee", "Finance & Accountant Employee", "Human Resource Manager", "Human Resource Employee", "Supervisor", "Site Manager", "Engineer", "General Staff"];

  const canSeeSalary = currentUser && ["Admin", "General Manager", "Finance & Accountant Manager", "Finance & Accountant Employee"].includes(currentUser.role);
  const canManageStaff = currentUser && ["Admin", "General Manager", "Human Resource Manager"].includes(currentUser.role);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase.from('employees').select('*')
    if (!error) setEmployees(data ? [...data].sort((a, b) => b.id - a.id) : [])
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (loginForm.id === MASTER_ID && loginForm.pass === MASTER_KEY) {
      setCurrentUser({ name: "System Admin", role: "Admin", employee_id: "ADMIN" });
      return;
    }
    const user = employees.find(emp => emp.employee_id === loginForm.id && emp.password === loginForm.pass);
    
    if (user) {
      if (user.status === 'Inactive') {
        alert("This account is currently Inactive. Please contact the Admin.");
      } else {
        setCurrentUser(user);
      }
    } else {
      alert("Invalid Login Credentials.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => { if (cleanedData[key] === "") cleanedData[key] = null; });

    if (editingId) {
      const { error } = await supabase.from('employees').update(cleanedData).eq('id', editingId);
      if (error) alert(error.message); else alert("Record Updated Successfully");
    } else {
      cleanedData.employee_id = `CSSL-${1001 + employees.length}`;
      cleanedData.password = cleanedData.phone_number; 
      const { error } = await supabase.from('employees').insert([cleanedData]);
      if (error) alert(error.message); else alert("Staff Registered Successfully");
    }
    setEditingId(null); fetchEmployees(); resetForm(); setLoading(false);
  }

  const resetForm = () => {
    setFormData({ employee_id: '', name: '', designation: '', role: 'General Staff', site_location: '', phone_number: '', reference_number: '', nid_number: '', blood_group: '', dob: '', joining_date: '', present_address: '', permanent_address: '', supervisor_name: '', email: '', basic_salary: '', status: 'Active' });
    setEditingId(null);
  };

  const exportToCSV = () => {
    const headers = `ID,Name,Role,Status,Phone,NID,${canSeeSalary ? 'Salary,' : ''}Site\n`;
    const rows = filteredEmployees.map(e => `${e.employee_id},${e.name},${e.role},${e.status},${e.phone_number},${e.nid_number},${canSeeSalary ? e.basic_salary + ',' : ''}${e.site_location}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `CSSL_Staff_Inventory.csv`; a.click();
  };

  const printID = (emp) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><style>
        body { font-family: sans-serif; display: flex; justify-content: center; padding: 40px; }
        .card { width: 340px; height: 210px; border: 3px solid #003366; border-radius: 10px; padding: 15px; position: relative; background: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { color: #003366; font-weight: bold; font-size: 16px; border-bottom: 2px solid #003366; padding-bottom: 5px; margin-bottom: 10px; text-transform: uppercase; }
        .id-badge { position: absolute; top: 15px; right: 15px; background: #003366; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .data { font-size: 13px; margin: 4px 0; color: #333; }
        .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #777; border-top: 1px solid #eee; padding-top: 5px; }
      </style></head><body>
        <div class="card">
          <div class="header">Composite Steel Structure Ltd.</div>
          <div class="id-badge">${emp.employee_id}</div>
          <div class="data"><strong>Name:</strong> ${emp.name}</div>
          <div class="data"><strong>Post:</strong> ${emp.designation}</div>
          <div class="data"><strong>Blood:</strong> ${emp.blood_group || 'N/A'}</div>
          <div class="data"><strong>Joined:</strong> ${emp.joining_date || 'N/A'}</div>
          <div class="footer">ISSUED BY IT DEPT - CSSL ERP SYSTEM</div>
        </div>
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
      </body></html>
    `);
    win.document.close();
  };

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (emp.name?.toLowerCase().includes(term) || emp.employee_id?.toLowerCase().includes(term) || emp.role?.toLowerCase().includes(term) || emp.site_location?.toLowerCase().includes(term));
  });

  if (!currentUser) {
    return (
      <div style={loginBoxStyle}>
        <h2 style={{ color: '#003366', marginBottom: '5px' }}>CSSL ERP</h2>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Management Portal</p>
        <form onSubmit={handleLogin}>
          <input style={inputStyle} placeholder="Employee ID" onChange={e => setLoginForm({...loginForm, id: e.target.value})} required />
          <input type="password" style={{...inputStyle, marginTop: '10px'}} placeholder="Password" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} required />
          <button type="submit" style={{...buttonStyle, marginTop: '20px'}}>Sign In</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '15px', maxWidth: '1400px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ color: '#003366', margin: 0 }}>CSSL ERP Portal</h2>
          <small>Signed in as: <strong>{currentUser.name}</strong> ({currentUser.role})</small>
        </div>
        <div>
          <button onClick={() => setShowPassModal(true)} style={utilBtnStyle('#6c757d', '#fff')}>Privacy Settings</button>
          <button onClick={() => setCurrentUser(null)} style={{...utilBtnStyle('#dc3545', '#fff'), marginLeft: '10px'}}>Logout</button>
        </div>
      </div>

      {canManageStaff && (
        <form onSubmit={handleSubmit} style={formBoxStyle}>
          <h3 style={{ marginTop: 0, color: '#003366' }}>{editingId ? `Modify Record: ${formData.employee_id}` : 'Staff Enrollment'}</h3>
          <div style={gridStyle}>
            <input style={inputStyle} placeholder="Full Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>{roleList.map(r => <option key={r} value={r}>{r}</option>)}</select>
            <input style={inputStyle} placeholder="Designation" value={formData.designation || ''} onChange={e => setFormData({...formData, designation: e.target.value})} />
            <input style={inputStyle} placeholder="Phone Number" value={formData.phone_number || ''} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
            <input style={inputStyle} placeholder="NID Number" value={formData.nid_number || ''} onChange={e => setFormData({...formData, nid_number: e.target.value})} />
            {canSeeSalary && <input type="number" style={inputStyle} placeholder="Salary (BDT)" value={formData.basic_salary || ''} onChange={e => setFormData({...formData, basic_salary: e.target.value})} />}
            <input style={inputStyle} placeholder="Blood Group" value={formData.blood_group || ''} onChange={e => setFormData({...formData, blood_group: e.target.value})} />
            <div><label style={labelStyle}>Joining Date</label><input type="date" style={inputStyle} value={formData.joining_date || ''} onChange={e => setFormData({...formData, joining_date: e.target.value})} /></div>
            <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <input style={inputStyle} placeholder="Current Work Site" value={formData.site_location || ''} onChange={e => setFormData({...formData, site_location: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} style={{...buttonStyle, marginTop: '20px'}}>{loading ? 'Processing...' : (editingId ? 'Apply Changes' : 'Confirm Registration')}</button>
          {editingId && <button onClick={resetForm} style={{...buttonStyle, background: '#666', marginTop: '5px'}}>Discard Edit</button>}
        </form>
      )}

      <div style={tableContainerStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
          <input style={{...inputStyle, flex: 2}} placeholder="🔍 Search Staff, ID, or Project Site..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={exportToCSV} style={utilBtnStyle('#28a745', '#fff')}>Export Excel</button>
          <div style={countBadgeStyle}>Total Records: {filteredEmployees.length}</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr style={{ backgroundColor: '#003366', color: 'white' }}><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Role</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #eee', opacity: emp.status === 'Inactive' ? 0.6 : 1 }}>
                  <td style={tdStyle}><strong>{emp.employee_id}</strong></td>
                  <td style={tdStyle}>{emp.name}</td>
                  <td style={tdStyle}>{emp.role}</td>
                  <td style={tdStyle}><span style={{ color: emp.status === 'Active' ? 'green' : 'red', fontWeight: 'bold' }}>{emp.status}</span></td>
                  <td style={tdStyle}>
                    <button onClick={() => setSelectedEmployee(emp)} style={actionBtnStyle('#17a2b8', '#fff')}>View</button>
                    {canManageStaff && (
                      <><button onClick={() => { setEditingId(emp.id); setFormData(emp); window.scrollTo(0,0); }} style={actionBtnStyle('#ffc107', '#000')}>Edit</button>
                      <button onClick={() => printID(emp)} style={actionBtnStyle('#28a745', '#fff')}>Print</button></>
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
            <h3 style={{ color: '#003366', borderBottom: '2px solid #003366', paddingBottom: '10px' }}>Staff Profile: {selectedEmployee.employee_id}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', marginTop: '10px' }}>
              <p><strong>Status:</strong> <span style={{color: selectedEmployee.status === 'Active' ? 'green' : 'red'}}>{selectedEmployee.status}</span></p>
              <p><strong>Name:</strong> {selectedEmployee.name}</p>
              <p><strong>Designation:</strong> {selectedEmployee.designation}</p>
              <p><strong>Phone:</strong> {selectedEmployee.phone_number}</p>
              <p><strong>NID:</strong> {selectedEmployee.nid_number}</p>
              <p><strong>Blood:</strong> {selectedEmployee.blood_group}</p>
              {canSeeSalary && <p><strong>Basic Salary:</strong> {selectedEmployee.basic_salary} BDT</p>}
              <p><strong>Joining Date:</strong> {selectedEmployee.joining_date}</p>
              <p><strong>Current Site:</strong> {selectedEmployee.site_location}</p>
            </div>
            <button onClick={() => setSelectedEmployee(null)} style={{...buttonStyle, marginTop: '20px'}}>Return to List</button>
          </div>
        </div>
      )}

      {showPassModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Update Security Password</h3>
            <input type="password" style={inputStyle} placeholder="New Secure Password" onChange={e => setNewPass(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
               <button onClick={async () => {
                 if (!newPass || currentUser.employee_id === "ADMIN") return;
                 const { error } = await supabase.from('employees').update({ password: newPass }).eq('id', currentUser.id);
                 if (!error) { alert("Security updated successfully!"); setShowPassModal(false); }
               }} style={buttonStyle}>Save Changes</button>
               <button onClick={() => setShowPassModal(false)} style={{...buttonStyle, background: '#666'}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// STYLES
const loginBoxStyle = { maxWidth: '350px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }
const formBoxStyle = { background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }
const tableContainerStyle = { background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }
const labelStyle = { fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '3px', color: '#555' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }
const thStyle = { padding: '12px 8px', textAlign: 'left' }
const tdStyle = { padding: '10px 8px' }
const countBadgeStyle = { background: '#003366', color: 'white', padding: '10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }
const utilBtnStyle = (bg, color) => ({ backgroundColor: bg, color, border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' })
const actionBtnStyle = (bg, color) => ({ backgroundColor: bg, color, border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold', fontSize: '11px' })
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '10px', maxWidth: '500px', width: '90%' }

export default App