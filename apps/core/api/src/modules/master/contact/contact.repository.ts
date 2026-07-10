import { MasterRepository } from "../master.repository.js";
import { contactDefinition } from "./contact.definition.js";
export class ContactRepository extends MasterRepository { constructor() { super(contactDefinition); } }
