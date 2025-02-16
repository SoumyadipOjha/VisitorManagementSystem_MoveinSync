const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const employeeController = {
    register: async (req, res) => {
        try {
            const { name, email, username, password } = req.body;
            
            const existingEmployee = await Employee.findOne({
                $or: [{ email }, { username }]
            });
            
            if (existingEmployee) {
                return res.status(400).json({ error: "Email or username already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const employee = new Employee({
                name,
                email,
                username,
                password: hashedPassword
            });

            await employee.save();
            res.status(201).json({ message: "Employee registered successfully" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            const employee = await Employee.findOne({ username });

            if (!employee || !(await bcrypt.compare(password, employee.password))) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const token = jwt.sign(
                { id: employee._id, name: employee.name, email: employee.email },
                process.env.SECRET_KEY,
                { expiresIn: "2h" }
            );

            res.json({
                token,
                employee: { name: employee.name, email: employee.email }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllEmployees: async (req, res) => {
        try {
            const employees = await Employee.find({}, "name");
            res.json(employees);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = employeeController;