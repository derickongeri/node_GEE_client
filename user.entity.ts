import { v4 } from "uuid";
import { BaseEntity, Entity, PrimaryKey, Property } from "@mikro-orm/core";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
}

@Entity({ tableName: "users" })
export class User extends BaseEntity<User, "id"> implements IUser {
  @PrimaryKey({ type: "uuid" })
  id = v4();

  @Property({ fieldName: "first_name", type: "text" })
  firstName!: string;

  @Property({ fieldName: "last_name", type: "text" })
  lastName!: string;

  @Property({ fieldName: "email", type: "text" })
  email!: string;
}
