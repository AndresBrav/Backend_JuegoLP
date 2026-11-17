"use strict";

/**
 * Ejercicios de grupo creados por el profesor (diagrama o pseudocódigo).
 * fecha_limite: hasta cuándo puede resolverse (DATEONLY, NULL = sin
 * límite). El estudiante puede VER el ejercicio vencido pero NO guardar
 * ni completar (validación en ejerciciosGrupoServices).
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Ejercicios_Grupo", {
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
            temario_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "Temarios_Grupo",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
                allowNull: false,
            },
            titulo: {
                allowNull: false,
                type: Sequelize.STRING(120),
            },
            // Enunciado escrito por el profesor.
            enunciado: {
                allowNull: false,
                type: Sequelize.TEXT("long"),
            },
            // Tipo de tablero con el que se resuelve.
            tipo: {
                allowNull: false,
                type: Sequelize.ENUM("diagrama", "pseudocodigo"),
            },
            // Puntos que gana el estudiante al completarlo la 1ª vez.
            puntos: {
                allowNull: false,
                defaultValue: 5,
                type: Sequelize.INTEGER,
            },
            fecha_limite: {
                allowNull: true,
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

        await queryInterface.addIndex("Ejercicios_Grupo", ["grupo_id"], {
            name: "idx_ejercicio_grupo_grupo",
        });
        await queryInterface.addIndex("Ejercicios_Grupo", ["temario_id"], {
            name: "idx_ejercicio_grupo_temario",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Ejercicios_Grupo");
    },
};
