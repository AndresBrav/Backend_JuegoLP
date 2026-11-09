"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            "Usuario_Ejercicios_Grupo",
            "comentario_profesor",
            {
                type: Sequelize.TEXT("long"),
                allowNull: true,
            },
        );
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(
            "Usuario_Ejercicios_Grupo",
            "comentario_profesor",
        );
    },
};
