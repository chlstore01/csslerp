import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
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
      .from('employees') // Matches your Supabase table name 
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setStatus('Error: ' + error.message)
      console.error(error)
    } else {
      setEmployees(data || [])
      setStatus(data.length > 0 ? 'Online' : 'Database Empty')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase
      .from('employees')
      .insert([{ 
        name: name, 
        designation: designation, 
        site_location: site // Matches your confirmed column name 
      }])

    if (error) {
      alert("Registration Failed: " + error.message)
    } else {
      setName(''); setDesignation(''); setSite('');
      fetchEmployees() 
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#003366', textAlign: 'center', marginBottom: '5px' }}>CSSL ERP Portal</h1>
      <p style={{ textAlign: 'center', fontSize: '12px', color: status.includes('Error') ? 'red' : 'green', marginTop: '0' }}>
        System Status: {status}
      </p>
      
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: '0' }}>Register New Personnel</h3>
        <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Designation" value={designation} onChange={e => setDesignation(e.target.value)} required />
        <input style={inputStyle} placeholder="Project Site (e.g. Chittagong)" value={site} onChange={e => setSite(e.target.value)} />
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Saving to Cloud...' : 'Add to Database'}
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Staff Directory ({employees.length})</h3>
        <button onClick={fetchEmployees} style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }}>Refresh List</button>
      </div>

      {employees.map(emp => (
        <div key={emp.id} style={{ borderBottom: '1px solid #ddd', padding: '12px 0' }}>
          <strong>{emp.name}</strong> — <span style={{ color: '#003366' }}>{emp.designation}</span> <br/>
          <small style={{ color: '#666' }}>Project Site: {emp.site_location || 'Not Assigned'}</small>
        </div>
      ))}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }
const buttonStyle = { width: '100%', padding: '15px', backgroundColor: '#003366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }

export default App