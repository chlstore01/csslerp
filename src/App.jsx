import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' })
  
  // MODAL & EDITING STATES
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingDbId, setEditingDbId] = useState(null) // This will now strictly store the Uppercase ID
  const [selectedViewUser, setSelectedViewUser] = useState(null)

  const [formData, setFormData] = useState({
    name: '', email: '', designation: '', role: 'General Staff', site_location: '', 
    phone_number: '', nid_number: '', blood_group: '', joining_date: '', 
    basic_salary: '', status: 'Active', employee_id: '',
    present_address: '', permanent_address: '', supervisor_name: ''
  });

  const MASTER_ID = "ADMIN", MASTER_KEY = "CSSL_MASTER_2026";
  const roles = ["Admin", "General Manager", "Finance Manager", "Supply Chain Manager", "HR Manager", "Supervisor", "Engineer", "General Staff"];

  // PERMISSIONS
  const canModify = currentUser && ["Admin", "General Manager", "HR Manager"].includes(currentUser.role);
  const canSeeSalary = currentUser && ["Admin", "General Manager", "Finance Manager"].includes(currentUser.role);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase.from('employees').select('*')
      if (error) throw error;
      // Use Uppercase ID for sorting
      setEmployees(data ? [...data].sort((a, b) => (b.ID || 0) - (a.ID || 0)) : [])
    } catch (err) { console.error("Sync Error:", err.message) }
  }

  // --- ACTION: DELETE (Strictly Uppercase ID) ---
  const handleDelete = async (dbId, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('ID', dbId);
      if (error) throw error;
      alert("Employee deleted successfully.");
      fetchEmployees();
    } catch (err) {
      alert("Delete Failed: " + err.message);
    } finally { setLoading(false); }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditingDbId(null);
    setFormData({ 
      name: '', email: '', designation: '', role: 'General Staff', site_location: '', 
      phone_number: '', nid_number: '', blood_group: '', joining_date: '', 
      basic_salary: '', status: 'Active', employee_id: '',
      present_address: '', permanent_address: '', supervisor_name: ''
    });
    setShowModal(true);
  };

  // --- ACTION: EDIT (The Red Circle Button) ---
  const handleEdit = (emp) => {
    setIsEditing(true);
    setEditingDbId(emp.ID); // Capture the Uppercase ID
    setFormData({ ...emp });
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      designation: formData.designation,
      role: formData.role,
      site_location: formData.site_location,
      phone_number: formData.phone_number,
      nid_number: formData.nid_number,
      blood_group: formData.blood_group,
      joining_date: formData.joining_date || null,
      basic_salary: formData.basic_salary || null,
      status: formData.status,
      present_address: formData.present_address,
      permanent_address: formData.permanent_address,
      supervisor_name: formData.supervisor_name
    };

    try {
      if (isEditing && editingDbId) {
        // UPDATE EXISTING (Strict Uppercase ID)
        const { error } = await supabase.from('employees').update(payload).eq('ID', editingDbId);
        if (error) throw error;
        alert("Information Updated Successfully.");
      } else {
        // REGISTER NEW
        const newEntry = { ...payload, employee_id: `CSSL-${1001 + employees.length}`, password: formData.phone_number || '123456' };
        const { error } = await supabase.from('employees').insert([newEntry]);
        if (error) throw error;
        alert("New Employee Registered.");
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      alert("Operation Failed: " + err.message);
    } finally { setLoading(false); }
  }

  const printID = (emp) => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><style>
      @page { size: 86mm 54mm; margin: 0; }
      body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
      .c { width: 85.6mm; height: 53.98mm; border: 1.5pt solid #003366; border-radius: 3mm; padding: 3mm; box-sizing: border-box; font-family: sans-serif; background: #fff; position: relative; }
      .h { color: #003366; font-size: 11pt; font-weight: bold; border-bottom: 1pt solid #003366; margin-bottom: 2mm; }
      .id { position: absolute; top: 3mm; right: 3mm; background: #003366; color: #fff; padding: 0.5mm 1.5mm; border-radius: 1mm; font-size: 8pt; }
      .i { font-size: 8.5pt; line-height: 1.3; }
    </style></head><body>
      <div class="c"><div class="h">CSSL BANGLADESH</div><div class="id">${emp.employee_id}</div>
      <div class="i"><b>NAME:</b> ${emp.name}<br/><b>POST:</b> ${emp.designation}<br/><b>BLOOD:</b> ${emp.blood_group || 'N/A'}<br/><b>SITE:</b> ${emp.site_location}</div></div>
      <script>setTimeout(()=>{window.print();window.close();},500);</script></body></html>`);
  };

  if (!currentUser) {
    return (
      <div style={loginStyle}>
        <h2 style={{ color: '#003366' }}>CSSL ERP LOGIN</h2>
        <input style={inputStyle} placeholder="Employee ID" onChange={e => setLoginForm({...loginForm, id: e.target.value})} />
        <input type="password" style={{...inputStyle, marginTop: '10px'}} placeholder="Password" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
        <button style={{...btnStyle, marginTop: '20px', background: '#003366', color: '#fff'}} onClick={() => {
          if (loginForm.id === MASTER_ID && loginForm.pass === MASTER_KEY) setCurrentUser({name: "Admin", role: "Admin"});
          else {
            const user = employees.find(e => e.employee_id === loginForm.id && e.password === loginForm.pass);
            if (user && user.status === 'Active') setCurrentUser(user); else alert("Invalid Login");
          }
        }}>Sign In</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={headerStyle}>
        <h2 style={{ color: '#003366', margin: 0 }}>CSSL Dashboard</h2>
        <div>
          <button onClick={handleAddNew} style={{...btnStyle, background: '#003366', color: '#fff', width: 'auto', padding: '10px 20px', marginRight: '10px'}}>+ ADD NEW EMPLOYEE</button>
          <button onClick={() => setCurrentUser(null)} style={{...btnStyle, background: '#dc3545', color: '#fff', width: 'auto', padding: '10px 20px'}}>Logout</button>
        </div>
      </div>

      <div style={tableCard}>
        <input style={{...inputStyle, marginBottom: '20px'}} placeholder="🔍 Search Staff Name, ID, or Phone..." onChange={e => setSearchTerm(e.target.value)} />
        <table style={tableStyle}>
          <thead><tr style={{ background: '#003366', color: '#fff' }}><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Designation</th><th style={thStyle}>Actions</th></tr></thead>
          <tbody>
            {employees.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.employee_id?.includes(searchTerm)).map(emp => (
              <tr key={emp.ID} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}><b>{emp.employee_id}</b></td>
                <td style={tdStyle}>{emp.name}</td>
                <td style={tdStyle}>{emp.designation}</td>
                <td style={tdStyle}>
                  <button onClick={() => setSelectedViewUser(emp)} style={actionBtn('#17a2b8', '#fff')}>View</button>
                  <button onClick={() => handleEdit(emp)} style={actionBtn('#ffc107', '#000')}>Edit</button>
                  <button onClick={() => handleDelete(emp.ID, emp.name)} style={actionBtn('#dc3545', '#fff')}>Delete</button>
                  <button onClick={() => printID(emp)} style={actionBtn('#28a745', '#fff')}>Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- POP-UP MODAL: ADD / UPDATE --- */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #003366', marginBottom: '20px', paddingBottom: '10px' }}>
              <h3 style={{margin:0}}>{isEditing ? `Update Employee: ${formData.employee_id}` : 'New Employee Enrollment'}</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={gridStyle}>
              <div><label style={label}>Name</label><input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label style={label}>Email</label><input type="email" style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label style={label}>Designation</label><input style={inputStyle} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
              <div><label style={label}>Phone</label><input style={inputStyle} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
              <div><label style={label}>NID</label><input style={inputStyle} value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} /></div>
              <div><label style={label}>Supervisor</label><input style={inputStyle} value={formData.supervisor_name} onChange={e => setFormData({...formData, supervisor_name: e.target.value})} /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={label}>Present Address</label><input style={inputStyle} value={formData.present_address} onChange={e => setFormData({...formData, present_address: e.target.value})} /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={label}>Permanent Address</label><input style={inputStyle} value={formData.permanent_address} onChange={e => setFormData({...formData, permanent_address: e.target.value})} /></div>
              <div><label style={label}>Joining Date</label><input type="date" style={inputStyle} value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} /></div>
              {canSeeSalary && <div><label style={label}>Salary</label><input type="number" style={inputStyle} value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>}
              
              <div style={{ gridColumn: '1/-1', marginTop: '20px' }}>
                <button type="submit" disabled={loading} style={{...btnStyle, background: isEditing ? '#ffc107' : '#003366', color: isEditing ? '#000' : '#fff'}}>
                  {loading ? 'Processing...' : (isEditing ? 'UPDATE EXISTING INFORMATION' : 'REGISTER STAFF')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW ONLY MODAL (RESTORED SALARY) --- */}
      {selectedViewUser && (
        <div style={modalOverlay} onClick={() => setSelectedViewUser(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#003366', borderBottom: '3px solid #003366' }}>Full Details: {selectedViewUser.employee_id}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              <p><b>Name:</b> {selectedViewUser.name}</p>
              <p><b>Email:</b> {selectedViewUser.email || 'N/A'}</p>
              <p><b>Post:</b> {selectedViewUser.designation}</p>
              <p><b>Phone:</b> {selectedViewUser.phone_number}</p>
              <p><b>Supervisor:</b> {selectedViewUser.supervisor_name}</p>
              {canSeeSalary && <p><b>Salary:</b> {selectedViewUser.basic_salary} BDT</p>}
              <p style={{gridColumn:'1/-1'}}><b>Present Address:</b> {selectedViewUser.present_address}</p>
              <p style={{gridColumn:'1/-1'}}><b>Permanent Address:</b> {selectedViewUser.permanent_address}</p>
            </div>
            <button onClick={() => setSelectedViewUser(null)} style={{...btnStyle, background: '#666', color: '#fff', marginTop: '20px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const loginStyle = { maxWidth: '350px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '15px', textAlign: 'center' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }
const tableCard = { background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }
const label = { fontSize: '11px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }
const btnStyle = { width: '100%', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
const tableStyle = { width: '100%', borderCollapse: 'collapse' }
const thStyle = { padding: '12px', textAlign: 'left' }
const tdStyle = { padding: '12px' }
const actionBtn = (bg, c) => ({ background: bg, color: c, border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold', fontSize: '11px' })
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContent = { background: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }

export default App