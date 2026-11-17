"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Ejercicios_Grupo", "casos_prueba", {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("Ejercicios_Grupo", "casos_prueba");
    },
};
