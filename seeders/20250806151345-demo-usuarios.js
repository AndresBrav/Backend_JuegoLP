'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Usuarios', [
      {
        username: 'andres',
        edad: 25,
        password: '123456',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'maria',
        edad: 30,
        password: 'abcdef',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'juan',
        edad: 28,
        password: 'qwerty',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Usuarios', null, {});
  }
};
