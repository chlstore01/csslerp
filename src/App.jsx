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
    employee_id: '', // New Field
    name: '', designation: '', site_location: '', phone_number: '',
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
      const sortedData = data ? [...data].reverse() : []
      setEmployees(sortedData)
      setStatus('Online') 
    }
  }

  // --- AUTO-GENERATION LOGIC ---
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
    
    // If it's a new entry, generate the ID automatically
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
      emp.employee_id?.toLowerCase().includes(term) || // Search by CSSL-ID
      emp.nid_number?.includes(term) ||
      emp.site_location?.toLowerCase().includes(term)
    );
  });

  if (!isAdmin) {
    return (
      <div style={{ padding: '50px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#003366' }}>CSSL Admin</h1>
        <form onSubmit={(e) => { e.preventDefault(); if(passwordInput === ADMIN_PASSWORD) setIsAdmin(true); else alert("Wrong Password"); }}>
          <input type="password" style={inputStyle} placeholder="Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
          <button type="submit" style={buttonStyle}>Login</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#003366' }}>CSSL ERP Portal</h2>
        <button onClick={() => setIsAdmin(false)} style={{ padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: '0' }}>{editingId ? `📝 Editing ${formData.employee_id}` : '👤 New Registration'}</h3>
        
        {/* ID DISPLAY (Shows what the next ID will be) */}
        {!editingId && <div style={{ marginBottom: '10px', color: '#003366', fontWeight: 'bold' }}>Next Employee ID: {generateID()}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div><label style={labelStyle}>Full Name</label><input name="name" style={inputStyle} value={formData.name} onChange={handleInputChange} required /></div>
          <div><label style={labelStyle}>Designation</label><input name="designation" style={inputStyle} value={formData.designation} onChange={handleInputChange} required /></div>
          <div><label style={labelStyle}>Phone Number</label><input name="phone_number" style={inputStyle} value={formData.phone_number} onChange={handleInputChange} /></div>
          <div><label style={labelStyle}>NID Number</label><input name="nid_number" style={inputStyle} value={formData.nid_number} onChange={handleInputChange} /></div>
          <div><label style={labelStyle}>Reference No.</label><input name="reference_number" style={inputStyle} value={formData.reference_number} onChange={handleInputChange} /></div>
          <div><label style={labelStyle}>Blood Group</label><input name="blood_group" style={inputStyle} value={formData.blood_group} onChange={handleInputChange} /></div>
          <div><label style={labelStyle}>Date of Birth</label><input name="dob" type="date" style={inputStyle} value={formData.dob} onChange={handleInputChange} /></div>
          <div><label style={labelStyle}>Joining Date</label><input name="joining_date" type="date" style={inputStyle} value={formData.joining_date} onChange={handleInputChange} /></div>
          <div><label style={labelStyle}>Project Site</label><input name="site_location" style={inputStyle} value={formData.site_location} onChange={handleInputChange} /></div>
          <div><label style={labelStyle}>Supervisor Name</label><input name="supervisor_name" style={inputStyle} value={formData.supervisor_name} onChange={handleInputChange} /></div>
          <div style={{gridColumn: 'span 2'}}><label style={labelStyle}>Supervisor Email</label><input name="email" type="email" style={inputStyle} value={formData.email} onChange={handleInputChange} /></div>
        </div>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Saving...' : (editingId ? 'Update Record' : 'Save to Database')}
        </button>
        {editingId && <button onClick={resetForm} type="button" style={{...buttonStyle, backgroundColor: '#6c757d', marginTop: '5px'}}>Cancel</button>}
      </form>

      <input style={{...inputStyle, borderColor: '#003366', height: '45px'}} placeholder="🔍 Search by Name, CSSL-ID, or NID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

      <div style={{ marginTop: '20px' }}>
        {filteredEmployees.map(emp => (
          <div key={emp.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ backgroundColor: '#003366', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{emp.employee_id}</span><br/>
                <strong style={{ fontSize: '1.1em' }}>{emp.name}</strong><br/>
                <small><strong>{emp.designation}</strong> | Site: {emp.site_location || 'N/A'}</small>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => startEdit(emp)} style={{ backgroundColor: '#ffc107', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(emp.id, emp.name)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>Del</button>
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <div>📞 <a href={`tel:${emp.phone_number}`}>{emp.phone_number || 'N/A'}</a></div>
              <div>🩸 Blood: {emp.blood_group || 'N/A'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '2px' }
const inputStyle = { width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }

export default App