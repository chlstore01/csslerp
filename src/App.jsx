import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  // Core States
  const [employees, setEmployees] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // UI States
  const [loginForm, setLoginForm] = useState({ id: '', pass: '' })
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [editingDbId, setEditingDbId] = useState(null) // PRIMARY KEY LOCK

  // RESTORED: All 11 Data Fields
  const [formData, setFormData] = useState({
    name: '', designation: '', role: 'General Staff', site_location: '', 
    phone_number: '', nid_number: '', blood_group: '', joining_date: '', 
    basic_salary: '', status: 'Active', employee_id: ''
  });

  const MASTER_ID = "ADMIN", MASTER_KEY = "CSSL_MASTER_2026";
  const roleList = ["Admin", "General Manager", "Finance & Accountant Manager", "Supply Chain Manager", "Human Resource Manager", "Supervisor", "Engineer", "General Staff"];

  // RESTORED: Role-Based Permissions
  const canModify = currentUser && ["Admin", "General Manager", "Human Resource Manager"].includes(currentUser.role);
  const canSeeSalary = currentUser && ["Admin", "General Manager", "Finance & Accountant Manager"].includes(currentUser.role);

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    const { data, error } = await supabase.from('employees').select('*')
    // We handle both id and ID just in case
    if (!error) setEmployees(data ? [...data].sort((a, b) => (b.ID || b.id) - (a.ID || a.id)) : [])
  }

  // --- FACILITY: DELETE (Fixed for Uppercase ID) ---
  const handleDelete = async (dbId, name) => {
    if (window.confirm(`PERMANENTLY DELETE ${name}?`)) {
      const { error } = await supabase.from('employees').delete().eq('ID', dbId);
      if (error) {
        // Fallback if ID is lowercase
        const { error: err2 } = await supabase.from('employees').delete().eq('id', dbId);
        if (err2) alert("Delete Failed: " + err2.message);
        else { alert("Deleted."); fetchEmployees(); }
      } else {
        alert("Deleted.");
        fetchEmployees();
      }
    }
  };

  // --- FACILITY: EDIT (Fixed for Uppercase ID) ---
  const handleEditTrigger = (emp) => {
    setEditingDbId(emp.ID || emp.id); 
    setFormData({ ...emp });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function handleFormSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // CLEAN DATA (Excludes metadata)
    const cleanData = {
      name: formData.name,
      designation: formData.designation,
      role: formData.role,
      site_location: formData.site_location,
      phone_number: formData.phone_number,
      nid_number: formData.nid_number,
      blood_group: formData.blood_group,
      joining_date: formData.joining_date || null,
      basic_salary: formData.basic_salary || null,
      status: formData.status
    };

    if (editingDbId) {
      // UPDATE PATH
      const { error } = await supabase.from('employees').update(cleanData).eq('ID', editingDbId);
      if (error) {
         const { error: err2 } = await supabase.from('employees').update(cleanData).eq('id', editingDbId);
         if (err2) alert("Update Failed: " + err2.message);
         else alert("Update Successful.");
      } else alert("Update Successful.");
    } else {
      // INSERT PATH
      const newEntry = {
        ...cleanData,
        employee_id: `CSSL-${1001 + employees.length}`,
        password: formData.phone_number || '123456'
      };
      const { error } = await supabase.from('employees').insert([newEntry]);
      if (error) alert("Insert Failed: " + error.message);
      else alert("Staff Registered.");
    }

    resetForm();