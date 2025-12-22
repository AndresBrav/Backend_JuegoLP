"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert(
            "Avatares",
            [
                {
                    url: "https://i.imgur.com/TxdbgOq.jpeg",
                },
                {
                    url: "https://i.imgur.com/53Xfosm.png",
                },
                {
                    url: "https://i.imgur.com/nlzFYjZ.png",
                },
                {
                    url: "https://i.imgur.com/AEI3Wpz.png",
                },
                {
                    url: "https://i.imgur.com/SKhtz4D.png",
                },
                {
                    url: "https://i.imgur.com/4tT9t8y.png",
                },
                {
                    url: "https://i.imgur.com/4lfaMNR.png",
                },
                {
                    url: "https://i.imgur.com/pILnkcV.png",
                },
                {
                    url: "https://i.imgur.com/NjKngjG.png",
                },
                {
                    url: "https://i.imgur.com/mtWvbzJ.png",
                },
            ],
            {}
        );
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         */
        await queryInterface.bulkDelete("Avatares", null, {});
    },
};
