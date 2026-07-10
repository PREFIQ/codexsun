import { sql, type Kysely } from "kysely";
export async function migrateReceiptModule(database: Kysely<any>) { await sql.raw(`CREATE TABLE IF NOT EXISTS billing_receipts (
 id varchar(80) primary key, receipt_number varchar(80) not null unique, receipt_date varchar(16) not null, party_name varchar(180) not null,
 party_id varchar(120) null, party_type varchar(40) not null default 'customer', receipt_mode varchar(40) not null default 'cash', bank_account varchar(180) null,
 reference_no varchar(120) null, reference_date varchar(16) null, amount double not null default 0, tds_amount double not null default 0, discount_amount double not null default 0,
 round_off double not null default 0, total_amount double not null default 0, allocated_amount double not null default 0, unallocated_amount double not null default 0,
 status varchar(24) not null default 'draft', notes text null, allocations_json longtext null, created_at varchar(40) not null, updated_at varchar(40) not null
 )`).execute(database); }
