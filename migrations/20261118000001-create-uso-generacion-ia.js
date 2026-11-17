"use strict";

/** Guarda el uso diario de generación IA por usuario y fecha local. */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Uso_Generacion_IA", {
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
            "Uso_Generacion_IA",
            ["usuario_id", "fecha_local"],
            {
                unique: true,
                name: "uq_uso_generacion_ia_usuario_fecha",
            },
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Uso_Generacion_IA");
    },
};
