"use strict";

/**
 * Tabla many-to-many entre Grupos y Usuarios (inscripción).
 * Índice único (grupo_id, usuario_id): un estudiante no puede estar
 * inscrito dos veces en el mismo grupo.
 */
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
                type: Sequelize.INTEGER,
                references: {
                    model: "Grupos",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
                allowNull: false,
            },
            usuario_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "Usuarios",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
                allowNull: false,
            },
            // Fecha en que el estudiante se unió al grupo (YYYY-MM-DD).
            fecha_union: {
                allowNull: false,
                type: Sequelize.DATEONLY,
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
            "Grupo_Estudiantes",
            ["grupo_id", "usuario_id"],
            {
                unique: true,
                name: "uq_grupo_estudiante",
            }
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Grupo_Estudiantes");
    },
};
