import { CommonMasterService } from "../../foundation/common-master.service.js";
import { contactGroupsDefinition } from "./contact-groups.definition.js";
export class ContactGroupsService extends CommonMasterService { constructor() { super(contactGroupsDefinition); } }
