import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const ADMIN_PASSWORD = "CSSL_ADMIN_2026"

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '', name: '', designation: '', 
    role: 'General Staff', // Default Role
    site_location: '', phone_number: '', reference_number: '', 
    nid_number: '', blood_group: '', dob: '', joining_date: '', 
    present_address: '', permanent_address: '', supervisor_name: '', 
    email: '', basic_salary: '', status: 'Active'
  });

  // THE UPDATED ROLE LIST
  const roleList = [
    "Admin", "General Manager", "Finance & Accountant Manager", 
    "Supply Chain Manager", "Supply Chain Employee", 
    "Finance & Accountant Employee", "Human Resource Manager", 
    "Human Resource Employee", "Supervisor", "Site Manager", 
    "Engineer", "General Staff"
  ];

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase.from('employees').select('*')
    if (!error) setEmployees(data ? [...data].sort((a, b) => b.id - a.id) : [])
  }

  const generateID = () => `CSSL-${1001 + employees.length}`;

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const finalData = editingId ? formData : { ...formData, employee_id: generateID() };
    const { error } = editingId 
      ? await supabase.from('employees').update(finalData).eq('id', editingId)
      : await supabase.from('employees').insert([finalData]);
    
    if (error) alert(error.message); 
    else { setEditingId(null); fetchEmployees(); resetForm(); }
    setLoading(false);
  }

  const resetForm = () => {
    setFormData({
      employee_id: '', name: '', designation: '', role: 'General Staff',
      site_location: '', phone_number: '', reference_number: '', 
      nid_number: '', blood_group: '', dob: '', joining_date: '', 
      present_address: '', permanent_address: '', supervisor_name: '', 
      email: '', basic_salary: '', status: 'Active'
    });
    setEditingId(null);
  };

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) || 
      emp.employee_id?.toLowerCase().includes(term) || 
      emp.role?.toLowerCase().includes(term) || // Now you can search by Role!
      emp.site_location?.toLowerCase().includes(term)
    );
  });

  if (!isAdmin) {
    return (
      <div style={{ padding: '50px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#003366' }}>CSSL ERP</h1>
        <input type="password" style={inputStyle} placeholder="Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
        <button onClick={() => passwordInput === ADMIN_PASSWORD ? setIsAdmin(true) : alert("Wrong Password")} style={buttonStyle}>Login</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px', maxWidth: '1400px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#003366' }}>CSSL ERP: Composite Steel Structure Ltd.</h2>

      <form onSubmit={handleSubmit} style={formBoxStyle}>
        <h3 style={{ marginTop: 0 }}>{editingId ? `Edit ${formData.employee_id}` : 'Personnel Registration'}</h3>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input name="name" style={inputStyle} value={formData.name} onChange={handleInputChange} required />
          </div>
          <div>
            <label style={labelStyle}>System Role</label>
            <select name="role" style={inputStyle} value={formData.role} onChange={handleInputChange}>
              {roleList.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Designation (Title)</label>
            <input name="designation" style={inputStyle} value={formData.designation} onChange={handleInputChange} required />
          </div>
          <div>
            <label style={labelStyle}>Basic Salary (BDT)</label>
            <input name="basic_salary" type="number" style={inputStyle} value={formData.basic_salary} onChange={handleInputChange} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input name="phone_number" style={inputStyle} value={formData.phone_number} onChange={handleInputChange} />
          </div>
          <div>
            <label style={labelStyle}>Project Site</label>
            <input name="site_location" style={inputStyle} value={formData.site_location} onChange={handleInputChange} />
          </div>
        </div>
        <button type="submit" disabled={loading} style={{...buttonStyle, marginTop: '15px'}}>{loading ? 'Saving...' : 'Update Database'}</button>
      </form>

      <div style={tableContainerStyle}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
          <input style={{...inputStyle, flex: 1}} placeholder="🔍 Search by Name, ID, or Role (e.g. 'Supply Chain')..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div style={countBadgeStyle}>Total: {filteredEmployees.length}</div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: '#003366', color: 'white' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Site</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}><strong>{emp.employee_id}</strong></td>
                  <td style={tdStyle}>{emp.name}</td>
                  <td style={tdStyle}><span style={roleBadgeStyle}>{emp.role}</span></td>
                  <td style={tdStyle}>{emp.site_location}</td>
                  <td style={tdStyle}>
                    <button onClick={() => setSelectedEmployee(emp)} style={actionBtnStyle('#17a2b8', 'white')}>Details</button>
                    <button onClick={() => { setEditingId(emp.id); setFormData(emp); window.scrollTo(0,0); }} style={actionBtnStyle('#ffc107')}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// STYLES
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }
const formBoxStyle = { background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }
const tableContainerStyle = { background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }
const thStyle = { padding: '12px 8px' }
const tdStyle = { padding: '10px 8px' }
const roleBadgeStyle = { background: '#e9ecef', padding: '3px 7px', borderRadius: '4px', fontSize: '11px', color: '#333', fontWeight: 'bold' }
const countBadgeStyle = { background: '#003366', color: 'white', padding: '10px', borderRadius: '4px', fontWeight: 'bold' }
const actionBtnStyle = (bg, color = 'black') => ({ backgroundColor: bg, color, border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' })

export default App