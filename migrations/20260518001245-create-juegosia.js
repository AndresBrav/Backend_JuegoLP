"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("juegosia", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            descripcion: {
                type: Sequelize.STRING(2000),
            },
            tipo_juego: {
                type: Sequelize.STRING(255),
            },
            usuario_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "Usuarios", // Nombre de la tabla de usuarios
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL", // o 'CASCADE' según tu lógica de negocio
            },
            completado: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            puntos: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("juegosia");
    },
};
