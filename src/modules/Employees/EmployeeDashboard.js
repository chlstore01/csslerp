import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function EmployeeDashboard({ currentUser }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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

  // --- STRICT ACCESS CONTROL LOGIC ---
  const isAdmin = currentUser?.role === "Admin";
  const canManage = ["Admin", "HR Manager", "General Manager"].includes(currentUser?.role);
  const canSeeSalary = ["Admin", "General Manager", "Finance Manager"].includes(currentUser?.role);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase.from('employees').select('*')
      if (error) throw error;
      setEmployees(data ? [...data].sort((a, b) => b.employee_id.localeCompare(a.employee_id)) : [])
    } catch (err) { console.error("Fetch Error:", err.message) }
  }

  const handleDelete = async (empId, name) => {
    if (!window.confirm(`Permanently delete ${name}?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('employee_id', empId);
      if (error) throw error;
      alert("Employee Record Removed.");
      fetchEmployees();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleEdit = (emp) => {
    setIsEditing(true);
    setEditingDbId(emp.employee_id);
    setFormData({ ...emp });
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const payload = { ...formData };
    
    // Default password logic for new entries
    if (!payload.password) payload.password = formData.phone_number || '123456';

    try {
      if (isEditing) {
        const { error } = await supabase.from('employees').update(payload).eq('employee_id', editingDbId);
        if (error) throw error;
      } else {
        const newID = `CSSL-${1001 + employees.length}`;
        const { error } = await supabase.from('employees').insert([{ ...payload, employee_id: newID }]);
        if (error) throw error;
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

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#003366', margin: 0 }}>Employee Management</h2>
        {canManage && (
          <button onClick={() => { setIsEditing(false); setShowModal(true); }} style={addBtn}>+ ENROLL NEW</button>
        )}
      </div>

      <input 
        style={searchBar} 
        placeholder="🔍 Search name, designation, or ID..." 
        onChange={e => setSearchTerm(e.target.value)} 
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={tbl}>
          <thead>
            <tr style={{ background: '#003366', color: '#fff' }}>
              <th style={th}>ID</th>
              <th style={th}>Full Name</th>
              <th style={th}>Designation</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.employee_id?.includes(searchTerm)).map(emp => (
              <tr key={emp.employee_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}><b>{emp.employee_id}</b></td>
                <td style={td}>{emp.name}</td>
                <td style={td}>{emp.designation}</td>
                <td style={td}>
                  <button onClick={() => setSelectedViewUser(emp)} style={actBtn('#17a2b8', '#fff')}>View</button>
                  {/* GATE: Edit only for Managers */}
                  {canManage && <button onClick={() => handleEdit(emp)} style={actBtn('#ffc107', '#000')}>Edit</button>}
                  {/* GATE: Delete ONLY for Admin */}
                  {isAdmin && <button onClick={() => handleDelete(emp.employee_id, emp.name)} style={actBtn('#dc3545', '#fff')}>Delete</button>}
                  <button onClick={() => printID(emp)} style={actBtn('#28a745', '#fff')}>Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL (ADD/EDIT) */}
      {showModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3 style={{ borderBottom: '2px solid #003366', paddingBottom: '10px' }}>{isEditing ? 'Update Employee File' : 'New Enrollment Form'}</h3>
            <form onSubmit={handleSubmit} style={grid}>
              <div><label style={lbl}>Name</label><input style={inp} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label style={lbl}>Email</label><input style={inp} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label style={lbl}>Designation</label><input style={inp} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
              <div><label style={lbl}>Role</label>
                <select style={inp} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              {/* ADMIN ONLY PASSWORD EDIT */}
              {isAdmin && (
                <div><label style={lbl}>Login Password</label><input style={inp} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="User's login key" /></div>
              )}

              {canSeeSalary && (
                <div><label style={lbl}>Salary (BDT)</label><input type="number" style={inp} value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>
              )}

              <div><label style={lbl}>Phone</label><input style={inp} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
              <div><label style={lbl}>NID</label><input style={inp} value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} /></div>
              <div><label style={lbl}>Joining Date</label><input type="date" style={inp} value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} /></div>
              <div><label style={lbl}>Supervisor</label><input style={inp} value={formData.supervisor_name} onChange={e => setFormData({...formData, supervisor_name: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Present Address</label><input style={inp} value={formData.present_address} onChange={e => setFormData({...formData, present_address: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Permanent Address</label><input style={inp} value={formData.permanent_address} onChange={e => setFormData({...formData, permanent_address: e.target.value})} /></div>
              <div><label style={lbl}>Blood Group</label>
                <select style={inp} value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})}>
                   <option value="">Select</option>
                   {bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Site Location</label><input style={inp} value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} /></div>

              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" style={saveBtn}>{loading ? 'Saving...' : 'SAVE RECORD'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {selectedViewUser && (
        <div style={overlay} onClick={() => setSelectedViewUser(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#003366', borderBottom: '2px solid #003366' }}>ID: {selectedViewUser.employee_id}</h2>
            <div style={grid}>
              <p><b>Name:</b> {selectedViewUser.name}</p>
              <p><b>Post:</b> {selectedViewUser.designation}</p>
              <p><b>Role:</b> {selectedViewUser.role}</p>
              <p><b>Phone:</b> {selectedViewUser.phone_number}</p>
              {isAdmin && <p style={{ color: 'red' }}><b>Password:</b> {selectedViewUser.password}</p>}
              {canSeeSalary && <p><b>Salary:</b> {selectedViewUser.basic_salary} BDT</p>}
              <p><b>Site:</b> {selectedViewUser.site_location}</p>
              <p><b>Blood:</b> {selectedViewUser.blood_group}</p>
            </div>
            <button onClick={() => setSelectedViewUser(null)} style={{...cancelBtn, marginTop: '20px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CSS-IN-JS STYLES ---
const th = { padding: '12px', textAlign: 'left' };
const td = { padding: '12px' };
const tbl = { width: '100%', borderCollapse: 'collapse' };
const lbl = { fontSize: '11px', fontWeight: 'bold', color: '#003366', textTransform: 'uppercase' };
const inp = { width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const searchBar = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd' };
const addBtn = { background: '#003366', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const saveBtn = { flex: 1, background: '#003366', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtn = { flex: 1, background: '#ccc', color: '#333', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const actBtn = (bg, c) => ({ background: bg, color: c, border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' });
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' };