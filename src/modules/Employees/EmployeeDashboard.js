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

  // --- STRICT RBAC GATES ---
  const userRole = currentUser?.role || "Guest";
  const isAdmin = userRole === "Admin";
  const canManage = ["Admin", "HR Manager", "General Manager"].includes(userRole);
  const canSeeSalary = ["Admin", "General Manager", "Finance Manager"].includes(userRole);

  useEffect(() => { 
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase.from('employees').select('*')
      if (error) throw error;
      setEmployees(data ? [...data].sort((a, b) => b.employee_id.localeCompare(a.employee_id)) : [])
    } catch (err) { console.error("Fetch Error:", err.message) }
  }

  // --- PRINT ID CARD FUNCTION ---
  const printID = (emp) => {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><style>
      @page { size: 86mm 54mm; margin: 0; }
      body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: 'Segoe UI', sans-serif; }
      .card { width: 85.6mm; height: 53.98mm; border: 2pt solid #003366; border-radius: 4mm; padding: 4mm; box-sizing: border-box; background: #fff; position: relative; }
      .header { color: #003366; font-size: 12pt; font-weight: bold; border-bottom: 1.5pt solid #003366; margin-bottom: 3mm; text-align: center; }
      .id-badge { position: absolute; top: 4mm; right: 4mm; background: #003366; color: #fff; padding: 1mm 2mm; border-radius: 1mm; font-size: 9pt; font-weight: bold; }
      .info { font-size: 9.5pt; line-height: 1.4; color: #333; }
      .info b { color: #003366; width: 60px; display: inline-block; }
    </style></head><body>
      <div class="card">
        <div class="header">COMPOSITE STEEL STRUCTURE LTD</div>
        <div class="id-badge">${emp.employee_id}</div>
        <div class="info">
          <b>NAME:</b> ${emp.name}<br/>
          <b>POST:</b> ${emp.designation}<br/>
          <b>BLOOD:</b> ${emp.blood_group || 'N/A'}<br/>
          <b>SITE:</b> ${emp.site_location || 'HO'}
        </div>
      </div>
      <script>setTimeout(()=>{window.print();window.close();},500);</script>
    </body></html>`);
  };

  const handleDelete = async (empId, name) => {
    if (!isAdmin) return;
    if (!window.confirm(`Permanently remove ${name} from the system?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('employees').delete().eq('employee_id', empId);
      if (error) throw error;
      fetchEmployees();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const payload = { ...formData };
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

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      
      {/* SECURITY STATUS BAR */}
      <div style={{ background: '#003366', color: '#fff', padding: '10px 15px', marginBottom: '20px', borderRadius: '6px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><strong>CSSL ERP GATEWAY:</strong> ACTIVE</span>
        <span><strong>LOGGED AS:</strong> <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{userRole}</span></span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ color: '#003366', margin: 0 }}>Employee Directory</h2>
        {canManage && (
          <button onClick={() => { setIsEditing(false); setFormData({role: 'General Staff', status: 'Active'}); setShowModal(true); }} style={addBtn}>+ New Enrollment</button>
        )}
      </div>

      <input 
        id="search_field"
        name="search_field"
        style={searchBar} 
        placeholder="🔍 Quick Search (Name, ID, or Designation)..." 
        onChange={e => setSearchTerm(e.target.value)} 
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={tbl}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #003366' }}>
              <th style={th}>ID</th>
              <th style={th}>Employee Name</th>
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
                  {canManage && <button onClick={() => { setIsEditing(true); setEditingDbId(emp.employee_id); setFormData({...emp}); setShowModal(true); }} style={actBtn('#ffc107', '#000')}>Edit</button>}
                  {isAdmin && <button onClick={() => handleDelete(emp.employee_id, emp.name)} style={actBtn('#dc3545', '#fff')}>Delete</button>}
                  <button onClick={() => printID(emp)} style={actBtn('#28a745', '#fff')}>Print ID</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAILED VIEW MODAL */}
      {selectedViewUser && (
        <div style={overlay} onClick={() => setSelectedViewUser(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #003366', paddingBottom: '10px', marginBottom: '15px' }}>
              <h2>TESTING UPDATE - 123</h2>
              <h2  style={{ margin: 0, color: '#003366' }}>Employee Profile: {selectedViewUser.employee_id}</h2>
              <button onClick={() => setSelectedViewUser(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={grid}>
              <p><b>Name:</b> {selectedViewUser.name}</p>
              <p><b>Email:</b> {selectedViewUser.email || 'N/A'}</p>
              <p><b>Designation:</b> {selectedViewUser.designation}</p>
              <p><b>Role:</b> {selectedViewUser.role}</p>
              <p><b>Phone:</b> {selectedViewUser.phone_number}</p>
              <p><b>Blood Group:</b> {selectedViewUser.blood_group}</p>
              <p><b>Site:</b> {selectedViewUser.site_location}</p>
              <p><b>Joining Date:</b> {selectedViewUser.joining_date}</p>
              <p><b>NID:</b> {selectedViewUser.nid_number}</p>
              <p><b>Supervisor:</b> {selectedViewUser.supervisor_name}</p>
              <p style={{ gridColumn: 'span 2' }}><b>Address:</b> {selectedViewUser.present_address}</p>
              {canSeeSalary && <p style={{ color: '#27ae60' }}><b>Salary:</b> {selectedViewUser.basic_salary} BDT</p>}
              {isAdmin && <p style={{ color: '#e74c3c' }}><b>Password:</b> {selectedViewUser.password}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT / EDIT MODAL */}
      {showModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3 style={{ borderBottom: '2px solid #003366', paddingBottom: '10px' }}>{isEditing ? 'Update Records' : 'Staff Enrollment Form'}</h3>
            <form onSubmit={handleSubmit} style={grid}>
              <div><label style={lbl}>Name</label><input style={inp} name="name" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label style={lbl}>Designation</label><input style={inp} name="designation" id="designation" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
              
              <div><label style={lbl}>Role</label>
                <select style={inp} name="role" id="role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {isAdmin && (
                <div><label style={lbl}>Login Password</label><input style={inp} name="password" id="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
              )}

              {canSeeSalary && (
                <div><label style={lbl}>Salary (BDT)</label><input style={inp} name="salary" id="salary" type="number" value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>
              )}

              <div><label style={lbl}>Phone</label><input style={inp} name="phone" id="phone" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
              <div><label style={lbl}>NID</label><input style={inp} name="nid" id="nid" value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} /></div>
              <div><label style={lbl}>Site Location</label><input style={inp} name="site" id="site" value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} /></div>
              
              <div><label style={lbl}>Blood Group</label>
                <select style={inp} name="blood" id="blood" value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})}>
                  <option value="">Select</option>
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>

              <div><label style={lbl}>Supervisor</label><input style={inp} name="sup" id="sup" value={formData.supervisor_name} onChange={e => setFormData({...formData, supervisor_name: e.target.value})} /></div>
              <div><label style={lbl}>Joining Date</label><input style={inp} type="date" name="join" id="join" value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} /></div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={lbl}>Present Address</label>
                <input style={inp} name="addr" id="addr" value={formData.present_address} onChange={e => setFormData({...formData, present_address: e.target.value})} />
              </div>

              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={saveBtn}>{loading ? 'Processing...' : 'SAVE TO DATABASE'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- ALL STYLES ---
const th = { padding: '12px', textAlign: 'left', color: '#003366', fontWeight: 'bold' };
const td = { padding: '12px', fontSize: '14px' };
const tbl = { width: '100%', borderCollapse: 'collapse' };
const lbl = { fontSize: '11px', fontWeight: 'bold', color: '#003366', textTransform: 'uppercase' };
const inp = { width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };
const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const searchBar = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd' };
const addBtn = { background: '#003366', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const saveBtn = { flex: 1, background: '#28a745', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtn = { flex: 1, background: '#6c757d', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const actBtn = (bg, c) => ({ background: bg, color: c, border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' });
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' };