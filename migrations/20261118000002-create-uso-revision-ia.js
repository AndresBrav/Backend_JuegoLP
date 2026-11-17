"use strict";

/** Guarda el uso diario de revisiones IA por usuario y ejercicio. */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Uso_Revision_IA", {
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
            juego_ia_id: {
                allowNull: false,
                type: Sequelize.INTEGER,
                references: {
                    model: "juegosia",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            fecha_local: {
                allowNull: false,
                type: Sequelize.DATEONLY,
            },
            cantidad: {
                allowNull: false,
                defaultValue: 0,
                type: Sequelize.INTEGER,
            },
        });

        await queryInterface.addIndex(
            "Uso_Revision_IA",
            ["usuario_id", "juego_ia_id", "fecha_local"],
            {
                unique: true,
                name: "uq_uso_revision_ia_usuario_juego_fecha",
            },
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Uso_Revision_IA");
    },
};
