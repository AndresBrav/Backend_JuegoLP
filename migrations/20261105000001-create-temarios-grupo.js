"use strict";

/** Crea la tabla de temarios (unidades temáticas) de cada grupo. */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Temarios_Grupo", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            grupo_id: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: "Grupos",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            nombre: {
                allowNull: false,
                type: Sequelize.STRING(80),
            },
            descripcion: {
                allowNull: true,
                type: Sequelize.TEXT,
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

        await queryInterface.addIndex(
            "Temarios_Grupo",
            ["grupo_id", "nombre"],
            { unique: true, name: "uq_temario_grupo_nombre" },
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Temarios_Grupo");
    },
};
