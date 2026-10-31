"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Usuario_Juegos", "estado_juego", {
            type: Sequelize.TEXT("long"),
            allowNull: true,
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn("Usuario_Juegos", "estado_juego");
    },
};
