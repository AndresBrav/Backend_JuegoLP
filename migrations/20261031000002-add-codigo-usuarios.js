"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Usuarios", "codigo", {
            type: Sequelize.STRING(20),
            allowNull: true,
        });

        // Código provisional para los usuarios que ya existían.
        await queryInterface.sequelize.query(
            "UPDATE Usuarios SET codigo = CONCAT('LEG', LPAD(id, 6, '0')) WHERE codigo IS NULL",
        );

        await queryInterface.changeColumn("Usuarios", "codigo", {
            type: Sequelize.STRING(20),
            allowNull: false,
        });

        await queryInterface.addIndex("Usuarios", ["codigo"], {
            unique: true,
            name: "uq_usuarios_codigo",
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex("Usuarios", "uq_usuarios_codigo");
        await queryInterface.removeColumn("Usuarios", "codigo");
    },
};
