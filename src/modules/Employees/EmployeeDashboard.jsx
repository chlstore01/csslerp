import { useEffect, useState } from 'react'
import { supabase } from "../../supabaseClient";

export default function EmployeeDashboard({ currentUser }) {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingDbId, setEditingDbId] = useState(null)
  const [selectedViewUser, setSelectedViewUser] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const [formData, setFormData] = useState({
    name: '', email: '', designation: '', role: 'General Staff', site_location: '',
    phone_number: '', nid_number: '', blood_group: '', joining_date: '',
    dob: '', reference_number: '', basic_salary: '', status: 'Active',
    present_address: '', permanent_address: '', supervisor_id: '', password: '',
    approval_status: 'Approved' 
  });

  const roles = ["Admin", "General Manager", "Finance Manager", "Supply Chain Manager", "HR Manager", "Supervisor", "Engineer", "General Staff"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const userRole = currentUser?.role || "Guest";
  const isAdmin = userRole === "Admin";
  const canManage = ["Admin", "HR Manager", "General Manager"].includes(userRole);
  const canSeeSalary = ["Admin", "General Manager", "Finance Manager"].includes(userRole);

  useEffect(() => { 
    fetchEmployees();
  }, [currentUser]);

  async function fetchEmployees() {
    try {
      let { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;

      let filtered = data || [];
      if (!canManage) {
        filtered = filtered.filter(emp => 
          emp.employee_id === currentUser.employee_id || 
          emp.supervisor_id === currentUser.employee_id
        );
      }
      if (!isAdmin) {
        filtered = filtered.filter(emp => emp.approval_status !== 'Pending');
      }
      setEmployees(filtered.sort((a, b) => b.employee_id.localeCompare(a.employee_id)));
    } catch (err) { console.error("Fetch Error:", err.message) }
  }

  // --- PRINT FUNCTION ---
  const printID = (emp) => {
    const printWindow = window.open('', '_blank');
    const logoUrl = window.location.origin + '/cssl-logo.jpg';
    printWindow.document.write(`
      <html>
        <head><title>Print ID - ${emp.name}</title></head>
        <body style="font-family: Arial; padding: 20px; margin: 0;">
          <div style="border: 2px solid #003366; padding: 20px; width: 300px; border-radius: 10px; text-align: center;">
            <div style="margin-bottom: 15px;">
              <img src="${logoUrl}" alt="Company Logo" style="height: 60px; width: auto; border-radius: 5px;"/>
            </div>
            <h2 style="color: #003366; margin: 5px 0; font-size: 16px;">CSSL EMPLOYEE ID</h2>
            <hr style="border: 1px solid #003366; margin: 10px 0;"/>
            <p style="margin: 8px 0;"><b>ID:</b> ${emp.employee_id}</p>
            <p style="margin: 8px 0;"><b>Name:</b> ${emp.name}</p>
            <p style="margin: 8px 0;"><b>Designation:</b> ${emp.designation}</p>
            <p style="margin: 8px 0;"><b>Site:</b> ${emp.site_location || 'N/A'}</p>
            <p style="margin: 8px 0;"><b>Joining:</b> ${emp.joining_date || 'N/A'}</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
  };

  const handlePasswordChange = async () => {
    if (!newPassword) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('employees')
        .update({ password: newPassword })
        .eq('employee_id', currentUser.employee_id);
      if (error) throw error;
      alert("Password updated successfully!");
      setShowPasswordModal(false);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  const handleDelete = async (empId, name) => {
    if (!isAdmin) return;
    if (!window.confirm(`Permanently remove ${name}?`)) return;
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
    const payload = { 
      ...formData, 
      approval_status: isAdmin ? 'Approved' : 'Pending' 
    };

    try {
      if (isEditing && isAdmin) {
        const { error } = await supabase.from('employees').update(payload).eq('employee_id', editingDbId);
        if (error) throw error;
      } else {
        const newID = `CSSL-${1001 + employees.length}`;
        const { error } = await supabase.from('employees').insert([{ ...payload, employee_id: newID }]);
        if (error) throw error;
        alert(isAdmin ? "Employee Enrolled" : "Enrolled. Awaiting Admin Approval.");
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
      
      <div style={{ background: '#003366', color: '#fff', padding: '10px 15px', marginBottom: '20px', borderRadius: '6px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><strong>CSSL ERP:</strong> {userRole} MODE</span>
        <button onClick={() => setShowPasswordModal(true)} style={actBtn('#f39c12', '#fff')}>🔑 Change My Password</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ color: '#003366', margin: 0 }}>Staff Directory</h2>
        {canManage && (
          <button onClick={() => { setIsEditing(false); setFormData({name: '', email: '', designation: '', role: 'General Staff', site_location: '', phone_number: '', nid_number: '', blood_group: '', joining_date: '', dob: '', reference_number: '', basic_salary: '', status: 'Active', present_address: '', permanent_address: '', supervisor_id: '', password: '', approval_status: 'Pending'}); setShowModal(true); }} style={addBtn}>+ New Enrollment</button>
        )}
      </div>

      <input style={searchBar} placeholder="🔍 Search Name, ID, or Designation..." onChange={e => setSearchTerm(e.target.value)} />

      <div style={{ overflowX: 'auto' }}>
        <table style={tbl}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #003366' }}>
              <th style={th}>ID</th>
              <th style={th}>Name</th>
              <th style={th}>Designation</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.employee_id?.includes(searchTerm)).map(emp => (
              <tr key={emp.employee_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}><b>{emp.employee_id}</b></td>
                <td style={td}>{emp.name} {emp.approval_status === 'Pending' && <span style={{color:'orange', fontSize:'10px'}}>(Pending)</span>}</td>
                <td style={td}>{emp.designation}</td>
                <td style={td}>{emp.status}</td>
                <td style={td}>
                  <button onClick={() => setSelectedViewUser(emp)} style={actBtn('#17a2b8', '#fff')}>View</button>
                  {isAdmin && <button onClick={() => { setIsEditing(true); setEditingDbId(emp.employee_id); setFormData({...emp}); setShowModal(true); }} style={actBtn('#ffc107', '#000')}>Edit</button>}
                  {isAdmin && <button onClick={() => handleDelete(emp.employee_id, emp.name)} style={actBtn('#dc3545', '#fff')}>Delete</button>}
                  <button onClick={() => printID(emp)} style={actBtn('#28a745', '#fff')}>Print ID</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      {selectedViewUser && (
        <div style={overlay} onClick={() => setSelectedViewUser(null)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ borderBottom: '2px solid #003366' }}>Profile: {selectedViewUser.employee_id}</h3>
            <div style={grid}>
              <p><b>Name:</b> {selectedViewUser.name}</p>
              <p><b>NID:</b> {selectedViewUser.nid_number || 'N/A'}</p>
              <p><b>Designation:</b> {selectedViewUser.designation}</p>
              <p><b>Site:</b> {selectedViewUser.site_location || 'N/A'}</p>
              <p><b>Joining Date:</b> {selectedViewUser.joining_date || 'N/A'}</p>
              <p><b>Email:</b> {selectedViewUser.email}</p>
              <p><b>Blood:</b> {selectedViewUser.blood_group}</p>
              <p><b>Supervisor:</b> {selectedViewUser.supervisor_id}</p>
              <p style={{ gridColumn: 'span 2' }}><b>Present Address:</b> {selectedViewUser.present_address}</p>
              {canSeeSalary && <p style={{ color: '#27ae60' }}><b>Salary:</b> {selectedViewUser.basic_salary} BDT</p>}
            </div>
          </div>
        </div>
      )}

      {/* ENROLLMENT / EDIT MODAL */}
      {showModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3 style={{ borderBottom: '2px solid #003366' }}>{isEditing ? 'Admin Edit Mode' : 'Staff Enrollment Form'}</h3>
            <form onSubmit={handleSubmit} style={grid}>
              <div><label style={lbl}>Full Name</label><input style={inp} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label style={lbl}>Designation</label><input style={inp} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
              <div><label style={lbl}>Email</label><input style={inp} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div><label style={lbl}>Phone</label><input style={inp} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
              
              {/* RESTORED FIELDS */}
              <div><label style={lbl}>NID Number</label><input style={inp} value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} /></div>
              <div><label style={lbl}>Site Location</label><input style={inp} value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} /></div>
              <div><label style={lbl}>Joining Date</label><input style={inp} type="date" value={formData.joining_date} onChange={e => setFormData({...formData, joining_date: e.target.value})} /></div>
              
              <div><label style={lbl}>Role</label>
                <select style={inp} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Date of Birth</label><input style={inp} type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} /></div>
              <div><label style={lbl}>Blood Group</label><select style={inp} value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})}><option value="">Select</option>{bloodGroups.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
              <div><label style={lbl}>Supervisor ID</label><input style={inp} value={formData.supervisor_id} onChange={e => setFormData({...formData, supervisor_id: e.target.value})} /></div>
              <div><label style={lbl}>Reference No</label><input style={inp} value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} /></div>
              
              <div><label style={lbl}>Status</label>
                <select style={inp} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
              {canSeeSalary && <div><label style={lbl}>Salary (BDT)</label><input style={inp} type="number" value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>}
              {isAdmin && <div><label style={lbl}>Initial Password</label><input style={inp} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>}
              
              <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Present Address</label><input style={inp} value={formData.present_address} onChange={e => setFormData({...formData, present_address: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Permanent Address</label><input style={inp} value={formData.permanent_address} onChange={e => setFormData({...formData, permanent_address: e.target.value})} /></div>

              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px' }}>
                <button type="submit" style={saveBtn}>{loading ? 'Saving...' : 'SAVE RECORD'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div style={overlay}>
          <div style={{...modalBox, maxWidth: '300px'}}>
            <h4>Update Password</h4>
            <input type="password" style={inp} placeholder="New Password" onChange={e => setNewPassword(e.target.value)} />
            <div style={{marginTop:'15px', display:'flex', gap:'10px'}}>
              <button onClick={handlePasswordChange} style={saveBtn}>Update</button>
              <button onClick={() => setShowPasswordModal(false)} style={cancelBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
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