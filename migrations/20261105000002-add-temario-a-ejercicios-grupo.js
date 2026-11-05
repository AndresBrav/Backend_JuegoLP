"use strict";

/**
 * Agrega temario_id (obligatorio) a Ejercicios_Grupo.
 * Los ejercicios que ya existían se agrupan en un temario inicial
 * llamado "General" por grupo. Si un temario tiene ejercicios, el
 * backend impide borrarlo (primero hay que vaciarlo/moverlos).
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Columna nullable para poder rellenarla
        await queryInterface.addColumn("Ejercicios_Grupo", "temario_id", {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: {
                model: "Temarios_Grupo",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        });

        // 2. Temario inicial "General" en cada grupo que tenga ejercicios
        await queryInterface.sequelize.query(`
            INSERT INTO Temarios_Grupo (grupo_id, nombre, descripcion, orden, createdAt, updatedAt)
            SELECT DISTINCT e.grupo_id, 'General', 'Temario inicial del grupo', 0, NOW(), NOW()
            FROM Ejercicios_Grupo e
            WHERE NOT EXISTS (
                SELECT 1 FROM Temarios_Grupo t
                WHERE t.grupo_id = e.grupo_id AND t.nombre = 'General'
            );
        `);

        // 3. Asignar los ejercicios existentes al temario General de su grupo
        await queryInterface.sequelize.query(`
            UPDATE Ejercicios_Grupo e
            JOIN Temarios_Grupo t ON t.grupo_id = e.grupo_id AND t.nombre = 'General'
            SET e.temario_id = t.id
            WHERE e.temario_id IS NULL;
        `);

        // 4. Hacer la columna obligatoria, conservando la FK
        await queryInterface.changeColumn("Ejercicios_Grupo", "temario_id", {
            allowNull: false,
            type: Sequelize.INTEGER,
            references: {
                model: "Temarios_Grupo",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        });

        await queryInterface.addIndex("Ejercicios_Grupo", ["temario_id"], {
            name: "idx_ejercicios_grupo_temario",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("Ejercicios_Grupo", "temario_id");

        // Elimina los temarios "General" que esta migración creó
        await queryInterface.sequelize.query(`
            DELETE FROM Temarios_Grupo WHERE nombre = 'General';
        `);
    },
};
