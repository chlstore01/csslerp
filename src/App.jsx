import { useState } from 'react'
import EmployeeDashboard from './modules/EmployeeManagement/EmployeeDashboard'
// import ProcurementDashboard from './modules/Procurement/ProcurementDashboard'

function App() {
  const [activeModule, setActiveModule] = useState('employees');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <div style={{ width: '250px', background: '#003366', color: 'white', padding: '20px' }}>
        <h3>CSSL ERP</h3>
        <button onClick={() => setActiveModule('employees')} style={navBtn}>Employees</button>
        <button onClick={() => setActiveModule('procurement')} style={navBtn}>Procurement</button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, background: '#f9f9f9' }}>
        {activeModule === 'employees' && <EmployeeDashboard />}
        {activeModule === 'procurement' && <div>Procurement Module Coming Soon...</div>}
      </div>
    </div>
  );
}

const navBtn = { 
  display: 'block', width: '100%', padding: '12px', marginBottom: '10px', 
  background: 'none', border: '1px solid #004d99', color: 'white', 
  textAlign: 'left', cursor: 'pointer', borderRadius: '4px' 
};

export default App;