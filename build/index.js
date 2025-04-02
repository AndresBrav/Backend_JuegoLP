"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apiServer_1 = __importDefault(require("./Config/apiServer"));
const apiServer = new apiServer_1.default(); //llamamos al servidor 
apiServer.escuchar(); //ejecutamos su metodo que escucha al puerto
