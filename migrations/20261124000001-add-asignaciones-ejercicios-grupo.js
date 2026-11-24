"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Ejercicios_Grupo", "asignacion", {
            type: Sequelize.ENUM("todos", "seleccionados"),
            allowNull: false,
            defaultValue: "todos",
        });

        await queryInterface.createTable("Ejercicio_Grupo_Estudiantes", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            ejercicio_grupo_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Ejercicios_Grupo",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            usuario_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Usuarios",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
        });

        await queryInterface.addIndex(
            "Ejercicio_Grupo_Estudiantes",
            ["ejercicio_grupo_id", "usuario_id"],
            {
                unique: true,
                name: "uq_ejercicio_grupo_estudiante",
            },
        );
        await queryInterface.addIndex(
            "Ejercicio_Grupo_Estudiantes",
            ["usuario_id", "ejercicio_grupo_id"],
            { name: "idx_ejercicio_estudiante_usuario" },
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Ejercicio_Grupo_Estudiantes");
        await queryInterface.removeColumn("Ejercicios_Grupo", "asignacion");
    },
};
