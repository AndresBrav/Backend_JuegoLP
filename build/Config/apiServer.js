"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const usuariosRoutes_1 = __importDefault(require("../Routes/usuariosRoutes"));
class ApiServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.usuariosPath = "/usuarios";
        this.middlewares(); // Llama a la función middleware
        this.routes(); // Registra las rutas
    }
    middlewares() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        // this.app.use(express.static('public'));
    }
    routes() {
        this.app.use(this.usuariosPath, usuariosRoutes_1.default);
    }
    listen() {
        this.app.listen(3000, () => {
            console.log('API REST iniciada en el puerto 3000');
        });
    }
}
exports.default = ApiServer;
