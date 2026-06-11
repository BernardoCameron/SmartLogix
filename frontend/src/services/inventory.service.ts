import { InventoryAPI } from '../api/inventory.api';

export const InventoryService = {
  getAllItems: async () => {
    return InventoryAPI.getItems();
  }
};
