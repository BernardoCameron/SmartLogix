import { InventoryAPI } from '../api/inventory.api';

export const InventoryService = {
  getAllItems: async () => {
    return InventoryAPI.getItems();
  },
  // para la vista de catalogo del usuario
  getCatalog: async () => {
    return InventoryAPI.getCatalog();
  },
  getItemBySku: async (sku: string) => {
    return InventoryAPI.getItemBySku(sku);
  },
  createItem: async (data: any) => {
    return InventoryAPI.createItem(data);
  },
  updateStatus: async (sku: string, active: boolean) => {
    return InventoryAPI.updateStatus(sku, active);
  },
  addRating: async (sku: string, value: number) => {
    return InventoryAPI.addRating(sku, value);
  },
};
