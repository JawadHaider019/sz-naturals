import express from "express";
import { getSettings, updateSettings ,changeEmail,changePassword} from "../controllers/settingController.js";

const settingRoutes = express.Router();

settingRoutes.get("/", getSettings);
settingRoutes.put("/", updateSettings);

settingRoutes.put("/change-email", changeEmail);

settingRoutes.put("/change-password", changePassword);



export default settingRoutes;
