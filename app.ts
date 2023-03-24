import * as dotenv from "dotenv";
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import express from "express";
import cors from "cors";

import { MikroORM, Options } from "@mikro-orm/core";
import * as AdminJSMikroORM from "@adminjs/mikroorm";
import { User } from "./user.entity";

import {getGeeRaster, getEEstats} from "./modules/gee_scripts/burnedarea"

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

dotenv.config();

AdminJS.registerAdapter({
  Resource: AdminJSMikroORM.Resource,
  Database: AdminJSMikroORM.Database,
});

// Note: `config` is your MikroORM configuration as described in it's docs
const config: Options = {
  entities: [User],
  dbName: "mikroorm",
  type: "postgresql",
  clientUrl: process.env.DATABASE_URL,
};

const PORT = 5000;

const start = async () => {
  const app = express();
  app.use(cors())

  const orm = await MikroORM.init(config);
  const adminOptions = {
    // We pass Owner to `resources`
    resources: [
      {
        resource: { model: User, orm },
        options: {},
      },
    ],
  };

  const admin = new AdminJS(adminOptions);

  const adminRouter = AdminJSExpress.buildRouter(admin);
  app.use(admin.options.rootPath, adminRouter);

  app.get("/api/mapid", [jsonParser, getGeeRaster]);
  app.post("/api/mapid", [jsonParser, getGeeRaster]);

  app.listen(PORT, () => {
    console.log(
      `AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`
    );
  });
};

start();
