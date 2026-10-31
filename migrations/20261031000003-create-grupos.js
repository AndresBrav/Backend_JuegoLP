"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Grupos", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            nombre: {
                allowNull: false,
                type: Sequelize.STRING(100),
            },
            codigo: {
                allowNull: false,
                unique: true,
                type: Sequelize.STRING(8),
            },
            profesor_id: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: "Usuarios",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
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

        await queryInterface.addIndex("Grupos", ["profesor_id"], {
            name: "idx_grupos_profesor",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex("Grupos", "idx_grupos_profesor");
        await queryInterface.dropTable("Grupos");
    },
};
