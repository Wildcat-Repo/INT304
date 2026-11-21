import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import './App.css';
import EmployeeForm from './Components/EmployeeForm';
import EmployeeList from './Components/EmployeeList';
import { fetchEmployees, createEmployee } from './api';

// Show a list of error messages from the API
function ErrorMessages({ messages }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return (
    <ul className="form-errors" role="alert">
      {messages.map((message) => <li key={message}>{message}</li>)}
    </ul>
  );
}

function EmployeeDetails({ employees, status }) {
  const { employeeId } = useParams();

  if (status === 'loading') {
    return <p>Loading employee…</p>;
  }

  const employee = employees.find((item) => item.employee_id === employeeId);
  if (!employee) {
    return (
      <div className="employee-not-found">
        <p>Employee not found.</p>
        <Link to="/employees">Back to the employee list</Link>
      </div>
    );
  }

  // Viewing an existing employee must not overwrite the new-employee draft
  return <EmployeeForm employee={employee} persistDraft={false} />;
}

function App() {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState('loading');   // 'loading' | 'ready' | 'error'
  const [loadErrors, setLoadErrors] = useState([]);
  const [submitErrors, setSubmitErrors] = useState([]);

  // Load the employee list from the API once, when the app starts
  useEffect(() => {
    let cancelled = false;
    fetchEmployees()
      .then((data) => {
        if (!cancelled) {
          setEmployees(data);
          setStatus('ready');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadErrors(error.messages || ['Could not load employees']);
          setStatus('error');
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Save a new employee through the API.
  // Returns true on success so the form knows to clear itself.
  async function addEmployee(employee) {
    try {
      const saved = await createEmployee(employee);
      setEmployees((current) => [...current, saved]);
      setSubmitErrors([]);
      return true;
    } catch (error) {
      setSubmitErrors(error.messages || ['Could not save the employee']);
      return false;
    }
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
              element={
                <>
                  <ErrorMessages messages={submitErrors} />
                  <EmployeeForm onSubmit={addEmployee} />
                </>
              }
            />
            <Route
              path="/employees"
              element={
                status === 'loading' ? <p>Loading employees…</p>
                  : status === 'error' ? <ErrorMessages messages={loadErrors} />
                  : <EmployeeList employees={employees} />
              }
            />
            <Route
              path="/employees/:employeeId"
              element={<EmployeeDetails employees={employees} status={status} />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
