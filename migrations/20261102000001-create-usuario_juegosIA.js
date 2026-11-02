"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Usuario_JuegosIA", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            usuario_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "Usuarios",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
                allowNull: true,
            },
            juego_ia_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "juegosia",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
                allowNull: true,
            },
            completado: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            puntos: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            estado_tablero: {
                type: Sequelize.TEXT("long"),
                allowNull: true,
            },
            fecha_completado: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            ultima_actividad: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("Usuario_JuegosIA");
    },
};
