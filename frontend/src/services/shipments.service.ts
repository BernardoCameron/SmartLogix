import { ShipmentsAPI } from '../api/shipments.api';

export const ShipmentsService = {
  getAllShipments: async () => {
    return ShipmentsAPI.getAll();
  },
  getByTrackingCode: async (trackingCode: string) => {
    return ShipmentsAPI.getByTrackingCode(trackingCode);
  },
  updateStatus: async (trackingCode: string, status: string) => {
    return ShipmentsAPI.updateStatus(trackingCode, status);
  },
};
