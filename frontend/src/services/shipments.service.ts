import { ShipmentsAPI } from '../api/shipments.api';

export const ShipmentsService = {
  getAllShipments: async () => {
    return ShipmentsAPI.getAll();
  }
};
