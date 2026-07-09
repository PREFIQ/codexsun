import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { addressTypesDefinition } from "./address-types.definition.js";
export class AddressTypesRepository extends CommonMasterRepository { constructor() { super(addressTypesDefinition); } }
