"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Migrar datos existentes de juegosia hacia Usuario_JuegosIA si existen registros
        try {
            await queryInterface.sequelize.query(`
                INSERT INTO Usuario_JuegosIA (
                    usuario_id,
                    juego_ia_id,
                    completado,
                    puntos,
                    estado_tablero,
                    fecha_completado,
                    ultima_actividad
                )
                SELECT 
                    usuario_id,
                    id,
                    COALESCE(completado, false),
                    COALESCE(puntos, 0),
                    estado_tablero,
                    CASE WHEN completado = true OR completado = 1 THEN updatedAt ELSE NULL END,
                    updatedAt
                FROM juegosia
                WHERE usuario_id IS NOT NULL;
            `);
        } catch (error) {
            console.warn(
                "Aviso al migrar datos de juegosia a Usuario_JuegosIA:",
                error.message
            );
        }

        // Eliminar columnas de progreso de juegosia
        await queryInterface.removeColumn("juegosia", "completado");
        await queryInterface.removeColumn("juegosia", "puntos");
        await queryInterface.removeColumn("juegosia", "estado_tablero");
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn("juegosia", "completado", {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn("juegosia", "puntos", {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        });
        await queryInterface.addColumn("juegosia", "estado_tablero", {
            type: Sequelize.TEXT("long"),
            allowNull: true,
        });

        // Restaurar datos desde Usuario_JuegosIA hacia juegosia si aplica
        try {
            await queryInterface.sequelize.query(`
                UPDATE juegosia j
                JOIN Usuario_JuegosIA uj ON uj.juego_ia_id = j.id AND uj.usuario_id = j.usuario_id
                SET 
                    j.completado = uj.completado,
                    j.puntos = uj.puntos,
                    j.estado_tablero = uj.estado_tablero;
            `);
        } catch (error) {
            console.warn(
                "Aviso al restaurar datos en down de juegosia:",
                error.message
            );
        }
    },
};
