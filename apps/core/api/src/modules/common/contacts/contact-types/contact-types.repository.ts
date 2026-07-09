import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { contactTypesDefinition } from "./contact-types.definition.js";
export class ContactTypesRepository extends CommonMasterRepository { constructor() { super(contactTypesDefinition); } }
