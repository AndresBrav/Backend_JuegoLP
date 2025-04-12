'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Carros', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull:false
      },
      descripcion: {
        type: Sequelize.STRING,
        allowNull:false
      },
      precio: {
        type: Sequelize.DOUBLE,
        allowNull:false

      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull:false
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      }
      
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Carros');
  }
};