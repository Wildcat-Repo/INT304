import React from 'react';
import { Link } from 'react-router-dom';
import './EmployeeList.css';

function EmployeeList(props) {
  return (
    <div className="employee-list">
      <h1>Employee List</h1>
      {props.employees && props.employees.length > 0 ? (
        <ul>
          {props.employees.map((employee) => (
            <li key={employee.employee_id}>
              <Link to={`/employees/${employee.employee_id}`}>
                {employee.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No employees added yet.</p>
      )}
    </div>
  );
}

export default EmployeeList;
