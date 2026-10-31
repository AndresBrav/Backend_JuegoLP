"use strict";

const { QueryTypes } = require("sequelize");
require("dotenv").config();

/**
 * Crea la cuenta de administrador inicial a partir de las variables
 * ADMIN_USER, ADMIN_PASSWORD y ADMIN_CODIGO del .env.
 * Si faltan las credenciales, no hace nada.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const username = process.env.ADMIN_USER;
        const password = process.env.ADMIN_PASSWORD;
        const codigo = process.env.ADMIN_CODIGO || "000000000";

        if (!username || !password) {
            console.log(
                "Seeder admin omitido: define ADMIN_USER y ADMIN_PASSWORD en el .env",
            );
            return;
        }

        const existentes = await queryInterface.sequelize.query(
            "SELECT id FROM Usuarios WHERE username = :username OR codigo = :codigo LIMIT 1",
            {
                replacements: { username, codigo },
                type: QueryTypes.SELECT,
            },
        );

        if (existentes.length > 0) {
            console.log("Seeder admin omitido: la cuenta ya existe");
            return;
        }

        await queryInterface.bulkInsert("Usuarios", [
            {
                codigo,
                username,
                edad: 0,
                password,
                idAvatar: 1,
                rol: "admin",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        console.log(`Cuenta admin creada: ${username}`);
    },

    async down(queryInterface, Sequelize) {
        const username = process.env.ADMIN_USER;

        if (!username) {
            return;
        }

        await queryInterface.bulkDelete("Usuarios", {
            username,
            rol: "admin",
        });
    },
};
