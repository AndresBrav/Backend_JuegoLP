"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Usuario_Juegos", "fecha_completado", {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn("Usuario_Juegos", "ultima_actividad", {
            type: Sequelize.DATE,
            allowNull: true,
        });

        await queryInterface.addColumn("Usuario_Juegos", "intentos", {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        });

        await queryInterface.addIndex(
            "Usuario_Juegos",
            ["usuario_id", "fecha_completado"],
            { name: "idx_uj_usuario_fecha" },
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex(
            "Usuario_Juegos",
            "idx_uj_usuario_fecha",
        );
        await queryInterface.removeColumn("Usuario_Juegos", "intentos");
        await queryInterface.removeColumn("Usuario_Juegos", "ultima_actividad");
        await queryInterface.removeColumn("Usuario_Juegos", "fecha_completado");
    },
};
