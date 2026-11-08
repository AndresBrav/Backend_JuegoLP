"use strict";

/** Añade temario_id a juegosia para clasificar ejercicios IA de pseudocódigo. */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("juegosia", "temario_id", {
            allowNull: true,
            type: Sequelize.INTEGER,
            references: {
                model: "Temarios_IA",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        });

        await queryInterface.addIndex("juegosia", ["temario_id"], {
            name: "ix_juegosia_temario",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("juegosia", "ix_juegosia_temario");
        await queryInterface.removeColumn("juegosia", "temario_id");
    },
};
