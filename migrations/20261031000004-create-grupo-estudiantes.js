"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Grupo_Estudiantes", {
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
            estudiante_id: {
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
        });

        await queryInterface.addIndex(
            "Grupo_Estudiantes",
            ["grupo_id", "estudiante_id"],
            { unique: true, name: "uq_grupo_estudiante" },
        );

        await queryInterface.addIndex("Grupo_Estudiantes", ["estudiante_id"], {
            name: "idx_ge_estudiante",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex(
            "Grupo_Estudiantes",
            "idx_ge_estudiante",
        );
        await queryInterface.removeIndex(
            "Grupo_Estudiantes",
            "uq_grupo_estudiante",
        );
        await queryInterface.dropTable("Grupo_Estudiantes");
    },
};
