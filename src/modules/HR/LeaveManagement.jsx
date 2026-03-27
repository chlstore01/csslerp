import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function LeaveManagement({ currentUser, selectedEmployee }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'Casual Leave',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const isAdmin = ["Admin", "HR Manager"].includes(currentUser.role);

  useEffect(() => {
    fetchLeaves();
  }, [selectedEmployee]);

  async function fetchLeaves() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('leave_requests').select(`*, employees(name, designation)`);
      
      // Filter by selected employee if viewing specific employee
      if (selectedEmployee) {
        query = query.eq('employee_id', selectedEmployee.employee_id);
      } else if (!isAdmin) {
        // If not Admin and no selected employee, only see own leaves
        query = query.eq('employee_id', currentUser.employee_id);
      }

      const { data, error: err } = await query.order('applied_at', { ascending: false });
      if (err) throw err;
      setLeaves(data || []);
    } catch (err) {
      console.error("Leave fetch error:", err.message);
      setError(err.message);
    }
    setLoading(false);
  }

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('leave_requests').insert([{
      ...formData,
      employee_id: currentUser.employee_id,
      status: 'Pending'
    }]);

    if (!error) {
      alert("Leave application submitted.");
      setShowApplyModal(false);
      fetchLeaves();
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: newStatus, approved_by: currentUser.employee_id })
      .eq('id', id);

    if (!error) {
      alert(`Application ${newStatus}`);
      fetchLeaves();
    }
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>Error: {error}</div>}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#003366', margin: 0 }}>Leave Management</h2>
          {selectedEmployee && <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0', background: '#f0f8ff', padding: '5px 8px', borderRadius: '4px', display: 'inline-block' }}>Viewing: {selectedEmployee.name}</p>}
        </div>
        {!selectedEmployee && <button onClick={() => setShowApplyModal(true)} style={addBtn}>Apply for Leave</button>}
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#003366' }}>Loading...</p>}

      {!loading && leaves.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No leave requests found.</p>
      )}

      {!loading && leaves.length > 0 && (
        <table style={tbl}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #003366' }}>
              <th style={th}>Employee</th>
              <th style={th}>Type</th>
              <th style={th}>Duration</th>
              <th style={th}>Status</th>
              {isAdmin && <th style={th}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.map(lv => (
              <tr key={lv.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>
                  <b>{lv.employees?.name}</b><br/>
                  <small>{lv.employee_id}</small>
                </td>
                <td style={td}>{lv.leave_type}</td>
                <td style={td}>{lv.start_date} to {lv.end_date}</td>
                <td style={td}>
                  <span style={statusBadge(lv.status)}>{lv.status}</span>
                </td>
                {isAdmin && (
                  <td style={td}>
                    {lv.status === 'Pending' && (
                      <>
                        <button onClick={() => handleStatusUpdate(lv.id, 'Approved')} style={actBtn('#28a745')}>Approve</button>
                        <button onClick={() => handleStatusUpdate(lv.id, 'Rejected')} style={actBtn('#dc3545')}>Reject</button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* APPLICATION MODAL */}
      {showApplyModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3>Leave Application</h3>
            <form onSubmit={handleApply}>
              <label style={lbl}>Leave Type</label>
              <select style={inp} onChange={e => setFormData({...formData, leave_type: e.target.value})}>
                <option>Casual Leave</option>
                <option>Sick Leave</option>
                <option>Earned Leave</option>
                <option>Maternity/Paternity Leave</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div><label style={lbl}>Start Date</label><input type="date" style={inp} required onChange={e => setFormData({...formData, start_date: e.target.value})} /></div>
                <div><label style={lbl}>End Date</label><input type="date" style={inp} required onChange={e => setFormData({...formData, end_date: e.target.value})} /></div>
              </div>

              <label style={{...lbl, display: 'block', marginTop: '10px'}}>Reason</label>
              <textarea style={{...inp, height: '80px'}} required onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button type="submit" style={saveBtn}>{loading ? 'Submitting...' : 'Submit Application'}</button>
                <button type="button" onClick={() => setShowApplyModal(false)} style={cancelBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const th = { padding: '12px', textAlign: 'left', color: '#003366', fontWeight: 'bold' };
const td = { padding: '12px', fontSize: '14px' };
const tbl = { width: '100%', borderCollapse: 'collapse' };
const inp = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' };
const lbl = { fontSize: '11px', fontWeight: 'bold', color: '#003366' };
const addBtn = { background: '#003366', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const saveBtn = { flex: 1, background: '#28a745', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const cancelBtn = { flex: 1, background: '#6c757d', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const actBtn = (bg) => ({ background: bg, color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' });
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalBox = { background: '#fff', padding: '30px', borderRadius: '8px', width: '450px' };

const statusBadge = (s) => ({
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: 'bold',
  background: s === 'Approved' ? '#e8f5e9' : s === 'Rejected' ? '#ffebee' : '#fff3e0',
  color: s === 'Approved' ? '#2e7d32' : s === 'Rejected' ? '#c62828' : '#ef6c00'
});