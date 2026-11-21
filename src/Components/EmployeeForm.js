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
        // Copy only the form fields so other properties (such as id) never enter the form state or the draft
        const source = props.employee || saved;
        this.state = {
            name: source.name || defaults.name,
            email: source.email || defaults.email,
            title: source.title || defaults.title,
            department: source.department || defaults.department
        };

        this.handleChange = this.handleChange.bind(this);   // Bind the handleChange method to the component instance
    }

    // Lifecycle method called after the component updates
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.employee !== this.props.employee) {
            this.setState({
                name: this.props.employee?.name || '',
                email: this.props.employee?.email || '',
                title: this.props.employee?.title || '',
                department: this.props.employee?.department || ''
            });
            return;
        }

        // Only the add-employee form keeps a draft; viewing an existing employee must not overwrite it
        if (this.props.persistDraft !== false && prevState !== this.state) {
            localStorage.setItem('current_employee', JSON.stringify(this.state));
        }
    }

    // Handle input changes
    handleChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    // Handle form submission without reloading the page.
    // If onSubmit reports success (returns or resolves to true), clear the form and the saved draft
    // so the same employee is not submitted twice.
    handleSubmit = async (event) => {
        event.preventDefault();
        if (this.props.onSubmit) {
            const saved = await this.props.onSubmit(this.state);
            if (saved === true) {
                this.setState({ name: '', email: '', title: '', department: '' });
            }
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
