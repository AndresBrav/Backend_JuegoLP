"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "Usuarios",
            [
                {
                    codigo: "201900006",
                    username: "jurgen",
                    edad: 25,
                    password: "123456",
                    idAvatar: 1,
                    rol: "estudiante",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    codigo: "201900002",
                    username: "maria",
                    edad: 30,
                    password: "abcdef",
                    idAvatar: 1,
                    rol: "estudiante",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    codigo: "201900003",
                    username: "juan",
                    edad: 28,
                    password: "qwerty",
                    idAvatar: 1,
                    rol: "estudiante",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            {},
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete("Usuarios", null, {});
    },
};
