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

  const [formData, setFormData] = useState({
    name: '', email: '', designation: '', role: 'General Staff', site_location: '',
    phone_number: '', nid_number: '', blood_group: '', joining_date: '',
    dob: '', reference_numbe: '', basic_salary: '', status: 'Active',
    present_address: '', permanent_addre: '', supervisor_name: ''
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

  const handleDelete = async (empId, name) => {
    if (!window.confirm(`Delete ${name} (${empId})?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('employee_id', empId);
      if (error) throw error;
      alert("Deleted.");
      fetchEmployees();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setEditingDbId(null);
    setFormData({
      name: '', email: '', designation: '', role: 'General Staff', site_location: '',
      phone_number: '', nid_number: '', blood_group: '', joining_date: '',
      dob: '', reference_numbe: '', basic_salary: '', status: 'Active',
      present_address: '', permanent_addre: '', supervisor_name: ''
    });
    setShowModal(true);
  };

  // --- FIXED: Form Mapping for Edit using Supabase Column Names ---
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
      reference_numbe: emp.reference_numbe || '', // Fixed mapping
      basic_salary: emp.basic_salary || '',
      status: emp.status || 'Active',
      present_address: emp.present_address || '',
      permanent_addre: emp.permanent_addre || '', // Fixed mapping
      supervisor_name: emp.supervisor_name || ''
    });
    setShowModal(true);
  };

  // --- FIXED: Update Logic using exact DB Column Names ---
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
      dob: formData.dob || null,
      reference_numbe: formData.reference_numbe, // DB specific
      basic_salary: formData.basic_salary || null,
      status: formData.status,
      present_address: formData.present_address,
      permanent_addre: formData.permanent_addre, // DB specific
      supervisor_name: formData.supervisor_name
    };

    try {
      if (isEditing && editingDbId) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('employee_id', editingDbId);

        if (error) throw error;
        alert("Updated successfully.");
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

  const printID = (emp) => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><style>
      @page { size: 86mm 54mm; margin: 0; }
      body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
      .c { width: 85.6mm; height: 53.98mm; border: 1.5pt solid #003366; border-radius: 3mm; padding: 3mm; box-sizing: border-box; background: #fff; position: relative; }
      .h { color: #003366; font-size: 11pt; font-weight: bold; border-bottom: 1pt solid #003366; margin-bottom: 2mm; }
      .id-tag { position: absolute; top: 3mm; right: 3mm; background: #003366; color: #fff; padding: 0.5mm 1.5mm; border-radius: 1mm; font-size: 8pt; }
      .i { font-size: 8.5pt; line-height: 1.3; }
    </style></head><body>
      <div class="c"><div class="h">CSSL BANGLADESH</div><div class="id-tag">${emp.employee_id}</div>
      <div class="i"><b>NAME:</b> ${emp.name}<br/><b>POST:</b> ${emp.designation}<br/><b>BLOOD:</b> ${emp.blood_group || 'N/A'}<br/><b>SITE:</b> ${emp.site_location}</div></div>
      <script>setTimeout(()=>{window.print();window.close();},500);</script></body></html>`);
  };

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
        <div>
          <button onClick={handleAddNew} style={{...btnStyle, background: '#003366', color: '#fff', width: 'auto', padding: '10px 20px', marginRight: '10px'}}>+ ADD NEW</button>
          <button onClick={() => setCurrentUser(null)} style={{...btnStyle, background: '#dc3545', color: '#fff', width: 'auto', padding: '10px 20px'}}>Logout</button>
        </div>
      </div>

      <div style={tableCard}>
        <input style={{...inputStyle, marginBottom: '20px'}} placeholder="🔍 Search..." onChange={e => setSearchTerm(e.target.value)} />
        <table style={tableStyle}>
          <thead><tr style={{ background: '#003366', color: '#fff' }}><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Designation</th><th style={thStyle}>Actions</th></tr></thead>
          <tbody>
            {employees.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.employee_id?.includes(searchTerm)).map(emp => (
              <tr key={emp.employee_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}><b>{emp.employee_id}</b></td>
                <td style={tdStyle}>{emp.name}</td>
                <td style={tdStyle}>{emp.designation}</td>
                <td style={tdStyle}>
                  <button onClick={() => setSelectedViewUser(emp)} style={actionBtn('#17a2b8', '#fff')}>View</button>
                  <button onClick={() => handleEdit(emp)} style={actionBtn('#ffc107', '#000')}>Edit</button>
                  <button onClick={() => handleDelete(emp.employee_id, emp.name)} style={actionBtn('#dc3545', '#fff')}>Delete</button>
                  <button onClick={() => printID(emp)} style={actionBtn('#28a745', '#fff')}>Print</button>
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
              <div><label style={label}>Name</label><input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label style={label}>Designation</label><input style={inputStyle} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
              <div><label style={label}>Role</label>
                <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={label}>Site Location</label><input style={inputStyle} value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} /></div>
              <div><label style={label}>Phone</label><input style={inputStyle} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
              <div><label style={label}>Blood Group</label>
                <select style={inputStyle} value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})}>
                  <option value="">Select</option>
                  {bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div><label style={label}>DOB</label><input type="date" style={inputStyle} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /></div>
              <div><label style={label}>Status</label>
                <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div><label style={label}>Ref No.</label><input style={inputStyle} value={formData.reference_numbe} onChange={e => setFormData({...formData, reference_numbe: e.target.value})} /></div>
              {canSeeSalary && <div><label style={label}>Salary</label><input type="number" style={inputStyle} value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>}
              
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={loading} style={{...btnStyle, background: '#003366', color: '#fff'}}>{loading ? 'Saving...' : 'SAVE CHANGES'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{...btnStyle, background: '#ccc'}}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedViewUser && (
        <div style={modalOverlay} onClick={() => setSelectedViewUser(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#003366' }}>Details: {selectedViewUser.employee_id}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <p><b>Name:</b> {selectedViewUser.name}</p>
              <p><b>Post:</b> {selectedViewUser.designation}</p>
              <p><b>Site:</b> {selectedViewUser.site_location}</p>
              <p><b>DOB:</b> {selectedViewUser.dob}</p>
              <p><b>Status:</b> {selectedViewUser.status}</p>
              {canSeeSalary && <p><b>Salary:</b> {selectedViewUser.basic_salary} BDT</p>}
            </div>
            <button onClick={() => setSelectedViewUser(null)} style={{...btnStyle, background: '#666', color: '#fff', marginTop: '20px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
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