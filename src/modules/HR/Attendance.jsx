import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Attendance({ currentUser }) {
  const [loading, setLoading] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  useEffect(() => {
    fetchTodayStatus();
    if (currentUser.role === 'Admin' || currentUser.role === 'HR Manager') {
      fetchAllLogs();
    }
  }, [currentUser]);

  // Check if the user has already checked in today
  async function fetchTodayStatus() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', currentUser.employee_id)
      .gte('check_in', today)
      .single();

    if (data) setTodayLog(data);
  }

  async function fetchAllLogs() {
    const { data } = await supabase
      .from('attendance')
      .select(`*, employees(name, designation)`)
      .order('check_in', { ascending: false })
      .limit(50);
    setAttendanceHistory(data || []);
  }

  const handleCheckIn = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const latLong = `${latitude}, ${longitude}`;

      const { error } = await supabase.from('attendance').insert([{
        employee_id: currentUser.employee_id,
        site_location: currentUser.site_location || 'Main Office',
        lat_long: latLong,
        status: 'Present'
      }]);

      if (error) alert(error.message);
      else {
        alert("Checked In Successfully!");
        fetchTodayStatus();
      }
      setLoading(false);
    }, (err) => {
      alert("Please enable Location Services to Check-In.");
      setLoading(false);
    });
  };

  const handleCheckOut = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('attendance')
      .update({ check_out: new Date().toISOString() })
      .eq('id', todayLog.id);

    if (error) alert(error.message);
    else {
      alert("Checked Out Successfully!");
      fetchTodayStatus();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h2 style={{ color: '#003366' }}>Daily Attendance</h2>
      <hr />

      {/* ACTION CARD */}
      <div style={{ background: '#f8f9fa', padding: '30px', textAlign: 'center', borderRadius: '10px', marginBottom: '20px' }}>
        <h3>Welcome, {currentUser.name}</h3>
        <p>Current Site: <b>{currentUser.site_location || 'Not Assigned'}</b></p>
        
        {!todayLog ? (
          <button onClick={handleCheckIn} disabled={loading} style={btnIn}>
            {loading ? 'Processing...' : 'START WORK (CHECK-IN)'}
          </button>
        ) : !todayLog.check_out ? (
          <button onClick={handleCheckOut} disabled={loading} style={btnOut}>
            {loading ? 'Processing...' : 'FINISH WORK (CHECK-OUT)'}
          </button>
        ) : (
          <div style={{ color: 'green', fontWeight: 'bold' }}>✅ Work Completed for Today</div>
        )}
      </div>

      {/* ADMIN VIEW: RECENT LOGS */}
      {(currentUser.role === 'Admin' || currentUser.role === 'HR Manager') && (
        <div>
          <h4>Recent Activity (All Staff)</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#003366', color: '#fff' }}>
                <th style={th}>Staff</th>
                <th style={th}>Check In</th>
                <th style={th}>Check Out</th>
                <th style={th}>Location</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>{log.employees?.name} <br/> <small>{log.employees?.designation}</small></td>
                  <td style={td}>{new Date(log.check_in).toLocaleTimeString()}</td>
                  <td style={td}>{log.check_out ? new Date(log.check_out).toLocaleTimeString() : 'On Duty'}</td>
                  <td style={td}><a href={`https://www.google.com/maps?q=${log.lat_long}`} target="_blank" rel="noreferrer">View Map</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Styles
const btnIn = { background: '#28a745', color: '#fff', padding: '15px 30px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnOut = { background: '#dc3545', color: '#fff', padding: '15px 30px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const th = { padding: '10px', textAlign: 'left', fontSize: '12px' };
const td = { padding: '10px', fontSize: '13px' };