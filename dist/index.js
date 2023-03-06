"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
// Configuration
dotenv_1.default.config();
const PORT = process.env.PORT || 80;
const morganOutput = process.env.NODE_ENV === "dev" ? "dev" : "combined";
app.use((0, morgan_1.default)(morganOutput));
// Routers
const users_1 = __importDefault(require("./routers/users"));
app.use(users_1.default);
app.listen(PORT, () => {
    console.log(`NDB2 application listneing on port: `, PORT);
});
//# sourceMappingURL=index.js.map