import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { loginToIOL } from "../helpers/iolHelper.js";
import moment from "moment";

const iolInstance = axios.create();

const db = new PrismaClient();

iolInstance.interceptors.request.use(async (config) => {
  try {
    let access_token, expires_at;
    const currentToken = await db.iol_token.findUnique({
      where: {
        token_id: 1,
      },
    });

    if (!currentToken?.access_token || !currentToken?.expires_at) {
      const data = await loginToIOL();
      access_token = data.access_token;
      expires_at = data.expires_at;
    } else {
      access_token = currentToken.access_token;
      expires_at = currentToken.expires_at;
    }

    if (moment().isAfter(moment(expires_at)))
      access_token = (await loginToIOL()).access_token;

    config.headers.Authorization = `Bearer ${access_token}`;
    return config;
  } catch (error) {
    return config;
  }
});

iolInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response.status === 401) {
      await db.iol_token.delete({
        where: {
          token_id: 1,
        },
      });
      return loginToIOL().then((newToken) => {
        iolInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newToken.access_token}`;
        return iolInstance.request(error.config);
      });
    }
    return Promise.reject(error);
  }
);

export default iolInstance;
