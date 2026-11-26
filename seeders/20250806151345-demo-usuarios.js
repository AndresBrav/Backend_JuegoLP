"use strict";
const argon2 = require("argon2");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "Usuarios",
            await Promise.all([
                {
                    codigo: "201900006",
                    username: "jurgen",
                    correo: "jurgen@demo.com",
                    password: await argon2.hash("123456", {
                        type: argon2.argon2id,
                    }),
                    idAvatar: 1,
                    rol: "estudiante",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    codigo: "201900002",
                    username: "maria",
                    correo: "maria@demo.com",
                    password: await argon2.hash("abcdef", {
                        type: argon2.argon2id,
                    }),
                    idAvatar: 1,
                    rol: "estudiante",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    codigo: "201900003",
                    username: "juan",
                    correo: "juan@demo.com",
                    password: await argon2.hash("qwerty", {
                        type: argon2.argon2id,
                    }),
                    idAvatar: 1,
                    rol: "estudiante",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]),
            {},
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("Usuarios", null, {});
    },
};
