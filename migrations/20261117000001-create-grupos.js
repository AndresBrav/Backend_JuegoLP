"use strict";

/** Crea la tabla de grupos (cada grupo pertenece a un profesor). */
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
                type: Sequelize.STRING(80),
            },
            // Código de 6 caracteres para que el estudiante se una.
            codigo: {
                allowNull: false,
                type: Sequelize.STRING(6),
            },
            profesor_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "Usuarios",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
                allowNull: false,
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

        // El código es único: es la llave de unión del estudiante.
        await queryInterface.addIndex("Grupos", ["codigo"], {
            unique: true,
            name: "uq_grupos_codigo",
        });
        // Índice para listar los grupos de un profesor.
        await queryInterface.addIndex("Grupos", ["profesor_id"], {
            name: "idx_grupos_profesor",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Grupos");
    },
};
