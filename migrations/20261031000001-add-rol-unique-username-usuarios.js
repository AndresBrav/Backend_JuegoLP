"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Usuarios", "rol", {
            type: Sequelize.ENUM("estudiante", "profesor", "admin"),
            allowNull: false,
            defaultValue: "estudiante",
        });

        await queryInterface.addIndex("Usuarios", ["username"], {
            unique: true,
            name: "uq_usuarios_username",
        });

        await queryInterface.addIndex("Usuarios", ["rol"], {
            name: "idx_usuarios_rol",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex("Usuarios", "idx_usuarios_rol");
        await queryInterface.removeIndex("Usuarios", "uq_usuarios_username");
        await queryInterface.removeColumn("Usuarios", "rol");
    },
};
