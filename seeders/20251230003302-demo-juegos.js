"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert("Juegos", [
            { nombre_juego: "Diagrama1", nivel_juego: 1 },
            { nombre_juego: "Diagrama2", nivel_juego: 1 },
            { nombre_juego: "Diagrama3", nivel_juego: 1 },
            { nombre_juego: "Diagrama4", nivel_juego: 1 },
            { nombre_juego: "Diagrama5", nivel_juego: 1 },
        ]);
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
        */
        await queryInterface.bulkDelete('Juegos', null, {});
    },
};
