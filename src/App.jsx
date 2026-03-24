import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [site, setSite] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  async function fetchEmployees() {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
    setEmployees(data || [])
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
      fetchEmployees() // Refresh the list
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#003366', textAlign: 'center' }}>CSSL ERP Portal</h1>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Register New Personnel</h3>
        <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Designation (e.g. Foreman)" value={designation} onChange={e => setDesignation(e.target.value)} required />
        <input style={inputStyle} placeholder="Project Site (e.g. Chittagong)" value={site} onChange={e => setSite(e.target.value)} />
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Saving...' : 'Add to Database'}
        </button>
      </form>

      {/* Employee List */}
      <h3>Staff Directory ({employees.length})</h3>
      {employees.map(emp => (
        <div key={emp.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0' }}>
          <strong>{emp.name}</strong> — {emp.designation} <br/>
          <small style={{ color: '#666' }}>Site: {emp.site_location || 'N/A'}</small>
        </div>
      ))}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }

export default App