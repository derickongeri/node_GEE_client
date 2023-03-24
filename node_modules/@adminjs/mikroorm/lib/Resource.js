"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Resource = void 0;
/* eslint-disable no-param-reassign */
const adminjs_1 = require("adminjs");
const core_1 = require("@mikro-orm/core");
const Property_1 = require("./Property");
const convert_filter_1 = require("./utils/convert-filter");
class Resource extends adminjs_1.BaseResource {
    constructor(args) {
        super(args);
        const { model, orm } = args;
        this.orm = orm;
        this.model = model;
        this.metadata = this.orm.getMetadata().find(model.name);
        this.propertiesObject = this.prepareProperties();
    }
    databaseName() {
        const { database, } = this.orm.config.getDriver().getConnection().getConnectionOptions();
        return database || 'mikroorm';
    }
    databaseType() {
        return this.orm.config.getAll().type || this.databaseName();
    }
    name() {
        var _a, _b, _c, _d;
        return (_d = (_b = (_a = this.metadata) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = this.metadata) === null || _c === void 0 ? void 0 : _c.className) !== null && _d !== void 0 ? _d : '';
    }
    id() {
        return this.name();
    }
    properties() {
        return [...Object.values(this.propertiesObject)];
    }
    property(path) {
        return this.propertiesObject[path];
    }
    build(params) {
        return new adminjs_1.BaseRecord(adminjs_1.flat.unflatten(params), this);
    }
    async count(filter) {
        return this.orm.em.fork().getRepository(this.model).count(convert_filter_1.convertFilter(filter));
    }
    async find(filter, params = {}) {
        const { limit = 10, offset = 0, sort = {} } = params;
        const { direction, sortBy } = sort;
        const results = await this.orm.em
            .fork()
            .getRepository(this.model)
            .find(convert_filter_1.convertFilter(filter), {
            orderBy: {
                [sortBy]: direction,
            },
            limit,
            offset,
        });
        return results.map((result) => new adminjs_1.BaseRecord(core_1.wrap(result).toJSON(), this));
    }
    async findOne(id) {
        const result = await this.orm.em
            .fork()
            .getRepository(this.model)
            .findOne(id); // mikroorm has incorrect types for `findOne`
        if (!result)
            return null;
        return new adminjs_1.BaseRecord(core_1.wrap(result).toJSON(), this);
    }
    async findMany(ids) {
        var _a;
        const pk = (_a = this.metadata) === null || _a === void 0 ? void 0 : _a.primaryKeys[0];
        if (!pk)
            return [];
        const results = await this.orm.em
            .fork()
            .getRepository(this.model)
            .find({ [pk]: { $in: ids } });
        return results.map((result) => new adminjs_1.BaseRecord(core_1.wrap(result).toJSON(), this));
    }
    async create(params) {
        const em = this.orm.em.fork();
        const instance = em
            .getRepository(this.model)
            .create(adminjs_1.flat.unflatten(params));
        await this.validateAndSave(instance, em);
        const returnedParams = adminjs_1.flat.flatten(core_1.wrap(instance).toJSON());
        return returnedParams;
    }
    async update(pk, params = {}) {
        const em = this.orm.em.fork();
        const instance = await em
            .getRepository(this.model)
            .findOne(pk); // mikroorm has incorrect types for findOneOrFail
        if (!instance)
            throw new Error('Record to update not found');
        const updatedInstance = core_1.wrap(instance).assign(adminjs_1.flat.unflatten(params));
        await this.validateAndSave(updatedInstance, em);
        const returnedParams = adminjs_1.flat.flatten(core_1.wrap(updatedInstance).toJSON());
        return returnedParams;
    }
    async delete(id) {
        await this.orm.em
            .fork()
            .getRepository(this.model)
            .nativeDelete(id); // mikroorm has incorrect types for nativeDelete
    }
    static isAdapterFor(args) {
        var _a, _b, _c;
        const { model, orm } = args !== null && args !== void 0 ? args : {};
        return !!(model === null || model === void 0 ? void 0 : model.name) && !!((_c = (_a = orm === null || orm === void 0 ? void 0 : orm.getMetadata) === null || _a === void 0 ? void 0 : (_b = _a.call(orm)).find) === null || _c === void 0 ? void 0 : _c.call(_b, model.name));
    }
    async validateAndSave(instance, em) {
        if (Resource.validate) {
            const errors = await Resource.validate(instance);
            if (errors && errors.length) {
                const validationErrors = errors.reduce((memo, error) => (Object.assign(Object.assign({}, memo), { [error.property]: {
                        type: Object.keys(error.constraints)[0],
                        message: Object.values(error.constraints)[0],
                    } })), {});
                throw new adminjs_1.ValidationError(validationErrors);
            }
        }
        try {
            await em.persistAndFlush(instance);
        }
        catch (error) {
            // TODO: figure out how to get column name from MikroORM's error metadata
            // It currently seems to return only whole Entity
            console.log(error);
            if (error.name === 'QueryFailedError' || error.name === 'ValidationError') {
                throw new adminjs_1.ValidationError({
                    [error.column]: {
                        type: 'QueryFailedError',
                        message: error.message,
                    },
                });
            }
        }
    }
    prepareProperties() {
        var _a;
        const { hydrateProps = [] } = (_a = this.metadata) !== null && _a !== void 0 ? _a : {};
        return hydrateProps.reduce((memo, prop, index) => {
            if (!['scalar', 'm:1', '1:1', 'm:n'].includes(prop.reference))
                return memo;
            const property = new Property_1.Property(prop, index);
            memo[property.path()] = property;
            return memo;
        }, {});
    }
}
exports.Resource = Resource;
//# sourceMappingURL=Resource.js.map