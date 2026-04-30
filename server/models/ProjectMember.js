const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectMember = sequelize.define('ProjectMember', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Member'),
    defaultValue: 'Member',
  }
}, {
  timestamps: true,
});

module.exports = ProjectMember;
