"use strict";

/** Crea la tabla de temarios globales para los ejercicios IA de pseudocódigo. */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Temarios_IA", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            nombre: {
                allowNull: false,
                type: Sequelize.STRING(80),
            },
            orden: {
                allowNull: false,
                defaultValue: 0,
                type: Sequelize.INTEGER,
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

        await queryInterface.addIndex("Temarios_IA", ["nombre"], {
            unique: true,
            name: "uq_temario_ia_nombre",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Temarios_IA");
    },
};
