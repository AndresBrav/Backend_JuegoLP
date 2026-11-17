"use strict";

/**
 * Entrega del estudiante para UN ejercicio de grupo.
 *
 * BLINDAJE del bug histórico ("entrego uno y se marca otro"): el índice
 * único (ejercicio_grupo_id, usuario_id) garantiza UNA fila por par
 * (ejercicio, estudiante). Toda lectura/escritura de la capa de
 * servicios DEBE filtrar por ese par completo, nunca solo por usuario.
 *
 * - estado_tablero: solución del estudiante (JSON del tablero).
 * - completado: el estudiante lo entregó (puntos solo la 1ª vez).
 * - calificado / puntos_profesor / comentario_profesor: revisión del
 *   profesor.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Usuario_Ejercicios_Grupo", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            ejercicio_grupo_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "Ejercicios_Grupo",
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
            estado_tablero: {
                type: Sequelize.TEXT("long"),
                allowNull: true,
            },
            completado: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            // Puntos de la primera entrega (definidos por el ejercicio).
            puntos: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            // Revisión del profesor.
            calificado: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            puntos_profesor: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            comentario_profesor: {
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

        // CRÍTICO: una única entrega por (ejercicio, estudiante).
        await queryInterface.addIndex(
            "Usuario_Ejercicios_Grupo",
            ["ejercicio_grupo_id", "usuario_id"],
            {
                unique: true,
                name: "uq_entrega_ejercicio_usuario",
            }
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Usuario_Ejercicios_Grupo");
    },
};
