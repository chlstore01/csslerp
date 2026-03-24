import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Connecting...')
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const ADMIN_PASSWORD = "CSSL_ADMIN_2026"

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '', name: '', designation: '', site_location: '', phone_number: '',
    reference_number: '', nid_number: '', blood_group: '',
    dob: '', joining_date: '', present_address: '',
    permanent_address: '', supervisor_name: '', email: ''
  });

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    setStatus('Fetching data...')
    const { data, error } = await supabase.from('employees').select('*')
    if (error) { setStatus('Error: ' + error.message) } 
    else { 
      const sortedData = data ? [...data].sort((a, b) => b.id - a.id) : []
      setEmployees(sortedData)
      setStatus('Online') 
    }
  }

  const generateID = () => {
    const nextNumber = 1001 + employees.length;
    return `CSSL-${nextNumber}`;
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const finalData = editingId ? formData : { ...formData, employee_id: generateID() };

    if (editingId) {
      const { error } = await supabase.from('employees').update(finalData).eq('id', editingId);
      if (error) alert(error.message);
      else { setEditingId(null); fetchEmployees(); resetForm(); }
    } else {
      const { error } = await supabase.from('employees').insert([finalData]);
      if (error) alert(error.message);
      else { fetchEmployees(); resetForm(); }
    }
    setLoading(false);
  }

  const resetForm = () => {
    setFormData({
      employee_id: '', name: '', designation: '', site_location: '', phone_number: '',
      reference_number: '', nid_number: '', blood_group: '',
      dob: '', joining_date: '', present_address: '',
      permanent_address: '', supervisor_name: '', email: ''
    });
    setEditingId(null);
  };

  const startEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({ ...emp });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name}?`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert(error.message); else fetchEmployees();
  }

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) || 
      emp.employee_id?.toLowerCase().includes(term) ||
      emp.site_location?.toLowerCase().includes(term) ||
      emp.nid_number?.includes(term)
    );
  });

  if (!isAdmin) {
    return (
      <div style={{ padding: '50px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#003366' }}>CSSL ERP</h1>
        <form onSubmit={(e) => { e.preventDefault(); if(passwordInput === ADMIN_PASSWORD) setIsAdmin(true); else alert("Wrong Password"); }}>
          <input type="password" style={inputStyle} placeholder="Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
          <button type="submit" style={buttonStyle}>Login</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px', maxWidth: '1200px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ color: '#003366', margin: 0 }}>CSSL ERP Portal</h2>
        <button onClick={() => setIsAdmin(false)} style={{ padding: '5px 12px', cursor: 'pointer', borderRadius: '4px' }}>Logout</button>
      </div>

      {/* REGISTRATION FORM */}
      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: '0' }}>{editingId ? `Edit ${formData.employee_id}` : 'New Registration'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <input name="name" style={inputStyle} placeholder="Full Name" value={formData.name} onChange={handleInputChange} required />
          <input name="designation" style={inputStyle} placeholder="Designation" value={formData.designation} onChange={handleInputChange} required />
          <input name="phone_number" style={inputStyle} placeholder="Phone" value={formData.phone_number} onChange={handleInputChange} />
          <input name="site_location" style={inputStyle} placeholder="Project Site" value={formData.site_location} onChange={handleInputChange} />
          <input name="nid_number" style={inputStyle} placeholder="NID" value={formData.nid_number} onChange={handleInputChange} />
          <input name="blood_group" style={inputStyle} placeholder="Blood Group" value={formData.blood_group} onChange={handleInputChange} />
          <input name="joining_date" type="date" style={inputStyle} value={formData.joining_date} onChange={handleInputChange} />
        </div>
        <button type="submit" disabled={loading} style={{...buttonStyle, marginTop: '10px'}}>{loading ? 'Saving...' : 'Save Record'}</button>
        {editingId && <button onClick={resetForm} type="button" style={{...buttonStyle, backgroundColor: '#666', marginTop: '5px'}}>Cancel</button>}
      </form>

      {/* SEARCH AND TABLE */}
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <input style={{...inputStyle, borderColor: '#003366', marginBottom: '15px'}} placeholder="🔍 Search by Name, ID, Site, or NID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#003366', color: 'white', textAlign: 'left' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Post</th>
                <th style={thStyle}>Site</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>NID</th>
                <th style={thStyle}>Blood</th>
                <th style={thStyle}>Joined</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}><strong>{emp.employee_id}</strong></td>
                  <td style={tdStyle}>{emp.name}</td>
                  <td style={tdStyle}>{emp.designation}</td>
                  <td style={tdStyle}>{emp.site_location}</td>
                  <td style={tdStyle}><a href={`tel:${emp.phone_number}`} style={{textDecoration: 'none', color: '#003366'}}>{emp.phone_number}</a></td>
                  <td style={tdStyle}>{emp.nid_number}</td>
                  <td style={tdStyle}>{emp.blood_group}</td>
                  <td style={tdStyle}>{emp.joining_date}</td>
                  <td style={tdStyle}>
                    <button onClick={() => startEdit(emp)} style={actionBtnStyle('#ffc107')}>Edit</button>
                    <button onClick={() => handleDelete(emp.id, emp.name)} style={actionBtnStyle('#dc3545', 'white')}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && <p style={{textAlign: 'center', padding: '20px'}}>No records found.</p>}
        </div>
      </div>
    </div>
  )
}

// STYLES
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const thStyle = { padding: '12px 8px', borderBottom: '2px solid #ddd' }
const tdStyle = { padding: '10px 8px' }
const actionBtnStyle = (bg, color = 'black') => ({ backgroundColor: bg, color: color, border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px', fontSize: '11px' })

export default App