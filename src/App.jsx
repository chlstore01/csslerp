import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null); // For the Popup
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
    const { data, error } = await supabase.from('employees').select('*')
    if (!error) { 
      setEmployees(data ? [...data].sort((a, b) => b.id - a.id) : [])
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
      if (error) alert(error.message); else { setEditingId(null); fetchEmployees(); resetForm(); }
    } else {
      const { error } = await supabase.from('employees').insert([finalData]);
      if (error) alert(error.message); else { fetchEmployees(); resetForm(); }
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

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    return (emp.name?.toLowerCase().includes(term) || emp.employee_id?.toLowerCase().includes(term) || emp.site_location?.toLowerCase().includes(term));
  });

  if (!isAdmin) {
    return (
      <div style={{ padding: '50px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#003366' }}>CSSL ERP</h1>
        <input type="password" style={inputStyle} placeholder="Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
        <button onClick={() => passwordInput === ADMIN_PASSWORD ? setIsAdmin(true) : alert("Wrong")} style={buttonStyle}>Login</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px', maxWidth: '1400px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#003366' }}>CSSL ERP Portal</h2>

      {/* REGISTRATION FORM */}
      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? `Edit ${formData.employee_id}` : 'New Employee Registration'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <input name="name" style={inputStyle} placeholder="Full Name" value={formData.name} onChange={handleInputChange} required />
          <input name="designation" style={inputStyle} placeholder="Designation" value={formData.designation} onChange={handleInputChange} required />
          <input name="phone_number" style={inputStyle} placeholder="Phone" value={formData.phone_number} onChange={handleInputChange} />
          <input name="nid_number" style={inputStyle} placeholder="NID" value={formData.nid_number} onChange={handleInputChange} />
          <input name="reference_number" style={inputStyle} placeholder="Ref No." value={formData.reference_number} onChange={handleInputChange} />
          <input name="blood_group" style={inputStyle} placeholder="Blood Group" value={formData.blood_group} onChange={handleInputChange} />
          <input name="dob" type="date" style={inputStyle} value={formData.dob} onChange={handleInputChange} />
          <input name="joining_date" type="date" style={inputStyle} value={formData.joining_date} onChange={handleInputChange} />
          <input name="site_location" style={inputStyle} placeholder="Project Site" value={formData.site_location} onChange={handleInputChange} />
          <input name="supervisor_name" style={inputStyle} placeholder="Supervisor Name" value={formData.supervisor_name} onChange={handleInputChange} />
          <input name="email" type="email" style={inputStyle} placeholder="Supervisor Email" value={formData.email} onChange={handleInputChange} />
        </div>
        <textarea name="present_address" style={{...inputStyle, height: '40px', marginTop: '10px'}} placeholder="Present Address" value={formData.present_address} onChange={handleInputChange} />
        <textarea name="permanent_address" style={{...inputStyle, height: '40px', marginTop: '10px'}} placeholder="Permanent Address" value={formData.permanent_address} onChange={handleInputChange} />

        <button type="submit" disabled={loading} style={{...buttonStyle, marginTop: '15px'}}>{loading ? 'Saving...' : 'Save Record'}</button>
        {editingId && <button onClick={resetForm} type="button" style={{...buttonStyle, backgroundColor: '#666', marginTop: '5px'}}>Cancel</button>}
      </form>

      {/* SEARCH AND TABLE */}
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <input style={{...inputStyle, borderColor: '#003366', marginBottom: '15px'}} placeholder="🔍 Search ID, Name, or Site..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' }}>
            <thead>
              <tr style={{ backgroundColor: '#003366', color: 'white', textAlign: 'left' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Site</th>
                <th style={thStyle}>Phone</th>
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
                  <td style={tdStyle}>
                    <button onClick={() => setSelectedEmployee(emp)} style={actionBtnStyle('#17a2b8', 'white')}>Details</button>
                    <button onClick={() => startEdit(emp)} style={actionBtnStyle('#ffc107')}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPLOYEE DETAILS MODAL/POPUP */}
      {selectedEmployee && (
        <div style={modalOverlayStyle} onClick={() => setSelectedEmployee(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #003366', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: '#003366' }}>{selectedEmployee.employee_id} - {selectedEmployee.name}</h3>
              <button onClick={() => setSelectedEmployee(null)} style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '20px' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px', fontSize: '14px' }}>
              <p><strong>Designation:</strong> {selectedEmployee.designation}</p>
              <p><strong>NID:</strong> {selectedEmployee.nid_number}</p>
              <p><strong>Phone:</strong> {selectedEmployee.phone_number}</p>
              <p><strong>Blood Group:</strong> {selectedEmployee.blood_group}</p>
              <p><strong>Joining Date:</strong> {selectedEmployee.joining_date}</p>
              <p><strong>DOB:</strong> {selectedEmployee.dob}</p>
              <p><strong>Reference:</strong> {selectedEmployee.reference_number}</p>
              <p><strong>Site Location:</strong> {selectedEmployee.site_location}</p>
              <p><strong>Supervisor:</strong> {selectedEmployee.supervisor_name}</p>
              <p><strong>Sup. Email:</strong> {selectedEmployee.email}</p>
            </div>
            <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <p><strong>Present Address:</strong> {selectedEmployee.present_address}</p>
              <p><strong>Permanent Address:</strong> {selectedEmployee.permanent_address}</p>
            </div>
            <button onClick={() => setSelectedEmployee(null)} style={{...buttonStyle, marginTop: '20px'}}>Close Details</button>
          </div>
        </div>
      )}
    </div>
  )
}

// STYLES
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const thStyle = { padding: '12px 8px' }
const tdStyle = { padding: '10px 8px' }
const actionBtnStyle = (bg, color = 'black') => ({ backgroundColor: bg, color: color, border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' })

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }
const modalContentStyle = { background: 'white', padding: '25px', borderRadius: '8px', maxWidth: '600px', width: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#555', marginBottom: '3px' }

export default App