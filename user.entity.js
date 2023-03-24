"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const uuid_1 = require("uuid");
const core_1 = require("@mikro-orm/core");
let User = class User extends core_1.BaseEntity {
    constructor() {
        super(...arguments);
        this.id = (0, uuid_1.v4)();
    }
};
__decorate([
    (0, core_1.PrimaryKey)({ type: "uuid" })
], User.prototype, "id", void 0);
__decorate([
    (0, core_1.Property)({ fieldName: "first_name", type: "text" })
], User.prototype, "firstName", void 0);
__decorate([
    (0, core_1.Property)({ fieldName: "last_name", type: "text" })
], User.prototype, "lastName", void 0);
__decorate([
    (0, core_1.Property)({ fieldName: "email", type: "text" })
], User.prototype, "email", void 0);
User = __decorate([
    (0, core_1.Entity)({ tableName: "users" })
], User);
exports.User = User;
