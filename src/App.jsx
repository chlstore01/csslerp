import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [site, setSite] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Connecting...')
  
  // --- ADMIN AUTH STATE ---
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const ADMIN_PASSWORD = "CSSL_ADMIN_2026" // Change this to your preferred password

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    setStatus('Fetching data...')
    const { data, error } = await supabase.from('employees').select('*')
    if (error) {
      setStatus('Error: ' + error.message)
    } else {
      const sortedData = data ? [...data].reverse() : []
      setEmployees(sortedData)
      setStatus(sortedData.length > 0 ? 'Online' : 'Database Empty')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('employees').insert([{ name, designation, site_location: site }])
    if (error) { alert("Error: " + error.message) } 
    else { setName(''); setDesignation(''); setSite(''); fetchEmployees() }
    setLoading(false)
  }

  async function handleDelete(id, employeeName) {
    const confirmed = window.confirm(`Delete ${employeeName}?`);
    if (!confirmed) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) { alert("Delete failed: " + error.message) } 
    else { fetchEmployees() }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true)
    } else {
      alert("Incorrect Password")
    }
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.site_location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // --- LOGIN SCREEN ---
  if (!isAdmin) {
    return (
      <div style={{ padding: '50px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#003366' }}>CSSL Admin Login</h1>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            style={inputStyle} 
            placeholder="Enter Admin Password" 
            value={passwordInput} 
            onChange={e => setPasswordInput(e.target.value)} 
          />
          <button type="submit" style={buttonStyle}>Login to ERP</button>
        </form>
      </div>
    )
  }

  // --- MAIN ERP APP (Only shows if isAdmin is true) ---
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#003366', margin: '0' }}>CSSL ERP Portal</h1>
        <button onClick={() => setIsAdmin(false)} style={{ padding: '5px 10px', fontSize: '12px' }}>Logout</button>
      </div>
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'green' }}>Status: {status}</p>
      
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: '0' }}>Register New Personnel</h3>
        <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Designation" value={designation} onChange={e => setDesignation(e.target.value)} required />
        <input style={inputStyle} placeholder="Project Site" value={site} onChange={e => setSite(e.target.value)} />
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Saving...' : 'Add to Database'}
        </button>
      </form>

      <input 
        style={{ ...inputStyle, borderColor: '#003366', marginBottom: '20px' }} 
        placeholder="🔍 Search personnel..." 
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>Staff Directory ({filteredEmployees.length})</h3>
        <button onClick={fetchEmployees} style={{ height: '30px', marginTop: '15px' }}>Refresh</button>
      </div>

      {filteredEmployees.map(emp => (
        <div key={emp.id} style={{ borderBottom: '1px solid #ddd', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{emp.name}</strong> — <span style={{ color: '#003366' }}>{emp.designation}</span> <br/>
            <small style={{ color: '#666' }}>Site: {emp.site_location || 'N/A'}</small>
          </div>
          <button onClick={() => handleDelete(emp.id, emp.name)} style={deleteButtonStyle}>Delete</button>
        </div>
      ))}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '15px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
const deleteButtonStyle = { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }

export default App