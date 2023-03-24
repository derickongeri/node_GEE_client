"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Property = void 0;
const adminjs_1 = require("adminjs");
const data_types_1 = require("./utils/data-types");
class Property extends adminjs_1.BaseProperty {
    constructor(column, columnPosition = 0) {
        const path = column.name;
        super({ path });
        this.column = column;
        this.columnPosition = columnPosition;
    }
    getColumnMetadata() {
        return this.column;
    }
    isEditable() {
        return !this.isId() && this.column.name !== 'createdAt' && this.column.name !== 'updatedAt';
    }
    isId() {
        return !!this.column.primary;
    }
    isRequired() {
        if (this.column.nullable === false)
            return true;
        return false;
    }
    isSortable() {
        return this.type() !== 'reference';
    }
    reference() {
        var _a, _b;
        const isRef = ['1:1', 'm:1'].includes(this.column.reference);
        if (isRef) {
            return (_b = (_a = this.column.targetMeta) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : this.column.type;
        }
        return null;
    }
    availableValues() {
        var _a, _b;
        const isEnum = !!this.column.enum && !!this.column.items;
        if (isEnum)
            return (_b = (_a = this.column.items) === null || _a === void 0 ? void 0 : _a.map((i) => String(i))) !== null && _b !== void 0 ? _b : [];
        return null;
    }
    position() {
        return this.columnPosition || 0;
    }
    isEnum() {
        return this.column.type === 'enum';
    }
    type() {
        let type = data_types_1.DATA_TYPES[this.column.columnTypes[0]]
            || data_types_1.DATA_TYPES[this.column.type];
        if (this.reference()) {
            type = 'reference';
        }
        // eslint-disable-next-line no-console
        if (!type) {
            console.warn(`Unhandled type: ${this.column.type}`);
        }
        return type;
    }
}
exports.Property = Property;
//# sourceMappingURL=Property.js.map