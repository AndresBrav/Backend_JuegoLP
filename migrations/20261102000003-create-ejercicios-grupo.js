"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Tabla de ejercicios creados por el profesor dentro de un grupo
        await queryInterface.createTable("Ejercicios_Grupo", {
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
            titulo: {
                allowNull: false,
                type: Sequelize.STRING(150),
            },
            enunciado: {
                allowNull: false,
                type: Sequelize.TEXT,
            },
            tipo: {
                allowNull: false,
                type: Sequelize.STRING(20),
                defaultValue: "diagrama",
            },
            puntos: {
                allowNull: false,
                type: Sequelize.INTEGER,
                defaultValue: 10,
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
            name: "idx_eg_grupo",
        });

        // Estado de cada estudiante sobre un ejercicio del grupo
        // (incluye su solución: nodos del diagrama o código del pseudocódigo)
        await queryInterface.createTable("Usuario_Ejercicios_Grupo", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            usuario_id: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: "Usuarios",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            ejercicio_grupo_id: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: "Ejercicios_Grupo",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
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

        await queryInterface.addIndex(
            "Usuario_Ejercicios_Grupo",
            ["ejercicio_grupo_id", "usuario_id"],
            { unique: true, name: "uq_usuario_ejercicio_grupo" },
        );

        await queryInterface.addIndex(
            "Usuario_Ejercicios_Grupo",
            ["usuario_id"],
            { name: "idx_ueg_usuario" },
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex(
            "Usuario_Ejercicios_Grupo",
            "idx_ueg_usuario",
        );
        await queryInterface.removeIndex(
            "Usuario_Ejercicios_Grupo",
            "uq_usuario_ejercicio_grupo",
        );
        await queryInterface.dropTable("Usuario_Ejercicios_Grupo");

        await queryInterface.removeIndex("Ejercicios_Grupo", "idx_eg_grupo");
        await queryInterface.dropTable("Ejercicios_Grupo");
    },
};
