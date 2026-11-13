import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import EmployeeForm from './Components/EmployeeForm';
import EmployeeList from './Components/EmployeeList';

// Read the saved employees array from localStorage, or start with an empty list
function loadEmployees() {
  try {
    const saved = JSON.parse(localStorage.getItem('employees'));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

// Save the employees array to localStorage
function saveData(data) {
  localStorage.setItem('employees', JSON.stringify(data));
  console.log('Saving data:', data);
}

function App() {
  const [employees, setEmployees] = useState(loadEmployees);

  // Add a new employee to the employees state and save the updated list
  function addEmployee(employee) {
    // Generate a simple ID based on timestamp if not present
    const employeeWithId = {
      ...employee,
      id: employee.id || Date.now().toString()
    };
    const updatedEmployees = [...employees, employeeWithId];
    setEmployees(updatedEmployees);
    saveData(updatedEmployees);
    console.log('Adding employee:', employeeWithId);
  }

  return (
    <Router>
      <div className="App">
        <nav className="app-nav">
          <Link to="/" className="nav-brand">Employee Management System</Link>
          <ul className="nav-links">
            <li><Link to="/">Form</Link></li>
            <li><Link to="/employees">Employee List</Link></li>
          </ul>
        </nav>
        <main className="app-main">
          <Routes>
            <Route 
              path="/" 
              element={<EmployeeForm onSubmit={addEmployee} />}
            />
            <Route 
              path="/employees" 
              element={<EmployeeList employees={employees} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
