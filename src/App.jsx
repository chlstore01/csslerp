import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // UI & Security States
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' })
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [editingId, setEditingId] = useState(null) // STRICT DB ID LOCK

  // FULL FIELD LIST (Restored all previous facilities)
  const [formData, setFormData] = useState({
    name: '', designation: '', role: 'General Staff', site_location: '', 
    phone_number: '', nid_number: '', blood_group: '', joining_date: '', 
    basic_salary: '', status: 'Active', employee_id: ''
  });

  const MASTER_ID = "ADMIN", MASTER_KEY = "CSSL_MASTER_2026";
  const roleList = ["Admin", "General Manager", "Finance & Accountant Manager", "Supply Chain Manager", "Human Resource Manager", "Supervisor", "Engineer", "General Staff"];

  // Role Permissions
  const canModify = currentUser && ["Admin", "General Manager", "Human Resource Manager"].includes(currentUser.role);
  const canSeeSalary = currentUser && ["Admin", "General Manager", "Finance & Accountant Manager"].includes(currentUser.role);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase.from('employees').select('*')
    if (!error) setEmployees(data ? [...data].sort((a, b) => b.id - a.id) : [])
  }

  // --- DELETE FACILITY (FIXED) ---
  const handleDelete = async (id, name) => {
    if (window.confirm(`CRITICAL: Delete ${name} permanently?`)) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) alert("Delete Failed: " + error.message);
      else {
        alert("Record Removed Successfully.");
        fetchEmployees();
      }
    }
  };

  // --- EDIT FACILITY (FIXED) ---
  const handleEditTrigger = (emp) => {
    setEditingId(emp.id); // Secure the unique DB key
    setFormData({ ...emp }); // Fill the form with EVERYTHING
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleFormSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // CLEAN PAYLOAD: Only send actual data fields to Supabase
    const cleanData = {
      name: formData.name,
      designation: formData.designation,
      role: formData.role,
      site_location: formData.site_location,
      phone_number: formData.phone_number,
      nid_number: formData.nid_number,
      blood_group: formData.blood_group,
      joining_date: formData.joining_date || null,
      basic_salary: formData.basic_salary || null,
      status: formData.status
    };

    if (editingId) {
      // FORCE UPDATE PATH
      const { error } = await supabase.from('employees').update(cleanData).eq('id', editingId);
      if (error) alert("Update Error: " + error.message);
      else alert(`Employee ${formData.name} updated successfully.`);
    } else {
      // FORCE INSERT PATH
      const newEntry = {
        ...cleanData,
        employee_id: `CSSL-${1001 + employees.length}`,
        password: formData.phone_number || '123456'
      };
      const { error } = await supabase.from('employees').insert([newEntry]);
      if (error) alert("Registration Error: " + error.message);
      else alert("New Employee Enrolled.");
    }

    setEditingId(null);
    resetForm();
    fetchEmployees();
    setLoading(false);
  }

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', designation: '', role: 'General Staff', site_location: '', phone_number: '', nid_number: '', blood_group: '', joining_date: '', basic_salary: '', status: 'Active', employee_id: '' });
  };

  // --- CSV & PRINT FACILITIES ---
  const runExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Name,Phone,Site,Status\n" 
      + employees.map(e => `${e.employee_id},${e.name},${e.phone_number},${e.site_location},${e.status}`).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "CSSL_Staff_Inventory.csv");
    link.click();
  };

  const runPrint = (emp) => {
    const win = window.open('', '_blank');
    win.document.write(`<html><body style="font-family:sans-serif; display:flex; justify-content:center; padding:40px;">
      <div style="width:300px; border:4px solid #003366; border-radius:15px; padding:20px; text-align:center;">
        <h2 style="color:#003366; margin-bottom:5px;">CSSL BANGLADESH</h2>
        <div style="background:#003366; color:#fff; display:inline-block; padding:3px 10px; border-radius:5px; font-weight:bold;">${emp.employee_id}</div>
        <h3 style="margin:15px 0 5px 0;">${emp.name}</h3>
        <p style="margin:0; color:#555;">${emp.designation}</p>
        <p style="margin:10px 0; font-size:12px;"><b>Blood:</b> ${emp.blood_group || 'N/A'} | <b>Site:</b> ${emp.site_location}</p>
      </div><script>setTimeout(()=>{window.print();window.close();},500);</script></body></html>`);
  };

  if (!currentUser) {
    return (
      <div style={loginBox}>
        <h2 style={{ color: '#003366' }}>CSSL ERP System</h2>
        <input style={inputStyle} placeholder="Employee ID" onChange={e => setLoginForm({...loginForm, id: e.target.value})} />
        <input type="password" style={{...inputStyle, marginTop: '10px'}} placeholder="Password" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
        <button onClick={() => {
          if (loginForm.id === MASTER_ID && loginForm.pass === MASTER_KEY) setCurrentUser({name: "Super Admin", role: "Admin"});
          else {
            const user = employees.find(e => e.employee_id === loginForm.id && e.password === loginForm.pass);
            if (user && user.status === 'Active') setCurrentUser(user);
            else alert("Unauthorized or Inactive Account.");
          }
        }} style={{...btnStyle, background: '#003366', color: '#fff', marginTop: '15px'}}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1300px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h1 style={{ color: '#003366', margin: 0 }}>CSSL Dashboard</h1>
        <button onClick={() => setCurrentUser(null)} style={{...btnStyle, background: '#dc3545', color: '#fff', width: 'auto', padding: '8px 20px'}}>Logout</button>
      </div>

      {canModify && (
        <div style={{...formCard, borderTop: editingId ? '8px solid #ffc107' : '8px solid #003366'}}>
          <h3 style={{ marginTop: 0 }}>{editingId ? `📝 Modifying: ${formData.employee_id}` : '➕ New Employee Enrollment'}</h3>
          <form onSubmit={handleFormSubmit} style={grid}>
            <div><label style={label}>Name</label><input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
            <div><label style={label}>Designation</label><input style={inputStyle} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
            <div><label style={label}>Role</label><select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>{roleList.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label style={label}>Phone</label><input style={inputStyle} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
            <div><label style={label}>NID Number</label><input style={inputStyle} value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} /></div>
            <div><label style={label}>Blood Group</label><input style={inputStyle} value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} /></div>
            {canSeeSalary && <div><label style={label}>Basic Salary</label><input type="number" style={inputStyle} value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>}
            <div><label style={label}>Status</label><select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
            <div><label style={label}>Project Site</label><input style={inputStyle} value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} /></div>
            <div><label style={label}>Joining Date</label><input type="date" style={inputStyle} value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} /></div>
            
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" disabled={loading} style={{...btnStyle, background: editingId ? '#ffc107' : '#003366', color: editingId ? '#000' : '#fff'}}>{loading ? 'Saving...' : (editingId ? 'SAVE CHANGES' : 'REGISTER STAFF')}</button>
              {editingId && <button type="button" onClick={resetForm} style={{...btnStyle, background: '#666', color: '#fff'}}>CANCEL</button>}
            </div>
          </form>
        </div>
      )}

      <div style={tableContainer}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input style={{...inputStyle, flex: 2}} placeholder="🔍 Search by Name, ID, or Site..." onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={runExport} style={{...btnStyle, background: '#28a745', color: '#fff', width: 'auto', padding: '0 20px'}}>Export Excel</button>
        </div>
        <table style={table}>
          <thead><tr style={{ background: '#003366', color: '#fff' }}><th style={th}>ID</th><th style={th}>Name</th><th style={th}>Status</th><th style={th}>Actions</th></tr></thead>
          <tbody>
            {employees.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.employee_id?.includes(searchTerm) || e.site_location?.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}><b>{emp.employee_id}</b></td>
                <td style={td}>{emp.name}</td>
                <td style={td}><span style={{ color: emp.status === 'Active' ? 'green' : 'red', fontWeight: 'bold' }}>{emp.status}</span></td>
                <td style={td}>
                  <button onClick={() => setSelectedEmployee(emp)} style={actionBtn('#17a2b8', '#fff')}>View</button>
                  {canModify && (
                    <>
                      <button onClick={() => handleEditTrigger(emp)} style={actionBtn('#ffc107', '#000')}>Edit</button>
                      <button onClick={() => handleDelete(emp.id, emp.name)} style={actionBtn('#dc3545', '#fff')}>Delete</button>
                      <button onClick={() => runPrint(emp)} style={actionBtn('#28a745', '#fff')}>Print</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL (RESTORED) */}
      {selectedEmployee && (
        <div style={modalOverlay} onClick={() => setSelectedEmployee(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#003366', borderBottom: '3px solid #003366' }}>Profile: {selectedEmployee.employee_id}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              <p><b>Name:</b> {selectedEmployee.name}</p>
              <p><b>Post:</b> {selectedEmployee.designation}</p>
              <p><b>Phone:</b> {selectedEmployee.phone_number}</p>
              <p><b>NID:</b> {selectedEmployee.nid_number}</p>
              <p><b>Blood Group:</b> {selectedEmployee.blood_group}</p>
              <p><b>Site:</b> {selectedEmployee.site_location}</p>
              <p><b>Joined:</b> {selectedEmployee.joining_date}</p>
              {canSeeSalary && <p><b>Salary:</b> {selectedEmployee.basic_salary} BDT</p>}
            </div>
            <button onClick={() => setSelectedEmployee(null)} style={{...btnStyle, background: '#003366', color: '#fff', marginTop: '25px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const loginBox = { maxWidth: '350px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '15px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }
const formCard = { background: '#f9f9f9', padding: '25px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }
const tableContainer = { background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' }
const label = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#666' }
const btnStyle = { width: '100%', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
const table = { width: '100%', borderCollapse: 'collapse', marginTop: '10px' }
const th = { padding: '12px', textAlign: 'left' }
const td = { padding: '12px', fontSize: '14px' }
const actionBtn = (bg, c) => ({ background: bg, color: c, border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold', fontSize: '12px' })
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '600px' }

export default App