import logo from './logo.svg';
import './App.css';
import EmployeeForm from './Components/EmployeeForm';

function addEmployee(employee) {
  console.log('Adding employee:', employee);
}

function saveData(data) {
  console.log('Saving data:', data);
}


function App() {
  return (
    <div className="App">
      <div>
          <EmployeeForm />
      </div>
    </div>

  );
}

export default App;
