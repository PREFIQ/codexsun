import { MasterService } from "../master.service.js";
import { contactDefinition } from "./contact.definition.js";
export class ContactService extends MasterService { constructor() { super(contactDefinition); } }
