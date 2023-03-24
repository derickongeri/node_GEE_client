import { BaseDatabase } from 'adminjs';
import { MikroORM } from '@mikro-orm/core';
import { Resource } from './Resource';
export declare class Database extends BaseDatabase {
    readonly orm: MikroORM;
    constructor(orm: MikroORM);
    resources(): Array<Resource>;
    static isAdapterFor(orm: MikroORM): boolean;
}
