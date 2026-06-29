import axiosClient from "./axiosClient";

export const gameApi = {
  spinWheel: (): Promise<any> => {
    return axiosClient.post("/games/spin") as Promise<any>;
  },
};
