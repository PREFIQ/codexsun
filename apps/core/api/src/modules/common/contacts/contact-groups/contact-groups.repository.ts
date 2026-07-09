import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { contactGroupsDefinition } from "./contact-groups.definition.js";
export class ContactGroupsRepository extends CommonMasterRepository { constructor() { super(contactGroupsDefinition); } }
