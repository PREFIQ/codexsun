import { CommonMasterService } from "../../foundation/common-master.service.js";
import { contactTypesDefinition } from "./contact-types.definition.js";
export class ContactTypesService extends CommonMasterService { constructor() { super(contactTypesDefinition); } }
