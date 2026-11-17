"use strict";

/** Agrega el rol 'profesor' al ENUM de Usuarios.rol. */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(
            "ALTER TABLE `Usuarios` MODIFY COLUMN `rol` ENUM('estudiante', 'profesor', 'admin') NOT NULL DEFAULT 'estudiante';",
        );
    },

    async down(queryInterface, Sequelize) {
        // Los profesores existentes vuelven a estudiante para no violar
        // el ENUM reducido.
        await queryInterface.sequelize.query(
            "UPDATE `Usuarios` SET `rol` = 'estudiante' WHERE `rol` = 'profesor';",
        );
        await queryInterface.sequelize.query(
            "ALTER TABLE `Usuarios` MODIFY COLUMN `rol` ENUM('estudiante', 'admin') NOT NULL DEFAULT 'estudiante';",
        );
    },
};
