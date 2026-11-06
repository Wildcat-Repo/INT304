import { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import EmployeeForm from './Components/EmployeeForm';

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
    const updatedEmployees = [...employees, employee];
    setEmployees(updatedEmployees);
    saveData(updatedEmployees);
    console.log('Adding employee:', employee);
  }

  return (
    <div className="App">
      <div>
          <EmployeeForm
            onSubmit={addEmployee}
          />
      </div>
    </div>

  );
}

export default App;
