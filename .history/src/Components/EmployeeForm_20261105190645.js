import React from 'react';
import './EmployeeForm.css';

class EmployeeForm extends
    React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '', email: '', title: '',
            department: ''
        };
    }

    // Handle form submission
    handleChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    render() {
        return (
            <form className="employee-form">
                <div>
                    <label htmlFor="employee-name">Name: </label>
                    <input
                        type="text"
                        name="name"
                        id="employee-name"
                        value={this.state.name}
                        onChange={this.handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="employee-email">Email: </label>
                    <input
                        type="email"
                        name="email"
                        id="employee-email"
                        value={this.state.email}
                        onChange={this.handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="employee-title">Title: </label>
                    <input
                        type="text"
                        name="title"
                        id="employee-title"
                        value={this.state.title}
                        onChange={this.handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="employee-department">Department: </label>
                    <input
                        type="text"
                        name="department"
                        id="employee-department"
                        value={this.state.department}
                        onChange={this.handleChange}
                    />
                </div>
                <button type="submit">Submit</button>
            </form>
        );
    }
}
export default EmployeeForm;
