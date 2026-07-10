import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { getBillingDatabase } from "../../database/billing-database.js";
import type {
  CommentCreateInput,
  ConvertQuotationsInput,
  EntryActivityRecord,
  EntryCommentRecord,
  EntryContactRecord,
  EntryFilters,
  EntryKind,
  EntryLineInput,
  EntryLineRecord,
  EntryProductRecord,
  EntryRecord,
  EntrySource,
  EntryStatus,
  EntryUpsertInput
} from "./entries.types.js";

type HeaderRow = Record<string, unknown>;

export class EntriesRepository {
  async listContacts(tenantId: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT *
      FROM entry_contacts
      WHERE tenant_id = ${tenantId}
      ORDER BY name ASC
    `.execute(await getBillingDatabase());
    return result.rows.map(mapContact);
  }

  async createContact(tenantId: string, input: Partial<EntryContactRecord>) {
    const code = cleanRequired(input.code, "Contact code").toUpperCase();
    const name = cleanRequired(input.name, "Contact name");
    await assertUnique("entry_contacts", tenantId, "code", code, "Contact code already exists. Enter a unique code.");
    await assertUnique("entry_contacts", tenantId, "name", name, "Contact name already exists. Enter a unique name.");
    const record = {
      addressLine1: cleanOptional(input.addressLine1),
      addressLine2: cleanOptional(input.addressLine2),
      cityId: cleanOptional(input.cityId),
      cityName: cleanOptional(input.cityName),
      code,
      countryId: cleanOptional(input.countryId),
      countryName: cleanOptional(input.countryName),
      districtId: cleanOptional(input.districtId),
      districtName: cleanOptional(input.districtName),
      email: cleanOptional(input.email),
      gstin: cleanOptional(input.gstin),
      id: createId(tenantId, "contact"),
      isActive: input.isActive !== false,
      legalName: cleanOptional(input.legalName),
      name,
      phone: cleanOptional(input.phone),
      pincodeId: cleanOptional(input.pincodeId),
      pincodeName: cleanOptional(input.pincodeName),
      stateId: cleanOptional(input.stateId),
      stateName: cleanOptional(input.stateName),
      tenantId,
      uuid: createUuid()
    } satisfies EntryContactRecord;
    await sql`
      INSERT INTO entry_contacts (
        id, uuid, tenant_id, code, name, legal_name, gstin, email, phone, address_line1, address_line2,
        country_id, country_name, state_id, state_name, district_id, district_name, city_id, city_name,
        pincode_id, pincode_name, is_active
      ) VALUES (
        ${record.id}, ${record.uuid}, ${record.tenantId}, ${record.code}, ${record.name}, ${record.legalName}, ${record.gstin},
        ${record.email}, ${record.phone}, ${record.addressLine1}, ${record.addressLine2}, ${record.countryId},
        ${record.countryName}, ${record.stateId}, ${record.stateName}, ${record.districtId}, ${record.districtName},
        ${record.cityId}, ${record.cityName}, ${record.pincodeId}, ${record.pincodeName}, ${record.isActive ? 1 : 0}
      )
    `.execute(await getBillingDatabase());
    return record;
  }

  async updateContact(tenantId: string, id: string, input: Partial<EntryContactRecord>) {
    const existing = await this.findContact(tenantId, id);
    if (!existing) throw AppError.notFound("Contact not found.");
    const code = cleanRequired(input.code, "Contact code").toUpperCase();
    const name = cleanRequired(input.name, "Contact name");
    await assertUnique("entry_contacts", tenantId, "code", code, "Contact code already exists. Enter a unique code.", id);
    await assertUnique("entry_contacts", tenantId, "name", name, "Contact name already exists. Enter a unique name.", id);
    await sql`
      UPDATE entry_contacts
      SET code = ${code}, name = ${name}, legal_name = ${cleanOptional(input.legalName)}, gstin = ${cleanOptional(input.gstin)},
        email = ${cleanOptional(input.email)}, phone = ${cleanOptional(input.phone)}, address_line1 = ${cleanOptional(input.addressLine1)},
        address_line2 = ${cleanOptional(input.addressLine2)}, country_id = ${cleanOptional(input.countryId)},
        country_name = ${cleanOptional(input.countryName)}, state_id = ${cleanOptional(input.stateId)},
        state_name = ${cleanOptional(input.stateName)}, district_id = ${cleanOptional(input.districtId)},
        district_name = ${cleanOptional(input.districtName)}, city_id = ${cleanOptional(input.cityId)},
        city_name = ${cleanOptional(input.cityName)}, pincode_id = ${cleanOptional(input.pincodeId)},
        pincode_name = ${cleanOptional(input.pincodeName)}, is_active = ${input.isActive === false ? 0 : 1}
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `.execute(await getBillingDatabase());
    return this.findContact(tenantId, id);
  }

  async findContact(tenantId: string, id: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT *
      FROM entry_contacts
      WHERE id = ${id} AND tenant_id = ${tenantId}
      LIMIT 1
    `.execute(await getBillingDatabase());
    return result.rows[0] ? mapContact(result.rows[0]) : null;
  }

  async listProducts(tenantId: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT *
      FROM entry_products
      WHERE tenant_id = ${tenantId}
      ORDER BY name ASC
    `.execute(await getBillingDatabase());
    return result.rows.map(mapProduct);
  }

  async createProduct(tenantId: string, input: Partial<EntryProductRecord>) {
    const code = cleanRequired(input.code, "Product code").toUpperCase();
    const name = cleanRequired(input.name, "Product name");
    await assertUnique("entry_products", tenantId, "code", code, "Product code already exists. Enter a unique code.");
    await assertUnique("entry_products", tenantId, "name", name, "Product name already exists. Enter a unique name.");
    const record = {
      code,
      hsnCode: cleanOptional(input.hsnCode),
      hsnCodeId: cleanOptional(input.hsnCodeId),
      id: createId(tenantId, "product"),
      isActive: input.isActive !== false,
      name,
      price: numberValue(input.price),
      productTypeId: cleanOptional(input.productTypeId),
      productTypeName: cleanOptional(input.productTypeName),
      taxDescription: cleanOptional(input.taxDescription),
      taxId: cleanOptional(input.taxId),
      taxRate: numberValue(input.taxRate),
      tenantId,
      unitId: cleanOptional(input.unitId),
      unitName: cleanOptional(input.unitName),
      uuid: createUuid()
    } satisfies EntryProductRecord;
    await sql`
      INSERT INTO entry_products (
        id, uuid, tenant_id, code, name, product_type_id, product_type_name, hsn_code_id, hsn_code,
        unit_id, unit_name, tax_id, tax_description, tax_rate, price, is_active
      ) VALUES (
        ${record.id}, ${record.uuid}, ${record.tenantId}, ${record.code}, ${record.name}, ${record.productTypeId},
        ${record.productTypeName}, ${record.hsnCodeId}, ${record.hsnCode}, ${record.unitId}, ${record.unitName},
        ${record.taxId}, ${record.taxDescription}, ${record.taxRate}, ${record.price}, ${record.isActive ? 1 : 0}
      )
    `.execute(await getBillingDatabase());
    return record;
  }

  async updateProduct(tenantId: string, id: string, input: Partial<EntryProductRecord>) {
    const existing = await this.findProduct(tenantId, id);
    if (!existing) throw AppError.notFound("Product not found.");
    const code = cleanRequired(input.code, "Product code").toUpperCase();
    const name = cleanRequired(input.name, "Product name");
    await assertUnique("entry_products", tenantId, "code", code, "Product code already exists. Enter a unique code.", id);
    await assertUnique("entry_products", tenantId, "name", name, "Product name already exists. Enter a unique name.", id);
    await sql`
      UPDATE entry_products
      SET code = ${code}, name = ${name}, product_type_id = ${cleanOptional(input.productTypeId)},
        product_type_name = ${cleanOptional(input.productTypeName)}, hsn_code_id = ${cleanOptional(input.hsnCodeId)},
        hsn_code = ${cleanOptional(input.hsnCode)}, unit_id = ${cleanOptional(input.unitId)}, unit_name = ${cleanOptional(input.unitName)},
        tax_id = ${cleanOptional(input.taxId)}, tax_description = ${cleanOptional(input.taxDescription)},
        tax_rate = ${numberValue(input.taxRate)}, price = ${numberValue(input.price)}, is_active = ${input.isActive === false ? 0 : 1}
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `.execute(await getBillingDatabase());
    return this.findProduct(tenantId, id);
  }

  async findProduct(tenantId: string, id: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT *
      FROM entry_products
      WHERE id = ${id} AND tenant_id = ${tenantId}
      LIMIT 1
    `.execute(await getBillingDatabase());
    return result.rows[0] ? mapProduct(result.rows[0]) : null;
  }

  async listEntries(kind: EntryKind, tenantId: string, filters: EntryFilters = {}) {
    const headerTable = tableName(kind);
    const result = await sql<HeaderRow>`
      SELECT *
      FROM ${sql.table(headerTable)}
      WHERE tenant_id = ${tenantId}
        AND (${filters.search ?? ""} = "" OR LOWER(document_no) LIKE ${like(filters.search)} OR LOWER(customer_name) LIKE ${like(filters.search)})
        AND (${filters.status ?? ""} = "" OR status = ${filters.status ?? ""})
        AND (${filters.active ?? ""} = "" OR is_active = ${filters.active === "inactive" ? 0 : 1})
      ORDER BY document_date DESC, created_at DESC
    `.execute(await getBillingDatabase());
    return Promise.all(result.rows.map((row) => this.hydrateEntry(kind, row)));
  }

  async findEntry(kind: EntryKind, tenantId: string, id: string) {
    const result = await sql<HeaderRow>`
      SELECT *
      FROM ${sql.table(tableName(kind))}
      WHERE id = ${id} AND tenant_id = ${tenantId}
      LIMIT 1
    `.execute(await getBillingDatabase());
    return result.rows[0] ? this.hydrateEntry(kind, result.rows[0]) : null;
  }

  async createEntry(kind: EntryKind, tenantId: string, input: EntryUpsertInput) {
    return this.saveEntry(kind, tenantId, input, null);
  }

  async updateEntry(kind: EntryKind, tenantId: string, id: string, input: EntryUpsertInput) {
    return this.saveEntry(kind, tenantId, input, id);
  }

  async setEntryActive(kind: EntryKind, tenantId: string, id: string, isActive: boolean) {
    const entry = await this.findEntry(kind, tenantId, id);
    if (!entry) throw AppError.notFound(`${labelFor(kind)} not found.`);
    await sql`
      UPDATE ${sql.table(tableName(kind))}
      SET is_active = ${isActive ? 1 : 0}
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `.execute(await getBillingDatabase());
    await this.addActivity(kind, id, isActive ? "activated" : "suspended", "system@codexsun.local", `${labelFor(kind)} ${isActive ? "activated" : "suspended"}`, null);
    return this.findEntry(kind, tenantId, id);
  }

  async addComment(kind: EntryKind, tenantId: string, id: string, input: CommentCreateInput) {
    const entry = await this.findEntry(kind, tenantId, id);
    if (!entry) throw AppError.notFound(`${labelFor(kind)} not found.`);
    const body = cleanRequired(input.body, "Comment");
    const authorEmail = cleanOptional(input.authorEmail) ?? "user@codexsun.local";
    const commentId = createId(tenantId, `${kind}-comment`);
    await sql`
      INSERT INTO ${sql.table(commentTableName(kind))} (id, uuid, ${sql.ref(`${kind}_entry_id`)}, author_email, body)
      VALUES (${commentId}, ${createUuid()}, ${id}, ${authorEmail}, ${body})
    `.execute(await getBillingDatabase());
    await this.addActivity(kind, id, "commented", authorEmail, "Comment added", { body });
    return this.findEntry(kind, tenantId, id);
  }

  async convertQuotationsToSales(tenantId: string, input: ConvertQuotationsInput) {
    const quotationIds = Array.from(new Set((input.quotationIds ?? []).map((value) => String(value).trim()).filter(Boolean)));
    if (!quotationIds.length) throw AppError.validation("Select at least one quotation.");
    const quotations = (await Promise.all(quotationIds.map((id) => this.findEntry("quotation", tenantId, id)))).filter(Boolean) as EntryRecord[];
    if (quotations.length !== quotationIds.length) throw AppError.notFound("One or more quotations were not found.");
    const first = quotations[0];
    if (!first) throw AppError.validation("Select at least one quotation.");
    const partyKey = `${first.customerId ?? ""}|${first.customerName.trim().toLowerCase()}`;
    if (quotations.some((quotation) => `${quotation.customerId ?? ""}|${quotation.customerName.trim().toLowerCase()}` !== partyKey)) {
      throw AppError.validation("Selected quotations must belong to the same customer.");
    }
    if (quotations.some((quotation) => quotation.generatedSalesEntryId || quotation.generatedSalesDocumentNo)) {
      throw AppError.conflict("One or more quotations are already linked to a sales invoice.");
    }

    const mergedLines = mergeQuotationLines(quotations.flatMap((quotation) => quotation.lines));
    const sales = await this.createEntry("sales", tenantId, {
      billingAddress: first.billingAddress,
      customerGstin: first.customerGstin,
      customerId: first.customerId,
      customerName: first.customerName,
      customerStateCode: first.customerStateCode,
      customerStateName: first.customerStateName,
      documentDate: isoDate(),
      dueDate: first.dueDate,
      lines: mergedLines,
      notes: first.notes,
      paymentTermId: first.paymentTermId,
      paymentTermName: first.paymentTermName,
      placeOfSupply: first.placeOfSupply,
      referenceNo: quotations.map((quotation) => quotation.documentNo).join(", "),
      salesTypeId: first.salesTypeId,
      salesTypeName: first.salesTypeName,
      shippingAddress: first.shippingAddress,
      source: {
        sourceQuotationNos: quotations.map((quotation) => quotation.documentNo),
        sourceQuotationUuids: quotations.map((quotation) => quotation.uuid),
        sourceType: "quotation"
      },
      terms: first.terms,
      transportAddress: first.transportAddress,
      transportContactNo: first.transportContactNo,
      transportContactPerson: first.transportContactPerson,
      transportGst: first.transportGst,
      transportId: first.transportId,
      transportName: first.transportName,
      vehicleNo: first.vehicleNo,
      workOrderNo: first.workOrderNo
    });
    if (!sales) throw AppError.internal("Unable to create sales invoice from quotation.");

    for (const quotation of quotations) {
      await sql`
        UPDATE quotation_entries
        SET generated_sales_entry_id = ${sales.id},
          generated_sales_document_no = ${sales.documentNo},
          generated_sales_at = CURRENT_TIMESTAMP,
          status = ${quotation.status === "draft" ? "posted" : quotation.status}
        WHERE id = ${quotation.id} AND tenant_id = ${tenantId}
      `.execute(await getBillingDatabase());
      await this.addActivity("quotation", quotation.id, "converted", "system@codexsun.local", `Converted to sales invoice ${sales.documentNo}`, {
        salesDocumentNo: sales.documentNo,
        salesId: sales.id
      });
    }

    await this.addActivity("sales", sales.id, "converted", "system@codexsun.local", `Created from ${quotations.length} quotation(s)`, {
      quotationIds,
      quotationNos: quotations.map((quotation) => quotation.documentNo)
    });

    return sales;
  }

  private async saveEntry(kind: EntryKind, tenantId: string, input: EntryUpsertInput, existingId: string | null) {
    const existing = existingId ? await this.findEntry(kind, tenantId, existingId) : null;
    if (existingId && !existing) throw AppError.notFound(`${labelFor(kind)} not found.`);
    const normalized = normalizeEntryInput(kind, tenantId, input, existing ?? null);
    await assertUnique(tableName(kind), tenantId, "document_no", normalized.documentNo, `${labelFor(kind)} number already exists. Enter a unique number.`, existingId ?? undefined);

    if (existing) {
      await sql`
        UPDATE ${sql.table(tableName(kind))}
        SET document_no = ${normalized.documentNo}, document_date = ${normalized.documentDate}, customer_id = ${normalized.customerId},
          customer_name = ${normalized.customerName}, customer_gstin = ${normalized.customerGstin},
          customer_state_code = ${normalized.customerStateCode}, customer_state_name = ${normalized.customerStateName},
          billing_address = ${normalized.billingAddress}, shipping_address = ${normalized.shippingAddress},
          place_of_supply = ${normalized.placeOfSupply}, reference_no = ${normalized.referenceNo}, due_date = ${normalized.dueDate},
          work_order_no = ${normalized.workOrderNo}, supplier_bill_no = ${normalized.supplierBillNo}, supplier_bill_date = ${normalized.supplierBillDate},
          payment_term_id = ${normalized.paymentTermId}, payment_term_name = ${normalized.paymentTermName},
          sales_type_id = ${normalized.salesTypeId}, sales_type_name = ${normalized.salesTypeName}, subtotal = ${normalized.subtotal},
          discount_total = ${normalized.discountTotal}, taxable_total = ${normalized.taxableTotal}, tax_total = ${normalized.taxTotal},
          round_off = ${normalized.roundOff}, grand_total = ${normalized.grandTotal}, paid_amount = ${normalized.paidAmount},
          balance_amount = ${normalized.balanceAmount}, status = ${normalized.status}, payment_status = ${normalized.paymentStatus},
          irn = ${normalized.irn}, ack_no = ${normalized.ackNo}, ack_date = ${normalized.ackDate}, signed_qr = ${normalized.signedQr},
          eway_bill_no = ${normalized.ewayBillNo}, eway_bill_date = ${normalized.ewayBillDate}, transport_id = ${normalized.transportId},
          transport_name = ${normalized.transportName}, transport_gst = ${normalized.transportGst}, transport_address = ${normalized.transportAddress},
          transport_contact_no = ${normalized.transportContactNo}, transport_contact_person = ${normalized.transportContactPerson},
          vehicle_no = ${normalized.vehicleNo}, eway_part = ${normalized.ewayPart}, notes = ${normalized.notes}, terms = ${normalized.terms},
          source_type = ${normalized.sourceType}, source_ref_no = ${normalized.sourceRefNo},
          source_quotation_uuids = ${jsonText(normalized.sourceQuotationUuids)}, source_quotation_nos = ${jsonText(normalized.sourceQuotationNos)},
          is_active = ${normalized.isActive ? 1 : 0}
        WHERE id = ${existing.id} AND tenant_id = ${tenantId}
      `.execute(await getBillingDatabase());
      await sql`DELETE FROM ${sql.table(itemTableName(kind))} WHERE ${sql.ref(`${kind}_entry_id`)} = ${existing.id}`.execute(await getBillingDatabase());
      await insertLines(kind, existing.id, normalized.lines);
      await this.addActivity(kind, existing.id, "updated", "system@codexsun.local", `${labelFor(kind)} updated`, {
        documentNo: normalized.documentNo
      });
      return this.findEntry(kind, tenantId, existing.id);
    }

    await sql`
      INSERT INTO ${sql.table(tableName(kind))} (
        id, uuid, tenant_id, document_no, document_date, customer_id, customer_name, customer_gstin,
        customer_state_code, customer_state_name, billing_address, shipping_address, place_of_supply, reference_no,
        due_date, work_order_no, supplier_bill_no, supplier_bill_date, payment_term_id, payment_term_name, sales_type_id, sales_type_name,
        subtotal, discount_total, taxable_total, tax_total, round_off, grand_total, paid_amount, balance_amount,
        status, payment_status, irn, ack_no, ack_date, signed_qr, eway_bill_no, eway_bill_date, transport_id,
        transport_name, transport_gst, transport_address, transport_contact_no, transport_contact_person, vehicle_no,
        eway_part, notes, terms, source_type, source_ref_no, source_quotation_uuids, source_quotation_nos, is_active
      ) VALUES (
        ${normalized.id}, ${normalized.uuid}, ${tenantId}, ${normalized.documentNo}, ${normalized.documentDate}, ${normalized.customerId},
        ${normalized.customerName}, ${normalized.customerGstin}, ${normalized.customerStateCode}, ${normalized.customerStateName},
        ${normalized.billingAddress}, ${normalized.shippingAddress}, ${normalized.placeOfSupply}, ${normalized.referenceNo},
        ${normalized.dueDate}, ${normalized.workOrderNo}, ${normalized.supplierBillNo}, ${normalized.supplierBillDate},
        ${normalized.paymentTermId}, ${normalized.paymentTermName},
        ${normalized.salesTypeId}, ${normalized.salesTypeName}, ${normalized.subtotal}, ${normalized.discountTotal},
        ${normalized.taxableTotal}, ${normalized.taxTotal}, ${normalized.roundOff}, ${normalized.grandTotal},
        ${normalized.paidAmount}, ${normalized.balanceAmount}, ${normalized.status}, ${normalized.paymentStatus},
        ${normalized.irn}, ${normalized.ackNo}, ${normalized.ackDate}, ${normalized.signedQr}, ${normalized.ewayBillNo},
        ${normalized.ewayBillDate}, ${normalized.transportId}, ${normalized.transportName}, ${normalized.transportGst},
        ${normalized.transportAddress}, ${normalized.transportContactNo}, ${normalized.transportContactPerson}, ${normalized.vehicleNo},
        ${normalized.ewayPart}, ${normalized.notes}, ${normalized.terms}, ${normalized.sourceType}, ${normalized.sourceRefNo},
        ${jsonText(normalized.sourceQuotationUuids)}, ${jsonText(normalized.sourceQuotationNos)}, ${normalized.isActive ? 1 : 0}
      )
    `.execute(await getBillingDatabase());
    await insertLines(kind, normalized.id, normalized.lines);
    await this.addActivity(kind, normalized.id, "created", "system@codexsun.local", `${labelFor(kind)} created`, {
      documentNo: normalized.documentNo
    });
    return this.findEntry(kind, tenantId, normalized.id);
  }

  private async hydrateEntry(kind: EntryKind, row: HeaderRow): Promise<EntryRecord> {
    const id = String(row.id);
    const [lines, comments, activities] = await Promise.all([
      this.listLines(kind, id),
      this.listComments(kind, id),
      this.listActivities(kind, id)
    ]);
    return {
      ackDate: toDateString(row.ack_date),
      ackNo: valueOrNull(row.ack_no),
      activities,
      balanceAmount: numberValue(row.balance_amount),
      billingAddress: valueOrNull(row.billing_address),
      comments,
      createdAt: toDateTimeString(row.created_at) ?? new Date().toISOString(),
      customerGstin: valueOrNull(row.customer_gstin),
      customerId: valueOrNull(row.customer_id),
      customerName: String(row.customer_name ?? ""),
      customerStateCode: valueOrNull(row.customer_state_code),
      customerStateName: valueOrNull(row.customer_state_name),
      discountTotal: numberValue(row.discount_total),
      documentDate: toDateString(row.document_date) ?? isoDate(),
      documentNo: String(row.document_no ?? ""),
      dueDate: toDateString(row.due_date),
      ewayBillDate: toDateString(row.eway_bill_date),
      ewayBillNo: valueOrNull(row.eway_bill_no),
      ewayPart: valueOrNull(row.eway_part),
      generatedSalesAt: toDateTimeString(row.generated_sales_at),
      generatedSalesDocumentNo: valueOrNull(row.generated_sales_document_no),
      generatedSalesEntryId: valueOrNull(row.generated_sales_entry_id),
      grandTotal: numberValue(row.grand_total),
      id,
      irn: valueOrNull(row.irn),
      isActive: Boolean(row.is_active),
      kind,
      lines,
      notes: valueOrNull(row.notes),
      paidAmount: numberValue(row.paid_amount),
      paymentStatus: normalizePaymentStatus(row.payment_status),
      paymentTermId: valueOrNull(row.payment_term_id),
      paymentTermName: valueOrNull(row.payment_term_name),
      placeOfSupply: row.place_of_supply === "igst" ? "igst" : "cgst-sgst",
      referenceNo: valueOrNull(row.reference_no),
      roundOff: numberValue(row.round_off),
      salesTypeId: valueOrNull(row.sales_type_id),
      salesTypeName: valueOrNull(row.sales_type_name),
      shippingAddress: valueOrNull(row.shipping_address),
      signedQr: valueOrNull(row.signed_qr),
      source: parseSource(row),
      status: normalizeStatus(row.status),
      subtotal: numberValue(row.subtotal),
      supplierBillDate: toDateString(row.supplier_bill_date),
      supplierBillNo: valueOrNull(row.supplier_bill_no),
      taxTotal: numberValue(row.tax_total),
      taxableTotal: numberValue(row.taxable_total),
      tenantId: String(row.tenant_id ?? ""),
      terms: valueOrNull(row.terms),
      transportAddress: valueOrNull(row.transport_address),
      transportContactNo: valueOrNull(row.transport_contact_no),
      transportContactPerson: valueOrNull(row.transport_contact_person),
      transportGst: valueOrNull(row.transport_gst),
      transportId: valueOrNull(row.transport_id),
      transportName: valueOrNull(row.transport_name),
      updatedAt: toDateTimeString(row.updated_at) ?? new Date().toISOString(),
      uuid: String(row.uuid ?? ""),
      vehicleNo: valueOrNull(row.vehicle_no),
      workOrderNo: valueOrNull(row.work_order_no)
    };
  }

  private async listLines(kind: EntryKind, entryId: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT *
      FROM ${sql.table(itemTableName(kind))}
      WHERE ${sql.ref(`${kind}_entry_id`)} = ${entryId}
      ORDER BY sort_order ASC, created_at ASC
    `.execute(await getBillingDatabase());
    return result.rows.map(mapLine);
  }

  private async listComments(kind: EntryKind, entryId: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT *
      FROM ${sql.table(commentTableName(kind))}
      WHERE ${sql.ref(`${kind}_entry_id`)} = ${entryId}
      ORDER BY created_at DESC
    `.execute(await getBillingDatabase());
    return result.rows.map(mapComment);
  }

  private async listActivities(kind: EntryKind, entryId: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT *
      FROM ${sql.table(activityTableName(kind))}
      WHERE ${sql.ref(`${kind}_entry_id`)} = ${entryId}
      ORDER BY created_at DESC
    `.execute(await getBillingDatabase());
    return result.rows.map(mapActivity);
  }

  private async addActivity(kind: EntryKind, entryId: string, activityType: string, actorEmail: string, message: string, payload: Record<string, unknown> | null) {
    await sql`
      INSERT INTO ${sql.table(activityTableName(kind))} (id, uuid, ${sql.ref(`${kind}_entry_id`)}, activity_type, actor_email, message, payload)
      VALUES (${createId("log", `${kind}-activity`)}, ${createUuid()}, ${entryId}, ${activityType}, ${actorEmail}, ${message}, ${jsonText(payload)})
    `.execute(await getBillingDatabase());
  }
}

function normalizeEntryInput(kind: EntryKind, tenantId: string, input: EntryUpsertInput, existing: EntryRecord | null) {
  const lines = normalizeLines(input.lines ?? [], tenantId, kind);
  if (!lines.length) throw AppError.validation("At least one item line is required.");
  const totals = calculateTotals(lines, numberValue(input.roundOff));
  const paidAmount = numberValue(input.paidAmount);
  return {
    ackDate: cleanDate(input.ackDate),
    ackNo: cleanOptional(input.ackNo),
    balanceAmount: roundMoney(totals.grand - paidAmount),
    billingAddress: cleanOptional(input.billingAddress),
    customerGstin: cleanOptional(input.customerGstin),
    customerId: cleanOptional(input.customerId),
    customerName: cleanRequired(input.customerName, kind === "purchase" ? "Supplier name" : "Customer name"),
    customerStateCode: cleanOptional(input.customerStateCode),
    customerStateName: cleanOptional(input.customerStateName),
    discountTotal: totals.discount,
    documentDate: cleanDate(input.documentDate) ?? isoDate(),
    documentNo: cleanOptional(input.documentNo) ?? nextDocumentNo(kind, tenantId),
    dueDate: cleanDate(input.dueDate),
    ewayBillDate: cleanDate(input.ewayBillDate),
    ewayBillNo: cleanOptional(input.ewayBillNo),
    ewayPart: cleanOptional(input.ewayPart),
    grandTotal: totals.grand,
    id: existing?.id ?? createId(tenantId, kind),
    irn: cleanOptional(input.irn),
    isActive: input.isActive !== false,
    lines,
    notes: cleanOptional(input.notes),
    paidAmount,
    paymentStatus: normalizePaymentStatus(input.paymentStatus),
    paymentTermId: cleanOptional(input.paymentTermId),
    paymentTermName: cleanOptional(input.paymentTermName),
    placeOfSupply: input.placeOfSupply === "igst" ? "igst" : "cgst-sgst",
    referenceNo: cleanOptional(input.referenceNo),
    roundOff: numberValue(input.roundOff),
    salesTypeId: cleanOptional(input.salesTypeId),
    salesTypeName: cleanOptional(input.salesTypeName),
    shippingAddress: cleanOptional(input.shippingAddress),
    signedQr: cleanOptional(input.signedQr),
    sourceQuotationNos: normalizeStringArray(input.source?.sourceQuotationNos),
    sourceQuotationUuids: normalizeStringArray(input.source?.sourceQuotationUuids),
    sourceRefNo: cleanOptional(input.source?.sourceRefNo as string | null | undefined) ?? cleanOptional(input.referenceNo),
    sourceType: cleanOptional(input.source?.sourceType as string | null | undefined),
    status: normalizeStatus(input.status),
    subtotal: totals.subtotal,
    supplierBillDate: cleanDate(input.supplierBillDate),
    supplierBillNo: cleanOptional(input.supplierBillNo),
    taxableTotal: totals.taxable,
    taxTotal: totals.tax,
    paymentStatusRaw: input.paymentStatus,
    terms: cleanOptional(input.terms),
    transportAddress: cleanOptional(input.transportAddress),
    transportContactNo: cleanOptional(input.transportContactNo),
    transportContactPerson: cleanOptional(input.transportContactPerson),
    transportGst: cleanOptional(input.transportGst),
    transportId: cleanOptional(input.transportId),
    transportName: cleanOptional(input.transportName),
    uuid: existing?.uuid ?? createUuid(),
    vehicleNo: cleanOptional(input.vehicleNo),
    workOrderNo: cleanOptional(input.workOrderNo)
  };
}

function normalizeLines(lines: EntryLineInput[], tenantId: string, kind: EntryKind): EntryLineRecord[] {
  return lines
    .map((line, index) => {
      const productName = cleanRequired(line.productName, "Product name");
      const quantity = numberValue(line.quantity, 1);
      const rate = numberValue(line.rate);
      const discountAmount = numberValue(line.discountAmount);
      const taxRate = numberValue(line.taxRate);
      const taxable = Math.max(0, quantity * rate - discountAmount);
      const taxAmount = roundMoney(taxable * taxRate / 100);
      return {
        colourId: cleanOptional(line.colourId),
        colourName: cleanOptional(line.colourName),
        dcNo: cleanOptional(line.dcNo),
        description: cleanOptional(line.description),
        discountAmount: roundMoney(discountAmount),
        hsnCode: cleanOptional(line.hsnCode),
        hsnCodeId: cleanOptional(line.hsnCodeId),
        id: createId(tenantId, `${kind}-line`),
        lineTotal: roundMoney(taxable + taxAmount),
        productId: cleanOptional(line.productId),
        productName,
        poNo: cleanOptional(line.poNo),
        quantity,
        rate,
        sizeId: cleanOptional(line.sizeId),
        sizeName: cleanOptional(line.sizeName),
        sortOrder: index + 1,
        taxAmount,
        taxDescription: cleanOptional(line.taxDescription),
        taxId: cleanOptional(line.taxId),
        taxRate,
        unitId: cleanOptional(line.unitId),
        unitName: cleanOptional(line.unitName),
        uuid: createUuid()
      } satisfies EntryLineRecord;
    })
    .filter((line) => line.productName.trim());
}

async function insertLines(kind: EntryKind, entryId: string, lines: EntryLineRecord[]) {
  for (const line of lines) {
    await sql`
      INSERT INTO ${sql.table(itemTableName(kind))} (
        id, uuid, ${sql.ref(`${kind}_entry_id`)}, product_id, product_name, description, colour_id, colour_name,
        hsn_code_id, hsn_code, po_no, dc_no, size_id, size_name, unit_id, unit_name, quantity, rate, discount_amount,
        tax_id, tax_description, tax_rate, tax_amount, line_total, sort_order
      ) VALUES (
        ${line.id}, ${line.uuid}, ${entryId}, ${line.productId}, ${line.productName}, ${line.description}, ${line.colourId},
        ${line.colourName}, ${line.hsnCodeId}, ${line.hsnCode}, ${line.poNo}, ${line.dcNo}, ${line.sizeId}, ${line.sizeName},
        ${line.unitId}, ${line.unitName}, ${line.quantity}, ${line.rate}, ${line.discountAmount}, ${line.taxId}, ${line.taxDescription},
        ${line.taxRate}, ${line.taxAmount}, ${line.lineTotal}, ${line.sortOrder}
      )
    `.execute(await getBillingDatabase());
  }
}

async function assertUnique(table: string, tenantId: string, column: string, value: string, message: string, excludeId?: string) {
  const result = await sql<Record<string, unknown>>`
    SELECT id
    FROM ${sql.table(table)}
    WHERE tenant_id = ${tenantId}
      AND ${sql.ref(column)} = ${value}
      ${excludeId ? sql`AND id <> ${excludeId}` : sql``}
    LIMIT 1
  `.execute(await getBillingDatabase());
  if (result.rows[0]) throw AppError.conflict(message);
}

function calculateTotals(lines: EntryLineRecord[], roundOff: number) {
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.quantity * line.rate, 0));
  const discount = roundMoney(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const taxable = roundMoney(lines.reduce((sum, line) => sum + Math.max(0, line.quantity * line.rate - line.discountAmount), 0));
  const tax = roundMoney(lines.reduce((sum, line) => sum + line.taxAmount, 0));
  const grand = roundMoney(taxable + tax + roundOff);
  return { discount, grand, subtotal, tax, taxable };
}

function mapContact(row: Record<string, unknown>): EntryContactRecord {
  return {
    addressLine1: valueOrNull(row.address_line1),
    addressLine2: valueOrNull(row.address_line2),
    cityId: valueOrNull(row.city_id),
    cityName: valueOrNull(row.city_name),
    code: String(row.code ?? ""),
    countryId: valueOrNull(row.country_id),
    countryName: valueOrNull(row.country_name),
    districtId: valueOrNull(row.district_id),
    districtName: valueOrNull(row.district_name),
    email: valueOrNull(row.email),
    gstin: valueOrNull(row.gstin),
    id: String(row.id ?? ""),
    isActive: Boolean(row.is_active),
    legalName: valueOrNull(row.legal_name),
    name: String(row.name ?? ""),
    phone: valueOrNull(row.phone),
    pincodeId: valueOrNull(row.pincode_id),
    pincodeName: valueOrNull(row.pincode_name),
    stateId: valueOrNull(row.state_id),
    stateName: valueOrNull(row.state_name),
    tenantId: String(row.tenant_id ?? ""),
    uuid: String(row.uuid ?? "")
  };
}

function mapProduct(row: Record<string, unknown>): EntryProductRecord {
  return {
    code: String(row.code ?? ""),
    hsnCode: valueOrNull(row.hsn_code),
    hsnCodeId: valueOrNull(row.hsn_code_id),
    id: String(row.id ?? ""),
    isActive: Boolean(row.is_active),
    name: String(row.name ?? ""),
    price: numberValue(row.price),
    productTypeId: valueOrNull(row.product_type_id),
    productTypeName: valueOrNull(row.product_type_name),
    taxDescription: valueOrNull(row.tax_description),
    taxId: valueOrNull(row.tax_id),
    taxRate: numberValue(row.tax_rate),
    tenantId: String(row.tenant_id ?? ""),
    unitId: valueOrNull(row.unit_id),
    unitName: valueOrNull(row.unit_name),
    uuid: String(row.uuid ?? "")
  };
}

function mapLine(row: Record<string, unknown>): EntryLineRecord {
  return {
    colourId: valueOrNull(row.colour_id),
    colourName: valueOrNull(row.colour_name),
    dcNo: valueOrNull(row.dc_no),
    description: valueOrNull(row.description),
    discountAmount: numberValue(row.discount_amount),
    hsnCode: valueOrNull(row.hsn_code),
    hsnCodeId: valueOrNull(row.hsn_code_id),
    id: String(row.id ?? ""),
    lineTotal: numberValue(row.line_total),
    productId: valueOrNull(row.product_id),
    productName: String(row.product_name ?? ""),
    poNo: valueOrNull(row.po_no),
    quantity: numberValue(row.quantity, 1),
    rate: numberValue(row.rate),
    sizeId: valueOrNull(row.size_id),
    sizeName: valueOrNull(row.size_name),
    sortOrder: numberValue(row.sort_order, 1),
    taxAmount: numberValue(row.tax_amount),
    taxDescription: valueOrNull(row.tax_description),
    taxId: valueOrNull(row.tax_id),
    taxRate: numberValue(row.tax_rate),
    unitId: valueOrNull(row.unit_id),
    unitName: valueOrNull(row.unit_name),
    uuid: String(row.uuid ?? "")
  };
}

function mapComment(row: Record<string, unknown>): EntryCommentRecord {
  return {
    authorEmail: String(row.author_email ?? ""),
    body: String(row.body ?? ""),
    createdAt: toDateTimeString(row.created_at) ?? new Date().toISOString(),
    id: String(row.id ?? ""),
    uuid: String(row.uuid ?? "")
  };
}

function mapActivity(row: Record<string, unknown>): EntryActivityRecord {
  return {
    actorEmail: String(row.actor_email ?? ""),
    activityType: String(row.activity_type ?? ""),
    createdAt: toDateTimeString(row.created_at) ?? new Date().toISOString(),
    id: String(row.id ?? ""),
    message: String(row.message ?? ""),
    payload: parseJson(row.payload),
    uuid: String(row.uuid ?? "")
  };
}

function parseSource(row: HeaderRow): EntrySource | null {
  const sourceType = valueOrNull(row.source_type);
  const sourceRefNo = valueOrNull(row.source_ref_no);
  const sourceQuotationNos = parseStringArray(row.source_quotation_nos);
  const sourceQuotationUuids = parseStringArray(row.source_quotation_uuids);
  const generatedSalesEntryId = valueOrNull(row.generated_sales_entry_id);
  const generatedSalesDocumentNo = valueOrNull(row.generated_sales_document_no);
  const generatedSalesAt = toDateTimeString(row.generated_sales_at);
  if (!sourceType && !sourceRefNo && !sourceQuotationNos.length && !sourceQuotationUuids.length && !generatedSalesEntryId) return null;
  return {
    ...(generatedSalesAt ? { generatedSalesAt } : {}),
    ...(generatedSalesDocumentNo ? { generatedSalesDocumentNo } : {}),
    ...(generatedSalesEntryId ? { generatedSalesEntryId } : {}),
    ...(sourceQuotationNos.length ? { sourceQuotationNos } : {}),
    ...(sourceQuotationUuids.length ? { sourceQuotationUuids } : {}),
    ...(sourceRefNo ? { sourceRefNo } : {}),
    ...(sourceType ? { sourceType } : {})
  };
}

function parseJson(value: unknown) {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseStringArray(value: unknown) {
  if (!value) return [] as string[];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(String(value)) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mergeQuotationLines(lines: EntryLineRecord[]): EntryLineInput[] {
  const merged = new Map<string, EntryLineInput>();
  for (const line of lines) {
    const key = [
      line.productId ?? "",
      line.productName.trim().toLowerCase(),
      line.rate,
      line.taxRate,
      line.unitId ?? line.unitName ?? "",
      line.hsnCodeId ?? line.hsnCode ?? "",
      line.colourId ?? line.colourName ?? "",
      line.sizeId ?? line.sizeName ?? ""
    ].join("|");
    const existing = merged.get(key);
    if (existing) {
      existing.quantity = numberValue(existing.quantity, 0) + line.quantity;
      existing.discountAmount = numberValue(existing.discountAmount, 0) + line.discountAmount;
      existing.description = [existing.description, line.description].filter(Boolean).join(" | ");
      continue;
    }
    merged.set(key, {
      colourId: line.colourId,
      colourName: line.colourName,
      dcNo: line.dcNo,
      description: line.description,
      discountAmount: line.discountAmount,
      hsnCode: line.hsnCode,
      hsnCodeId: line.hsnCodeId,
      productId: line.productId,
      productName: line.productName,
      poNo: line.poNo,
      quantity: line.quantity,
      rate: line.rate,
      sizeId: line.sizeId,
      sizeName: line.sizeName,
      taxDescription: line.taxDescription,
      taxId: line.taxId,
      taxRate: line.taxRate,
      unitId: line.unitId,
      unitName: line.unitName
    });
  }
  return Array.from(merged.values());
}

function tableName(kind: EntryKind) {
  return `${kind}_entries`;
}

function itemTableName(kind: EntryKind) {
  return `${kind}_entry_items`;
}

function commentTableName(kind: EntryKind) {
  return `${kind}_entry_comments`;
}

function activityTableName(kind: EntryKind) {
  return `${kind}_entry_activities`;
}

function labelFor(kind: EntryKind) {
  if (kind === "quotation") return "Quotation";
  if (kind === "sales") return "Sales";
  if (kind === "purchase") return "Purchase";
  return "Export Sales";
}

function nextDocumentNo(kind: EntryKind, tenantId: string) {
  const prefix = kind === "quotation" ? "QUO" : kind === "sales" ? "SAL" : kind === "purchase" ? "PUR" : "EXP";
  return `${prefix}-${tenantId.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
}

function cleanRequired(value: unknown, label: string) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) throw AppError.validation(`${label} is required.`);
  return cleaned;
}

function cleanOptional(value: unknown) {
  const cleaned = String(value ?? "").trim();
  return cleaned ? cleaned : null;
}

function cleanDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function valueOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  return text.trim() ? text : null;
}

function toDateString(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : text;
}

function toDateTimeString(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeStatus(value: unknown): EntryStatus {
  return value === "posted" || value === "cancelled" ? value : "draft";
}

function normalizePaymentStatus(value: unknown): EntryRecord["paymentStatus"] {
  return value === "paid" || value === "partial" ? value : "unpaid";
}

function normalizeStringArray(value: unknown) {
  return Array.from(new Set((Array.isArray(value) ? value : []).map((item) => String(item).trim()).filter(Boolean)));
}

function createId(scope: string, prefix: string) {
  return `${scope}-${prefix}-${randomUUID()}`;
}

function createUuid() {
  return randomUUID().replaceAll("-", "").slice(0, 8);
}

function jsonText(value: unknown) {
  return value ? JSON.stringify(value) : null;
}

function like(value: string | undefined) {
  return `%${(value ?? "").trim().toLowerCase()}%`;
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}
