// inventoryService.ts
import { CONFIG } from "../CONFIG";
import apiService from "./api";
import { Item } from "../types";

class InventoryService {
  private getUrl() {
    return CONFIG.buildProxyUrl(CONFIG.INVENTORY_ITEMS);
  }

  // ----------------- Helper functions -----------------
  private findFirstArray(obj: any): any[] | null {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === "object") {
      return obj;
    }
    if (typeof obj === "object") {
      for (const k of Object.keys(obj)) {
        try {
          const found = this.findFirstArray(obj[k]);
          if (found) return found;
        } catch (e) {
          // ignore and continue searching
        }
      }
    }
    return null;
  }

  private getNormalizedValue(item: any, candidates: string[]) {
    if (!item || typeof item !== "object") return undefined;

    // direct exact-match candidates
    for (const c of candidates) {
      if (Object.prototype.hasOwnProperty.call(item, c)) return item[c];
    }

    // build normalized map of keys: trimmed lowercase without spaces -> original key
    const normalizedMap: Record<string, string> = {};
    for (const key of Object.keys(item)) {
      const nk = key.toString().trim().toLowerCase().replace(/\s+/g, "");
      normalizedMap[nk] = key;
    }

    // try normalized candidates
    for (const c of candidates) {
      const nk = c.toString().trim().toLowerCase().replace(/\s+/g, "");
      if (normalizedMap[nk]) return item[normalizedMap[nk]];
    }

    return undefined;
  }
  // --------------- end helpers -----------------------

  async getAllItems(): Promise<Item[]> {
    try {
      console.log("[InventoryService] Fetching all items.");

      const response = await apiService.axios.get(this.getUrl());
      // response.data is what your console showed previously
      console.log("[InventoryService] Raw response:", response.data);

      // Extract items from the response (robust)
      const extractedItems = this.extractItems(response.data);
      console.log(
        "[InventoryService] extractedItems length:",
        (extractedItems || []).length
      );

      // Transform the data to match our Item interface (robust key lookup)
      const items: Item[] = (extractedItems || []).map((item: any) => {
        const get = (names: string[]) => this.getNormalizedValue(item, names);

        const itemIdRaw =
          get(["Item ID", "itemId", "id"]) || Math.random().toString();
        const nameRaw = get(["Item Name", "name"]) || "";
        const priceRaw = get(["Item Price", "price"]) || 0;
        const qtyRaw = get(["Quantity Available", "qty", "quantity"]) || 0;
        const expiryRaw = get(["Expiry Date", "expiryDate"]) || undefined;
        const descRaw = get(["Description", "description"]) || undefined;

        // Convert types safely
        const price = Number(priceRaw) || 0;
        const qty = parseInt(String(qtyRaw || 0), 10) || 0;

        return {
          itemId: String(itemIdRaw),
          name: String(nameRaw),
          price,
          qty,
          expiryDate: expiryRaw,
          description: descRaw,
        } as Item;
      });

      console.log("[InventoryService] Transformed items:", items);
      return items;
    } catch (error: any) {
      console.error("[InventoryService] Error in getAllItems:", error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response && error.response.data && error.response.data.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error("An unknown error occurred");
  }

  async createItem(itemData: Omit<Item, "itemId">): Promise<Item> {
    try {
      console.log("[InventoryService] Creating item:", itemData);

      const response = await apiService.axios.post(this.getUrl(), {
        operation: "POST", // Match the n8n switch operation
        data: itemData,
      });

      console.log("[InventoryService] Item created:", response.data);

      // Transform the response to match our Item interface
      const newItem: Item = {
        itemId: response.data?.itemId || Math.random().toString(),
        name: itemData.name,
        price: itemData.price,
        qty: itemData.qty,
        expiryDate: itemData.expiryDate,
        description: itemData.description,
      };

      return newItem;
    } catch (error) {
      console.error("[InventoryService] Error creating item:", error);
      throw this.handleError(error);
    }
  }

  async updateItem(itemId: string, itemData: Partial<Item>): Promise<Item> {
    try {
      console.log("[InventoryService] Updating item:", itemId, itemData);

      const response = await apiService.axios.post(this.getUrl(), {
        operation: "UPDATE",
        itemId,
        data: itemData,
      });

      console.log("[InventoryService] Item updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("[InventoryService] Error updating item:", error);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      console.log("[InventoryService] Deleting item:", itemId);

      await apiService.axios.post(this.getUrl(), {
        operation: "DELETE",
        itemId,
      });

      console.log("[InventoryService] Item deleted successfully");
    } catch (error) {
      console.error("[InventoryService] Error deleting item:", error);
      throw error;
    }
  }

  // Robust extractor that handles upstreamBody (stringified JSON) and other wrappers
  private extractItems(response: any): any[] {
    console.log(
      "[InventoryService] Extracting items from response:",
      JSON.stringify(response, null, 2)
    );

    // Handle proxy response structure first
    if (response?.upstreamBody) {
      let parsed;
      if (typeof response.upstreamBody === "string") {
        try {
          parsed = JSON.parse(response.upstreamBody);
          console.log("[InventoryService] Parsed upstreamBody:", parsed);
        } catch (e) {
          console.error("[InventoryService] Failed to parse upstreamBody:", e);
          return [];
        }
      } else {
        parsed = response.upstreamBody;
      }

      // Now extract items from the parsed upstreamBody
      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (parsed?.items && Array.isArray(parsed.items)) {
        return parsed.items;
      }

      // If it's a single item object, wrap it in array
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        const hasItemFields = keys.some((k) =>
          /item\s?id|item\s?name|item\s?price|quantity|description|expiry/i.test(
            k
          )
        );
        if (hasItemFields) {
          return [parsed];
        }
      }
    }

    // Fallback to original extraction logic
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.items && Array.isArray(response.items)) {
      return response.items;
    }

    if (response?.data?.items && Array.isArray(response.data.items)) {
      return response.data.items;
    }

    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }

    // Check for message field (another proxy pattern)
    if (response?.message) {
      try {
        const parsed = JSON.parse(response.message);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (parsed?.items && Array.isArray(parsed.items)) {
          return parsed.items;
        }
      } catch (e) {
        console.error("[InventoryService] Failed to parse message:", e);
      }
    }

    console.warn(
      "[InventoryService] Unknown response structure, returning empty array"
    );
    return [];
  }
}

export default new InventoryService();
