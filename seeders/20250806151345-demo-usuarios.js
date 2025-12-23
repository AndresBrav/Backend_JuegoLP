'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Usuarios', [
      {
        username: 'andres',
        edad: 25,
        password: '123456',
        idAvatar:1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'maria',
        edad: 30,
        password: 'abcdef',
        idAvatar:1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'juan',
        edad: 28,
        password: 'qwerty',
        idAvatar:1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Usuarios', null, {});
  }
};
