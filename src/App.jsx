import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  // Core States
  const [employees, setEmployees] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // UI States
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' })
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showPassModal, setShowPassModal] = useState(false)
  const [newPass, setNewPass] = useState('')

  // THE CRITICAL FIX: Track the DB primary key separately from the form
  const [targetId, setTargetId] = useState(null) 

  const [formData, setFormData] = useState({
    employee_id: '', name: '', designation: '', role: 'General Staff',
    site_location: '', phone_number: '', nid_number: '', 
    blood_group: '', joining_date: '', basic_salary: '', status: 'Active'
  });

  const MASTER_ID = "ADMIN", MASTER_KEY = "CSSL_MASTER_2026";
  const roleList = ["Admin", "General Manager", "Finance & Accountant Manager", "Supply Chain Manager", "Human Resource Manager", "Supervisor", "Engineer", "General Staff"];

  // Permissions
  const isPrivileged = currentUser && ["Admin", "General Manager", "Human Resource Manager"].includes(currentUser.role);
  const canSeeSalary = currentUser && ["Admin", "General Manager", "Finance & Accountant Manager"].includes(currentUser.role);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase.from('employees').select('*')
    if (!error) setEmployees(data ? [...data].sort((a, b) => b.id - a.id) : [])
  }

  // --- REWRITTEN EDIT LOGIC ---
  const handleEditInit = (emp) => {
    setTargetId(emp.id); // Lock the Database ID
    setFormData({
      employee_id: emp.employee_id,
      name: emp.name || '',
      designation: emp.designation || '',
      role: emp.role || 'General Staff',
      site_location: emp.site_location || '',
      phone_number: emp.phone_number || '',
      nid_number: emp.nid_number || '',
      blood_group: emp.blood_group || '',
      joining_date: emp.joining_date || '',
      basic_salary: emp.basic_salary || '',
      status: emp.status || 'Active'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);

    // Clean data for Supabase (Remove any ID or metadata from the body)
    const payload = {
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

    if (targetId) {
      // MODE: UPDATE EXISTING
      const { error } = await supabase.from('employees').update(payload).eq('id', targetId);
      if (error) alert("Update Error: " + error.message);
      else alert(`SUCCESS: ${formData.name} has been updated.`);
    } else {
      // MODE: REGISTER NEW
      const newEmployee = {
        ...payload,
        employee_id: `CSSL-${1001 + employees.length}`,
        password: formData.phone_number // Default pass
      };
      const { error } = await supabase.from('employees').insert([newEmployee]);
      if (error) alert("Registration Error: " + error.message);
      else alert("SUCCESS: New Employee Registered.");
    }

    resetAll();
    fetchEmployees();
    setLoading(false);
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${name}? This cannot be undone.`)) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) alert(error.message);
      else {
        alert("Record Deleted.");
        fetchEmployees();
      }
    }
  };

  const resetAll = () => {
    setTargetId(null);
    setFormData({ employee_id: '', name: '', designation: '', role: 'General Staff', site_location: '', phone_number: '', nid_number: '', blood_group: '', joining_date: '', basic_salary: '', status: 'Active' });
  };

  const exportData = () => {
    const head = "ID,Name,Role,Status,Site\n";
    const body = employees.map(e => `${e.employee_id},${e.name},${e.role},${e.status},${e.site_location}`).join("\n");
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([head + body], { type: 'text/csv' }));
    link.download = 'CSSL_Staff_Data.csv';
    link.click();
  };

  const printID = (emp) => {
    const win = window.open('', '_blank');
    win.document.write(`<html><body style="font-family:sans-serif; display:flex; justify-content:center; padding:50px;">
      <div style="width:300px; border:3px solid #003366; border-radius:12px; padding:20px; position:relative;">
        <div style="color:#003366; font-weight:bold; border-bottom:2px solid #003366; padding-bottom:5px;">COMPOSITE STEEL STRUCTURE</div>
        <div style="position:absolute; top:20px; right:20px; background:#003366; color:#fff; padding:2px 8px; border-radius:4px; font-size:12px;">${emp.employee_id}</div>
        <p><strong>Name:</strong> ${emp.name}</p>
        <p><strong>Post:</strong> ${emp.designation}</p>
        <p><strong>Blood:</strong> ${emp.blood_group || 'N/A'}</p>
      </div><script>setTimeout(()=> { window.print(); window.close(); }, 500);</script></body></html>`);
  };

  if (!currentUser) {
    return (
      <div style={loginStyle}>
        <h2 style={{ color: '#003366' }}>CSSL ERP LOGIN</h2>
        <input style={inputStyle} placeholder="Employee ID" onChange={e => setLoginForm({...loginForm, id: e.target.value})} />
        <input type="password" style={{...inputStyle, marginTop: '10px'}} placeholder="Password" onChange={e => setLoginForm({...loginForm, pass: e.target.value})} />
        <button onClick={() => {
          if (loginForm.id === "ADMIN" && loginForm.pass === "CSSL_MASTER_2026") setCurrentUser({name: "Admin", role: "Admin"});
          else {
            const user = employees.find(e => e.employee_id === loginForm.id && e.password === loginForm.pass);
            if (user && user.status === 'Active') setCurrentUser(user);
            else alert("Access Denied");
          }
        }} style={{...buttonStyle, marginTop: '20px'}}>Sign In</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={headerStyle}>
        <h2>CSSL Management Portal</h2>
        <button onClick={() => setCurrentUser(null)} style={utilBtnStyle('#dc3545', '#fff')}>Logout</button>
      </div>

      {isPrivileged && (
        <div style={{...formBoxStyle, border: targetId ? '2px solid #ffc107' : '1px solid #ddd'}}>
          <h3 style={{ color: targetId ? '#856404' : '#003366', marginTop: 0 }}>
            {targetId ? `Editing Record: ${formData.employee_id}` : 'Enroll New Personnel'}
          </h3>
          <form onSubmit={handleSave} style={gridStyle}>
            <input style={inputStyle} placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <select style={inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              {roleList.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input style={inputStyle} placeholder="Designation" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} />
            <input style={inputStyle} placeholder="Phone" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
            <input style={inputStyle} placeholder="NID" value={formData.nid_number} onChange={e => setFormData({...formData, nid_number: e.target.value})} />
            {canSeeSalary && <input type="number" style={inputStyle} placeholder="Salary (BDT)" value={formData.basic_salary} onChange={e => setFormData({...formData, basic_salary: e.target.value})} />}
            <input style={inputStyle} placeholder="Site Location" value={formData.site_location} onChange={e => setFormData({...formData, site_location: e.target.value})} />
            <select style={inputStyle} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: '10px' }}>
              <button type="submit" style={{...buttonStyle, background: targetId ? '#ffc107' : '#003366', color: targetId ? '#000' : '#fff'}}>
                {loading ? 'Processing...' : (targetId ? 'UPDATE EMPLOYEE DATA' : 'CONFIRM REGISTRATION')}
              </button>
              {targetId && <button type="button" onClick={resetAll} style={{...buttonStyle, background: '#666'}}>CANCEL EDIT</button>}
            </div>
          </form>
        </div>
      )}

      <div style={tableCardStyle}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input style={{...inputStyle, flex: 2}} placeholder="🔍 Search by Name or ID..." onChange={e => setSearchTerm(e.target.value)} />
          <button onClick={exportData} style={utilBtnStyle('#28a745', '#fff')}>Export CSV</button>
        </div>
        <table style={tableStyle}>
          <thead><tr style={{ background: '#003366', color: '#fff' }}><th style={thStyle}>ID</th><th style={thStyle}>Name</th><th style={thStyle}>Status</th><th style={thStyle}>Actions</th></tr></thead>
          <tbody>
            {employees.filter(e => e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || e.employee_id?.includes(searchTerm)).map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}><strong>{emp.employee_id}</strong></td>
                <td style={tdStyle}>{emp.name}</td>
                <td style={tdStyle}><span style={{ color: emp.status === 'Active' ? 'green' : 'red', fontWeight: 'bold' }}>{emp.status}</span></td>
                <td style={tdStyle}>
                  <button onClick={() => setSelectedEmployee(emp)} style={actionBtnStyle('#17a2b8', '#fff')}>View</button>
                  {isPrivileged && (
                    <>
                      <button onClick={() => handleEditInit(emp)} style={actionBtnStyle('#ffc107', '#000')}>Edit</button>
                      <button onClick={() => handleDelete(emp.id, emp.name)} style={actionBtnStyle('#dc3545', '#fff')}>Delete</button>
                      <button onClick={() => printID(emp)} style={actionBtnStyle('#28a745', '#fff')}>Print</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FIXED VIEW MODAL */}
      {selectedEmployee && (
        <div style={modalOverlayStyle} onClick={() => setSelectedEmployee(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ borderBottom: '2px solid #003366', color: '#003366' }}>Employee Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
              <p><strong>ID:</strong> {selectedEmployee.employee_id}</p>
              <p><strong>Status:</strong> {selectedEmployee.status}</p>
              <p><strong>Name:</strong> {selectedEmployee.name}</p>
              <p><strong>Post:</strong> {selectedEmployee.designation}</p>
              <p><strong>Role:</strong> {selectedEmployee.role}</p>
              <p><strong>Phone:</strong> {selectedEmployee.phone_number}</p>
              <p><strong>Site:</strong> {selectedEmployee.site_location}</p>
              {canSeeSalary && <p><strong>Salary:</strong> {selectedEmployee.basic_salary} BDT</p>}
            </div>
            <button onClick={() => setSelectedEmployee(null)} style={{...buttonStyle, marginTop: '20px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const loginStyle = { maxWidth: '350px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'center' }
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }
const formBoxStyle = { background: '#fcfcfc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }
const tableCardStyle = { background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }
const thStyle = { padding: '12px 8px', textAlign: 'left' }
const tdStyle = { padding: '10px 8px' }
const utilBtnStyle = (bg, color) => ({ backgroundColor: bg, color, border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' })
const actionBtnStyle = (bg, color) => ({ backgroundColor: bg, color, border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '11px' })
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '10px', maxWidth: '500px', width: '90%' }

export default App