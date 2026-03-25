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

  // --- STRICT SECURITY CHECK ---
  const userRole = currentUser?.role || "Guest";
  const isAdmin = userRole === "Admin";
  const canManage = ["Admin", "HR Manager", "General Manager"].includes(userRole);
  const canSeeSalary = ["Admin", "General Manager", "Finance Manager"].includes(userRole);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase.from('employees').select('*')
      if (error) throw error;
      setEmployees(data ? [...data].sort((a, b) => b.employee_id.localeCompare(a.employee_id)) : [])
    } catch (err) { console.error("Fetch Error:", err.message) }
  }

  const handleDelete = async (empId, name) => {
    if (!isAdmin) return alert("Access Denied: Only Admin can delete.");
    if (!window.confirm(`Delete ${name}?`)) return;
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
      
      {/* DEBUG HEADER: If this says "Guest", your App.jsx is not passing the user correctly */}
      <div style={{ background: '#eee', padding: '10px', marginBottom: '15px', borderRadius: '5px', fontSize: '12px' }}>
        <strong>Security System:</strong> Active Role: <span style={{ color: isAdmin ? 'red' : 'blue' }}>{userRole}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#003366', margin: 0 }}>CSSL Personnel</h2>
        {canManage && (
          <button onClick={() => { setIsEditing(false); setShowModal(true); }} style={addBtn}>+ ENROLL NEW</button>
        )}
      </div>

      <input 
        style={searchBar} 
        id="main_search"
        name="main_search"
        placeholder="🔍 Search name or ID..." 
        onChange={e => setSearchTerm(e.target.value)} 
      />

      <table style={tbl}>
        <thead>
          <tr style={{ background: '#003366', color: '#fff' }}>
            <th style={th}>ID</th><th style={th}>Name</th><th style={th}>Post</th><th style={th}>Actions</th>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3>{isEditing ? 'Update Profile' : 'New Employee'}</h3>
            <form onSubmit={handleSubmit} style={grid}>
              <div><label htmlFor="f_name" style={lbl}>Name</label><input id="f_name" name="name" style={inp} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label htmlFor="f_designation" style={lbl}>Designation</label><input id="f_designation" name="designation" style={inp} value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} /></div>
              
              <div><label htmlFor="f_role" style={lbl}>Role</label>
                <select id="f_role" name="role" style={inp} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* ADMIN ONLY PASSWORD */}
              {isAdmin && (
                <div><label htmlFor="f_pass" style={lbl}>System Password</label><input id="f_pass" name="password" style={inp} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
              )}

              {canSeeSalary && (
                <div><label htmlFor="f_salary" style={lbl}>Salary (BDT)</label><input id="f_salary" name="basic_salary" type="number" style={inp} value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} /></div>
              )}

              {/* Other Fields */}
              <div><label htmlFor="f_phone" style={lbl}>Phone</label><input id="f_phone" name="phone_number" style={inp} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} /></div>
              <div><label htmlFor="f_nid" style={lbl}>NID</label><input id="f_nid" name="nid_number" style={inp} value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} /></div>
              <div><label htmlFor="f_site" style={lbl}>Site</label><input id="f_site" name="site_location" style={inp} value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} /></div>
              
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={saveBtn}>{loading ? 'Saving...' : 'SAVE'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={cancelBtn}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const th = { padding: '12px', textAlign: 'left' };
const td = { padding: '12px' };
const tbl = { width: '100%', borderCollapse: 'collapse' };
const lbl = { fontSize: '11px', fontWeight: 'bold', color: '#003366' };
const inp = { width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' };
const grid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const searchBar = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd' };
const addBtn = { background: '#003366', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' };
const saveBtn = { flex: 1, background: '#003366', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer' };
const cancelBtn = { flex: 1, background: '#ccc', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer' };
const actBtn = (bg, c) => ({ background: bg, color: c, border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' });
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalBox = { background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '700px' };