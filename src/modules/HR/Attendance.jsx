import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Attendance({ currentUser, selectedEmployee }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isWithinRange, setIsWithinRange] = useState(false);

  const ALLOWED_RADIUS_METERS = 200; // Adjust based on site size
  const targetUser = selectedEmployee || currentUser;

  useEffect(() => {
    fetchTodayStatus();
  }, [currentUser, selectedEmployee]);

  // Haversine Formula to calculate distance between two points in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
  };

  async function fetchTodayStatus() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', targetUser.employee_id)
        .gte('check_in', today)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setTodayLog(data);
    } catch (err) {
      console.error("Attendance fetch error:", err.message);
      setError(err.message);
    }
  }

  const handleVerifyLocation = () => {
    setLoading(true);
    if (!currentUser.target_location) {
      alert("No target location assigned to your profile. Please contact HR.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      
      const [targetLat, targetLon] = currentUser.target_location.split(',').map(Number);
      
      const dist = calculateDistance(userLat, userLon, targetLat, targetLon);
      setDistance(Math.round(dist));

      if (dist <= ALLOWED_RADIUS_METERS) {
        setIsWithinRange(true);
      } else {
        setIsWithinRange(false);
        alert(`Access Denied: You are ${Math.round(dist)}m away from the site.`);
      }
      setLoading(false);
    }, (err) => {
      alert("Location access denied. Check-in is impossible without GPS.");
      setLoading(false);
    }, { enableHighAccuracy: true });
  };

  const handleCheckIn = async () => {
    if (!isWithinRange) return;
    setLoading(true);
    
    const { error } = await supabase.from('attendance').insert([{
      employee_id: targetUser.employee_id,
      site_location: targetUser.site_location,
      lat_long: `${distance}m from site`,
      status: 'Present'
    }]);

    if (!error) {
      alert("Check-in Verified!");
      fetchTodayStatus();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>Error: {error}</div>}
      
      <div style={card}>
        <h2 style={{ color: '#003366', textAlign: 'center' }}>Site Attendance</h2>
        {selectedEmployee && <p style={{ textAlign: 'center', fontSize: '12px', color: '#666', fontWeight: 'bold', background: '#f0f8ff', padding: '8px', borderRadius: '4px', marginBottom: '10px' }}>Viewing: {selectedEmployee.name}</p>}
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
          Site: <b>{targetUser.site_location || 'Not Assigned'}</b>
        </p>
        
        <hr />

        {loading && <p style={{ textAlign: 'center', color: '#003366' }}>Loading...</p>}

        {!loading && !todayLog ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {!isWithinRange ? (
              <button onClick={handleVerifyLocation} disabled={loading} style={verifyBtn}>
                {loading ? 'Locating...' : 'Verify My Location'}
              </button>
            ) : (
              <div>
                <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Location Verified ({distance}m away)</p>
                <button onClick={handleCheckIn} style={checkInBtn}>CONFIRM CHECK-IN</button>
              </div>
            )}
          </div>
        ) : !loading && todayLog ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '50px' }}>✅</div>
            <h3>Checked In</h3>
            <p>Time: {new Date(todayLog.check_in).toLocaleTimeString()}</p>
          </div>
        ) : null}

        {distance !== null && !isWithinRange && (
          <p style={{ color: 'red', textAlign: 'center', marginTop: '10px', fontSize: '12px' }}>
            Error: You are outside the {ALLOWED_RADIUS_METERS}m boundary.
          </p>
        )}
      </div>
    </div>
  );
}

// Styles
const card = { background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #eee' };
const verifyBtn = { background: '#003366', color: '#fff', width: '100%', padding: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const checkInBtn = { background: '#28a745', color: '#fff', width: '100%', padding: '15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };