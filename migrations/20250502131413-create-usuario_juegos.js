"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Usuario_Juegos", {
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
            juego_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "Juegos",
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
        });
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await queryInterface.dropTable("Usuario_Juegos");
    },
};
