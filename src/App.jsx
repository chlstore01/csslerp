import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' })
  
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingDbId, setEditingDbId] = useState(null) 
  const [selectedViewUser, setSelectedViewUser] = useState(null)

  // Initializing state with exact Supabase column keys
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    designation: '', 
    role: 'General Staff', 
    site_location: '', 
    phone_number: '', 
    nid_number: '', 
    blood_group: '', 
    joining_date: '', 
    dob: '', 
    reference_numbe: '', // Matched to your screenshot
    basic_salary: '', 
    status: 'Active', 
    present_address: '', 
    permanent_addre: '', // Matched to your screenshot
    supervisor_name: ''
  });

  const roles = ["Admin", "General Manager", "Finance Manager", "Supply Chain Manager", "HR Manager", "Supervisor", "Engineer", "General Staff"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const canSeeSalary = currentUser && ["Admin", "General Manager", "Finance Manager"].includes(currentUser.role);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase.from('employees').select('*')
      if (error) throw error;
      setEmployees(data ? [...data].sort((a, b) => b.employee_id.localeCompare(a.employee_id)) : [])
    } catch (err) { console.error("Fetch Error:", err.message) }
  }

  // --- FIXED: Mapping from 'emp' (Supabase row) to Form State ---
  const handleEdit = (emp) => {
    setIsEditing(true);
    setEditingDbId(emp.employee_id);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      designation: emp.designation || '',
      role: emp.role || 'General Staff',
      site_location: emp.site_location || '',
      phone_number: emp.phone_number || '',
      nid_number: emp.nid_number || '',
      blood_group: emp.blood_group || '',
      joining_date: emp.joining_date || '',
      dob: emp.dob || '',
      reference_numbe: emp.reference_numbe || '', // Updated to match DB
      basic_salary: emp.basic_salary || '',
      status: emp.status || 'Active',
      present_address: emp.present_address || '',
      permanent_addre: emp.permanent_addre || '', // Updated to match DB
      supervisor_name: emp.supervisor_name || ''
    });
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = { ...formData };
    // Primary key should never be in the update payload
    delete payload.employee_id; 
    delete payload.created_at;

    try {
      if (isEditing && editingDbId) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('employee_id', editingDbId);

        if (error) throw error;
        alert("Employee details updated successfully.");
      } else {
        const newID = `CSSL-${1001 + employees.length}`;
        const { error } = await supabase
          .from('employees')
          .insert([{ ...payload, employee_id: newID, password: formData.phone_number || '123456' }]);
        
        if (error) throw error;
        alert("New record created.");
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      alert("Error: " + err.message);
    } finally { setLoading(false); }
  }

  // Helper for inputs to reduce repetition
  const updateField = (key, value) => setFormData({...formData, [key]: value});

  if (!currentUser) {
    return (
      <div style={loginStyle}>
        <h2 style={{ color: '#003366' }}>CSSL ERP</h2>
        <input style={inputStyle} placeholder="ID" onChange={e => setLoginForm({...loginForm, id: e.target.value})} />
        <input type="password" style={{...inputStyle, marginTop: '10px'}} placeholder="Pass" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
        <button style={{...btnStyle, marginTop: '20px', background: '#003366', color: '#fff'}} onClick={() => {
          if (loginForm.id === "ADMIN" && loginForm.pass === "CSSL_MASTER_2026") setCurrentUser({name: "Admin", role: "Admin"});
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
        <h2 style={{ color: '#003366' }}>CSSL Dashboard</h2>
        <button onClick={() => { setIsEditing(false); setFormData({}); setShowModal(true); }} style={{...btnStyle, background: '#003366', color: '#fff', width: 'auto', padding: '10px 20px'}}>+ ADD NEW</button>
      </div>

      <div style={tableCard}>
        <table style={tableStyle}>
          <thead><tr style={{ background: '#003366', color: '#fff' }}><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
          <tbody>
            {employees.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
              <tr key={emp.employee_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}><b>{emp.employee_id}</b></td>
                <td style={tdStyle}>{emp.name}</td>
                <td style={tdStyle}>{emp.status}</td>
                <td style={tdStyle}>
                  <button onClick={() => setSelectedViewUser(emp)} style={actionBtn('#17a2b8', '#fff')}>View</button>
                  <button onClick={() => handleEdit(emp)} style={actionBtn('#ffc107', '#000')}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>{isEditing ? 'Update Employee' : 'Enrollment'}</h3>
            <form onSubmit={handleSubmit} style={gridStyle}>
              <div><label style={label}>Name</label><input style={inputStyle} value={formData.name || ''} onChange={e => updateField('name', e.target.value)} required /></div>
              <div><label style={label}>Designation</label><input style={inputStyle} value={formData.designation || ''} onChange={e => updateField('designation', e.target.value)} /></div>
              <div><label style={label}>Site Location</label><input style={inputStyle} value={formData.site_location || ''} onChange={e => updateField('site_location', e.target.value)} /></div>
              <div><label style={label}>Phone</label><input style={inputStyle} value={formData.phone_number || ''} onChange={e => updateField('phone_number', e.target.value)} /></div>
              <div><label style={label}>Ref No.</label><input style={inputStyle} value={formData.reference_numbe || ''} onChange={e => updateField('reference_numbe', e.target.value)} /></div>
              <div><label style={label}>Status</label>
                <select style={inputStyle} value={formData.status || 'Active'} onChange={e => updateField('status', e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={loading} style={{...btnStyle, background: '#003366', color: '#fff'}}>{loading ? 'Saving...' : 'SAVE CHANGES'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{...btnStyle, background: '#ccc'}}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES (NO CHANGES)
const loginStyle = { maxWidth: '300px', margin: '100px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'center' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }
const tableCard = { background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const label = { fontSize: '12px', fontWeight: 'bold', color: '#666' }
const btnStyle = { width: '100%', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const tableStyle = { width: '100%', borderCollapse: 'collapse' }
const thStyle = { padding: '10px', textAlign: 'left' }
const tdStyle = { padding: '10px' }
const actionBtn = (bg, c) => ({ background: bg, color: c, border: 'none', padding: '5px 8px', borderRadius: '3px', cursor: 'pointer', marginRight: '3px', fontSize: '11px' })
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContent = { background: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '700px' }

export default App