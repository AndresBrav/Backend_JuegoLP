"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("juegosia", "estado_tablero", {
            type: Sequelize.TEXT("long"),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("juegosia", "estado_tablero");
    },
};
