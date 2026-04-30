const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  due_date: {
    type: DataTypes.DATEONLY,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Active', 'Completed'),
    defaultValue: 'Draft',
  },
}, {
  timestamps: true,
});

// Relationships will be defined in index.js to avoid circular dependencies
module.exports = Project;
