import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getKitchenServePool } from "../../database/kitchen-serve-database.js";
import type {
  KitchenTicketStatus,
  ServiceOrder,
  ServiceOrderInput,
  ServiceOrderStatus
} from "./service-orders.types.js";
type OrderRow = RowDataPacket & {
  created_at: Date;
  guest_name: string | null;
  id: number;
  notes: string | null;
  status: ServiceOrderStatus;
  table_label: string;
  tenant_id: string;
  uuid: string;
  waiter_name: string;
};
type ItemRow = RowDataPacket & {
  id: number;
  item_name: string;
  kitchen_station: string;
  notes: string | null;
  quantity: string | number;
  status: KitchenTicketStatus;
  unit_price: string | number;
};
export class ServiceOrdersRepository {
  async list(db: string, tenantId: string, status?: ServiceOrderStatus) {
    const pool = await getKitchenServePool(db);
    const [rows] = await pool.query<OrderRow[]>(
      `SELECT * FROM kitchen_serve_orders WHERE tenant_id=? ${status ? "AND status=?" : ""} ORDER BY created_at DESC,id DESC`,
      status ? [tenantId, status] : [tenantId]
    );
    return Promise.all(rows.map((row) => this.hydrate(db, row)));
  }
  async create(db: string, tenantId: string, input: ServiceOrderInput) {
    const pool = await getKitchenServePool(db);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const uuid = randomUUID();
      const [result] = await connection.execute<ResultSetHeader>(
        "INSERT INTO kitchen_serve_orders (uuid,tenant_id,table_label,guest_name,waiter_name,status,notes) VALUES (?,?,?,?,?,'draft',?)",
        [
          uuid,
          tenantId,
          input.tableLabel,
          input.guestName ?? null,
          input.waiterName,
          input.notes ?? null
        ]
      );
      for (const item of input.items)
        await connection.execute(
          "INSERT INTO kitchen_serve_order_items (order_id,item_name,quantity,unit_price,notes,kitchen_station,status) VALUES (?,?,?,?,?,?,'queued')",
          [
            result.insertId,
            item.itemName,
            item.quantity,
            item.unitPrice,
            item.notes ?? null,
            item.kitchenStation
          ]
        );
      await connection.commit();
      return this.find(db, tenantId, uuid);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async find(db: string, tenantId: string, id: string) {
    const pool = await getKitchenServePool(db);
    const [rows] = await pool.query<OrderRow[]>(
      "SELECT * FROM kitchen_serve_orders WHERE tenant_id=? AND (uuid=? OR id=?) LIMIT 1",
      [tenantId, id, Number(id) || 0]
    );
    return rows[0] ? this.hydrate(db, rows[0]) : null;
  }
  async transition(db: string, tenantId: string, id: string, status: ServiceOrderStatus) {
    const order = await this.find(db, tenantId, id);
    if (!order) return null;
    const pool = await getKitchenServePool(db);
    await pool.execute("UPDATE kitchen_serve_orders SET status=? WHERE id=? AND tenant_id=?", [
      status,
      order.id,
      tenantId
    ]);
    if (status === "submitted") {
      const stations = [...new Set(order.items.map((item) => item.kitchenStation))];
      for (const station of stations)
        await pool.execute(
          "INSERT INTO kitchen_serve_tickets (uuid,order_id,station,status) VALUES (?,?,?,'queued')",
          [randomUUID(), order.id, station]
        );
    }
    return this.find(db, tenantId, id);
  }
  private async hydrate(db: string, row: OrderRow): Promise<ServiceOrder> {
    const pool = await getKitchenServePool(db);
    const [items] = await pool.query<ItemRow[]>(
      "SELECT * FROM kitchen_serve_order_items WHERE order_id=? ORDER BY id",
      [row.id]
    );
    return {
      createdAt: new Date(row.created_at).toISOString(),
      guestName: row.guest_name,
      id: Number(row.id),
      items: items.map((item) => ({
        id: Number(item.id),
        itemName: item.item_name,
        kitchenStation: item.kitchen_station,
        notes: item.notes ?? undefined,
        quantity: Number(item.quantity),
        status: item.status,
        unitPrice: Number(item.unit_price)
      })),
      notes: row.notes,
      status: row.status,
      tableLabel: row.table_label,
      tenantId: row.tenant_id,
      uuid: row.uuid,
      waiterName: row.waiter_name
    };
  }
}
