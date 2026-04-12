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
            { nombre_juego: "Pseudocodigo1", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo2", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo3", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo4", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo5", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo6", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo7", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo8", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo9", nivel_juego: 2 },
            { nombre_juego: "Pseudocodigo10", nivel_juego: 2 },
        ]);
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         */
        await queryInterface.bulkDelete("Juegos", null, {});
    },
};
