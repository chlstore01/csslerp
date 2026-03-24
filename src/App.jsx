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

  // --- FORM STATES ---
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', designation: '', site_location: '', phone_number: '',
    reference_number: '', nid_number: '', blood_group: '',
    dob: '', joining_date: '', present_address: '',
    permanent_address: '', supervisor_name: '', email: '' // Changed to lowercase 'email'
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    if (editingId) {
      const { error } = await supabase.from('employees').update(formData).eq('id', editingId);
      if (error) alert("Update Error: " + error.message);
      else { setEditingId(null); fetchEmployees(); resetForm(); }
    } else {
      const { error } = await supabase.from('employees').insert([formData]);
      if (error) alert("Insert Error: " + error.message);
      else { fetchEmployees(); resetForm(); }
    }
    setLoading(false);
  }

  const resetForm = () => {
    setFormData({
      name: '', designation: '', site_location: '', phone_number: '',
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
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert(error.message); else fetchEmployees();
  }

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(term) || 
      emp.designation?.toLowerCase().includes(term) || 
      emp.nid_number?.includes(term) ||
      emp.site_location?.toLowerCase().includes(term)
    );
  });

  if (!isAdmin) {
    return (
      <div style={{ padding: '50px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#003366' }}>CSSL Admin Login</h1>
        <form onSubmit={(e) => { e.preventDefault(); if(passwordInput === ADMIN_PASSWORD) setIsAdmin(true); else alert("Wrong Password"); }}>
          <input type="password" style={inputStyle} placeholder="Enter Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
          <button type="submit" style={buttonStyle}>Login to ERP</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
        <h2 style={{ color: '#003366', margin: '0' }}>CSSL ERP</h2>
        <button onClick={() => setIsAdmin(false)} style={{ padding: '5px 10px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Logout</button>
      </div>

      {/* FORM SECTION */}
      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: '0' }}>{editingId ? '📝 Edit Record' : '👤 New Registration'}</h3>
        
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

        <label style={labelStyle}>Present Address</label>
        <textarea name="present_address" style={{...inputStyle, height: '40px'}} value={formData.present_address} onChange={handleInputChange} />
        
        <label style={labelStyle}>Permanent Address</label>
        <textarea name="permanent_address" style={{...inputStyle, height: '40px'}} value={formData.permanent_address} onChange={handleInputChange} />
        
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Saving...' : (editingId ? 'Update Record' : 'Save to Database')}
        </button>
        {editingId && <button onClick={resetForm} type="button" style={{...buttonStyle, backgroundColor: '#6c757d', marginTop: '5px'}}>Cancel Edit</button>}
      </form>

      {/* SEARCH BAR */}
      <input 
        style={{...inputStyle, borderColor: '#003366', height: '45px', fontSize: '16px', marginBottom: '15px'}} 
        placeholder="🔍 Search Personnel..." 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)} 
      />

      {/* DIRECTORY LIST */}
      <div>
        <h3 style={{ marginBottom: '10px' }}>Staff List ({filteredEmployees.length})</h3>
        {filteredEmployees.map(emp => (
          <div key={emp.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <strong style={{ fontSize: '1.1em', color: '#003366' }}>{emp.name}</strong><br/>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{emp.designation}</span><br/>
                <small style={{ color: '#666' }}>📍 Site: {emp.site_location || 'N/A'}</small>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => startEdit(emp)} style={{ backgroundColor: '#ffc107', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                <button onClick={() => handleDelete(emp.id, emp.name)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Del</button>
              </div>
            </div>
            
            <div style={{ marginTop: '8px', fontSize: '13px', borderTop: '1px solid #eee', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <div><strong>Phone:</strong> <a href={`tel:${emp.phone_number}`} style={{ color: '#003366', textDecoration: 'none', fontWeight: 'bold' }}>{emp.phone_number || 'N/A'}</a></div>
              <div><strong>NID:</strong> {emp.nid_number || 'N/A'}</div>
              <div><strong>Blood Group:</strong> {emp.blood_group || 'N/A'}</div>
              <div><strong>Joined:</strong> {emp.joining_date || 'N/A'}</div>
              <div style={{gridColumn: 'span 2'}}><strong>Supervisor:</strong> {emp.supervisor_name} ({emp.email})</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#666', marginBottom: '2px' }
const inputStyle = { width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }

export default App