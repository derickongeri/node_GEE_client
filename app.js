"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const adminjs_1 = __importDefault(require("adminjs"));
const express_1 = __importDefault(require("@adminjs/express"));
const express_2 = __importDefault(require("express"));
const core_1 = require("@mikro-orm/core");
const AdminJSMikroORM = __importStar(require("@adminjs/mikroorm"));
const user_entity_1 = require("./user.entity");
adminjs_1.default.registerAdapter({
    Resource: AdminJSMikroORM.Resource,
    Database: AdminJSMikroORM.Database,
});
// Note: `config` is your MikroORM configuration as described in it's docs
const config = {
    entities: [user_entity_1.User],
    dbName: "mikroorm",
    type: "postgresql",
    clientUrl: process.env.DATABASE_URL,
};
const PORT = 5000;
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_2.default)();
    const orm = yield core_1.MikroORM.init(config);
    const adminOptions = {
        // We pass Owner to `resources`
        resources: [
            {
                resource: { model: user_entity_1.User, orm },
                options: {},
            },
        ],
    };
    const admin = new adminjs_1.default(adminOptions);
    const adminRouter = express_1.default.buildRouter(admin);
    app.use(admin.options.rootPath, adminRouter);
    app.listen(PORT, () => {
        console.log(`AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`);
    });
});
start();
