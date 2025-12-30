"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("Usuario_Juegos", [
            { usuario_id: 1, juego_id: 1, completado: false, puntos: 0 },
            { usuario_id: 1, juego_id: 2, completado: false, puntos: 0 },
            { usuario_id: 1, juego_id: 3, completado: false, puntos: 0 },
            { usuario_id: 2, juego_id: 1, completado: false, puntos: 0 },
            { usuario_id: 3, juego_id: 3, completado: false, puntos: 0 },
        ]);
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         */
        await queryInterface.bulkDelete("Usuario_Juegos", null, {});
    },
};
