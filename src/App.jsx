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
    employee_id: '',
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

  // --- PRINT ID CARD LOGIC ---
  const printID = (emp) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>ID Card - ${emp.name}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; padding: 20px; }
            .card { width: 325px; height: 200px; border: 2px solid #003366; border-radius: 10px; padding: 15px; position: relative; background: #fff; }
            .header { color: #003366; font-weight: bold; font-size: 18px; border-bottom: 2px solid #003366; padding-bottom: 5px; margin-bottom: 10px; }
            .id-tag { position: absolute; top: 15px; right: 15px; background: #003366; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
            .info { font-size: 14px; margin: 5px 0; }
            .footer { margin-top: 15px; font-size: 10px; color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">Composite Steel Structure Ltd.</div>
            <div class="id-tag">${emp.employee_id}</div>
            <div class="info"><strong>Name:</strong> ${emp.name}</div>
            <div class="info"><strong>Post:</strong> ${emp.designation}</div>
            <div class="info"><strong>Blood:</strong> ${emp.blood_group || 'N/A'}</div>
            <div class="info"><strong>Site:</strong> ${emp.site_location || 'N/A'}</div>
            <div class="footer">Propery of CSSL. If found, please return to Dhaka Office.</div>
          </div>
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete ${name}?`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert(error.message); else fetchEmployees();
  }

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (emp.name?.toLowerCase().includes(term) || emp.employee_id?.toLowerCase().includes(term) || emp.site_location?.toLowerCase().includes(term));
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
    <div style={{ padding: '10px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#003366' }}>CSSL ERP Portal</h2>
        <button onClick={() => setIsAdmin(false)} style={{ padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: '0' }}>{editingId ? `📝 Editing ${formData.employee_id}` : '👤 New Registration'}</h3>
        {!editingId && <div style={{ marginBottom: '10px', color: '#003366', fontWeight: 'bold' }}>Next Employee ID: {generateID()}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input name="name" style={inputStyle} placeholder="Full Name" value={formData.name} onChange={handleInputChange} required />
          <input name="designation" style={inputStyle} placeholder="Designation" value={formData.designation} onChange={handleInputChange} required />
          <input name="phone_number" style={inputStyle} placeholder="Phone" value={formData.phone_number} onChange={handleInputChange} />
          <input name="nid_number" style={inputStyle} placeholder="NID" value={formData.nid_number} onChange={handleInputChange} />
          <input name="blood_group" style={inputStyle} placeholder="Blood" value={formData.blood_group} onChange={handleInputChange} />
          <input name="site_location" style={inputStyle} placeholder="Site" value={formData.site_location} onChange={handleInputChange} />
        </div>
        <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'Saving...' : 'Save Record'}</button>
      </form>

      <input style={{...inputStyle, borderColor: '#003366', height: '40px'}} placeholder="🔍 Search CSSL-ID or Name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

      <div style={{ marginTop: '20px' }}>
        {filteredEmployees.map(emp => (
          <div key={emp.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ backgroundColor: '#003366', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{emp.employee_id}</span><br/>
                <strong>{emp.name}</strong><br/>
                <small>{emp.designation} | {emp.site_location}</small>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => printID(emp)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>Print</button>
                <button onClick={() => startEdit(emp)} style={{ backgroundColor: '#ffc107', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(emp.id, emp.name)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer' }}>Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }

export default App