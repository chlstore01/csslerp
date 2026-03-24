import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [employees, setEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState(null)
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [site, setSite] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Connecting...')
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const ADMIN_PASSWORD = "CSSL_ADMIN_2026"

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

  // --- CSV EXPORT LOGIC ---
  const exportToCSV = () => {
    if (filteredEmployees.length === 0) return alert("No data to export");
    
    const headers = ["Name,Designation,Site Location\n"];
    const rows = filteredEmployees.map(emp => 
      `"${emp.name}","${emp.designation}","${emp.site_location || 'N/A'}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `CSSL_Staff_${selectedSite || 'Full_List'}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getSiteSummary = () => {
    const counts = {};
    employees.forEach(emp => {
      const siteName = emp.site_location && emp.site_location.trim() !== '' ? emp.site_location : 'Office/General';
      counts[siteName] = (counts[siteName] || 0) + 1;
    });
    return Object.entries(counts);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('employees').insert([{ name, designation, site_location: site }]);
    if (error) { alert("Error: " + error.message) } 
    else { setName(''); setDesignation(''); setSite(''); fetchEmployees() }
    setLoading(false);
  }

  async function handleDelete(id, employeeName) {
    if (!window.confirm(`Delete ${employeeName}?`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) { alert("Delete failed: " + error.message) } else { fetchEmployees() }
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) { setIsAdmin(true) } else { alert("Incorrect Password") }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    const empSite = emp.site_location && emp.site_location.trim() !== '' ? emp.site_location : 'Office/General';
    const matchesSite = selectedSite ? empSite === selectedSite : true;
    return matchesSearch && matchesSite;
  })

  if (!isAdmin) {
    return (
      <div style={{ padding: '50px 20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#003366' }}>CSSL Admin Login</h1>
        <form onSubmit={handleLogin}>
          <input type="password" style={inputStyle} placeholder="Enter Admin Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
          <button type="submit" style={buttonStyle}>Login to ERP</button>
        </form>
      </div>
    )
  }

  const summary = getSiteSummary();

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#003366', margin: '0' }}>CSSL ERP Portal</h1>
        <button onClick={() => setIsAdmin(false)} style={{ padding: '5px 10px', fontSize: '12px' }}>Logout</button>
      </div>

      <div style={{ margin: '20px 0', padding: '15px', background: '#f0f4f8', borderRadius: '8px', borderLeft: '5px solid #003366' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', color: '#003366' }}>Site Statistics:</div>
          {selectedSite && (
            <button onClick={() => setSelectedSite(null)} style={{ fontSize: '11px', color: '#003366', cursor: 'pointer', border: '1px solid #003366', background: 'white', borderRadius: '4px' }}>Show All</button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {summary.map(([siteName, count]) => (
            <div key={siteName} onClick={() => setSelectedSite(siteName)} style={{ background: selectedSite === siteName ? '#003366' : 'white', color: selectedSite === siteName ? 'white' : '#555', padding: '6px 12px', borderRadius: '4px', fontSize: '13px', border: '1px solid #ddd', cursor: 'pointer' }}>
              {siteName}: <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #eee' }}>
        <h3 style={{ marginTop: '0' }}>Register New Personnel</h3>
        <input style={inputStyle} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
        <input style={inputStyle} placeholder="Designation" value={designation} onChange={e => setDesignation(e.target.value)} required />
        <input style={inputStyle} placeholder="Project Site" value={site} onChange={e => setSite(e.target.value)} />
        <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'Saving...' : 'Add to Database'}</button>
      </form>

      <input style={{ ...inputStyle, borderColor: '#003366', marginBottom: '20px' }} placeholder="🔍 Search in current view..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: '0' }}>{selectedSite ? `${selectedSite} Staff` : 'Staff Directory'} ({filteredEmployees.length})</h3>
        <div style={{ display: 'flex', gap: '5px' }}>
           <button onClick={fetchEmployees} style={{ padding: '5px 10px', fontSize: '12px' }}>Refresh</button>
           <button onClick={exportToCSV} style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Export CSV</button>
        </div>
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