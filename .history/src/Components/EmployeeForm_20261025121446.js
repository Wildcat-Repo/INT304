import React from 'react';

class EmployeeForm extends
    React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '', email: '', title: '',
            department: ''
        };
    }

    handleChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }
}
export default EmployeeForm;
