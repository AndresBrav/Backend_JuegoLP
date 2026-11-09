"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            "Usuario_Ejercicios_Grupo",
            "calificado",
            {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        );

        await queryInterface.sequelize.query(`
            UPDATE Usuario_Ejercicios_Grupo
            SET calificado = true
            WHERE puntos > 0;
        `);
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(
            "Usuario_Ejercicios_Grupo",
            "calificado",
        );
    },
};
