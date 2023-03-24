"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const adminjs_1 = require("adminjs");
const Resource_1 = require("./Resource");
class Database extends adminjs_1.BaseDatabase {
    constructor(orm) {
        super(orm);
        this.orm = orm;
        this.orm = orm;
    }
    resources() {
        const metadata = this.orm.getMetadata();
        if (!metadata)
            return [];
        metadata.decorate(this.orm.em);
        return Object.values(metadata.getAll()).reduce((memo, meta) => {
            const resource = new Resource_1.Resource({
                model: meta.class,
                orm: this.orm,
            });
            memo.push(resource);
            return memo;
        }, []);
    }
    static isAdapterFor(orm) {
        var _a, _b;
        return !!((_a = orm.isConnected) === null || _a === void 0 ? void 0 : _a.call(orm)) && !!((_b = orm.getMetadata) === null || _b === void 0 ? void 0 : _b.call(orm));
    }
}
exports.Database = Database;
//# sourceMappingURL=Database.js.map