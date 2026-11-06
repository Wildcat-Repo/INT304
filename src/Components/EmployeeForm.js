import React from 'react';
import './EmployeeForm.css';

class EmployeeForm extends React.Component {
    constructor(props) {
        super(props);
        
        const defaults = {
            name: '',
            email: '',
            title: '',
            department: ''
        };

        // Retrieve the saved employee from localStorage if it exists.
        // Merge it over the defaults so missing fields stay '' (keeps inputs controlled),
        // and fall back to the defaults if the saved value is not valid JSON or not an object.
        let saved = {};
        try {
            const parsed = JSON.parse(localStorage.getItem('current_employee'));
            if (parsed && typeof parsed === 'object') {
                saved = parsed;
            }
        } catch (error) {
            saved = {};
        }
        this.state = { ...defaults, ...saved };

        this.handleChange = this.handleChange.bind(this);   // Bind the handleChange method to the component instance
    }

    // Lifecycle method called after the component updates
    componentDidUpdate(prevProps, prevState) {
        if (prevState !== this.state) {
            localStorage.setItem('current_employee', JSON.stringify(this.state));
        }
    }

    // Handle input changes
    handleChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    // Handle form submission without reloading the page
    handleSubmit = (event) => {
        event.preventDefault();
        if (this.props.onSubmit) {
            this.props.onSubmit(this.state);
        }
    }

    render() {
        return (
            <form className="employee-form" onSubmit={this.handleSubmit}>
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
