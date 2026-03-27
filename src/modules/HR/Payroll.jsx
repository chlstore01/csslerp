import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Payroll({ currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [activeEmp, setActiveEmp] = useState(null);

  // Manual Deduction State
  const [deductions, setDeductions] = useState({
    advance: 0, tax: 0, fund: 0, event: 0, misc: 0
  });

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  async function fetchPayrollData() {
    setLoading(true);
    try {
      const { data: staff, error: staffErr } = await supabase.from('employees').select('*');
      if (staffErr) throw staffErr;

      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString();

      const staffWithAttendance = await Promise.all(staff.map(async (emp) => {
        const { count } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('employee_id', emp.employee_id)
          .gte('check_in', startDate)
          .lte('check_in', endDate);
        
        // Fetch existing manual deductions if any from a 'payroll' records table (optional logic)
        // For this UI, we calculate live:
        const daysPresent = count || 0;
        const dailyWage = (emp.basic_salary || 0) / 30;
        const grossPay = Math.round(daysPresent * dailyWage);

        return { ...emp, daysPresent, grossPay };
      }));

      setEmployees(staffWithAttendance);
    } catch (err) { console.error(err.message); }
    setLoading(false);
  }

  const openDeductionModal = (emp) => {
    setActiveEmp(emp);
    setShowDeductModal(true);
  };

  const calculateFinalPay = (emp) => {
    const totalDeductions = Number(deductions.advance) + Number(deductions.tax) + 
                            Number(deductions.fund) + Number(deductions.event) + Number(deductions.misc);
    return emp.grossPay - totalDeductions;
  };

  const generatePayslip = (emp) => {
    const totalDeduct = Number(deductions.advance) + Number(deductions.tax) + Number(deductions.fund) + Number(deductions.event) + Number(deductions.misc);
    const finalPay = emp.grossPay - totalDeduct;
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
    
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head><title>Payslip - ${emp.employee_id}</title></head>
        <body style="font-family: sans-serif; padding: 30px;">
          <div style="border: 2px solid #003366; padding: 20px; max-width: 800px; margin: auto;">
            <h2 style="text-align:center; color:#003366; margin:0;">COMPOSITE STEEL STRUCTURE LTD.</h2>
            <p style="text-align:center; margin-bottom:20px;">Salary Slip: ${monthName} ${selectedYear}</p>
            <hr/>
            <table style="width:100%; margin-bottom:20px;">
                <tr><td><b>Staff:</b> ${emp.name}</td><td><b>ID:</b> ${emp.employee_id}</td></tr>
                <tr><td><b>Designation:</b> ${emp.designation}</td><td><b>Days Present:</b> ${emp.daysPresent}</td></tr>
            </table>
            <table style="width:100%; border-collapse:collapse;">
                <tr style="background:#f2f2f2;"><th style={td}>Earnings</th><th style={td}>Amount</th><th style={td}>Deductions</th><th style={td}>Amount</th></tr>
                <tr>
                    <td style={td}>Gross Salary (Attd)</td><td style={td}>${emp.grossPay}</td>
                    <td style={td}>Advance Deduction</td><td style={td}>${deductions.advance}</td>
                </tr>
                <tr>
                    <td></td><td></td><td style={td}>Income Tax</td><td style={td}>${deductions.tax}</td>
                </tr>
                <tr>
                    <td></td><td></td><td style={td}>Employee Fund</td><td style={td}>${deductions.fund}</td>
                </tr>
                <tr>
                    <td></td><td></td><td style={td}>Event/Misc</td><td style={td}>${Number(deductions.event) + Number(deductions.misc)}</td>
                </tr>
                <tr style="background:#003366; color:#fff; font-weight:bold;">
                    <td colspan="3" style={td}>NET PAYABLE (BDT)</td><td style={td}>${finalPay}</td>
                </tr>
            </table>
            <p style="margin-top:50px; text-align:right;">Authorized Signature: _________________</p>
          </div>
        </body>
      </html>
    `);
  };

  return (
    <div style={{ padding: '20px', background: '#fff' }}>
      <h2 style={{ color: '#003366' }}>Payroll & Manual Deductions</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select style={inp} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', {month:'long'})}</option>)}
        </select>
        <select style={inp} value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
        </select>
      </div>

      <table style={tbl}>
        <thead>
          <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #003366' }}>
            <th style={th}>Staff</th>
            <th style={th}>Attendance Pay</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.employee_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}><b>{emp.name}</b><br/><small>{emp.employee_id}</small></td>
              <td style={td}>{emp.grossPay} BDT</td>
              <td style={td}>
                <button onClick={() => openDeductionModal(emp)} style={actBtn('#f39c12')}>Set Deductions</button>
                <button onClick={() => generatePayslip(emp)} style={actBtn('#003366')}>Print Slip</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DEDUCTION MODAL */}
      {showDeductModal && (
        <div style={overlay}>
          <div style={modalBox}>
            <h3>Deductions: {activeEmp?.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={lbl}>Advance Deduction</label><input type="number" style={inp} value={deductions.advance} onChange={e => setDeductions({...deductions, advance: e.target.value})} /></div>
              <div><label style={lbl}>Income Tax</label><input type="number" style={inp} value={deductions.tax} onChange={e => setDeductions({...deductions, tax: e.target.value})} /></div>
              <div><label style={lbl}>Employee Fund</label><input type="number" style={inp} value={deductions.fund} onChange={e => setDeductions({...deductions, fund: e.target.value})} /></div>
              <div><label style={lbl}>Event Deduction</label><input type="number" style={inp} value={deductions.event} onChange={e => setDeductions({...deductions, event: e.target.value})} /></div>
              <div><label style={lbl}>Miscellaneous</label><input type="number" style={inp} value={deductions.misc} onChange={e => setDeductions({...deductions, misc: e.target.value})} /></div>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setShowDeductModal(false)} style={saveBtn}>Apply to Payslip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const th = { padding: '12px', textAlign: 'left' };
const td = { padding: '12px', border: '1px solid #ddd' };
const tbl = { width: '100%', borderCollapse: 'collapse' };
const inp = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const lbl = { fontSize: '11px', fontWeight: 'bold', color: '#003366' };
const actBtn = (bg) => ({ background: bg, color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' });
const saveBtn = { background: '#28a745', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalBox = { background: '#fff', padding: '25px', borderRadius: '8px', width: '400px' };