"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            "Usuario_Ejercicios_Grupo",
            "resultado_casos_prueba",
            {
                type: Sequelize.JSON,
                allowNull: true,
            },
        );
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(
            "Usuario_Ejercicios_Grupo",
            "resultado_casos_prueba",
        );
    },
};
