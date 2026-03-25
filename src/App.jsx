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
    dob: '', reference_number: '', basic_salary: '', status: 'Active',
    present_address: '', permanent_address: '', supervisor_name: '', password: ''
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
      dob: '', reference_number: '', basic_salary: '', status: 'Active',
      present_address: '', permanent_address: '', supervisor_name: '', password: ''
    });
    setShowModal(true);
  };

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
      reference_number: emp.reference_number || '',
      basic_salary: emp.basic_salary || '',
      status: emp.status || 'Active',
      present_address: emp.present_address || '',
      permanent_address: emp.permanent_address || '',
      supervisor_name: emp.supervisor_name || '',
      password: emp.password || ''
    });
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const payload = { ...formData, joining_date: formData.joining_date || null, dob: formData.dob || null, basic_salary: formData.basic_salary || null };
    if (!payload.password) payload.password = formData.phone_number || '123456';

    try {
      if (isEditing && editingDbId) {
        const { error } = await supabase.from('employees').update(payload).eq('employee_id', editingDbId);
        if (error) throw error;
        alert("Updated.");
      } else {
        const newID = `CSSL-${1001 + employees.length}`;
        const { error } = await supabase.from('employees').insert([{ ...payload, employee_id: newID }]);
        if (error) throw error;
        alert("Created.");
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
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
        <input style={{...inputStyle, marginBottom: '20px'}} placeholder="🔍 Search by name or ID..." onChange={e => setSearchTerm(e.target.value)} />
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
            <h3 style={{ borderBottom: '2px solid #003366', paddingBottom: '10px' }}>{isEditing ? 'Update Employee' : 'New Enrollment'}</h3>
            <form onSubmit={handleSubmit} style={gridStyle}>
              {/* Row 1 */}
              <div><label style={label}>Full Name</label><input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label style={label}>Email Address</label><input type="email" style={inputStyle} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              
              {/* Row 2 */}
              <div><label style={label}>Designation</label><input style={inputStyle} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
              <div><label style={label}>Role</label>
                <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Row 3 */}
              <div><label style={label}>Phone Number</label><input style={inputStyle} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
              <div><label style={label}>NID Number</label><input style={inputStyle} value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} /></div>

              {/* Row 4 */}
              <div><label style={label}>Joining Date</label><input type="date" style={inputStyle} value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} /></div>
              <div><label style={label}>Supervisor Name</label><input style={inputStyle} value={formData.supervisor_name} onChange={e => setFormData({...formData, supervisor_name: e.target.value})} /></div>

              {/* Row 5 */}
              <div style={{ gridColumn: 'span 2' }}><label style={label}>Present Address</label><input style={inputStyle} value={formData.present_address} onChange={e => setFormData({...formData, present_address: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={label}>Permanent Address</label><input style={inputStyle} value={formData.permanent_address} onChange={e => setFormData({...formData, permanent_address: e.target.value})} /></div>

              {/* Row 6 */}
              <div><label style={label}>Site Location</label><input style={inputStyle} value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} /></div>
              <div><label style={label}>Blood Group</label>
                <select style={inputStyle} value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})}>
                  <option value="">Select</option>
                  {bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Row 7 */}
              <div><label style={label}>Date of Birth</label><input type="date" style={inputStyle} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /></div>
              <div><label style={label}>Status</label>
                <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Row 8 */}
              {canSeeSalary && <div><label style={label}>Basic Salary (BDT)</label><input type="number" style={inputStyle} value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>}
              <div><label style={label}>Reference No.</label><input style={inputStyle} value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} /></div>

              {/* Action Buttons */}
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" disabled={loading} style={{...btnStyle, background: '#003366', color: '#fff'}}>{loading ? 'Processing...' : 'SAVE EMPLOYEE'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{...btnStyle, background: '#ccc'}}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedViewUser && (
        <div style={modalOverlay} onClick={() => setSelectedViewUser(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#003366', borderBottom: '2px solid #003366' }}>ID: {selectedViewUser.employee_id}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <p><b>Name:</b> {selectedViewUser.name}</p>
              <p><b>Email:</b> {selectedViewUser.email}</p>
              <p><b>Post:</b> {selectedViewUser.designation}</p>
              <p><b>Site:</b> {selectedViewUser.site_location}</p>
              <p><b>NID:</b> {selectedViewUser.nid_number}</p>
              <p><b>Joining:</b> {selectedViewUser.joining_date}</p>
              <p><b>Supervisor:</b> {selectedViewUser.supervisor_name}</p>
              <p><b>Status:</b> {selectedViewUser.status}</p>
              <div style={{ gridColumn: 'span 2' }}><p><b>Present Address:</b> {selectedViewUser.present_address}</p></div>
              <div style={{ gridColumn: 'span 2' }}><p><b>Permanent Address:</b> {selectedViewUser.permanent_address}</p></div>
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
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }
const tableCard = { background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '4px' }
const label = { fontSize: '11px', fontWeight: 'bold', color: '#003366', textTransform: 'uppercase' }
const btnStyle = { width: '100%', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const tableStyle = { width: '100%', borderCollapse: 'collapse' }
const thStyle = { padding: '10px', textAlign: 'left' }
const tdStyle = { padding: '10px' }
const actionBtn = (bg, c) => ({ background: bg, color: c, border: 'none', padding: '5px 8px', borderRadius: '3px', cursor: 'pointer', marginRight: '3px', fontSize: '11px' })
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContent = { background: 'white', padding: '25px', borderRadius: '10px', width: '90%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }

export default App