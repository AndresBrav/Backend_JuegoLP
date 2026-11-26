"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Usuarios", "correo", {
            type: Sequelize.STRING(255),
            allowNull: true,
            unique: true,
        });
        await queryInterface.removeColumn("Usuarios", "edad");
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn("Usuarios", "edad", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });
        await queryInterface.removeColumn("Usuarios", "correo");
    },
};
