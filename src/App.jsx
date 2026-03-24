import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('') // New state for search
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [site, setSite] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Connecting...')

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    setStatus('Fetching data...')
    const { data, error } = await supabase
      .from('employees')
      .select('*')

    if (error) {
      setStatus('Error: ' + error.message)
    } else {
      const sortedData = data ? [...data].reverse() : []
      setEmployees(sortedData)
      setStatus(sortedData.length > 0 ? 'Online' : 'Database Empty (0)')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase
      .from('employees')
      .insert([{ name, designation, site_location: site }])

    if (error) {
      alert("Error: " + error.message)
    } else {
      setName(''); setDesignation(''); setSite('');
      fetchEmployees() 
    }
    setLoading(false)
  }

  async function handleDelete(id, employeeName) {
    const confirmed = window.confirm(`Are you sure you want to delete ${employeeName}?`);
    if (!confirmed) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      fetchEmployees();
    }
  }

  // --- SEARCH LOGIC ---
  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.site_location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#003366', textAlign: 'center', marginBottom: '5px' }}>CSSL ERP Portal</h1>
      <p style={{ textAlign: 'center', fontSize: '12px', color: status.includes('Error') ? 'red' : 'green', marginTop: '0' }}>
        System Status: {status}
      </p>
      
      {/* Registration Form */}
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: '0' }}>Register New Personnel</h3>
        <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Designation" value={designation} onChange={e => setDesignation(e.target.value)} required />
        <input style={inputStyle} placeholder="Project Site" value={site} onChange={e => setSite(e.target.value)} />
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Saving to Cloud...' : 'Add to Database'}
        </button>
      </form>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          style={{ ...inputStyle, marginBottom: '0', borderColor: '#003366' }} 
          placeholder="🔍 Search by name, post, or site..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Staff Directory ({filteredEmployees.length})</h3>
        <button onClick={fetchEmployees} style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}>Refresh</button>
      </div>

      {filteredEmployees.map(emp => (
        <div key={emp.id} style={{ borderBottom: '1px solid #ddd', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{emp.name}</strong> — <span style={{ color: '#003366' }}>{emp.designation}</span> <br/>
            <small style={{ color: '#666' }}>Site: {emp.site_location || 'N/A'}</small>
          </div>
          <button 
            onClick={() => handleDelete(emp.id, emp.name)}
            style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
          >
            Delete
          </button>
        </div>
      ))}
      
      {filteredEmployees.length === 0 && employees.length > 0 && (
        <p style={{ textAlign: 'center', color: '#999' }}>No personnel found matching "{searchTerm}"</p>
      )}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '15px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }

export default App